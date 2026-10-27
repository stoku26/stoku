package site.stoku.logjika

import kotlin.math.asin
import kotlin.math.cos
import kotlin.math.min
import kotlin.math.sin
import kotlin.math.sqrt

/*
 * Marketet e merchandiserëve (marketet.js): lista e marketeve (si folderat, me bashkimin), marketi aktiv ("Je te: …") me GPS,
 * pikat e përbashkëta të Stoku-t (pikat/{id}), shtimi vetëm brenda marketit (v250) dhe kufiri 20 m mes marketeve (v253).
 * Marketi: { id, emri, lat, lng, ndryshuarSe, p }. Pika: { id, emri, lat, lng, krijuarNga, krijuarNgaEmri, emriNgaAdmini }.
 */
object Marketet {
    const val RREZJA_M = 60.0 // v256: ishte 250
    const val PASAKTESIA_MAKS_M = 40.0 // v256: ishte 150
    const val PASAKTESIA_E_PRANUESHME_M = 150.0 // v256: me pasaktësi më të madhe s'dihet a je brenda marketit
    const val LARG_M = 300.0 // v256: zgjedhja me dorë bie kur GPS-i të tregon më larg se kaq (+ pasaktësia) nga ai market
    const val DORE_MS = 3 * 3600 * 1000L
    const val KONTROLLI_MS = 2 * 60 * 1000L
    const val EMRI_MAKS = 60
    const val SAKTESIA_MAKS_M = 100.0
    const val LIDHJA_M = 60.0
    const val AFER_M = 20.0
    const val FRESKET_MS = 10 * 60 * 1000L

    class Pozita(val lat: Double, val lng: Double, val sakt: Double?)

    private fun numer(x: Any?) = eNumer(x)
    fun kaVend(m: Obj?): Boolean = m != null && numer(m["lat"]) && numer(m["lng"]) &&
        Math.abs((m["lat"] as Number).toDouble()) <= 90 && Math.abs((m["lng"] as Number).toDouble()) <= 180

    private fun lat(m: Obj) = (m["lat"] as Number).toDouble()
    private fun lng(m: Obj) = (m["lng"] as Number).toDouble()

    /** Lista e pastër: vetëm marketet me id dhe emër (një rresht i dëmtuar s'e rrëzon aplikacionin) */
    fun pastro(l: Any?): List<MObj> {
        val pare = HashSet<String>()
        return l.siListe().filter {
            val m = it.siObj() ?: return@filter false
            val id = m["id"] as? String ?: return@filter false
            id.isNotEmpty() && pare.add(id)
        }.map {
            val m = it.siObj()!!
            val x = obj("id" to m["id"], "emri" to (if (m["emri"] == null) "" else jsString(m["emri"])).trim().take(EMRI_MAKS).ifEmpty { "Market" })
            if (kaVend(m)) { x["lat"] = m["lat"]; x["lng"] = m["lng"] }
            if (numer(m["ndryshuarSe"])) x["ndryshuarSe"] = m["ndryshuarSe"]
            val p = m["p"]
            if (p is String && p.isNotEmpty() && p.length <= 40) x["p"] = p
            x
        }
    }

    fun idERe(tani: Long = System.currentTimeMillis()): String =
        "m" + tani.toString(36) + (1..6).map { "0123456789abcdefghijklmnopqrstuvwxyz".random() }.joinToString("")

    fun rendit(l: List<Obj>): List<Obj> = l.sortedWith { a, b -> Afatet.KOLATORI.compare(jsString(a["emri"]), jsString(b["emri"])) }
    fun sipasId(l: List<Obj>?, id: Any?): Obj? = l?.firstOrNull { it["id"] == id }
    fun emri(l: List<Obj>?, id: Any?): String = (sipasId(l, id)?.get("emri") as? String) ?: ""
    fun emriINormalizuar(e: Any?): String = (if (e == null) "" else jsString(e)).trim().lowercase().replace(Regex("\\s+"), " ")
    fun ekzistonEmri(l: List<Obj>?, e: String, pervecId: String? = null): Boolean {
        val n = emriINormalizuar(e)
        return (l ?: emptyList()).any { it["id"] != pervecId && emriINormalizuar(it["emri"]) == n }
    }

    /** Largësia në metra (haversine) */
    fun largesia(aLat: Double, aLng: Double, bLat: Double, bLng: Double): Double {
        val r = 6371000.0; val rad = Math.PI / 180
        val dLat = (bLat - aLat) * rad; val dLng = (bLng - aLng) * rad
        val h = sin(dLat / 2) * sin(dLat / 2) + cos(aLat * rad) * cos(bLat * rad) * sin(dLng / 2) * sin(dLng / 2)
        return 2 * r * asin(min(1.0, sqrt(h)))
    }
    private fun larg(m: Obj, p: Pozita) = largesia(lat(m), lng(m), p.lat, p.lng)

