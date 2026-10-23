package site.stoku.vendas

import android.content.Context
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import site.stoku.logjika.Afatet
import site.stoku.logjika.Bashkimi
import site.stoku.logjika.Json
import site.stoku.logjika.MObj
import site.stoku.logjika.Obj
import site.stoku.logjika.jsString
import site.stoku.logjika.koha
import site.stoku.logjika.me
import site.stoku.logjika.numerOse0
import site.stoku.logjika.obj
import site.stoku.logjika.siListe
import site.stoku.logjika.siObj
import java.io.File
import java.util.concurrent.Executors

/**
 * Dyqani në këtë telefon (si localStorage i web-it): folderat, produktet, afatet, marketet, shënimet e fshirjeve dhe
 * renditja. Ruhet në një skedar (dyqani.json) pas çdo ndryshimi dhe sinkronizohet me Firebase (Sinkronizimi).
 * Ndryshimet bëhen vetëm në fillin kryesor; gjendja është e pandryshueshme (kopje të reja), që sinkronizimi në sfond
 * ta lexojë pa rrezik.
 */
data class Gjendja(
    val foldera: List<Obj> = Bashkimi.FOLDERAT_PARAZGJEDHUR.map { obj("id" to it.first, "emri" to it.second) },
    val produktet: Map<String, Obj> = emptyMap(),
    val afatet: List<Obj> = emptyList(),
    val marketet: List<Obj> = emptyList(),
    val rendiKoha: Long = 0,
    val pronari: String? = null
)

object Dyqani {
    private val _gjendja = MutableStateFlow(Gjendja())
    val gjendja: StateFlow<Gjendja> get() = _gjendja
    val g: Gjendja get() = _gjendja.value

    /** Shënimet e fshirjeve: { produktet: {çelësi: koha}, foldera, afatet, marketet } */
    private val fshira: MObj = obj("produktet" to MObj(), "foldera" to MObj(), "afatet" to MObj(), "marketet" to MObj())

    /** Rritet me çdo ndryshim të bërë këtu (jo nga sinkronizimi): rezultati i një sinkronizimi të vjetër s'e mbulon */
    @Volatile var versioniLokal = 0
        private set

    /** Thirret pas çdo ndryshimi lokal (Sinkronizimi e dërgon në cloud me pak vonesë) */
    var kurNdryshon: ((vonesaMs: Long) -> Unit)? = null

    private lateinit var skedari: File
    private val shkruesi = Executors.newSingleThreadExecutor()
    private var pritjeShkrimi = false

    /** Vetëm për testet e pamjeve */
    fun vendosPerProve(g: Gjendja) { _gjendja.value = g }

    fun nis(ctx: Context) {
        skedari = File(ctx.filesDir, "dyqani.json")
        val x = try { if (skedari.exists()) Json.lexo(skedari.readText()).siObj() else null } catch (e: Exception) { null }
        if (x != null) {
            val f = Bashkimi.pastroFolderat(x["foldera"])
            val pm = LinkedHashMap<String, Obj>()
            Bashkimi.pastroProduktet(x["produktet"].siObj()?.values?.toList() ?: x["produktet"].siListe())
                .forEach { pm[Bashkimi.celesi(it["kategoriaId"], it["barkodi"])] = it }
            _gjendja.value = Gjendja(
                foldera = if (x["foldera"] is List<*>) f else Gjendja().foldera,
                produktet = pm,
                afatet = Bashkimi.pastroAfatet(x["afatet"]),
                marketet = x["marketet"].siListe().mapNotNull { it.siObj() },
                rendiKoha = numerOse0(x["rendiKoha"]).toLong(),
                pronari = x["pronari"] as? String
            )
            x["fshira"].siObj()?.forEach { (l, m) -> (m.siObj())?.let { fshira[l] = LinkedHashMap(it) } }
        }
    }

