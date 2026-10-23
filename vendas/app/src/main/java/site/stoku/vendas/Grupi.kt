package site.stoku.vendas

import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.FirebaseFirestoreException
import com.google.firebase.firestore.ListenerRegistration
import com.google.firebase.firestore.MetadataChanges
import com.google.firebase.firestore.Query
import com.google.firebase.firestore.SetOptions
import kotlinx.coroutines.Job
import kotlinx.coroutines.MainScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import site.stoku.logjika.GrupiLogjika
import site.stoku.logjika.Json
import site.stoku.logjika.Marketet
import site.stoku.logjika.MObj
import site.stoku.logjika.Obj
import site.stoku.logjika.Ruajtja
import site.stoku.logjika.me
import site.stoku.logjika.numerOse0
import site.stoku.logjika.obj
import site.stoku.logjika.eVertete
import site.stoku.logjika.krahasoTekst

/**
 * Grupi (si ekipa.js, krijoCloud + krijoKontrollues): grupi im (perdoruesit/{uid}.grupi + grupet/{g}/anetaret/{uid}),
 * anëtarët me praninë, përmbledhjet e afateve të kolegëve (grupet/{g}/afatet/{uid}), aktiviteti (feed), ftesat, kërkesat për
 * t'u futur, njoftimet personale (heqjet e kolegëve që presin miratimin). Të dhënat janë të njëjtat që shkruan web-i.
 * Firestore-i i Android-it i ruan vetë shkrimet pa internet (edhe pas mbylljes së aplikacionit), prandaj s'ka radhë më vete.
 */
object Grupi {
    private val db: FirebaseFirestore get() = FirebaseFirestore.getInstance()
    private val scope = MainScope()

    data class Gjendja(val qasja: String = "duke", val grupi: String? = null, val roli: String = "anetar", val uHoq: String? = null)

    val gjendja = MutableStateFlow(Gjendja())
    val grupiDoc = MutableStateFlow<Obj?>(null)
    val anetaret = MutableStateFlow<List<Obj>>(emptyList())
    /** uid → { emri, afatet }; null = ende pa përgjigje */
    val permbledhjet = MutableStateFlow<Map<String, Obj>?>(null)
    val ngjarjet = MutableStateFlow<List<Obj>>(emptyList())
    val ngjarjetGati = MutableStateFlow(false)
    val ftesatEMia = MutableStateFlow<List<Obj>>(emptyList())
    val ftesatEGrupit = MutableStateFlow<List<Obj>>(emptyList())
    val kerkesatEMia = MutableStateFlow<List<Obj>>(emptyList())
    val kerkesatEGrupit = MutableStateFlow<List<Obj>>(emptyList())
    val njoftimet = MutableStateFlow<List<Obj>>(emptyList())

    private var uid: String? = null
    private var emri: String = ""
    private val degjuesitPerdoruesit = ArrayList<ListenerRegistration>()
    private val degjuesitGrupit = ArrayList<ListenerRegistration>()
    private var ndalAnetaresine: ListenerRegistration? = null
    private var gNdjekur: String? = null
    private var treguesi: Any? = null
    private var rikthimiProvuar = false
    private var rikthimiNeRruge = false
    private var veprimeNeGrup = 0
    private var nisur = false
    private var pranie: Job? = null
    private var nePerpara = false

    fun grupi(): String? = gjendja.value.let { if (it.qasja == "anetar") it.grupi else null }
    fun eshtePronar() = gjendja.value.qasja == "anetar" && gjendja.value.roli == "pronar"
    fun uidIm() = uid
    fun emriIm() = emri

    /** Testet e pamjeve (pa Firebase): ekrani s'nis kohëmatës */
    var neProve = false
        private set

    /** Vetëm për testet e pamjeve */
    fun vendosPerProve(g: Gjendja, doc: Obj?, an: List<Obj>, perm: Map<String, Obj>?, ngj: List<Obj>, uidP: String, emriP: String,
                       ftesat: List<Obj> = emptyList(), kerkesatEGrupit: List<Obj> = emptyList(), ftesatEGrupit: List<Obj> = emptyList(), nj: List<Obj> = emptyList()) {
        neProve = true
        uid = uidP; emri = emriP
        gjendja.value = g; grupiDoc.value = doc; anetaret.value = an; permbledhjet.value = perm; ngjarjet.value = ngj; ngjarjetGati.value = true
        ftesatEMia.value = ftesat; this.kerkesatEGrupit.value = kerkesatEGrupit; this.ftesatEGrupit.value = ftesatEGrupit; njoftimet.value = nj
    }

    fun nis() {
        if (nisur) return
        nisur = true
        scope.launch {
            combine(Llogaria.perdoruesi, Llogaria.lejet) { p, _ -> if (p != null && Llogaria.leja("grupi")) p else null }
                .distinctUntilChanged().collect { p -> ndryshoPerdoruesin(p) }
        }
        // Afatet e mia (dhe marketet) → përmbledhja për kolegët, me pak vonesë
        scope.launch {
            combine(Dyqani.gjendja, gjendja) { g, gj -> Triple(g.afatet, g.marketet, gj.grupi.takeIf { gj.qasja == "anetar" }) }
                .distinctUntilChanged().collect { (_, _, g) -> if (g != null) planifikoPublikimin() }
        }
    }

