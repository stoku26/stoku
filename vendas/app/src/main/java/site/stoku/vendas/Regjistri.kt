package site.stoku.vendas

import android.content.Context
import com.google.firebase.firestore.CollectionReference
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import com.google.firebase.firestore.SetOptions
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.FlowPreview
import kotlinx.coroutines.Job
import kotlinx.coroutines.MainScope
import kotlinx.coroutines.plus
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.debounce
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeoutOrNull
import site.stoku.logjika.Afatet
import site.stoku.logjika.Furnizuesit
import site.stoku.logjika.Json
import site.stoku.logjika.Kujtesa
import site.stoku.logjika.Lejet
import site.stoku.logjika.Obj
import site.stoku.logjika.RuajtjaEKujteses
import site.stoku.logjika.eVertete
import site.stoku.logjika.jsNumber
import site.stoku.logjika.kanonik
import site.stoku.logjika.renditjaJs
import site.stoku.logjika.siObj
import java.io.File

/**
 * Kujtesa e produkteve në këtë telefon (si StokuAfatet.kujtesa() te web-i) dhe sinkronizimi i saj (ekipa.js, v197 + v242):
 * - regjistri i përbashkët i Stoku-t: kujtesa/{p0..p9, px} (vetëm çka ka kontrolluar administratori; e lexon kushdo);
 * - pritja: kujtesa_pritje/{uid}: çka mëson/shkruan secili pa kontroll; administratori i merr krejt si "në pritje";
 * - kujtesa e grupit: grupet/{g}/kujtesa (e përbashkët për kolegët).
 * Mëson kur ruhet një afat ose produkt me barkod, nga importet, dhe në sfond nga afatet/stoku/afatet e kolegëve.
 */
object Regjistri {
    private lateinit var skedari: File
    private val scope = MainScope() + StokuApp.trajtuesi(false)
    private val db: FirebaseFirestore get() = FirebaseFirestore.getInstance()
    private val _versioni = MutableStateFlow(0)
    /** Rritet me çdo ndryshim të kujtesës (këtu ose nga Firebase): ekranet rifreskohen */
    val versioni: StateFlow<Int> get() = _versioni
    private var shkrimi: Job? = null

    private val ruajtja = object : RuajtjaEKujteses {
        override fun lexo(): String? = try { if (::skedari.isInitialized && skedari.exists()) skedari.readText() else null } catch (e: Exception) { null }
        override fun shkruaj(teksti: () -> String) {
            if (!::skedari.isInitialized) return
            shkrimi?.cancel()
            shkrimi = scope.launch {
                delay(800)
                withContext(Dispatchers.IO) {
                    try {
                        val tmp = File(skedari.parentFile, skedari.name + ".tmp")
                        tmp.writeText(teksti())
                        if (!tmp.renameTo(skedari)) { skedari.delete(); tmp.renameTo(skedari) }
                    } catch (e: Exception) { /* memoria plot: mbetet vetëm në memorie */ }
                }
            }
        }
    }
    val kujtesa = Kujtesa(ruajtja)

    // ---------------- Gjendja e sinkronizimit ----------------
    private var uid: String? = null
    private var emri: String = ""
    private val admin: Boolean get() = Lejet.eshteAdmin(emri)
    private var dReg: ListenerRegistration? = null
    private var dPritje: ListenerRegistration? = null
    private var dGrupi: ListenerRegistration? = null
    private var regjGati = false
    private var regjGabim = false
    private var regjRemote: Map<String, Any?> = emptyMap()
    private val regjNdryshuar = LinkedHashSet<String>()
    private var pritjetQePresin: List<Triple<String, String, Any?>>? = null
    private var kohezReg: Job? = null
    private var grupiAktiv: String? = null
    private var grupiGati = false
    private val grupiPritje = LinkedHashSet<String>()
    private var kohezGrupi: Job? = null
    private var kohezMesimi: Job? = null
    private var nisur = false