    // ---------------- Ruajtja në skedar ----------------
    private fun ruajSkedarin() {
        synchronized(this) { if (pritjeShkrimi) return; pritjeShkrimi = true }
        shkruesi.execute {
            synchronized(this) { pritjeShkrimi = false }
            val gj = _gjendja.value
            val fsh = synchronized(fshira) { kopjoFshirat() }
            val dok = obj("v" to 1L, "pronari" to gj.pronari, "foldera" to gj.foldera, "produktet" to gj.produktet,
                "afatet" to gj.afatet, "marketet" to gj.marketet, "rendiKoha" to gj.rendiKoha, "fshira" to fsh)
            try {
                val tmp = File(skedari.parentFile, "dyqani.json.tmp")
                tmp.writeText(Json.shkruaj(dok))
                if (!tmp.renameTo(skedari)) { skedari.delete(); tmp.renameTo(skedari) }
            } catch (e: Exception) { /* memoria plot: ndryshimi mbetet në memorie dhe shkon në cloud */ }
        }
    }

    private fun kopjoFshirat(): MObj {
        val o = MObj()
        fshira.forEach { (l, m) -> o[l] = LinkedHashMap(m.siObj() ?: emptyMap()) }
        return o
    }

    /** Ndryshim nga përdoruesi: ruhet, versioni rritet dhe nis sinkronizimi */
    private fun ndrysho(vonesaMs: Long = 1500, fn: (Gjendja) -> Gjendja) {
        _gjendja.value = fn(_gjendja.value)
        versioniLokal++
        ruajSkedarin()
        kurNdryshon?.invoke(vonesaMs)
    }

    /** Ndryshim nga sinkronizimi (pa versionin lokal, pa sinkronizim të ri) */
    internal fun vendosNgaCloud(fn: (Gjendja) -> Gjendja) {
        _gjendja.value = fn(_gjendja.value)
        ruajSkedarin()
    }

    private fun shenoFshirjen(lloji: String, celesi: String) {
        synchronized(fshira) {
            @Suppress("UNCHECKED_CAST")
            (fshira.getOrPut(lloji) { MObj() } as MutableMap<String, Any?>)[celesi] = System.currentTimeMillis()
        }
    }

    // ---------------- Për cloud-in (si gjendjaPerCloud te web-i) ----------------
    fun gjendjaPerCloud(): MObj {
        val g = _gjendja.value
        return obj("app" to "stoku", "version" to 3L, "koha" to site.stoku.logjika.isoNgaMs(System.currentTimeMillis()),
            "rendiKoha" to g.rendiKoha, "foldera" to g.foldera, "produktet" to g.produktet.values.toList(),
            "afatet" to g.afatet, "marketet" to g.marketet, "fshira" to synchronized(fshira) { kopjoFshirat() })
    }

    /** Pas sinkronizimit të suksesshëm: shënimet më të vjetra se 120 ditë hiqen */
    /** "Rikthe nga cloud": fshirjet e kësaj pajisjeje harrohen (përndryshe bashkimi i fshinte sërish) */
    fun harroFshirjet() {
        synchronized(fshira) { fshira.values.forEach { @Suppress("UNCHECKED_CAST") (it as? MutableMap<String, Any?>)?.clear() } }
        ruajSkedarin()
    }

    fun pastroFshirjet() {
        synchronized(fshira) {
            @Suppress("UNCHECKED_CAST")
            Bashkimi.pastroFshirjetEVjetra(fshira as MutableMap<String, Any?>)
        }
        ruajSkedarin()
    }

    /** Zbaton rezultatin e bashkimit (nga cloud-i): folderat, produktet, afatet, marketet, renditja */
    fun zbatoBashkimin(b: Obj) {
        if (Bashkimi.eNjejte(b, gjendjaPerCloud())) return
        vendosNgaCloud { g ->
            val pm = LinkedHashMap<String, Obj>()
            b["produktet"].siListe().forEach { x ->
                val p = x.siObj() ?: return@forEach
                if (p["barkodi"] is String && p["kategoriaId"] is String) pm[Bashkimi.celesi(p["kategoriaId"], p["barkodi"])] = p
            }
            val rk = numerOse0(b["rendiKoha"]).toLong()
            g.copy(
                foldera = if (b["foldera"] is List<*>) b["foldera"].siListe().mapNotNull { it.siObj() } else g.foldera,
                produktet = pm,
                afatet = if (b["afatet"] is List<*>) b["afatet"].siListe().mapNotNull { it.siObj() } else g.afatet,
                marketet = if (b["marketet"] is List<*>) b["marketet"].siListe().mapNotNull { it.siObj() } else g.marketet,
                rendiKoha = maxOf(g.rendiKoha, rk)
            )
        }
    }