    private fun ndryshoPerdoruesin(p: Perdoruesi?) {
        degjuesitPerdoruesit.forEach { it.remove() }; degjuesitPerdoruesit.clear()
        ndalGrupin(); ndalAnetaresine?.remove(); ndalAnetaresine = null; gNdjekur = null
        rikthimiProvuar = false; rikthimiNeRruge = false
        uid = p?.uid; emri = p?.emri ?: ""
        ftesatEMia.value = emptyList(); kerkesatEMia.value = emptyList(); njoftimet.value = emptyList()
        if (p == null) { gjendja.value = Gjendja(); return }
        gjendja.value = Gjendja("duke")
        val u0 = p.uid
        degjuesitPerdoruesit.add(db.collection("perdoruesit").document(u0).addSnapshotListener(MetadataChanges.INCLUDE) { s, e ->
            if (uid != u0) return@addSnapshotListener
            if (e != null) { if (gjendja.value.qasja == "duke") gjendja.value = Gjendja("gabim"); return@addSnapshotListener }
            if (s == null) return@addSnapshotListener
            val nga = s.metadata.isFromCache
            if (!s.exists() && nga) return@addSnapshotListener
            val g = if (s.exists()) s.get("grupi") else null
            // v243: dokumenti i pjesshëm i pajisjes (pa `grupi`) s'merret si "pa tregues": pritet serveri
            if (g !is String && nga) return@addSnapshotListener
            treguesi = g
            if (g == "" && rikthimiNeRruge) return@addSnapshotListener
            if (g == "" && !rikthimiProvuar) {
                rikthimiProvuar = true; rikthimiNeRruge = true
                scope.launch {
                    val gg = gjejGrupinTim(StokuApp.prefsOse("grupi_i_fundit", ""))
                    rikthimiNeRruge = false
                    if (uid != u0) return@launch
                    if (gg.isNotEmpty()) { treguesi = gg; try { vendosTreguesin(gg) } catch (e: Exception) { } }
                    ndiq(gg)
                }
                return@addSnapshotListener
            }
            ndiq(g as? String ?: "") // pa tregues fare (llogari shumë e vjetër): pa grup derisa ta hapë web-in
        })
        degjuesitPerdoruesit.add(db.collection("ftesat").whereEqualTo("perdoruesi", p.emri).addSnapshotListener { s, _ ->
            if (s != null && uid == u0) ftesatEMia.value = s.documents.map { (it.data ?: emptyMap()).me("id" to it.id) }
        })
        degjuesitPerdoruesit.add(db.collection("kerkesat_grupi").whereEqualTo("uid", u0).addSnapshotListener { s, _ ->
            if (s != null && uid == u0) kerkesatEMia.value = s.documents.map { (it.data ?: emptyMap()).me("id" to it.id) }
        })
        degjuesitPerdoruesit.add(db.collection("perdoruesit").document(u0).collection("njoftimet").whereEqualTo("lexuar", false).addSnapshotListener { s, _ ->
            if (s != null && uid == u0) njoftimet.value = s.documents.map { (it.data ?: emptyMap()).me("id" to it.id) }.sortedByDescending { numerOse0(it["koha"]) }
        })
    }

    private fun ndiq(g: String) {
        if (g == gNdjekur) return
        gNdjekur = g
        ndalAnetaresine?.remove(); ndalAnetaresine = null
        ndalGrupin()
        val u0 = uid ?: return
        if (g.isEmpty()) { gjendja.value = Gjendja("pa-grup"); return }
        ndalAnetaresine = db.collection("grupet").document(g).collection("anetaret").document(u0).addSnapshotListener { s, e ->
            if (uid != u0 || gNdjekur != g) return@addSnapshotListener
            if (e != null) {
                gjendja.value = Gjendja(if (e.code == FirebaseFirestoreException.Code.PERMISSION_DENIED) "pa-rregulla" else "gabim")
                return@addSnapshotListener
            }
            if (s == null) return@addSnapshotListener
            if (!s.exists()) {
                if (s.metadata.isFromCache) return@addSnapshotListener
                // Pronari të hoqi (ose grupi u fshi): treguesi pastrohet
                if (veprimeNeGrup == 0 && treguesi == g) scope.launch { try { vendosTreguesin("") } catch (er: Exception) { } }
                ndalGrupin()
                gjendja.value = Gjendja("pa-grup", uHoq = g)
                return@addSnapshotListener
            }
            val roli = if (s.getString("roli") == "pronar") "pronar" else "anetar"
            val para = gjendja.value
            gjendja.value = Gjendja("anetar", g, roli)
            StokuApp.vendosPref("grupi_i_fundit", g)
            if (para.qasja != "anetar" || para.grupi != g || para.roli != roli) nisGrupin(g, roli)
        }
    }

    private fun ndalGrupin() {
        degjuesitGrupit.forEach { it.remove() }; degjuesitGrupit.clear()
        grupiDoc.value = null; anetaret.value = emptyList(); permbledhjet.value = null; ngjarjet.value = emptyList(); ngjarjetGati.value = false
        ftesatEGrupit.value = emptyList(); kerkesatEGrupit.value = emptyList()
    }

    private fun nisGrupin(g: String, roli: String) {
        degjuesitGrupit.forEach { it.remove() }; degjuesitGrupit.clear()
        val ref = db.collection("grupet").document(g)
        degjuesitGrupit.add(ref.addSnapshotListener { s, _ -> if (s != null && gNdjekur == g) grupiDoc.value = if (s.exists()) (s.data ?: emptyMap()).me("id" to g) else null })
        degjuesitGrupit.add(ref.collection("anetaret").addSnapshotListener { s, _ ->
            if (s == null || gNdjekur != g) return@addSnapshotListener
            anetaret.value = s.documents.map { d ->
                val x = d.data ?: emptyMap()
                obj("uid" to d.id, "emri" to ((x["emri"] as? String)?.ifEmpty { null } ?: d.id), "aktivSe" to (x["aktivSe"] ?: x["hyriSe"] ?: 0L),
                    "online" to (x["online"] == true), "platforma" to (x["platforma"] ?: ""), "kycurSe" to (x["hyriSe"] ?: 0L),
                    "roli" to if (x["roli"] == "pronar") "pronar" else "anetar", "pronar" to (x["roli"] == "pronar"), "admin" to (x["emri"] == "mendurberisha"))
            }
        })
        degjuesitGrupit.add(ref.collection("afatet").addSnapshotListener { s, _ ->
            if (s == null || gNdjekur != g) return@addSnapshotListener
            permbledhjet.value = s.documents.associate { d -> val x = d.data ?: emptyMap(); d.id to obj("emri" to (x["emri"] ?: ""), "afatet" to (x["afatet"] as? List<*> ?: emptyList<Any>()), "ndryshuarSe" to (x["ndryshuarSe"] ?: 0L)) }
        })
        degjuesitGrupit.add(ref.collection("feed").orderBy("koha", Query.Direction.DESCENDING).limit(150).addSnapshotListener { s, _ ->
            if (s == null || gNdjekur != g) return@addSnapshotListener
            ngjarjet.value = s.documents.map { (it.data ?: emptyMap()).me("id" to it.id) }
            ngjarjetGati.value = true
        })
        if (roli == "pronar") {
            degjuesitGrupit.add(db.collection("ftesat").whereEqualTo("gid", g).addSnapshotListener { s, _ ->
                if (s != null && gNdjekur == g) ftesatEGrupit.value = s.documents.map { (it.data ?: emptyMap()).me("id" to it.id) }
            })
            degjuesitGrupit.add(db.collection("kerkesat_grupi").whereEqualTo("gid", g).addSnapshotListener { s, _ ->
                if (s != null && gNdjekur == g) kerkesatEGrupit.value = s.documents.map { (it.data ?: emptyMap()).me("id" to it.id) }
            })
        }
        rrahZemren(nePerpara)
        planifikoPublikimin()
    }