    @OptIn(FlowPreview::class)
    fun nis(ctx: Context) {
        if (nisur) return
        nisur = true
        skedari = File(ctx.filesDir, "kujtesa.json")
        kujtesa.harro()
        kujtesa.degjo { b ->
            regjNdryshuar.addAll(b); grupiPritje.addAll(b)
            _versioni.value++
            planifikoRegjistrin(); planifikoGrupin()
        }
        scope.launch {
            Llogaria.perdoruesi.collect { p ->
                emri = p?.emri.orEmpty(); uid = p?.uid
                kujtesa.vendosAutorin(emri, admin) // versioni i administratorit fiton
                ndalRegjistrin()
                if (p != null) nisRegjistrin()
                nisGrupin(Grupi.grupi())
                planifikoMesimin()
            }
        }
        scope.launch { Grupi.gjendja.map { Grupi.grupi() }.distinctUntilChanged().collect { nisGrupin(it) } }
        // Në sfond: nga afatet, stoku dhe afatet e kolegëve (pa mbishkruar)
        scope.launch { Dyqani.gjendja.debounce(1500).collect { planifikoMesimin() } }
        scope.launch { Grupi.permbledhjet.debounce(1500).collect { planifikoMesimin() } }
    }

    private fun ndalRegjistrin() {
        dReg?.remove(); dPritje?.remove(); dReg = null; dPritje = null
        regjGati = false; regjGabim = false; regjRemote = emptyMap(); regjNdryshuar.clear(); pritjetQePresin = null
        kohezReg?.cancel()
    }

    // ---------------- Regjistri i përbashkët (v242) ----------------
    private fun vendosurNgaAdmini(b: String): Boolean = eVertete(regjRemote[b].siObj()?.get("s"))

    private fun pjesetE(d: List<DocumentSnapshot>): LinkedHashMap<String, Any?> {
        val h = LinkedHashMap<String, Any?>()
        d.forEach { s -> (s.get("p") as? Map<*, *>)?.forEach { (k, v) -> if (k is String) h[k] = v } }
        return h
    }

    private fun nisRegjistrin() {
        dReg = db.collection("kujtesa").addSnapshotListener { s, e ->
            if (e != null || s == null) { // rregullat para v242: mbetet kujtesa e pajisjes
                regjGabim = true
                pritjetQePresin?.let { pritjetQePresin = null; zbatoPritjet(it) }
                return@addSnapshotListener
            }
            regjRemote = pjesetE(s.documents)
            val n = kujtesa.bashko(regjRemote)
            val iPari = !regjGati
            regjGati = true
            if (iPari) pritjetQePresin?.let { pritjetQePresin = null; zbatoPritjet(it) } // erdhën para regjistrit
            if (iPari && admin) regjNdryshuar.addAll(kujtesa.perDergim(regjRemote))
            planifikoRegjistrin()
            if (n > 0 || iPari) _versioni.value++
        }
        // Administratori: pritja e krejt llogarive → "Produktet e reja"
        if (admin) dPritje = db.collection("kujtesa_pritje").addSnapshotListener { s, e ->
            if (e != null || s == null) { dPritje?.remove(); dPritje = null; return@addSnapshotListener }
            val lista = s.documents.map { Triple(it.id, it.getString("emri").orEmpty(), it.get("p")) }
            if (!regjGati && !regjGabim) pritjetQePresin = lista else zbatoPritjet(lista)
        }
    }

    private fun nr(v: Any?): Double { val d = jsNumber(v); return if (d.isNaN()) 0.0 else d }

    /** Administratori: pritja e krejt llogarive hyn si "në pritje" (pa `s`, me emrin e autorit) */
    private fun zbatoPritjet(lista: List<Triple<String, String, Any?>>) {
        val uIm = uid ?: return
        val h = LinkedHashMap<String, Any?>()
        lista.forEach { (id, emriA, p0) ->
            if (id == uIm) return@forEach
            @Suppress("UNCHECKED_CAST") val pm = p0 as? Map<String, Any?> ?: return@forEach
            renditjaJs(pm).forEach { b ->
                val x = pm[b].siObj() ?: return@forEach
                if (eVertete(x["x"])) return@forEach // fshirjet e të tjerëve s'vlejnë këtu
                if (vendosurNgaAdmini(b)) return@forEach // e kontrolluar (ose e fshirë) nga administratori
                val y = LinkedHashMap(x); y.remove("s")
                if (!eVertete(y["n"])) y["n"] = emriA.take(40)
                if (!eVertete(y["n"])) y["r"] = 1L
                val ek = h[b].siObj()
                if (ek == null || nr(y["k"]) > nr(ek["k"])) h[b] = y
            }
        }
        if (kujtesa.bashko(h) > 0) _versioni.value++
        pastroProven()
    }