    /** Gjendja e cloud-it në hyrje (zbatoGjendjenNgaCloud): pa foldera → 4 të parazgjedhurit; pastaj sinkronizim */
    fun zbatoGjendjenNgaCloud(te0: Obj) {
        val folderat = Bashkimi.pastroFolderat(te0["foldera"])
        val pm = LinkedHashMap<String, Obj>()
        Bashkimi.pastroProduktet(te0["produktet"]).forEach { pm[Bashkimi.celesi(it["kategoriaId"], it["barkodi"])] = it }
        val rk = numerOse0(te0["rendiKoha"]).toLong()
        ndrysho { g ->
            g.copy(
                foldera = folderat.ifEmpty { Gjendja().foldera },
                produktet = pm,
                afatet = if (te0["afatet"] is List<*>) Bashkimi.pastroAfatet(te0["afatet"]) else g.afatet,
                marketet = if (te0["marketet"] is List<*>) te0["marketet"].siListe().mapNotNull { it.siObj() } else g.marketet,
                rendiKoha = maxOf(g.rendiKoha, rk)
            )
        }
    }

    /** E vërtetë kur telefoni s'ka asnjë të dhënë të përdoruesit (vetëm 4 folderat e parazgjedhur, të paprekur) */
    fun eshteIPaprekur(): Boolean {
        val g = _gjendja.value
        if (g.produktet.isNotEmpty() || g.afatet.isNotEmpty() || g.rendiKoha != 0L) return false
        val d = Bashkimi.FOLDERAT_PARAZGJEDHUR
        return g.foldera.size == d.size && d.indices.all { g.foldera[it]["id"] == d[it].first && g.foldera[it]["emri"] == d[it].second }
    }

    /** Hyrja me një llogari tjetër: të dhënat e llogarisë së vjetër s'i kalojnë asaj (si porta.js) */
    fun vendosPronarin(uid: String) {
        val p = _gjendja.value.pronari
        if (p == uid) return
        if (p != null) {
            synchronized(fshira) { fshira.keys.forEach { fshira[it] = MObj() } }
            _gjendja.value = Gjendja(pronari = uid)
            versioniLokal++
        } else _gjendja.value = _gjendja.value.copy(pronari = uid)
        ruajSkedarin()
    }

    // ---------------- Folderat ----------------
    fun emriFolderit(id: Any?): String = (_gjendja.value.foldera.firstOrNull { it["id"] == id }?.get("emri") as? String) ?: ""
    fun produktetEFolderit(id: String): List<Obj> = _gjendja.value.produktet.values.filter { it["kategoriaId"] == id }

    fun krijoFolderin(emri: String, ikona: String?): String {
        val id = "f" + System.currentTimeMillis().toString(36) + (1..4).map { "0123456789abcdefghijklmnopqrstuvwxyz".random() }.joinToString("")
        val f = obj("id" to id, "emri" to emri.trim())
        if (ikona != null) f["ikona"] = ikona
        f["ndryshuarSe"] = System.currentTimeMillis()
        ndrysho { it.copy(foldera = it.foldera + f) }
        return id
    }

    fun ndryshoFolderin(id: String, emri: String, ikona: String?) {
        ndrysho { g ->
            g.copy(foldera = g.foldera.map { f ->
                if (f["id"] != id) f else f.me("emri" to emri.trim(), "ndryshuarSe" to System.currentTimeMillis()).also { m ->
                    if (ikona != null) m["ikona"] = ikona
                }
            })
        }
    }