    // ---------------- Treguesi i grupit ----------------
    private suspend fun vendosTreguesin(g: String) {
        val u0 = uid ?: return
        db.collection("perdoruesit").document(u0).set(mapOf("grupi" to g), SetOptions.merge()).await()
    }

    /** v243: grupi im që e humbi treguesin: i fundit i kësaj pajisjeje, grupet që i kam krijuar, ku jam admin (lista publike) */
    private suspend fun gjejGrupinTim(iFundit: String): String {
        val u0 = uid ?: return ""
        val kand = ArrayList<String>()
        if (iFundit.isNotEmpty() && iFundit != "ekipa") kand.add(iFundit)
        try { db.collection("grupet").whereEqualTo("pronarUid", u0).get().await().documents.forEach { if (it.id !in kand) kand.add(it.id) } } catch (e: Exception) { }
        try { db.collection("grupet_publike").whereEqualTo("pronarEmri", emri).get().await().documents.forEach { if (it.id !in kand) kand.add(it.id) } } catch (e: Exception) { }
        for (g in kand.take(10)) {
            try { if (db.collection("grupet").document(g).collection("anetaret").document(u0).get().await().exists()) return g } catch (e: Exception) { }
        }
        return ""
    }

    private fun anetaresiaERe(roli: String) = mapOf("emri" to emri, "roli" to roli, "hyriSe" to System.currentTimeMillis(),
        "aktivSe" to System.currentTimeMillis(), "online" to true, "platforma" to "tel")

    private fun idERe(): String {
        val a = "0123456789abcdefghijklmnopqrstuvwxyz"
        return System.currentTimeMillis().toString(36) + (1..14).map { a.random() }.joinToString("")
    }

    private fun gabimi(e: Exception): String = if (e is FirebaseFirestoreException && e.code == FirebaseFirestoreException.Code.PERMISSION_DENIED) "leje" else "rrjeti"

    // ---------------- Prania ----------------
    /** MainActivity: aplikacioni doli përpara / në sfond */
    fun vendosPerpara(po: Boolean) {
        nePerpara = po
        pranie?.cancel(); pranie = null
        if (neProve) return
        rrahZemren(po) // pa grup s'bën asgjë; rrahja vazhdon, që të nisë vetë kur hyn në një grup
        if (po) pranie = scope.launch { while (true) { delay(GrupiLogjika.RRAHJA_MS); if (nePerpara) rrahZemren(true) } }
        else dergoAfateTeReja()
    }

    private fun rrahZemren(online: Boolean) {
        val u0 = uid ?: return; val g = grupi() ?: return
        db.collection("grupet").document(g).collection("anetaret").document(u0)
            .set(mapOf("emri" to emri, "aktivSe" to System.currentTimeMillis(), "online" to online, "platforma" to "tel"), SetOptions.merge())
    }

    // ---------------- Përmbledhja e afateve të mia ----------------
    private var publikimi: Job? = null
    private fun planifikoPublikimin() {
        publikimi?.cancel()
        publikimi = scope.launch { delay(1500); publikoTani() }
    }
    private fun publikoTani() {
        val u0 = uid ?: return; val g = grupi() ?: return
        if (!Llogaria.leja("afatet")) return
        val dq = Dyqani.g
        val p = GrupiLogjika.permbledhjaEAfateve(Marketet.meEmra(dq.afatet, Marketet.pastro(dq.marketet)))
        val n = u0 + "|" + g + "|" + emri + "|" + Ruajtja.hash(Json.shkruaj(p)) + ":" + p.size
        if (n == StokuApp.prefsOse("grupi_publikuar", "")) return
        db.collection("grupet").document(g).collection("afatet").document(u0)
            .set(mapOf("uid" to u0, "emri" to emri, "afatet" to p, "ndryshuarSe" to System.currentTimeMillis()))
            .addOnSuccessListener { StokuApp.vendosPref("grupi_publikuar", n) }
    }

    // ---------------- Aktiviteti ----------------
    private fun shtoNgjarje(ng: Map<String, Any?>) {
        val u0 = uid ?: return; val g = grupi() ?: return
        val d = LinkedHashMap<String, Any?>(ng); d["uid"] = u0; d["emri"] = emri; d["koha"] = System.currentTimeMillis()
        db.collection("grupet").document(g).collection("feed").document(idERe()).set(d.filterValues { it != null })
    }

