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
        skedariKopjes = File(ctx.filesDir, "kopja-fshirjeve.json")
        _kopja.value = try {
            Json.lexo(skedariKopjes.readText()).siObj()?.let { k ->
                Kopja(k["uid"] as? String ?: "", numerOse0(k["koha"]).toLong(), k["foldera"].siListe().mapNotNull { it.siObj() }, k["produktet"].siListe().mapNotNull { it.siObj() })
            }
        } catch (e: Exception) { null }
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
        val pm = LinkedHashMap<String, Obj>()
        b["produktet"].siListe().forEach { x ->
            val p = x.siObj() ?: return@forEach
            if (p["barkodi"] is String && p["kategoriaId"] is String) pm[Bashkimi.celesi(p["kategoriaId"], p["barkodi"])] = p
        }
        val g0 = _gjendja.value
        val folderaRe = if (b["foldera"] is List<*>) b["foldera"].siListe().mapNotNull { it.siObj() } else g0.foldera
        ruajTeFshiratNeKopje(folderaRe, pm) // v232: çka fshiu një pajisje tjetër mbetet këtu si kopje
        val rk = numerOse0(b["rendiKoha"]).toLong()
        vendosNgaCloud { g ->
            g.copy(
                foldera = folderaRe,
                produktet = pm,
                afatet = if (b["afatet"] is List<*>) b["afatet"].siListe().mapNotNull { it.siObj() } else g.afatet,
                marketet = if (b["marketet"] is List<*>) b["marketet"].siListe().mapNotNull { it.siObj() } else g.marketet,
                rendiKoha = maxOf(g.rendiKoha, rk)
            )
        }
    }

    // ---------------- v232: kopja e të fshirave nga një pajisje tjetër (si KEY_KOPJA te app-tel.js) ----------------
    class Kopja(val uid: String, val koha: Long, val foldera: List<Obj>, val produktet: List<Obj>)
    private const val KOPJA_MS = 30L * 86400000
    private lateinit var skedariKopjes: File
    private val _kopja = MutableStateFlow<Kopja?>(null)
    val kopja: StateFlow<Kopja?> get() = _kopja

    private fun uidIm(): String? = Llogaria.perdoruesi.value?.uid ?: _gjendja.value.pronari
    fun lexoKopjen(): Kopja? {
        val k = _kopja.value ?: return null
        if (k.uid != uidIm() || System.currentTimeMillis() - k.koha > KOPJA_MS) return null
        return k
    }
    private fun ruajKopjen(k: Kopja?) {
        _kopja.value = k
        if (!::skedariKopjes.isInitialized) return
        val dok = k?.let { obj("uid" to it.uid, "koha" to it.koha, "foldera" to it.foldera, "produktet" to it.produktet) }
        shkruesi.execute { try { if (dok == null) skedariKopjes.delete() else skedariKopjes.writeText(Json.shkruaj(dok)) } catch (e: Exception) { /* memoria plot: pa kopje */ } }
    }
    /** Para se të zbatohet gjendja e re: ruhet çka do të hiqej. Produkti i zhvendosur (i njëjti barkod në një folder tjetër)
     *  s'është i fshirë, përveç kur i hoqi bashkë folderi i vet. */
    private fun ruajTeFshiratNeKopje(folderaRe: List<Obj>, produktetRe: Map<String, Obj>) {
        val u = uidIm() ?: return
        if (eshteIPaprekur()) return
        val g = _gjendja.value
        val idRe = folderaRe.mapNotNull { it["id"] as? String }.toSet()
        val barkodetRe = produktetRe.values.mapNotNull { it["barkodi"] as? String }.toSet()
        val meProdukte = g.produktet.values.mapNotNull { it["kategoriaId"] as? String }.toSet()
        // Një folder i parazgjedhur bosh dhe i paprekur (pa ndryshuarSe) s'ruhet: s'ka asgjë për t'u humbur
        val folderatH = g.foldera.filter { f -> val id = f["id"] as? String; id != null && id !in idRe && (f["ndryshuarSe"] != null || id in meProdukte) }
        val fH = folderatH.mapNotNull { it["id"] as? String }.toSet()
        val produktetH = g.produktet.filter { (k, p) -> produktetRe[k] == null && (p["kategoriaId"] in fH || p["barkodi"] !in barkodetRe) }.values
        if (folderatH.isEmpty() && produktetH.isEmpty()) return
        val k0 = lexoKopjen()
        var fl = k0?.foldera ?: emptyList(); var pl = k0?.produktet ?: emptyList()
        folderatH.forEach { f -> fl = fl.filter { it["id"] != f["id"] } + f }
        produktetH.forEach { p -> val c = Bashkimi.celesi(p["kategoriaId"], p["barkodi"]); pl = pl.filter { Bashkimi.celesi(it["kategoriaId"], it["barkodi"]) != c } + p }
        if (pl.size > 20000) pl = pl.takeLast(20000)
        ruajKopjen(Kopja(u, System.currentTimeMillis(), fl, pl))
    }
    /** Çka nga kopja mungon tani (folderat dhe produktet që do të riktheheshin) */
    fun teMungueshmetNgaKopja(k: Kopja): Pair<List<Obj>, List<Obj>> {
        val g = _gjendja.value
        val fM = k.foldera.filter { f -> g.foldera.none { it["id"] == f["id"] } }
        val ka = (g.foldera + fM).mapNotNull { it["id"] as? String }.toSet()
        val pM = k.produktet.filter { p -> p["kategoriaId"] in ka && g.produktet[Bashkimi.celesi(p["kategoriaId"], p["barkodi"])] == null }
        return fM to pM
    }
    /** "3 foldera dhe 45 produkte" / "1 folder ("Pije")" */
    fun pershkrimiIKopjes(m: Pair<List<Obj>, List<Obj>>): String = listOfNotNull(
        if (m.first.isEmpty()) null else if (m.first.size == 1) "1 folder (\"" + (m.first[0]["emri"] as? String).orEmpty() + "\")" else "${m.first.size} foldera",
        if (m.second.isEmpty()) null else if (m.second.size == 1) "1 produkt" else "${m.second.size} produkte"
    ).joinToString(" dhe ")
    /** Rikthen të fshirat (me kohë të re: fitojnë ndaj fshirjes edhe në cloud) */
    fun riktheNgaKopja(): Pair<List<Obj>, List<Obj>>? {
        val k = lexoKopjen() ?: return null
        val m = teMungueshmetNgaKopja(k)
        if (m.first.isEmpty() && m.second.isEmpty()) { ruajKopjen(null); return null }
        val tani = System.currentTimeMillis()
        synchronized(fshira) {
            @Suppress("UNCHECKED_CAST") val ff = fshira["foldera"] as? MutableMap<String, Any?>
            @Suppress("UNCHECKED_CAST") val fp = fshira["produktet"] as? MutableMap<String, Any?>
            m.first.forEach { f -> ff?.remove(f["id"] as? String ?: "") }
            m.second.forEach { p -> fp?.remove(Bashkimi.celesi(p["kategoriaId"], p["barkodi"])) }
        }
        ndrysho { g ->
            val pm = LinkedHashMap(g.produktet)
            m.second.forEach { p -> pm[Bashkimi.celesi(p["kategoriaId"], p["barkodi"])] = p.me("prekurSe" to tani) }
            g.copy(foldera = g.foldera + m.first.map { it.me("ndryshuarSe" to tani) }, produktet = pm)
        }
        ruajKopjen(null)
        return m
    }
    fun hiqKopjen() = ruajKopjen(null)

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

    // ---------------- Prova si vizitor (si porta.js v217) ----------------
    /** Pronari i të dhënave gjatë provës pa llogari: s'sinkronizohen kurrë dhe hiqen kur hyn një llogari */
    const val VIZITOR = "vizitor"

    fun kaTeDhena(): Boolean = _gjendja.value.produktet.isNotEmpty() || _gjendja.value.afatet.isNotEmpty()

    /**
     * Të dhënat shembull të provës (si mbushProven te porta.js): folderat e zakonshëm, disa produkte (njëri pa stok) dhe
     * afate me ngjyrat e ndryshme (i skaduar, sot, së shpejti, në rregull, i hequr nga rafti), me data nga dita e sotme.
     */
    fun mbushProven(tani: Long = System.currentTimeMillis()) {
        val dita = 86400000L
        val sot = java.time.LocalDate.now()
        fun data(n: Long) = Afatet.isoNgaData(sot.plusDays(n))
        val foldera = listOf("ushqimore" to "Ushqimore", "pije" to "Pije", "higjiene" to "Higjiene", "fresh" to "Fresh").map { obj("id" to it.first, "emri" to it.second) }
        val lista = listOf(
            listOf("ushqimore", "2000100000014", "Bukë e bardhë 500g", 18, "Furnizuesi A"),
            listOf("ushqimore", "2000100000021", "Oriz 1kg", 40, "Furnizuesi B"),
            listOf("ushqimore", "2000100000038", "Makarona 500g", 25, "Furnizuesi B"),
            listOf("ushqimore", "2000100000045", "Vaj luledielli 1L", 6, "Furnizuesi B"),
            listOf("pije", "2000200000013", "Ujë natyral 1.5L", 48, "Furnizuesi C"),
            listOf("pije", "2000200000020", "Lëng portokalli 1L", 0, "Furnizuesi C"),
            listOf("pije", "2000200000037", "Pije e gazuar 0.5L", 30, "Furnizuesi C"),
            listOf("higjiene", "2000300000012", "Sapun i lëngshëm 500ml", 12, "Furnizuesi B"),
            listOf("higjiene", "2000300000029", "Pastë dhëmbësh 75ml", 9, "Furnizuesi B"),
            listOf("fresh", "2000400000011", "Qumësht 1L", 20, "Furnizuesi A"),
            listOf("fresh", "2000400000028", "Kos 500g", 15, "Furnizuesi A"),
            listOf("fresh", "2000400000035", "Djathë i bardhë 400g", 7, "Furnizuesi A")
        )
        // Ndryshimet e fundit, si në një dyqan të vërtetë (orë më parë)
        val oret = listOf(0.2, 0.7, 2.0, 4.0, 7.0, 26.0, 29.0, 50.0, 53.0, 75.0, 98.0, 122.0)
        val produktet = LinkedHashMap<String, Obj>()
        lista.forEachIndexed { i, x ->
            produktet[Bashkimi.celesi(x[0], x[1])] = obj("barkodi" to x[1], "emri" to x[2], "sasia" to (x[3] as Int).toLong(), "kategoriaId" to x[0],
                "furnizuesi" to x[4], "prekurSe" to Math.round(tani - oret[i] * 3600000.0))
        }
        val afatet = listOf(
            listOf("2000400000028", "Kos 500g", -2, 4, "Furnizuesi A"),
            listOf("2000400000011", "Qumësht 1L", 0, 6, "Furnizuesi A"),
            listOf("2000100000014", "Bukë e bardhë 500g", 2, 10, "Furnizuesi A"),
            listOf("2000400000035", "Djathë i bardhë 400g", 6, 3, "Furnizuesi A"),
            listOf("2000200000020", "Lëng portokalli 1L", 21, 12, "Furnizuesi C"),
            listOf("2000100000021", "Oriz 1kg", 150, 20, "Furnizuesi B"),
            listOf("2000400000042", "Jogurt frutash 150g", -9, 5, "Furnizuesi A")
        ).mapIndexed { i, x ->
            val a = obj("id" to "prova${i + 1}", "barkodi" to x[0], "emri" to x[1], "data" to data((x[2] as Int).toLong()), "sasia" to (x[3] as Int).toLong(),
                "furnizuesi" to x[4], "statusi" to "aktiv", "krijuarSe" to tani - 3 * dita, "ndryshuarSe" to tani - 3 * dita)
            if (i == 6) { a["statusi"] = "hequr"; a["hequrSe"] = tani - 8 * dita; a["ndryshuarSe"] = tani - 8 * dita }
            a as Obj
        }
        synchronized(fshira) { fshira.keys.forEach { fshira[it] = MObj() } }
        hiqKopjen()
        _gjendja.value = Gjendja(foldera = foldera, produktet = produktet, afatet = afatet, pronari = VIZITOR)
        versioniLokal++
        ruajSkedarin()
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
    fun shtoAfatet(l: List<Obj>) { if (l.isNotEmpty()) ndrysho(300) { it.copy(afatet = it.afatet + l) } }

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

    /** Cilësimet → Furnizuesit: emri i ri te krejt afatet dhe produktet (afati, produkte) */
    fun riemertoFurnizuesin(vjeter: String, iRi: String): Pair<Int, Int> {
        val g = _gjendja.value
        val r = site.stoku.logjika.Furnizuesit.riemerto(g.afatet, g.produktet, vjeter, iRi, System.currentTimeMillis())
        if (r.nAfate > 0 || r.nProdukte > 0) ndrysho { it.copy(afatet = r.afatet, produktet = if (r.nProdukte > 0) r.produktet else it.produktet) }
        return r.nAfate to r.nProdukte
    }

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

    /** Furnizuesit për sugjerim (si furnizuesitPerSugjerim te web-i): afatet e mia + të kontrolluarit (kujtesa, stoku) + lista e administratorit */
    fun furnizuesitPerSugjerim(): List<String> {
        val m = LinkedHashMap<String, String>()
        fun shto(f: Any?) { val s = jsString(f ?: "").replace(Regex("\\s+"), " ").trim(); val c = s.lowercase(); if (s.isNotEmpty() && s != "null" && !m.containsKey(c)) m[c] = s }
        Regjistri.lexoFurnizuesitPublike()
        _gjendja.value.afatet.forEach { shto(it["furnizuesi"]) }
        Regjistri.furnizuesit().forEach { shto(it) }
        Regjistri.furnizuesitPublike().forEach { shto(it) } // v211: lista e administratorit
        return m.values.sortedWith(Afatet.KOLATORI)
    }
}