    class Gjetur(val marketi: Obj, val largesia: Long)

    /** Marketi ku je (v256: më i afërti brenda 60 m + pasaktësia deri 40 m; me pasaktësi mbi 150 m asnjë), ose null */
    fun gjej(l: List<Obj>, poz: Pozita?): Gjetur? {
        if (poz == null) return null
        if (poz.sakt != null && poz.sakt > PASAKTESIA_E_PRANUESHME_M) return null
        val kufiri = RREZJA_M + min(maxOf(0.0, poz.sakt ?: 0.0), PASAKTESIA_MAKS_M)
        var mi: Obj? = null; var dMin = Double.POSITIVE_INFINITY
        l.forEach { m -> if (!kaVend(m)) return@forEach; val d = larg(m, poz); if (d <= kufiri && d < dMin) { dMin = d; mi = m } }
        return mi?.let { Gjetur(it, Math.round(dMin)) }
    }

    // ---------- Pikat e përbashkëta (v246) ----------
    fun pastroPikat(l: Any?): List<MObj> = l.siListe().mapNotNull { it.siObj() }.filter { (it["id"] as? String).orEmpty().isNotEmpty() && kaVend(it) }.map { x ->
        obj("id" to x["id"], "emri" to (if (x["emri"] == null) "" else jsString(x["emri"])).trim().take(EMRI_MAKS).ifEmpty { "Market" }, "lat" to x["lat"], "lng" to x["lng"],
            "krijuarNga" to oseBosh(x["krijuarNga"]), "krijuarNgaEmri" to oseBosh(x["krijuarNgaEmri"]), "emriNgaAdmini" to (x["emriNgaAdmini"] == true))
    }

    /** JS: `x || ''` */
    private fun oseBosh(x: Any?): Any = if (eVertete(x)) x!! else ""

    class PikaAfer(val pika: Obj, val largesia: Long)

    /** Pikat afër (deri maksM), më e afërta e para */
    fun pikatAfer(pikat: List<Obj>, poz: Pozita?, maksM: Double, n: Int = 8): List<PikaAfer> {
        if (poz == null) return emptyList()
        return pastroPikat(pikat).map { PikaAfer(it, Math.round(larg(it, poz))) }.filter { it.largesia <= maksM }
            .sortedBy { it.largesia }.take(n)
    }

    fun sipasPikes(l: List<Obj>, pikaId: Any?): Obj? = l.firstOrNull { it["p"] == pikaId }

    /** Market nga pika: id e qëndrueshme 'k' + pika (i njëjti në krejt pajisjet) */
    fun ngaPika(pika: Obj, tani: Long = System.currentTimeMillis()): MObj =
        obj("id" to "k" + pika["id"], "emri" to pika["emri"], "lat" to pika["lat"], "lng" to pika["lng"], "p" to pika["id"], "ndryshuarSe" to tani)

    private fun pozNga(m: Obj) = Pozita(lat(m), lng(m), null)

    /** Pika në të njëjtin vend: brenda 20 m (çfarëdo emri) ose 60 m me të njëjtin emër (marketi i vjetër pa pikë) */
    fun pikaPerMarketin(pikat: List<Obj>, m: Obj): Obj? {
        if (!kaVend(m)) return null
        val n = if (m["emri"] != null && m["emri"] != "") emriINormalizuar(m["emri"]) else ""
        return pikatAfer(pikat, pozNga(m), LIDHJA_M, 50).firstOrNull { it.largesia <= AFER_M || (n.isNotEmpty() && emriINormalizuar(it.pika["emri"]) == n) }?.pika
    }

    private fun mAfer(l: List<Obj>, poz: Pozita, maksM: Double): Gjetur? {
        var mi: Obj? = null; var dMin = Double.POSITIVE_INFINITY
        l.forEach { m -> if (!kaVend(m)) return@forEach; val d = larg(m, poz); if (d <= maksM && d < dMin) { dMin = d; mi = m } }
        return mi?.let { Gjetur(it, Math.round(dMin)) }
    }

    fun marketiNeVend(l: List<Obj>, poz: Pozita?): Gjetur? = if (poz == null) null else mAfer(l, poz, AFER_M)
    fun pikaShumeAfer(pikat: List<Obj>, poz: Pozita?): PikaAfer? = if (poz == null) null else pikatAfer(pikat, poz, AFER_M, 1).firstOrNull()