    private fun pjesa(b: String): String { val c = b.last(); return if (c in '0'..'9') "p$c" else "px" }

    /** setDoc me merge te kujtesa/{pjesa} ose grupet/{g}/kujtesa/{pjesa} */
    private suspend fun ruajNePjese(koleksioni: CollectionReference, hyrjet: Map<String, Any?>): Boolean {
        val pjeset = LinkedHashMap<String, LinkedHashMap<String, Any?>>()
        hyrjet.forEach { (b, x) -> pjeset.getOrPut(pjesa(b)) { LinkedHashMap() }[b] = x }
        return try {
            withTimeoutOrNull(30000) {
                pjeset.forEach { (k, p) -> koleksioni.document(k).set(mapOf("p" to p, "ndryshuarSe" to System.currentTimeMillis()), SetOptions.merge()).await() }
                true
            } ?: false
        } catch (e: Exception) { false }
    }

    private fun planifikoRegjistrin() {
        if (!regjGati) return
        kohezReg?.cancel()
        kohezReg = scope.launch { delay(2500); dergoRegjistrin() }
    }

    private suspend fun dergoRegjistrin() {
        val u = uid ?: return
        if (!regjGati) return
        if (admin) {
            // Administratori: te regjistri vetëm çka ka kontrolluar (ruajtur ose fshirë prej tij), jo ato në pritje
            val bs = regjNdryshuar.toList(); regjNdryshuar.clear()
            if (bs.isEmpty()) return
            val te = kujtesa.hyrjePerGrup(bs).filter { (_, x) -> x["s"] == 1L && (x["x"] == 1L || x["r"] != 1L) }
            if (te.isEmpty()) return
            if (!ruajNePjese(db.collection("kujtesa"), te)) regjNdryshuar.addAll(bs) // provohet me ndryshimin e radhës
            return
        }
        regjNdryshuar.clear()
        // Të tjerët: çka di pajisja dhe s'është (ose është ndryshe) te regjistri → pritja ime, më të rejat të parat
        val hyr = kujtesa.hyrjePerGrup(kujtesa.perDergim(regjRemote))
        val lista = hyr.keys.filter { hyr[it]!!["x"] != 1L && !vendosurNgaAdmini(it) && !eShembull(it, hyr[it]) }.sortedByDescending { (hyr[it]!!["k"] as? Long) ?: 0L }
        val p = LinkedHashMap<String, Any?>(); lista.take(3000).forEach { p[it] = hyr[it] }
        val celes = u + "|" + kanonik(p).let { it.hashCode().toString(36) + ":" + it.length }
        if (StokuApp.prefsOse("kujtesa_pritja", "") == celes) return // asgjë e re për administratorin
        val ok = try {
            withTimeoutOrNull(30000) {
                db.collection("kujtesa_pritje").document(u).set(mapOf("p" to p, "emri" to emri, "ndryshuarSe" to System.currentTimeMillis())).await(); true
            } ?: false
        } catch (e: Exception) { false }
        if (ok) StokuApp.vendosPref("kujtesa_pritja", celes)
    }

    // ---------------- Kujtesa e grupit (v197) ----------------
    private fun nisGrupin(g: String?) {
        if (g == grupiAktiv && dGrupi != null) return
        dGrupi?.remove(); dGrupi = null; grupiGati = false; kohezGrupi?.cancel()
        grupiAktiv = g
        if (g == null || uid == null) return
        dGrupi = db.collection("grupet").document(g).collection("kujtesa").addSnapshotListener { s, e ->
            if (e != null || s == null) return@addSnapshotListener // p.sh. rregullat: mbetet kujtesa e pajisjes
            val remote = pjesetE(s.documents)
            val n = kujtesa.bashko(remote)
            if (!grupiGati) { grupiGati = true; grupiPritje.addAll(kujtesa.perDergim(remote)) } // çka di kjo pajisje më mirë shkon te grupi
            planifikoGrupin()
            if (n > 0) _versioni.value++
        }
    }