    fun fshijFolderin(id: String) {
        val brenda = produktetEFolderit(id)
        shenoFshirjen("foldera", id)
        brenda.forEach { shenoFshirjen("produktet", Bashkimi.celesi(id, it["barkodi"])) }
        ndrysho { g -> g.copy(foldera = g.foldera.filter { it["id"] != id }, produktet = g.produktet.filterValues { it["kategoriaId"] != id }) }
    }

    /** Renditja e re e folderave (zvarritja): fiton renditja me kohën më të re */
    fun renditFolderat(ids: List<String>) {
        ndrysho { g ->
            val sipas = g.foldera.associateBy { it["id"] as String }
            val te = ids.mapNotNull { sipas[it] } + g.foldera.filter { it["id"] !in ids }
            g.copy(foldera = te, rendiKoha = System.currentTimeMillis())
        }
    }

    // ---------------- Produktet ----------------
    fun produkti(folderId: String, barkodi: String): Obj? = _gjendja.value.produktet[Bashkimi.celesi(folderId, barkodi)]

    /** Shton sasinë (mund të jetë negative) te produkti; stoku s'bëhet negativ. furnizuesi: null = mbetet, "" = hiqet */
    fun ruajProduktin(folderId: String, barkodi: String, emri: String, sasiaShtese: Long, furnizuesi: String?): Obj {
        val k = Bashkimi.celesi(folderId, barkodi)
        var ri: MObj = MObj()
        ndrysho { g ->
            val e = g.produktet[k]
            val total = maxOf(0L, ((e?.get("sasia") as? Number)?.toLong() ?: 0L) + sasiaShtese)
            ri = (e ?: emptyMap()).me("barkodi" to barkodi, "emri" to emri, "sasia" to total, "kategoriaId" to folderId, "prekurSe" to System.currentTimeMillis())
            if (furnizuesi != null) { if (furnizuesi.isNotEmpty()) ri["furnizuesi"] = furnizuesi else ri.remove("furnizuesi") }
            g.copy(produktet = LinkedHashMap(g.produktet).also { it[k] = ri })
        }
        return ri
    }

    fun vendosSasine(celesi: String, sasia: Long) {
        ndrysho { g ->
            val p = g.produktet[celesi] ?: return@ndrysho g
            if ((p["sasia"] as? Number)?.toLong() == sasia) return@ndrysho g
            g.copy(produktet = LinkedHashMap(g.produktet).also { it[celesi] = p.me("sasia" to maxOf(0L, sasia), "prekurSe" to System.currentTimeMillis()) })
        }
    }

    fun fshijProduktin(celesi: String) {
        if (_gjendja.value.produktet[celesi] == null) return
        shenoFshirjen("produktet", celesi)
        ndrysho { g -> g.copy(produktet = LinkedHashMap(g.produktet).also { it.remove(celesi) }) }
    }

    fun fshiTeGjithaNeFolder(folderId: String) {
        val brenda = produktetEFolderit(folderId)
        brenda.forEach { shenoFshirjen("produktet", Bashkimi.celesi(folderId, it["barkodi"])) }
        ndrysho { g -> g.copy(produktet = g.produktet.filterValues { it["kategoriaId"] != folderId }) }
    }

    /** → (u bashkua me një ekzistues, sasia e re) ose null */
    fun zhvendosProduktin(folderVjeter: String, barkodi: String, folderRi: String): Pair<Boolean, Long>? {
        val g0 = _gjendja.value
        val kv = Bashkimi.celesi(folderVjeter, barkodi); val kr = Bashkimi.celesi(folderRi, barkodi)
        val p = g0.produktet[kv] ?: return null
        if (g0.foldera.none { it["id"] == folderRi }) return null
        val ek = g0.produktet[kr]
        val total = ((ek?.get("sasia") as? Number)?.toLong() ?: 0L) + ((p["sasia"] as? Number)?.toLong() ?: 0L)
        shenoFshirjen("produktet", kv)
        ndrysho { g ->
            val emri = (ek?.get("emri") as? String)?.takeIf { it.isNotEmpty() } ?: (p["emri"] ?: "")
            val ri = obj("barkodi" to barkodi, "emri" to emri, "sasia" to total, "kategoriaId" to folderRi, "prekurSe" to System.currentTimeMillis())
            ((ek?.get("furnizuesi") as? String)?.takeIf { it.isNotEmpty() } ?: (p["furnizuesi"] as? String)?.takeIf { it.isNotEmpty() })?.let { ri["furnizuesi"] = it }
            g.copy(produktet = LinkedHashMap(g.produktet).also { it.remove(kv); it[kr] = ri })
        }
        return (ek != null) to total
    }