    private var afateTeRejaN = 0
    private var afateTeRejaFoto = false
    private var afateTeRejaJob: Job? = null
    /** Afatet e reja mblidhen 20 s, që "shtoi 12 afate" të dalë një herë */
    fun afateTeReja(n: Int, ngaFoto: Boolean) {
        if (n <= 0 || grupi() == null) return
        afateTeRejaN += n; afateTeRejaFoto = afateTeRejaFoto || ngaFoto
        afateTeRejaJob?.cancel()
        afateTeRejaJob = scope.launch { delay(20000); dergoAfateTeReja() }
    }
    private fun dergoAfateTeReja() {
        afateTeRejaJob?.cancel(); afateTeRejaJob = null
        if (afateTeRejaN == 0) return
        shtoNgjarje(mapOf("lloji" to "afate-te-reja", "n" to afateTeRejaN.toLong(), "ngaFoto" to afateTeRejaFoto))
        afateTeRejaN = 0; afateTeRejaFoto = false
    }

    /** "U hoq nga rafti" / "Rikthe si aktiv" te afatet e mia (si ekNgjarjeAfati) */
    fun ngjarjeAfati(lloji: String, a: Obj) {
        val u0 = uid ?: return
        shtoNgjarje(mapOf("lloji" to lloji, "pronariUid" to u0, "pronariEmri" to emri, "afatId" to a["id"],
            "produkti" to ((a["emri"] as? String)?.ifEmpty { null } ?: (a["barkodi"] as? String) ?: ""), "barkodi" to (a["barkodi"] ?: ""),
            "data" to (a["data"] ?: ""), "sasia" to (a["sasia"] as? Number)))
    }

    // ---------------- Heqja e afatit të një kolegu (pret miratimin e tij) ----------------
    suspend fun heqAfatinEKolegut(a: Obj): String? {
        val u0 = uid ?: return "pa-hyrje"; val g = grupi() ?: return "pa-grup"
        val pr = a["pronariUid"] as? String ?: return "gabim"
        val produkti = (a["emri"] as? String)?.ifEmpty { null } ?: (a["barkodi"] as? String) ?: ""
        val tani = System.currentTimeMillis()
        return try {
            val nj = mapOf("lloji" to "hequr", "afatId" to a["id"], "produkti" to produkti, "barkodi" to (a["barkodi"] ?: ""), "data" to (a["data"] ?: ""),
                "grupi" to g, "uid" to u0, "emri" to emri, "koha" to tani, "lexuar" to false)
            val t = db.collection("perdoruesit").document(pr).collection("njoftimet").document(idERe()).set(nj)
            shtoNgjarje(mapOf("lloji" to "hequr", "pronariUid" to pr, "pronariEmri" to (a["pronariEmri"] ?: ""), "afatId" to a["id"],
                "produkti" to produkti, "barkodi" to (a["barkodi"] ?: ""), "data" to (a["data"] ?: ""), "sasia" to (a["sasia"] as? Number)))
            kotlinx.coroutines.withTimeoutOrNull(4000) { t.await() }
            null
        } catch (e: Exception) { gabimi(e) }
    }

    /** Pronari pranon ose refuzon heqjen e një kolegu; kur e pranon, afati im shënohet i hequr */
    suspend fun vendosPerHeqjen(nj: Obj, pranoj: Boolean): String? {
        val u0 = uid ?: return "pa-hyrje"
        val id = nj["id"] as? String ?: return "gabim"
        val tani = System.currentTimeMillis()
        try {
            kotlinx.coroutines.withTimeoutOrNull(4000) {
                db.collection("perdoruesit").document(u0).collection("njoftimet").document(id)
                    .update(mapOf("vendim" to if (pranoj) "pranuar" else "refuzuar", "vendosurSe" to tani, "lexuar" to true)).await()
            }
        } catch (e: Exception) {
            if (!(e is FirebaseFirestoreException && e.code == FirebaseFirestoreException.Code.NOT_FOUND)) return gabimi(e)
        }
        if (pranoj) zbatoHeqjen(nj)
        njoftimet.value = njoftimet.value.filter { it["id"] != id }
        val g = grupi() ?: return null
        val lloji = if (pranoj) "heqje-pranuar" else "heqje-refuzuar"
        val te = mapOf("afatId" to (nj["afatId"] ?: ""), "produkti" to (nj["produkti"] ?: ""), "barkodi" to (nj["barkodi"] ?: ""), "data" to (nj["data"] ?: ""))
        val nga = nj["uid"] as? String
        if (nga != null && nga != u0) db.collection("perdoruesit").document(nga).collection("njoftimet").document(idERe())
            .set(te + mapOf("lloji" to lloji, "grupi" to g, "uid" to u0, "emri" to emri, "koha" to tani, "lexuar" to false))
        shtoNgjarje(te + mapOf("lloji" to lloji, "pronariUid" to u0, "kerkuesUid" to (nga ?: ""), "kerkuesEmri" to (nj["emri"] ?: "")))
        return null
    }

    private fun zbatoHeqjen(nj: Obj) {
        val a = Dyqani.afati(nj["afatId"] as? String ?: return) ?: return
        if (a["statusi"] == "hequr") return
        Dyqani.perditesoAfatin(a["id"] as String, mapOf("statusi" to "hequr", "hequrSe" to (nj["koha"] ?: System.currentTimeMillis()), "hequrNga" to (nj["emri"] ?: "")))
    }

    /** Njoftimet e lexuara (zilja) */
    fun shenoTeLexuara(ids: List<String>) {
        val u0 = uid ?: return
        if (ids.isEmpty()) return
        val b = db.batch()
        ids.take(400).forEach { b.update(db.collection("perdoruesit").document(u0).collection("njoftimet").document(it), "lexuar", true) }
        b.commit()
    }

    /** Kolegët (pa mua): për "Kërko heqje nga rafti" */
    fun koleget(): List<Obj> = anetaret.value.filter { it["uid"] != uid }