    private fun planifikoGrupin() {
        if (!grupiGati) return
        kohezGrupi?.cancel()
        kohezGrupi = scope.launch {
            delay(2000)
            val g = grupiAktiv ?: return@launch
            val bs = grupiPritje.toList()
            if (bs.isEmpty()) return@launch
            grupiPritje.clear()
            if (!ruajNePjese(db.collection("grupet").document(g).collection("kujtesa"), kujtesa.hyrjePerGrup(bs))) grupiPritje.addAll(bs)
        }
    }

    // ---------------- Mësimi ----------------
    /** Kur përdoruesi ruan një afat ose produkt me barkod (herën tjetër ky barkod plotëson vetë emrin dhe furnizuesin) */
    fun mesoNgaPerdoruesi(barkodi: String?, emri: String?, furnizuesi: String?) {
        if (barkodi.isNullOrEmpty() || neProve()) return
        try { kujtesa.meso(barkodi, emri, furnizuesi) } catch (e: Exception) { }
    }
    /** v214: furnizuesi i ri që e shkruan kushdo (edhe te një afat pa barkod) pret kontrollin */
    fun regjistroFurnizuesinERi(f: String?) { if (!f.isNullOrEmpty() && !neProve()) try { kujtesa.regjistroFurnizuesinERi(f) } catch (e: Exception) { } }
    /** Importet (Excel, fotoja e fletës): si nga përdoruesi */
    fun mesoNgaImporti(lista: List<Obj>) {
        if (neProve()) return
        try { kujtesa.mesoShume(lista.map { Kujtesa.Rreshti(it["barkodi"], it["emri"], it["furnizuesi"]) }, "mbishkruaj") } catch (e: Exception) { }
    }

    /** Prova si vizitor (ose të dhënat e saj, para se t'i heqë hyrja me llogari): kujtesa s'mëson asgjë */
    private fun neProve(): Boolean = Dyqani.g.pronari == Dyqani.VIZITOR || Llogaria.eshteVizitor()

    /** Hyrje e të dhënave shembull të provës (produkt ose furnizues), që s'duhet të dalë kurrë te regjistri */
    private fun eShembull(k: String, x: Map<String, Any?>?): Boolean =
        if (Kujtesa.eshteCelesFurnizuesi(k)) Dyqani.ProvaEVizitorit.eshteFurnizues((x?.get("e") as? String)?.ifEmpty { null } ?: k.substring(Kujtesa.FURN_PARA.length))
        else Dyqani.ProvaEVizitorit.eshteProdukt(k, x?.get("e") as? String)

    /**
     * Administratori: të dhënat shembull që hynë në pritje nga një telefon me provën si vizitor (para këtij rregullimi) fshihen,
     * si të ishin fshirë me dorë: fshirja shkon te regjistri dhe zhduket edhe te web-i dhe te pajisjet e tjera.
     */
    private fun pastroProven() {
        try {
            if (admin) {
                kujtesa.lista().filter { it.nePritje && Dyqani.ProvaEVizitorit.eshteProdukt(it.barkodi, it.emri) }.forEach { kujtesa.fshij(it.barkodi) }
                kujtesa.furnizuesit().filter { it.nePritje && !it.fshire && Dyqani.ProvaEVizitorit.eshteFurnizues(it.emri) }.forEach { kujtesa.fshijFurnizuesin(it.emri) }
            } else {
                // Të tjerët: hiqen vetëm nga ky telefon (fshirja e tyre s'dërgohet), që të mos dalin te listat
                kujtesa.lista().filter { !it.ngaAdmini && Dyqani.ProvaEVizitorit.eshteProdukt(it.barkodi, it.emri) }.forEach { kujtesa.fshij(it.barkodi) }
            }
        } catch (e: Exception) { }
    }
    private var provaPastruarPer: String? = null