    /** null (shtohet) ose arsyeja: pasakte(sakt) | ekziston(emri, marketi|pika) | afer(emri, largesia, sakt) */
    sealed class Kontrolli {
        class Pasakte(val sakt: Long) : Kontrolli()
        class Ekziston(val emri: String, val marketi: Obj?, val pika: Obj?) : Kontrolli()
        class Afer(val emri: String, val largesia: Long, val sakt: Long) : Kontrolli()
    }

    fun kontrolloShtimin(poz: Pozita?, l: List<Obj>, pikat: List<Obj>): Kontrolli? {
        if (poz == null) return Kontrolli.Pasakte(0)
        val s = poz.sakt
        if (s == null || !s.isFinite() || s > SAKTESIA_MAKS_M) return Kontrolli.Pasakte(Math.round(s?.takeIf { it.isFinite() } ?: 0.0))
        marketiNeVend(l, poz)?.let { return Kontrolli.Ekziston(jsString(it.marketi["emri"]), it.marketi, null) }
        pikatAfer(pikat, poz, AFER_M, 1).firstOrNull()?.let { return Kontrolli.Ekziston(jsString(it.pika["emri"]), null, it.pika) }
        val kufiri = min(LIDHJA_M, AFER_M + maxOf(0.0, s))
        val a = mAfer(l, poz, kufiri); val b = pikatAfer(pikat, poz, kufiri, 1).firstOrNull()
        val x = if (a != null && (b == null || a.largesia <= b.largesia)) jsString(a.marketi["emri"]) to a.largesia
        else if (b != null) jsString(b.pika["emri"]) to b.largesia else null
        return x?.let { Kontrolli.Afer(it.first, it.second, Math.round(s)) }
    }

    class Sinkronizimi(val marketet: List<Obj>, val ndryshuar: Boolean, val hequr: List<String>)

    /** v250: lista e merchandiserit = pikat e Stoku-t (një pikë = një market; i vjetri lidhet; i pikës së fshirë hiqet me kujdes) */
    fun sinkronizoMePikat(l: List<Obj>, pikat: List<Obj>, afatet: List<Obj>, serveri: Boolean, tani: Long = System.currentTimeMillis()): Sinkronizimi {
        val pk = pastroPikat(pikat); val h = LinkedHashMap<String, Obj>(); val perdorur = HashMap<String, String>()
        var ndr = false; val hequr = ArrayList<String>(); val meAfate = HashSet<String>(); val r = ArrayList<Obj>()
        pk.forEach { h[it["id"] as String] = it }
        afatet.forEach { a -> (a["m"] as? String)?.takeIf { it.isNotEmpty() }?.let { meAfate.add(it) } }
        val plota = serveri && pk.size < 3000; val lidhja = HashMap<String, String>()
        l.forEach { m ->
            val mp = m["p"] as? String
            val pid = if (!mp.isNullOrEmpty()) (if (h.containsKey(mp)) mp else null) else if (kaVend(m)) pikaPerMarketin(pk, m)?.get("id") as? String else null
            if (pid == null) return@forEach
            val id = m["id"] as String
            lidhja[id] = pid
            if (perdorur[pid] == null || (meAfate.contains(id) && !meAfate.contains(perdorur[pid]))) perdorur[pid] = id
        }
        l.forEach { m0 ->
            var m = m0
            val id = m["id"] as String
            val mp = m["p"] as? String
            if (!mp.isNullOrEmpty() && !h.containsKey(mp)) {
                if (plota && !meAfate.contains(id) && tani - koha(m, "ndryshuarSe") > FRESKET_MS) { hequr.add(id); ndr = true; return@forEach }
                r.add(m); return@forEach
            }
            val pid = lidhja[id]; val x = pid?.let { h[it] }
            if (x != null && perdorur[pid] != id) {
                if (!meAfate.contains(id)) { hequr.add(id); ndr = true; return@forEach }
                if (mp.isNullOrEmpty()) { r.add(m); return@forEach }
            }
            if (x != null && mp.isNullOrEmpty()) { m = m.me("p" to pid, "ndryshuarSe" to tani); ndr = true }
            if (x != null && (m["emri"] != x["emri"] || !njejteNumer(m["lat"], x["lat"]) || !njejteNumer(m["lng"], x["lng"]))) {
                m = m.me("emri" to x["emri"], "lat" to x["lat"], "lng" to x["lng"], "ndryshuarSe" to tani); ndr = true
            }
            r.add(m)
        }
        pk.forEach { x -> if (perdorur[x["id"]] == null) { r.add(ngaPika(x, tani)); ndr = true } }
        return Sinkronizimi(r, ndr, hequr)
    }