    /** "Kërko heqje nga rafti": te një koleg (perUid) ose te krejt grupi → null ose arsyeja (bosh, pa-kolege, anetari, …) */
    fun kerkoHeqjen(produktet: List<Obj>, shenim0: String, perUid: String?): String? {
        val u0 = uid ?: return "pa-hyrje"; val g = grupi() ?: return "pa-grup"
        val lista = GrupiLogjika.listaEKerkeses(obj("produktet" to produktet))
        if (lista.isEmpty()) return "bosh"
        val kol = koleget()
        val per = if (perUid.isNullOrEmpty()) null else (kol.firstOrNull { it["uid"] == perUid } ?: return "anetari")
        if (kol.isEmpty()) return "pa-kolege"
        val produkti = lista[0]["produkti"]; val barkodi = lista[0]["barkodi"] // për versionet e para (pa listë)
        val shenim = shenim0.trim().take(300); val koha = System.currentTimeMillis()
        val id = idERe()
        db.collection("grupet").document(g).collection("feed").document(id).set(mapOf("lloji" to "kerkese-heqje", "uid" to u0, "emri" to emri, "koha" to koha,
            "produkti" to produkti, "barkodi" to barkodi, "produktet" to lista, "shenim" to shenim, "perUid" to (per?.get("uid") ?: ""), "perEmri" to (per?.get("emri") ?: "")))
        (if (per != null) listOf(per) else kol).forEach { a ->
            val u = a["uid"] as String
            if (u == u0) return@forEach
            db.collection("perdoruesit").document(u).collection("njoftimet").document(idERe()).set(mapOf("lloji" to "kerkese-heqje", "kerkeseId" to id,
                "produkti" to produkti, "barkodi" to barkodi, "produktet" to lista, "shenim" to shenim, "perKrejt" to (per == null), "grupi" to g,
                "uid" to u0, "emri" to emri, "koha" to koha, "lexuar" to false))
        }
        return null
    }

    /** Pronari: fshin krejt aktivitetin e grupit → numri i rreshtave të fshirë, ose null kur s'u fshi krejt */
    suspend fun pastroAktivitetin(): Int? {
        val g = grupi() ?: return null
        if (!eshtePronar()) return null
        var n = 0
        val ref = db.collection("grupet").document(g).collection("feed")
        for (i in 0 until 50) {
            val s = try { ref.limit(400).get().await() } catch (e: Exception) { return null }
            if (s.isEmpty) return n
            val b = db.batch(); s.documents.forEach { b.delete(it.reference) }
            try { b.commit().await() } catch (e: Exception) { return null }
            n += s.size()
        }
        return n
    }

    /** "U krye" te një kërkesë për heqje */
    suspend fun kryejKerkesen(nj: Obj): String? {
        val u0 = uid ?: return "pa-hyrje"
        val id = nj["id"] as? String ?: return "gabim"
        val tani = System.currentTimeMillis()
        try {
            kotlinx.coroutines.withTimeoutOrNull(4000) {
                db.collection("perdoruesit").document(u0).collection("njoftimet").document(id).update(mapOf("kryer" to true, "kryerSe" to tani, "lexuar" to true)).await()
            }
        } catch (e: Exception) { if (!(e is FirebaseFirestoreException && e.code == FirebaseFirestoreException.Code.NOT_FOUND)) return gabimi(e) }
        njoftimet.value = njoftimet.value.filter { it["id"] != id }
        val g = grupi() ?: return null
        val te = mapOf("kerkeseId" to (nj["kerkeseId"] ?: ""), "produkti" to (nj["produkti"] ?: ""), "barkodi" to (nj["barkodi"] ?: ""),
            "produktet" to GrupiLogjika.listaEKerkeses(nj))
        val nga = nj["uid"] as? String
        if (nga != null && nga != u0) db.collection("perdoruesit").document(nga).collection("njoftimet").document(idERe())
            .set(te + mapOf("lloji" to "kerkese-kryer", "grupi" to g, "uid" to u0, "emri" to emri, "koha" to tani, "lexuar" to false))
        shtoNgjarje(te + mapOf("lloji" to "kerkese-kryer", "kerkuesUid" to (nga ?: ""), "kerkuesEmri" to (nj["emri"] ?: "")))
        return null
    }

    // ---------------- Grupi: krijimi, ftesat, kërkesat, largimi ----------------
    /** → null (u krijua) ose arsyeja */
    suspend fun krijoGrupin(emriGrupit: String): String? {
        val em = emriGrupit.trim().replace(Regex("\\s+"), " ").take(60)
        val u0 = uid ?: return "pa-hyrje"
        if (em.length < 2) return "emri"
        val g = "g" + idERe().take(22)
        veprimeNeGrup++
        return try {
            val b = db.batch()
            b.set(db.collection("grupet").document(g), mapOf("emri" to em, "pronarUid" to u0, "pronarEmri" to emri, "krijuarSe" to System.currentTimeMillis()))
            b.set(db.collection("grupet").document(g).collection("anetaret").document(u0), anetaresiaERe("pronar"))
            b.commit().await()
            vendosTreguesin(g)
            publikoGrupin(g, em)
            fshijKerkesatEMia()
            null
        } catch (e: Exception) { gabimi(e) } finally { veprimeNeGrup-- }
    }

    private fun publikoGrupin(g: String, emriG: String) {
        val em = emriG.trim().replace(Regex("\\s+"), " ").take(60)
        if (uid == null || em.length < 2) return
        db.collection("grupet_publike").document(g).set(mapOf("emri" to em, "pronarEmri" to emri, "ndryshuarSe" to System.currentTimeMillis()))
    }

    private suspend fun fshijKerkesatEMia() {
        val u0 = uid ?: return
        try { db.collection("kerkesat_grupi").whereEqualTo("uid", u0).get().await().documents.forEach { try { it.reference.delete().await() } catch (e: Exception) { } } } catch (e: Exception) { }
    }

    suspend fun riemertoGrupin(emriGrupit: String): String? {
        val em = emriGrupit.trim().replace(Regex("\\s+"), " ").take(60)
        val g = grupi() ?: return "pa-grup"
        if (em.length < 2) return "emri"
        return try { db.collection("grupet").document(g).set(mapOf("emri" to em), SetOptions.merge()).await(); publikoGrupin(g, em); null } catch (e: Exception) { gabimi(e) }
    }