    private fun planifikoMesimin() {
        kohezMesimi?.cancel()
        kohezMesimi = scope.launch {
            delay(300)
            if (uid == null || neProve()) return@launch // prova si vizitor: të dhënat shembull s'mësohen
            try {
                val g = Dyqani.g
                val l = ArrayList<Kujtesa.Rreshti>()
                g.afatet.sortedByDescending { nr(it["ndryshuarSe"]) }.forEach { l.add(Kujtesa.Rreshti(it["barkodi"], it["emri"], it["furnizuesi"])) }
                g.produktet.values.forEach { l.add(Kujtesa.Rreshti(it["barkodi"], it["emri"], it["furnizuesi"])) }
                if (Grupi.grupi() != null) Grupi.anetaretMeAfate().forEach { a ->
                    if (a["uneJam"] == true) return@forEach
                    (a["afatet"] as? List<*>)?.forEach { x -> x.siObj()?.let { l.add(Kujtesa.Rreshti(it["barkodi"], it["emri"], it["furnizuesi"])) } }
                }
                kujtesa.mesoShume(l, "plotëso")
                ruajFurnizuesitEMiratuar()
                if (provaPastruarPer != uid) { provaPastruarPer = uid; pastroProven() } // një herë pas hyrjes
            } catch (e: Exception) { }
        }
    }

    /** Administratori: furnizuesit e afateve/stokut të tij pa asnjë hyrje ruhen NË PRITJE (v238); publikohen si sugjerime */
    fun ruajFurnizuesitEMiratuar() {
        if (!admin) return
        val g = Dyqani.g
        val l = Furnizuesit.lista(g.afatet, g.produktet, kujtesa.lista().filter { it.ngaAdmini }, emptyList())
        kujtesa.regjistroFurnizuesitNePritje(l.map { it.emri })
        publikoFurnizuesit()
    }

    // ---------------- v211: furnizuesit e administratorit si sugjerime për krejt përdoruesit ----------------
    private var kohezPublikimi: Job? = null
    private var publikeLexuarSe = 0L
    private fun publikoFurnizuesit() {
        kohezPublikimi?.cancel()
        kohezPublikimi = scope.launch {
            delay(3000)
            if (!admin || uid == null) return@launch
            val lista = kujtesa.furnizuesit().filter { !it.fshire && !it.nePritje }.map { it.emri }.take(3000).sortedWith(Afatet.KOLATORI)
            val nen = Json.shkruaj(lista)
            if (StokuApp.prefsOse("furnizuesit_publikuar", "") == nen) return@launch
            val ok = try { withTimeoutOrNull(20000) { db.collection("publike").document("furnizuesit").set(mapOf("lista" to lista, "ndryshuarSe" to System.currentTimeMillis())).await(); true } ?: false } catch (e: Exception) { false }
            if (ok) { StokuApp.vendosPref("furnizuesit_publikuar", nen); StokuApp.vendosPref("furnizuesit_publike", nen) }
        }
    }
    /** Lista e administratorit (publike/furnizuesit), e lexuar më së shumti çdo 30 minuta */
    fun lexoFurnizuesitPublike() {
        if (uid == null || System.currentTimeMillis() - publikeLexuarSe < 30 * 60000) return
        publikeLexuarSe = System.currentTimeMillis()
        scope.launch {
            try {
                val s = withTimeoutOrNull(15000) { db.collection("publike").document("furnizuesit").get().await() } ?: return@launch
                val l = (s.get("lista") as? List<*>)?.filterIsInstance<String>()?.take(3000) ?: emptyList()
                StokuApp.vendosPref("furnizuesit_publike", Json.shkruaj(l))
            } catch (e: Exception) { publikeLexuarSe = 0 }
        }
    }
    fun furnizuesitPublike(): List<String> = try {
        (Json.lexo(StokuApp.prefsOse("furnizuesit_publike", "[]")) as? List<*>)?.filterIsInstance<String>() ?: emptyList()
    } catch (e: Exception) { emptyList() }

    // ---------------- Për plotësimin dhe sugjerimet ----------------
    fun merr(barkodi: String): Pair<String, String>? = kujtesa.merr(barkodi)?.let { it.emri to it.furnizuesi }
    /** Furnizuesit e kontrolluar (jo ata në pritje) nga kujtesa dhe stoku */
    fun furnizuesit(): List<String> =
        Furnizuesit.lista(emptyList(), Dyqani.g.produktet, kujtesa.lista(), kujtesa.furnizuesit()).filter { !it.nePritje }.map { it.emri }

    /** Vetëm për testet e pamjeve */
    fun vendosPerProve(autori: String, admin: Boolean, hyrjet: Map<String, Any?>) {
        kujtesa.pastro(); kujtesa.vendosAutorin(autori, admin); kujtesa.bashko(hyrjet); _versioni.value++
    }
    fun rrit() { _versioni.value++ }
}