    private fun njejteNumer(a: Any?, b: Any?): Boolean =
        if (a is Number && b is Number) a.toDouble() == b.toDouble() else a == b

    fun filtro(afatet: List<Obj>, id: String?): List<Obj> = if (id == null) afatet else afatet.filter { it["m"] == id }

    /** Kopje e afateve me emrin e marketit (mk) për kolegët dhe serverin */
    fun meEmra(afatet: List<Obj>, l: List<Obj>): List<Obj> {
        if (l.isEmpty()) return afatet
        val h = l.associate { it["id"] to it["emri"] }
        return afatet.map { a -> val m = a["m"]; if (m != null && m != "" && h[m] != null && h[m] != "") a.me("mk" to h[m]) else a }
    }

    /** Afatet pa market (ose me market të fshirë) → te id (marketi i parë). → (afatet, n) */
    fun vendosPaMarket(afatet: List<Obj>, l: List<Obj>, id: String, tani: Long = System.currentTimeMillis()): Pair<List<Obj>, Int> {
        var n = 0
        val ka = l.map { it["id"] }.toSet()
        val r = afatet.map { a -> val m = a["m"]; if (m != null && m != "" && m in ka) a else { n++; a.me("m" to id, "ndryshuarSe" to tani) } }
        return r to n
    }

    class Grupi(val id: String, val emri: String, val afatet: List<Obj>)

    /** Grupimi sipas marketit (emri), "Pa market" në fund */
    fun grupo(afatet: List<Obj>, l: List<Obj>): List<Grupi> {
        val g = LinkedHashMap<String, MutableList<Obj>>(); val emrat = HashMap<String, String>()
        rendit(pastro(l)).forEach { m -> g[m["id"] as String] = ArrayList(); emrat[m["id"] as String] = m["emri"] as String }
        val pa = ArrayList<Obj>()
        afatet.forEach { a -> val m = a["m"] as? String; if (m != null && g.containsKey(m)) g[m]!!.add(a) else pa.add(a) }
        val r = g.filter { it.value.isNotEmpty() }.map { Grupi(it.key, emrat[it.key]!!, it.value) }.toMutableList()
        if (pa.isNotEmpty()) r.add(Grupi("", "Pa market", pa))
        return r
    }

    // ---------- Marketi aktiv i kësaj pajisjeje ----------
    data class Aktivi(val id: String?, val menyra: String = "gps", val koha: Long = 0, val kontrolluarSe: Long = 0)

    /** v256: a të tregon GPS-i qartë larg marketit id (më larg se LARG_M + pasaktësia)? Pa vendndodhje ose me pozitë të përafërt: jo */
    fun largNgaMarketi(l: List<Obj>, id: Any?, poz: Pozita?): Boolean {
        val m = sipasId(l, id) ?: return false
        if (!kaVend(m) || poz == null) return false
        val s = maxOf(0.0, poz.sakt ?: 0.0)
        if (s > PASAKTESIA_E_PRANUESHME_M) return false
        return larg(m, poz) > LARG_M + s
    }

    /** Përgjigjja e GPS-it → aktivi i ri (zgjedhja me dorë fiton për 3 orë, v256: përveç kur GPS-i të tregon larg saj) */
    fun pasGps(aktivi: Aktivi, gjetur: Gjetur?, tani: Long = System.currentTimeMillis(), larg: Boolean = false): Aktivi {
        val a = aktivi.copy(kontrolluarSe = tani)
        if (a.menyra == "dore" && tani - a.koha < DORE_MS && !larg) return a
        return if (gjetur != null) Aktivi(gjetur.marketi["id"] as String, "gps", tani, tani) else Aktivi(null, "gps", tani, tani)
    }

    fun kaPika(l: List<Obj>): Boolean = l.any { kaVend(it) }
    fun duhetKontrolli(l: List<Obj>, aktivi: Aktivi?, tani: Long = System.currentTimeMillis()): Boolean =
        kaPika(l) && tani - (aktivi?.kontrolluarSe ?: 0L) >= KONTROLLI_MS

    fun tekstiGabimit(e: String): String = when (e) {
        "leje" -> "Stoku s'ka leje për vendndodhjen. Lejoje te cilësimet e shfletuesit ose të aplikacionit, ose zgjidhe marketin me dorë."
        "pa-gps" -> "Kjo pajisje s'e jep vendndodhjen. Zgjidhe marketin me dorë."
        "kohe" -> "Vendndodhja s'u gjet me kohë (brenda ndërtesës GPS-i dobësohet). Provo sërish ose zgjidhe marketin me dorë."
        else -> "Vendndodhja s'u gjet. Provo sërish ose zgjidhe marketin me dorë."
    }
}