    /** Pronari: ftesë për një emër përdoruesi → null ose arsyeja (emri, vetja, anetar, e-ftuar, leje, rrjeti) */
    suspend fun ftoNeGrup(perdoruesi: String): String? {
        val p = perdoruesi.trim().lowercase().removeSuffix("@stoku-app.local")
        val g = grupi() ?: return "pa-grup"
        if (!eshtePronar()) return "jo-pronar"
        if (!Regex("^[a-z0-9_.-]{3,40}$").matches(p)) return "emri"
        if (p == emri) return "vetja"
        if (anetaret.value.any { (it["emri"] as? String).orEmpty().lowercase() == p }) return "anetar"
        if (ftesatEGrupit.value.any { it["perdoruesi"] == p }) return "e-ftuar"
        return try {
            db.collection("ftesat").document(g + "_" + p).set(mapOf("gid" to g, "grupiEmri" to ((grupiDoc.value?.get("emri") as? String) ?: "").take(60),
                "perdoruesi" to p, "ngaUid" to uid, "ngaEmri" to emri, "koha" to System.currentTimeMillis())).await()
            null
        } catch (e: Exception) { gabimi(e) }
    }

    suspend fun anuloFtesen(id: String): String? = try { db.collection("ftesat").document(id).delete().await(); null } catch (e: Exception) { gabimi(e) }

    class Largimi(val ok: Boolean, val iFundit: Boolean = false, val trashegimtari: String? = null, val trashegimtariEmri: String? = null)

    /** v246: admini i vetëm mund të largohet: adminin e merr kolegu që ka hyrë më herët */
    fun mundTeLargohet(): Largimi {
        if (grupi() == null) return Largimi(true)
        if (anetaret.value.isEmpty()) return Largimi(false)
        val tjeret = anetaret.value.filter { it["uid"] != uid }
        if (eshtePronar() && tjeret.isNotEmpty() && tjeret.none { it["pronar"] == true }) {
            val tr = tjeret.sortedWith(compareBy<Obj>({ numerOse0(it["kycurSe"]) }, { (it["emri"] as? String).orEmpty() })).first()
            return Largimi(true, false, tr["uid"] as String, tr["emri"] as? String)
        }
        return Largimi(true, tjeret.isEmpty())
    }

    /** Pranimi i ftesës: hyrja te grupi i ri (ftesa fshihet bashkë me të), pastaj largimi nga i mëparshmi */
    suspend fun pranoFtesen(f: Obj): String? {
        val u0 = uid ?: return "pa-hyrje"
        val gid = f["gid"] as? String ?: return "gabim"
        val id = f["id"] as? String ?: return "gabim"
        val neGrup = grupi()
        val m = mundTeLargohet()
        if (neGrup != null && !m.ok) return "duke-ngarkuar"
        veprimeNeGrup++
        try {
            val b = db.batch()
            b.set(db.collection("grupet").document(gid).collection("anetaret").document(u0), anetaresiaERe("anetar"))
            b.delete(db.collection("ftesat").document(id))
            try { b.commit().await() } catch (e: Exception) {
                if (gabimi(e) != "leje") return gabimi(e)
                try { db.collection("ftesat").document(id).delete().await() } catch (e2: Exception) { }
                ftesatEMia.value = ftesatEMia.value.filter { it["id"] != id }
                return "ftesa-skadoi"
            }
            if (neGrup != null && neGrup != gid) largohu(neGrup, m.iFundit, true, m.trashegimtari)
            vendosTreguesin(gid)
            fshijKerkesatEMia()
            db.collection("grupet").document(gid).collection("feed").document(idERe()).set(mapOf("lloji" to "anetar-i-ri", "anetariUid" to u0,
                "anetariEmri" to emri, "ftuarNga" to (f["ngaEmri"] ?: ""), "uid" to u0, "emri" to emri, "koha" to System.currentTimeMillis()))
            ftesatEMia.value = ftesatEMia.value.filter { it["id"] != id }
            return null
        } catch (e: Exception) { return gabimi(e) } finally { veprimeNeGrup-- }
    }

    suspend fun refuzoFtesen(f: Obj): String? = try { db.collection("ftesat").document(f["id"] as String).delete().await(); null } catch (e: Exception) { gabimi(e) }

    suspend fun largohuNgaGrupi(): String? {
        val g = grupi() ?: return "pa-grup"
        val m = mundTeLargohet()
        if (!m.ok) return "duke-ngarkuar"
        return largohu(g, m.iFundit, false, m.trashegimtari)
    }

    private suspend fun largohu(g: String, fshiGrupin: Boolean, paTregues: Boolean, trashegimtari: String?): String? {
        val u0 = uid ?: return null
        veprimeNeGrup++
        try {
            if (trashegimtari != null && !fshiGrupin) {
                try {
                    db.collection("grupet").document(g).collection("anetaret").document(trashegimtari).update("roli", "pronar").await()
                } catch (e: Exception) { return "trashegimtari" }
                try {
                    kotlinx.coroutines.withTimeoutOrNull(4000) {
                        db.collection("perdoruesit").document(trashegimtari).collection("njoftimet").document(idERe())
                            .set(mapOf("lloji" to "admin-i-ri", "grupi" to g, "uid" to u0, "emri" to emri, "koha" to System.currentTimeMillis(), "lexuar" to false)).await()
                    }
                } catch (e: Exception) { }
            }
            try { db.collection("grupet").document(g).collection("afatet").document(u0).delete().await() } catch (e: Exception) { }
            if (fshiGrupin) {
                for (k in listOf("feed", "afatet", "push")) pastroKol(db.collection("grupet").document(g).collection(k))
                try { db.collection("ftesat").whereEqualTo("gid", g).get().await().documents.forEach { try { it.reference.delete().await() } catch (e: Exception) { } } } catch (e: Exception) { }
                try { db.collection("kerkesat_grupi").whereEqualTo("gid", g).get().await().documents.forEach { try { it.reference.delete().await() } catch (e: Exception) { } } } catch (e: Exception) { }
                try { db.collection("grupet").document(g).delete().await() } catch (e: Exception) { }
                try { db.collection("grupet_publike").document(g).delete().await() } catch (e: Exception) { }
            }
            db.collection("grupet").document(g).collection("anetaret").document(u0).delete().await()
            if (!paTregues) vendosTreguesin("")
            StokuApp.vendosPref("grupi_i_fundit", "")
            StokuApp.vendosPref("grupi_publikuar", "")
            return null
        } catch (e: Exception) { return gabimi(e) } finally { veprimeNeGrup-- }
    }