    // ---------------- Marketet (merchandiseri) ----------------
    /** Lista e re e marketeve (dhe ndoshta e afateve, kur marketi i parë merr afatet pa market); hequr = shënohen si fshirje */
    fun vendosMarketet(marketet: List<Obj>, afatet: List<Obj>? = null, hequr: List<String> = emptyList()) {
        hequr.forEach { shenoFshirjen("marketet", it) }
        ndrysho(if (afatet != null) 300 else 1500) { g -> g.copy(marketet = marketet, afatet = afatet ?: g.afatet) }
    }

    // ---------------- Afatet ----------------
    fun afati(id: String): Obj? = _gjendja.value.afatet.firstOrNull { it["id"] == id }

    fun shtoAfatin(a: Obj) = ndrysho(300) { it.copy(afatet = it.afatet + a) }

    fun perditesoAfatin(id: String, ndryshimet: Map<String, Any?>) {
        ndrysho(300) { g ->
            g.copy(afatet = g.afatet.map { a -> if (a["id"] != id) a else a.kopje2(ndryshimet).also { it["ndryshuarSe"] = System.currentTimeMillis() } })
        }
    }

    fun fshijAfatin(id: String) {
        shenoFshirjen("afatet", id)
        ndrysho(300) { g -> g.copy(afatet = g.afatet.filter { it["id"] != id }) }
    }

    private fun Obj.kopje2(n: Map<String, Any?>): MObj { val m = LinkedHashMap(this); m.putAll(n); return m }

    // ---------------- Plotësimi nga barkodi ----------------
    /** Emri i produktit nga stoku ose afatet (herën tjetër ky barkod plotëson vetë emrin) */
    fun emriNgaBarkodi(barkodi: String): String {
        if (barkodi.isEmpty()) return ""
        val g = _gjendja.value
        Regjistri.merr(barkodi)?.first?.takeIf { it.isNotEmpty() }?.let { return it }
        g.produktet.values.firstOrNull { it["barkodi"] == barkodi && (it["emri"] as? String).orEmpty().isNotEmpty() }?.let { return it["emri"] as String }
        g.afatet.firstOrNull { it["barkodi"] == barkodi && (it["emri"] as? String).orEmpty().isNotEmpty() }?.let { return it["emri"] as String }
        return ""
    }

    fun furnizuesiNgaBarkodi(barkodi: String): String {
        if (barkodi.isEmpty()) return ""
        Regjistri.merr(barkodi)?.second?.takeIf { it.isNotEmpty() }?.let { return it }
        return _gjendja.value.afatet.sortedByDescending { koha(it, "ndryshuarSe") }
            .firstOrNull { it["barkodi"] == barkodi && (it["furnizuesi"] as? String).orEmpty().isNotEmpty() }?.get("furnizuesi") as? String ?: ""
    }

    /** Furnizuesit për sugjerim: afatet + produktet + regjistri i përbashkët */
    fun furnizuesitPerSugjerim(): List<String> {
        val m = LinkedHashMap<String, String>()
        fun shto(f: Any?) { val s = jsString(f ?: "").replace(Regex("\\s+"), " ").trim(); val c = s.lowercase(); if (s.isNotEmpty() && s != "null" && !m.containsKey(c)) m[c] = s }
        _gjendja.value.afatet.forEach { shto(it["furnizuesi"]) }
        _gjendja.value.produktet.values.forEach { shto(it["furnizuesi"]) }
        Regjistri.furnizuesit().forEach { shto(it) }
        return m.values.sortedWith(Afatet.KOLATORI)
    }
}