    private suspend fun pastroKol(ref: com.google.firebase.firestore.CollectionReference) {
        for (i in 0 until 50) {
            val s = try { ref.limit(400).get().await() } catch (e: Exception) { return }
            if (s.isEmpty) return
            val b = db.batch(); s.documents.forEach { b.delete(it.reference) }
            try { b.commit().await() } catch (e: Exception) { return }
        }
    }

    /** Pronari: heq një anëtar (anëtarësia dhe përmbledhja e afateve) */
    suspend fun hiqNgaGrupi(u: String): String? {
        val g = grupi() ?: return "pa-grup"
        if (u == uid) return "gabim"
        return try {
            db.collection("grupet").document(g).collection("anetaret").document(u).delete().await()
            try { db.collection("grupet").document(g).collection("afatet").document(u).delete().await() } catch (e: Exception) { }
            null
        } catch (e: Exception) { gabimi(e) }
    }

    /** Pronari: njoftim për krejt grupin (zilja e secilit + aktiviteti) */
    fun lajmeroEkipen(tekst0: String): Boolean {
        val tekst = tekst0.trim().take(1000)
        val u0 = uid ?: return false; val g = grupi() ?: return false
        if (tekst.isEmpty()) return false
        val koha = System.currentTimeMillis()
        anetaret.value.forEach { a ->
            val u = a["uid"] as String
            if (u == u0) return@forEach
            db.collection("perdoruesit").document(u).collection("njoftimet").document(idERe())
                .set(mapOf("lloji" to "lajmerim", "tekst" to tekst, "grupi" to g, "uid" to u0, "emri" to emri, "koha" to koha, "lexuar" to false))
        }
        db.collection("grupet").document(g).collection("feed").document(idERe()).set(mapOf("lloji" to "lajmerim", "tekst" to tekst, "uid" to u0, "emri" to emri, "koha" to koha))
        return true
    }

    // ---------------- "Hyr në një grup" (v242) ----------------
    suspend fun listaEGrupeve(): List<Obj>? = try {
        db.collection("grupet_publike").limit(2000).get().await().documents.map { (it.data ?: emptyMap()).me("id" to it.id) }.filter { (it["emri"] as? String).orEmpty().isNotEmpty() }
    } catch (e: Exception) { null }

    private var grupetPublike: List<Obj>? = null
    private var grupetKoha = 0L
    private suspend fun lexoGrupetPublike(detyro: Boolean): Boolean {
        if (!detyro && grupetPublike != null && System.currentTimeMillis() - grupetKoha < 15000) return true
        val l = listaEGrupeve() ?: return false
        grupetPublike = l; grupetKoha = System.currentTimeMillis()
        return true
    }

    /** Emri pa shkronja të mëdha dhe pa ë/ç (si normalizoEmrin te ekipa.js) */
    fun normalizoEmrin(t: String?): String =
        java.text.Normalizer.normalize(t.orEmpty().lowercase(), java.text.Normalizer.Form.NFD).replace(Regex("[\\u0300-\\u036f]"), "")
            .replace(Regex("[^a-z0-9]+"), " ").trim()

    private fun perputhet(emriG: String?, q: String): Boolean {
        val n = normalizoEmrin(emriG)
        if (n.isEmpty()) return false
        if (n.contains(q) || n.replace(" ", "").contains(q.replace(" ", ""))) return true
        return q.split(" ").all { it.isNotEmpty() && n.contains(it) }
    }

    /** Grupet me këtë emër (ose me këtë admin) → lista, ose null kur s'u lexua */
    suspend fun kerkoGrupet(teksti: String): List<Obj>? {
        val q = normalizoEmrin(teksti)
        if (uid == null) return null
        if (q.replace(" ", "").length < 2) return emptyList()
        if (!lexoGrupetPublike(false)) return null
        fun gjej() = grupetPublike.orEmpty().filter { it["id"] != grupi() && (perputhet(it["emri"] as? String, q) || normalizoEmrin(it["pronarEmri"] as? String) == q) }
            .sortedWith(compareBy<Obj> { if (normalizoEmrin(it["emri"] as? String).startsWith(q)) 0 else 1 }.thenComparator { a, b -> krahasoTekst((a["emri"] as? String).orEmpty(), (b["emri"] as? String).orEmpty()) })
            .take(30)
        var l = gjej()
        if (l.isEmpty() && System.currentTimeMillis() - grupetKoha > 2000 && lexoGrupetPublike(true)) l = gjej()
        return l
    }

    /** → null (kërkesa u dërgua), "nga-ftesa" / "rikthyer" (u fute direkt në grup), ose arsyeja e gabimit */
    suspend fun dergoKerkesen(gr: Obj): String? {
        val u0 = uid ?: return "pa-hyrje"
        val gid = gr["id"] as? String ?: return "gabim"
        if (grupi() == gid) return "ne-grup"
        // Grupi më ka ftuar tashmë: pranohet ftesa
        ftesatEMia.value.firstOrNull { it["gid"] == gid }?.let { f -> return pranoFtesen(f) ?: "nga-ftesa" }
        try { if (db.collection("grupet").document(gid).collection("anetaret").document(u0).get().await().exists()) { vendosTreguesin(gid); return "rikthyer" } } catch (e: Exception) { }
        return try {
            db.collection("kerkesat_grupi").document(gid + "_" + u0).set(mapOf("gid" to gid, "grupiEmri" to ((gr["emri"] as? String) ?: "").take(60),
                "uid" to u0, "emri" to emri, "koha" to System.currentTimeMillis())).await()
            null
        } catch (e: Exception) { gabimi(e) }
    }

    suspend fun anuloKerkesen(gid: String): String? {
        val u0 = uid ?: return "pa-hyrje"
        return try { db.collection("kerkesat_grupi").document(gid + "_" + u0).delete().await(); null } catch (e: Exception) { gabimi(e) }
    }

    /** Pronari: pranimi = ftesë për atë emër + fshirja e kërkesës */
    suspend fun pranoKerkesen(k: Obj): String? {
        val g = grupi() ?: return "pa-grup"
        val em = (k["emri"] as? String).orEmpty()
        if (k["gid"] != g || !Regex("^[a-z0-9_.-]{3,40}$").matches(em)) return "gabim"
        return try {
            val b = db.batch()
            b.set(db.collection("ftesat").document(g + "_" + em), mapOf("gid" to g, "grupiEmri" to ((grupiDoc.value?.get("emri") as? String) ?: (k["grupiEmri"] as? String) ?: "").take(60),
                "perdoruesi" to em, "ngaUid" to uid, "ngaEmri" to emri, "koha" to System.currentTimeMillis()))
            b.delete(db.collection("kerkesat_grupi").document(k["id"] as String))
            b.commit().await()
            null
        } catch (e: Exception) { gabimi(e) }
    }

    suspend fun refuzoKerkesen(k: Obj): String? = try { db.collection("kerkesat_grupi").document(k["id"] as String).delete().await(); null } catch (e: Exception) { gabimi(e) }

    // ---------------- Për ekranin ----------------
    /** Anëtarët me afatet (unë me afatet e mia, kolegët me përmbledhjet, heqjet në pritje) */
    fun anetaretMeAfate(): List<MObj> {
        val u0 = uid
        val dq = Dyqani.g
        val te = if (grupi() != null) anetaret.value else emptyList()
        return GrupiLogjika.anetaretMeAfate(te, permbledhjet.value, u0, emri, dq.afatet, ngjarjet.value)
    }

    fun numriKerkesave(): Int = ftesatEMia.value.size + (if (eshtePronar()) kerkesatEGrupit.value.size else 0)

    /** Kush e kreu një kërkesë për heqje: unë (njoftimi im ka "kryer") ose një koleg (ngjarja "kerkese-kryer") → (uneJam, emri) */
    fun kryeresiIKerkeses(nj: Obj?): Pair<Boolean, String>? {
        if (nj == null) return null
        if (eVertete(nj["kryer"])) return true to ""
        val k = nj["kerkeseId"].takeIf { eVertete(it) } ?: return null
        val ng = ngjarjet.value.firstOrNull { it["lloji"] == "kerkese-kryer" && it["kerkeseId"] == k } ?: return null
        return (ng["uid"] == uid) to ((ng["emri"] as? String)?.ifEmpty { null } ?: "Një koleg")
    }

    /** Njoftimet që presin diçka nga unë: heqjet pa vendim, kërkesat pa kryer (mbeten "të palexuara") */
    fun ePritur(n: Obj): Boolean = (n["lloji"] == "kerkese-heqje" && kryeresiIKerkeses(n) == null) || (n["lloji"] == "hequr" && !eVertete(n["vendim"]))

    fun numriNjoftimeve(): Int = njoftimet.value.count { !(it["lloji"] == "kerkese-heqje" && kryeresiIKerkeses(it) != null) }

    // ---------------- Zilja ----------------
    /** 40 njoftimet e fundit (të lexuara dhe të palexuara) → null kur s'u lexuan */
    suspend fun merrNjoftimet(): List<Obj>? {
        val u0 = uid ?: return null
        return try {
            db.collection("perdoruesit").document(u0).collection("njoftimet").orderBy("koha", Query.Direction.DESCENDING).limit(40).get().await()
                .documents.map { (it.data ?: emptyMap()).me("id" to it.id) }
        } catch (e: Exception) { null }
    }

    /** Të palexuarat që s'presin asgjë shënohen të lexuara (pas hapjes së zilës) */
    fun shenoNjoftimetTeLexuara() {
        val ids = njoftimet.value.filter { !ePritur(it) }.mapNotNull { it["id"] as? String }
        if (ids.isEmpty()) return
        njoftimet.value = njoftimet.value.filter { ePritur(it) }
        shenoTeLexuara(ids)
    }

    /** v211: secili i fshin njoftimet e veta */
    suspend fun fshijNjoftimet(ids: List<String>): String? {
        val u0 = uid ?: return "pa-hyrje"
        if (ids.isEmpty()) return null
        return try {
            val b = db.batch()
            ids.take(400).forEach { b.delete(db.collection("perdoruesit").document(u0).collection("njoftimet").document(it)) }
            b.commit().await()
            val h = ids.toSet()
            njoftimet.value = njoftimet.value.filter { it["id"] !in h }
            null
        } catch (e: Exception) { gabimi(e) }
    }

    /** Pronari: "Bëje admin" / "Hiqe si admin" (grupi s'mbetet pa admin) */
    suspend fun ndryshoRolin(u: String, roli: String): String? {
        val g = grupi() ?: return "pa-grup"
        if (!eshtePronar()) return "jo-pronar"
        if (roli != "pronar" && anetaret.value.none { it["uid"] != u && it["pronar"] == true }) return "pronari-i-vetem"
        return try {
            db.collection("grupet").document(g).collection("anetaret").document(u).update("roli", if (roli == "pronar") "pronar" else "anetar").await(); null
        } catch (e: Exception) { gabimi(e) }
    }
}
