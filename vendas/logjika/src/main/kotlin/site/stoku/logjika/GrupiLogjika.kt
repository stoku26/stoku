package site.stoku.logjika

import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId

/*
 * Grupi (ekipa.js, pjesa 2 "Funksione të pastra"): prania, koha relative, statistikat e grupit, tekstet e aktivitetit
 * dhe të njoftimeve, kalendari, përmbledhja e afateve për kolegët dhe heqjet e kolegëve që presin miratimin.
 * Anëtari: { uid, emri, aktivSe, online, platforma, roli }. Ngjarja (grupet/{g}/feed): { lloji, uid, emri, koha, … }.
 */
object GrupiLogjika {
    const val ONLINE_MS = 4 * 60 * 1000L
    const val RRAHJA_MS = 90 * 1000L
    const val PERMBLEDHJA_HEQUR_DITE = 40
    const val PERMBLEDHJA_MAKS = 700 * 1024
    const val KERKESA_MAKS = 30
    val MUAJT = listOf("Janar", "Shkurt", "Mars", "Prill", "Maj", "Qershor", "Korrik", "Gusht", "Shtator", "Tetor", "Nëntor", "Dhjetor")
    val DITET_SHKURT = listOf("Hën", "Mar", "Mër", "Enj", "Pre", "Sht", "Die")
    val FUSHAT_E_PERMBLEDHJES = listOf("id", "barkodi", "emri", "data", "sasia", "furnizuesi", "statusi", "hequrSe", "hequrNga", "lajmeruarSe", "ndryshuarSe", "mk")

    private fun dy(n: Int) = (if (n < 10) "0" else "") + n
    private fun data(ts: Long, zona: ZoneId) = Instant.ofEpochMilli(ts).atZone(zona)
    fun isoDites(ts: Long, zona: ZoneId = ZoneId.systemDefault()): String { val d = data(ts, zona); return d.year.toString() + "-" + dy(d.monthValue) + "-" + dy(d.dayOfMonth) }

    /** v288 (ekipa.js kohaENgjarjes): ora e ngjarjes = ora e vërtetë e veprimit kur është e kaluar dhe jo më e vjetër se 30 ditë; përndryshe "tani" */
    const val NGJARJA_MAKS_VJETER = 30 * 86400000L
    fun kohaENgjarjes(k: Any?, tani: Long): Long {
        if (!eNumer(k)) return tani
        val d = (k as Number).toDouble()
        return if (d > 0 && d <= tani && tani - d <= NGJARJA_MAKS_VJETER) Math.floor(d).toLong() else tani
    }
    fun eshteOnline(a: Obj?, tani: Long = System.currentTimeMillis()): Boolean =
        a != null && a["online"] == true && tani - koha(a, "aktivSe") < ONLINE_MS

    fun kohaRelative(ts: Long, tani: Long = System.currentTimeMillis(), zona: ZoneId = ZoneId.systemDefault()): String {
        if (ts == 0L) return ""
        val d = tani - ts
        if (d < 60000) return "tani"
        if (d < 3600000) return "para " + (d / 60000) + " min"
        val dt = data(ts, zona)
        val sot = data(tani, zona)
        val ora = dy(dt.hour) + ":" + dy(dt.minute)
        if (dt.toLocalDate() == sot.toLocalDate()) return "sot $ora"
        if (dt.toLocalDate() == sot.toLocalDate().minusDays(1)) return "dje $ora"
        return dy(dt.dayOfMonth) + "." + dy(dt.monthValue) + (if (dt.year != sot.year) "." + dt.year else "") + " " + ora
    }

    /** Titulli i ditës te aktiviteti: "Sot", "Dje" ose DD.MM.VVVV */
    fun titulliDites(ts: Long, tani: Long = System.currentTimeMillis(), zona: ZoneId = ZoneId.systemDefault()): String {
        val dt = data(ts, zona).toLocalDate()
        val sot = data(tani, zona).toLocalDate()
        if (dt == sot) return "Sot"
        if (dt == sot.minusDays(1)) return "Dje"
        return dy(dt.dayOfMonth) + "." + dy(dt.monthValue) + "." + dt.year
    }

    fun ora(ts: Long, zona: ZoneId = ZoneId.systemDefault()): String { val d = data(ts, zona); return dy(d.hour) + ":" + dy(d.minute) }

    fun tekstiPranise(a: Obj?, tani: Long = System.currentTimeMillis(), zona: ZoneId = ZoneId.systemDefault()): String {
        if (eshteOnline(a, tani)) return "Online tani"
        if (a != null && koha(a, "aktivSe") > 0) return "Parë " + kohaRelative(koha(a, "aktivSe").toLong(), tani, zona)
        return "S'është parë ende"
    }

    private fun koha(o: Obj, k: String): Double = site.stoku.logjika.koha(o, k)

    // ---------- Përmbledhja e afateve për kolegët (grupet/{g}/afatet/{uid}) ----------
    /** Vetëm fushat që duhen; afatet në raft + të hequrat e 40 ditëve; brenda ~700 KB (së pari ato në raft) */
    fun permbledhjaEAfateve(afatet: List<Obj>, tani: Long = System.currentTimeMillis()): List<MObj> {
        val kufiri = tani - PERMBLEDHJA_HEQUR_DITE * 86400000L
        val lista = afatet.filter { a -> eVertete(a["id"]) && (a["statusi"] != "hequr" || koha(a, "hequrSe") >= kufiri) }.map { a ->
            val r = MObj()
            FUSHAT_E_PERMBLEDHJES.forEach { k -> val v = a[k]; if (v != null && v != "") r[k] = v }
            r
        }.sortedWith { x, y ->
            val hx = x["statusi"] == "hequr"; val hy = y["statusi"] == "hequr"
            if (hx != hy) return@sortedWith if (hx) 1 else -1
            if (hx) {
                val d = koha(y, "hequrSe").compareTo(koha(x, "hequrSe"))
                if (d != 0) d else krahasoTekst(jsString(x["id"]), jsString(y["id"]))
            } else {
                val d = krahasoTekst(jsString(x["data"] ?: ""), jsString(y["data"] ?: ""))
                if (d != 0) d else krahasoTekst(jsString(x["id"]), jsString(y["id"]))
            }
        }
        var madhesia = 0.0
        val rez = ArrayList<MObj>()
        for (x in lista) {
            madhesia += Json.shkruaj(x).length * 1.2 + 40
            if (madhesia > PERMBLEDHJA_MAKS) break
            rez.add(x)
        }
        return rez
    }

    // ---------- Administratori ndryshon afatin e një kolegu (si ndryshoAfatinNeGjendje te ekipa.js) ----------
    /**
     * Gjendja e dyqanit të kolegut me afatin e ndryshuar: "hiq" (i hequr nga administratori), "kthe" (sërish në raft) ose
     * "fshij" (hiqet dhe shënohet te fshira.afatet që bashkimi të mos e rikthejë). null = afati s'ekziston.
     */
    fun ndryshoAfatinNeGjendje(gjendja: Obj?, afatId: String, veprimi: String, emriAdminit: String?, tani: Long = System.currentTimeMillis()): MObj? {
        val g = MObj(); if (gjendja != null) g.putAll(gjendja)
        val afatet: List<Any?> = (g["afatet"] as? List<*>) ?: emptyList<Any?>()
        if (afatet.none { it.siObj()?.get("id") == afatId }) return null
        if (veprimi == "fshij") {
            g["afatet"] = afatet.filter { it.siObj()?.get("id") != afatId }
            val f = MObj(); f["produktet"] = MObj(); f["foldera"] = MObj(); f["afatet"] = MObj()
            g["fshira"].siObj()?.let { f.putAll(it) }
            val fa = MObj(); f["afatet"].siObj()?.let { fa.putAll(it) }
            fa[afatId] = tani
            f["afatet"] = fa
            g["fshira"] = f
        } else {
            g["afatet"] = afatet.map { x ->
                val a = x.siObj()
                if (a == null || a["id"] != afatId) x
                else MObj().also { r ->
                    r.putAll(a)
                    if (veprimi == "kthe") { r["statusi"] = "aktiv"; r["hequrSe"] = 0L; r["hequrNga"] = ""; r["ndryshuarSe"] = tani }
                    else { r["statusi"] = "hequr"; r["hequrSe"] = tani; r["hequrNga"] = emriAdminit ?: ""; r["ndryshuarSe"] = tani }
                }
            }
        }
        return g
    }

    // ---------- Heqjet e kolegëve (v179: presin miratimin e pronarit) ----------
    class Heqja(var heqja: Obj? = null, var vendimi: Obj? = null)

    fun eshteHeqjeKolegu(ng: Obj?): Boolean = ng != null && ng["lloji"] == "hequr" && eVertete(ng["pronariUid"]) && eVertete(ng["afatId"]) && ng["pronariUid"] != ng["uid"]

    /** pronariUid|afatId → { heqja, vendimi } */
    fun hartaEHeqjeve(ngjarjet: List<Obj>): Map<String, Heqja> {
        val m = LinkedHashMap<String, Heqja>()
        ngjarjet.forEach { ng ->
            if (!eVertete(ng["afatId"])) return@forEach
            if (eshteHeqjeKolegu(ng)) {
                val k = jsString(ng["pronariUid"]) + "|" + jsString(ng["afatId"])
                val h = m.getOrPut(k) { Heqja() }
                if (h.heqja == null || koha(h.heqja!!, "koha") < koha(ng, "koha")) h.heqja = ng
            } else if (ng["lloji"] == "heqje-pranuar" || ng["lloji"] == "heqje-refuzuar") {
                val k = jsString(if (eVertete(ng["pronariUid"])) ng["pronariUid"] else ng["uid"]) + "|" + jsString(ng["afatId"])
                val h = m.getOrPut(k) { Heqja() }
                if (h.vendimi == null || koha(h.vendimi!!, "koha") < koha(ng, "koha")) h.vendimi = ng
            }
        }
        return m
    }

    /** Afati i kolegut "në pritje" (nePritjeNga, nePritjeUid, nePritjeSe) derisa pronari ta pranojë ose ta refuzojë */
    fun mbivendosHeqjen(afat: Obj, pronariUid: String, harta: Map<String, Heqja>): Obj {
        val h = harta[pronariUid + "|" + jsString(afat["id"])] ?: return afat
        val ng = h.heqja ?: return afat
        if (afat["statusi"] == "hequr" || koha(afat, "ndryshuarSe") >= koha(ng, "koha")) return afat
        if (h.vendimi != null && koha(h.vendimi!!, "koha") >= koha(ng, "koha")) return afat
        return afat.me("nePritjeNga" to ((ng["emri"] as? String)?.ifEmpty { null } ?: "Një koleg"), "nePritjeUid" to ng["uid"], "nePritjeSe" to ng["koha"])
    }

    /** A duhet ta zbatojë pronari heqjen e kolegut? Vetëm për të skaduara vërtet, të pandryshuara pas heqjes */
    fun duhetZbatuarHeqja(afat: Obj?, nj: Obj?, tani: Long = System.currentTimeMillis()): Boolean {
        if (afat == null || nj == null || afat["statusi"] == "hequr") return false
        if (Afatet.statusi(afat, tani) != "skaduar") return false
        return koha(afat, "ndryshuarSe") < koha(nj, "koha")
    }

    // ---------- Kalendari ----------
    private val RENDI_STATUSIT = mapOf("skaduar" to 4, "pa-date" to 3, "afer" to 2, "ok" to 1, "hequr" to 0)
    private fun statusiMeIKeq(lista: List<Obj>, tani: Long): String? {
        var m: String? = null
        lista.forEach { a -> val s = Afatet.statusi(a, tani); if (m == null || (RENDI_STATUSIT[s] ?: 0) > (RENDI_STATUSIT[m] ?: 0)) m = s }
        return m
    }

    class Qeliza(val iso: String, val dita: Int, val sot: Boolean, val afatet: List<Obj>, val neRaft: Int, val statusi: String?)
    class Kalendari(val titulli: String, val viti: Int, val muaji: Int, val qelizat: List<Qeliza?>, val ditetMeStatus: Map<String, Int>)

    /** Muaji (0–11) me afatet e secilës ditë dhe ngjyrën (statusi më i keq i atyre në raft); e hëna kolona e parë */
    fun kalendari(afatet: List<Obj>, viti: Int, muaji: Int, tani: Long = System.currentTimeMillis(), zona: ZoneId = ZoneId.systemDefault()): Kalendari {
        val sot = isoDites(tani, zona)
        val sipasDites = LinkedHashMap<String, MutableList<Obj>>()
        afatet.forEach { a -> val d = a["data"] as? String; if (!d.isNullOrEmpty()) sipasDites.getOrPut(d) { ArrayList() }.add(a) }
        val e1 = LocalDate.of(viti, muaji + 1, 1)
        val zbrazet = (e1.dayOfWeek.value + 6) % 7 // dayOfWeek: e hëna = 1
        val nDite = e1.lengthOfMonth()
        val q = ArrayList<Qeliza?>()
        repeat(zbrazet) { q.add(null) }
        for (d in 1..nDite) {
            val iso = viti.toString() + "-" + dy(muaji + 1) + "-" + dy(d)
            val lista = sipasDites[iso] ?: emptyList()
            val neRaft = lista.filter { Afatet.statusi(it, tani) != "hequr" }
            q.add(Qeliza(iso, d, iso == sot, lista, neRaft.size, if (neRaft.isNotEmpty()) statusiMeIKeq(neRaft, tani) else if (lista.isNotEmpty()) "hequr" else null))
        }
        while (q.size % 7 != 0) q.add(null)
        val shuma = linkedMapOf("skaduar" to 0, "afer" to 0, "ok" to 0, "hequr" to 0)
        q.forEach { c -> val s = c?.statusi; if (s != null && shuma.containsKey(s)) shuma[s] = shuma[s]!! + 1 }
        return Kalendari(MUAJT[muaji] + " " + viti, viti, muaji, q, shuma)
    }

    // ---------- Statistikat ----------
    class PerAnetar(val uid: String, val emri: String, var aktive: Int = 0, var skaduara: Int = 0, var afer: Int = 0, var hequr30: Int = 0)
    class Statistikat(
        val aktive: Int, val skaduara: Int, val afer: Int, val ok: Int, val javes: Int, val sot: Int, val hequrMuajit: Int, val hequrSot: Int,
        val perAnetar: List<PerAnetar>, val furnizuesit: List<Pair<String, Int>>, val heqesit: List<Pair<String, Int>>
    )

    /** anetaret: [{ uid, emri, afatet }] (afatet me heqjet e mbivendosura) */
    fun statistikat(anetaret: List<Obj>, tani: Long = System.currentTimeMillis(), zona: ZoneId = ZoneId.systemDefault()): Statistikat {
        val dt = data(tani, zona)
        val fillimiMuajit = dt.toLocalDate().withDayOfMonth(1).atStartOfDay(zona).toInstant().toEpochMilli()
        val para30 = tani - 30 * 86400000L
        val sotIso = isoDites(tani, zona)
        var aktive = 0; var skaduara = 0; var afer = 0; var ok = 0; var javes = 0; var sot = 0; var hequrMuajit = 0; var hequrSot = 0
        val per = ArrayList<PerAnetar>()
        val fur = LinkedHashMap<String, Int>(); val heq = LinkedHashMap<String, Int>()
        anetaret.forEach { m ->
            val x = PerAnetar(jsString(m["uid"]), jsString(m["emri"] ?: ""))
            m["afatet"].siListe().mapNotNull { it.siObj() }.forEach { a ->
                val st = Afatet.statusi(a, tani)
                if (st == "hequr") {
                    val hs = koha(a, "hequrSe").toLong()
                    if (hs >= fillimiMuajit) hequrMuajit++
                    if (hs != 0L && isoDites(hs, zona) == sotIso) hequrSot++
                    if (hs >= para30) {
                        x.hequr30++
                        val kush = (a["hequrNga"] as? String)?.ifEmpty { null } ?: x.emri
                        if (kush.isNotEmpty()) heq[kush] = (heq[kush] ?: 0) + 1
                    }
                    return@forEach
                }
                aktive++; x.aktive++
                when (st) { "skaduar" -> { skaduara++; x.skaduara++ }; "afer" -> { afer++; x.afer++ }; "ok" -> ok++ }
                val n = Afatet.ditetDeri(a["data"], tani)
                if (n != null && n >= 0 && n <= 7) javes++
                if (n == 0) sot++
                val f = a["furnizuesi"] as? String
                if ((st == "skaduar" || st == "afer") && !f.isNullOrEmpty()) fur[f] = (fur[f] ?: 0) + 1
            }
            per.add(x)
        }
        fun rendit(h: Map<String, Int>) = h.entries.map { it.key to it.value }
            .sortedWith { a, b -> if (b.second != a.second) b.second - a.second else krahasoTekst(a.first, b.first) }.take(5)
        per.sortWith { a, b -> if (b.skaduara != a.skaduara) b.skaduara - a.skaduara else if (b.aktive != a.aktive) b.aktive - a.aktive else krahasoTekst(a.emri, b.emri) }
        return Statistikat(aktive, skaduara, afer, ok, javes, sot, hequrMuajit, hequrSot, per, rendit(fur), rendit(heq))
    }

    // ---------- Tekstet ----------
    class Teksti(val lloji: String, val kush: String, val cfare: String, val detaje: String, val avatar: String? = null)

    private val FJALA_E_VEPRIMIT = mapOf("hiq" to "e hoqi nga rafti", "kthe" to "e ktheu në raft", "fshij" to "e fshiu")
    private val FJALA_E_VEPRIMIT_TI = mapOf("hiq" to "e hoqe nga rafti", "kthe" to "e ktheve në raft", "fshij" to "e fshive")

    private fun tx(o: Obj, k: String): String = (o[k] as? String) ?: ""
    private fun ose(vararg x: Any?): String { for (v in x) if (eVertete(v)) return jsString(v); return "" }

    /** Produktet e një kërkese për heqje: `produktet` ose produkti/barkodi i vetëm */
    fun listaEKerkeses(k: Obj?): List<MObj> {
        val pl = k?.get("produktet").siListe()
        val l: List<Any?> = if (pl.isNotEmpty()) pl else listOf(obj("produkti" to k?.get("produkti"), "barkodi" to k?.get("barkodi"), "data" to k?.get("data")))
        return l.mapNotNull { it.siObj() }.filter { eVertete(it["produkti"]) || eVertete(it["barkodi"]) }.take(KERKESA_MAKS).map { x ->
            val d = (x["data"] as? String) ?: ""
            obj("produkti" to ose(x["produkti"]).trim().take(120), "barkodi" to ose(x["barkodi"]).trim().take(40),
                "data" to if (Regex("^\\d{4}-\\d{2}-\\d{2}$").matches(d)) d else "")
        }
    }
    private fun emriIProduktit(x: Obj): String {
        val p = ose(x["produkti"]); val b = ose(x["barkodi"])
        return if (p.isNotEmpty() && b.isNotEmpty() && p != b) "$p ($b)" else p.ifEmpty { b.ifEmpty { "produkt" } }
    }
    fun rreshtiIProduktit(x: Obj): String = listOf(ose(x["produkti"], x["barkodi"]).ifEmpty { "produkt" },
        if (eVertete(x["produkti"]) && eVertete(x["barkodi"])) jsString(x["barkodi"]) else "",
        if (eVertete(x["data"])) "skadoi më " + Afatet.formato(x["data"]) else "").filter { it.isNotEmpty() }.joinToString(" · ")
    fun produktiIKerkeses(k: Obj?): String {
        val l = listaEKerkeses(k)
        if (l.size <= 1) return emriIProduktit(l.firstOrNull() ?: emptyMap())
        val emrat = l.take(3).map { ose(it["produkti"], it["barkodi"]) }
        return l.size.toString() + " produkte (" + emrat.joinToString(", ") +
            (if (l.size > 3) " e " + (l.size - 3) + (if (l.size - 3 == 1) " tjetër" else " të tjera") else "") + ")"
    }

    /** v283 (ekipa.js objektiINgjarjes): prekja e një ngjarjeje te Aktiviteti hap afatin/produktin e saj; null = ngjarje pa produkt */
    class Objekti(val pronari: String, val ids: List<String>, val kerko: String)
    private val NGJARJE_AFATI = setOf("hequr", "heqje-pranuar", "heqje-refuzuar", "rikthyer", "admin-afat", "afate-te-reja", "kerkese-heqje", "kerkese-kryer")
    fun objektiINgjarjes(ng: Obj?): Objekti? {
        if (ng == null || ng["lloji"] !in NGJARJE_AFATI) return null
        val lloji = ng["lloji"] as String
        var ids = ng["ids"].siListe().filterIsInstance<String>().filter { it.isNotEmpty() }.take(30)
        (ng["afatId"] as? String)?.takeIf { it.isNotEmpty() }?.let { ids = listOf(it) }
        val kerkese = lloji == "kerkese-heqje" || lloji == "kerkese-kryer"
        val p0: Obj = if (kerkese) (listaEKerkeses(ng).firstOrNull() ?: emptyMap()) else ng
        val kerko = ose(p0["barkodi"], p0["produkti"]).trim()
        val pronari = if (lloji == "afate-te-reja") ose(ng["uid"]) else if (kerkese) "" else ose(ng["pronariUid"], ng["uid"])
        if (ids.isEmpty() && kerko.isEmpty() && lloji != "afate-te-reja") return null
        return Objekti(pronari, ids, if (ids.isNotEmpty()) "" else kerko)
    }

    fun tekstiNgjarjes(ng: Obj, uidIm: String?): Teksti {
        val une = ng["uid"] == uidIm
        val kush = if (une) "Ti" else ((ng["emri"] as? String)?.ifEmpty { null } ?: "Dikush")
        val dataTx = if (eVertete(ng["data"])) Afatet.formato(ng["data"]) else ""
        val produkti = ose(ng["produkti"], ng["barkodi"]).ifEmpty { "produkt" }
        return when (ng["lloji"]) {
            "hequr" -> {
                val iKujt = if (!eVertete(ng["pronariUid"]) || ng["pronariUid"] == ng["uid"]) "" else if (ng["pronariUid"] == uidIm) "produkt i yti" else "i përket: " + ose(ng["pronariEmri"]).ifEmpty { "kolegut" }
                Teksti("hequr", kush, (if (une) "e hoqe" else "e hoqi") + " nga rafti: " + produkti,
                    listOf(iKujt, if (iKujt.isNotEmpty()) "pret miratimin" else "", if (dataTx.isNotEmpty()) "skadoi më $dataTx" else "",
                        if (eVertete(ng["sasia"])) jsString(ng["sasia"]) + " copë" else "").filter { it.isNotEmpty() }.joinToString(" · "))
            }
            "heqje-pranuar" -> Teksti("hequr", kush, (if (une) "e pranove" else "e pranoi") + " heqjen nga rafti: " + produkti,
                if (ng["kerkuesUid"] == uidIm) "e hoqe ti" else "e hoqi " + ose(ng["kerkuesEmri"]).ifEmpty { "një koleg" })
            "heqje-refuzuar" -> Teksti("rikthyer", kush, (if (une) "e refuzove" else "e refuzoi") + " heqjen nga rafti: " + produkti,
                "mbetet në raft · " + if (ng["kerkuesUid"] == uidIm) "e kishe hequr ti" else "e kishte hequr " + ose(ng["kerkuesEmri"]).ifEmpty { "një koleg" })
            "lajmeruar" -> {
                val n = numerOse0(ng["n"]).toLong()
                Teksti("lajmeruar", kush, (if (une) "e lajmërove" else "e lajmëroi") + " furnizuesin" + (if (eVertete(ng["furnizuesi"])) " " + jsString(ng["furnizuesi"]) else ""),
                    if (n != 0L) n.toString() + (if (n == 1L) " produkt afër skadimit" else " produkte afër skadimit") else "")
            }
            "afate-te-reja" -> {
                val n = numerOse0(ng["n"]).toLong().let { if (it == 0L) 1L else it }
                Teksti("afate-te-reja", kush, (if (une) "shtove " else "shtoi ") + n + (if (n == 1L) " afat të ri" else " afate të reja"),
                    if (eVertete(ng["ngaFoto"])) "nga fleta e fotografuar" else "")
            }
            "rikthyer" -> Teksti("rikthyer", kush, (if (une) "e ktheve" else "e ktheu") + " në raft: " + produkti, "")
            "anetar-i-ri" -> {
                if (eVertete(ng["anetariUid"]) && ng["anetariUid"] != ng["uid"]) {
                    val iRi = ng["anetariUid"] == uidIm
                    Teksti("anetar-i-ri", if (iRi) "Ti" else ose(ng["anetariEmri"]).ifEmpty { "Një koleg" }, if (iRi) "u pranove në grup" else "u bashkua me grupin",
                        "pranuar nga " + if (une) "ti" else ose(ng["emri"]).ifEmpty { "administratori" }, ose(ng["anetariEmri"]))
                } else Teksti("anetar-i-ri", kush, if (une) "u bashkove me grupin" else "u bashkua me grupin", "")
            }
            "lajmerim" -> Teksti("lajmerim", kush, if (une) "njoftove të gjithë grupin" else "njoftoi të gjithë grupin", tx(ng, "tekst"))
            "kerkese-heqje" -> Teksti("lajmeruar", kush, (if (une) "kërkove" else "kërkoi") + " heqjen nga rafti: " + produktiIKerkeses(ng),
                (if (eVertete(ng["perUid"])) "për " + (if (ng["perUid"] == uidIm) "ty" else ose(ng["perEmri"]).ifEmpty { "një koleg" }) else "për të gjithë grupin") +
                    (if (eVertete(ng["shenim"])) " · " + jsString(ng["shenim"]) else ""))
            "kerkese-kryer" -> Teksti("hequr", kush, (if (une) "e hoqe" else "e hoqi") + " nga rafti: " + produktiIKerkeses(ng),
                if (ng["kerkuesUid"] == uidIm) "me kërkesën tënde" else "me kërkesë të " + ose(ng["kerkuesEmri"]).ifEmpty { "një kolegu" })
            "admin-afat" -> Teksti("admin-afat", kush,
                (if (une) (FJALA_E_VEPRIMIT_TI[ng["veprimi"]] ?: "ndryshove") else (FJALA_E_VEPRIMIT[ng["veprimi"]] ?: "ndryshoi")) + ": " + produkti,
                if (ng["pronariUid"] == uidIm) "produkt i yti" else "i përket: " + ose(ng["pronariEmri"]).ifEmpty { "kolegut" })
            else -> Teksti(ose(ng["lloji"]), kush, tx(ng, "tekst"), "")
        }
    }

    // ---------- v284: detajet e një ngjarjeje (ekipa.js detajetENgjarjes): pamja VETËM PËR SHIKIM te Aktiviteti ----------
    const val ARTIKUJT_MAKS = 30
    private val DATA_ISO = Regex("^\\d{4}-\\d{2}-\\d{2}$")
    private fun nr(x: Any?): Double = if (eNumer(x)) (x as Number).toDouble() else 0.0
    private fun njejte(x: Any?, u: String?): Boolean = x != null && u != null && x == u

    /** Fotografia e një afati brenda ngjarjes (edhe pastrimi kur lexohet) */
    fun artikulliINgjarjes(a: Obj?): MObj {
        val d = (a?.get("data") as? String) ?: ""
        val r = obj("id" to ose(a?.get("id")).take(60), "emri" to ose(a?.get("emri")).trim().take(120), "barkodi" to ose(a?.get("barkodi")).trim().take(40),
            "data" to if (DATA_ISO.matches(d)) d else "")
        if (eNumer(a?.get("sasia"))) r["sasia"] = a?.get("sasia")
        if (eVertete(a?.get("furnizuesi"))) r["furnizuesi"] = jsString(a?.get("furnizuesi")).trim().take(80)
        if (eVertete(a?.get("mk"))) r["mk"] = jsString(a?.get("mk")).trim().take(60)
        return r
    }
    fun artikujtENgjarjes(ng: Obj?): List<MObj> = ng?.get("artikujt").siListe().mapNotNull { it.siObj() }.map { artikulliINgjarjes(it) }
        .filter { (it["emri"] as String).isNotEmpty() || (it["barkodi"] as String).isNotEmpty() }.take(ARTIKUJT_MAKS)

    /** Një artikull gati për pamje: fushat e pastra + st ("" = pa kuti ditësh), n (ditët ose null), mesazh, shenim */
    private fun artikullPerPamje(a: Obj, eshteAfat: Boolean, uidIm: String?, tani: Long, zona: ZoneId): MObj {
        val r = artikulliINgjarjes(a)
        val data = r["data"] as String
        val st = if (eshteAfat && a["statusi"] == "hequr") "hequr" else if (data.isNotEmpty()) Afatet.statusi(obj("data" to data), tani) else if (eshteAfat) "pa-date" else ""
        val n: Int? = if (data.isNotEmpty()) Afatet.ditetDeri(data, tani) else null
        r["st"] = st; r["n"] = n
        r["mesazh"] = when {
            st == "hequr" -> { val hs = nr(a["hequrSe"]).toLong()
                "U hoq nga rafti" + (if (eVertete(a["hequrNga"])) " nga " + jsString(a["hequrNga"]) else "") + (if (hs != 0L) " · " + kohaRelative(hs, tani, zona) else "") + "." }
            eshteAfat && eVertete(a["nePritjeNga"]) -> { val ps = nr(a["nePritjeSe"]).toLong()
                (if (njejte(a["nePritjeUid"], uidIm)) "E hoqe nga rafti" else "E hoqi " + jsString(a["nePritjeNga"])) + (if (ps != 0L) " " + kohaRelative(ps, tani, zona) else "") + ". " +
                    (if (njejte(a["pronariUid"], uidIm)) "Pret miratimin tënd." else "Pret miratimin e " + ose(a["pronariEmri"]).ifEmpty { "kolegut" } + ".") }
            st == "pa-date" || (st.isNotEmpty() && n == null) -> "Pa datë skadimi."
            st.isNotEmpty() && n != null -> if (n < 0) (if (n == -1) "Skadoi dje." else "Ka skaduar para " + Afatet.ditetParaTekst(-n) + ".")
                else if (n == 0) "Skadon SOT." else if (n == 1) "Skadon nesër." else "Skadon për " + Afatet.ditetTekst(n) + "."
            else -> ""
        }
        r["shenim"] = ""
        return r
    }

    class Detajet(val lloji: String, val kush: String, val cfare: String, val avatar: String, val kur: String, val rreshtat: List<Pair<String, String>>,
                  val tekst: String, val artikujt: List<MObj>, val shenim: String)

    /** anetaret = anetaretMeAfate() (secili me `afatet`, `ngarkuar`) */
    fun detajetENgjarjes(ng0: Obj?, uidIm: String?, anetaret: List<Obj>, tani: Long = System.currentTimeMillis(), zona: ZoneId = ZoneId.systemDefault()): Detajet {
        val ng: Obj = ng0 ?: emptyMap()
        val t = tekstiNgjarjes(ng, uidIm)
        val ko = nr(ng["koha"]).toLong()
        val rreshtat = ArrayList<Pair<String, String>>(); val art = ArrayList<MObj>()
        var tekst = ""; var shenim = ""
        fun anetari(u: Any?): Obj? = if (eVertete(u)) anetaret.firstOrNull { it["uid"] == u } else null
        fun afati(u: Any?, id: Any?): Obj? = if (eVertete(id)) anetari(u)?.get("afatet").siListe().mapNotNull { it.siObj() }.firstOrNull { it["id"] == id } else null
        fun mungon(u: Any?): Boolean { val a = anetari(u); return a != null && eVertete(a["ngarkuar"]) && !eVertete(a["paTeDhena"]) && tani - ko > 600000 }
        fun ngaNgjarja(x: Obj, u: Any?): MObj { val r = artikullPerPamje(x, false, uidIm, tani, zona); if (mungon(u)) r["shenim"] = "Nuk gjendet më në listë."; return r }
        fun iKujt() = if (njejte(ng["pronariUid"], uidIm)) "ty" else ose(ng["pronariEmri"]).ifEmpty { "kolegut" }
        fun pa(p: Any?, b: Any?): Any? = if (p == b) "" else p
        fun njeAfat() {
            val pu = ose(ng["pronariUid"], ng["uid"])
            val id = ng["afatId"] as? String
            val a = if (id != null) afati(pu, id) else null
            if (a != null) art.add(artikullPerPamje(a, true, uidIm, tani, zona))
            else if (eVertete(ng["produkti"]) || eVertete(ng["barkodi"]))
                art.add(ngaNgjarja(obj("id" to (id ?: ""), "emri" to pa(ng["produkti"], ng["barkodi"]), "barkodi" to ng["barkodi"], "data" to ng["data"], "sasia" to ng["sasia"]), pu))
        }
        fun produktet() = listaEKerkeses(ng).forEach { x ->
            art.add(artikullPerPamje(obj("emri" to pa(x["produkti"], x["barkodi"]), "barkodi" to x["barkodi"], "data" to x["data"]), false, uidIm, tani, zona))
        }
        when (ng["lloji"]) {
            "afate-te-reja" -> {
                val n = nr(ng["n"]).toLong().let { if (it == 0L) 1L else it }
                val ids = ng["ids"].siListe().filterIsInstance<String>().filter { it.isNotEmpty() }.take(ARTIKUJT_MAKS)
                val foto = artikujtENgjarjes(ng)
                if (ids.isNotEmpty()) {
                    ids.forEach { id ->
                        val a = afati(ng["uid"], id); val f = foto.firstOrNull { it["id"] == id }
                        if (a != null) art.add(artikullPerPamje(a, true, uidIm, tani, zona)) else if (f != null) art.add(ngaNgjarja(f, ng["uid"]))
                    }
                } else if (foto.isNotEmpty()) {
                    foto.forEach { art.add(ngaNgjarja(it, ng["uid"])) }
                } else if (ko != 0L) {
                    val kand = anetari(ng["uid"])?.get("afatet").siListe().mapNotNull { it.siObj() }
                        .map { a -> a to (nr(a["krijuarSe"]).let { k -> if (k != 0.0) k else nr(a["ndryshuarSe"]) }) }
                        .filter { it.second != 0.0 && it.second <= ko + 5000 }
                        .sortedWith { x, y -> if (y.second != x.second) y.second.compareTo(x.second) else ose(x.first["id"]).compareTo(ose(y.first["id"])) }
                    var para = ko.toDouble()
                    for (k in kand) {
                        if (art.size >= minOf(n, ARTIKUJT_MAKS.toLong())) break
                        if (para - k.second > 30000) break
                        art.add(artikullPerPamje(k.first, true, uidIm, tani, zona)); para = k.second
                    }
                    if (art.isNotEmpty()) shenim = "Aktivitet i vjetër: afatet u gjetën sipas kohës kur u shtuan."
                }
                if (eVertete(ng["ngaFoto"])) rreshtat.add("Mënyra" to "nga fleta e fotografuar")
                if (art.isEmpty()) shenim = if (n == 1L) "Ky afat nuk gjendet më. Mund të jetë fshirë ose ndryshuar." else "Këto afate nuk gjenden më. Mund të jenë fshirë ose ndryshuar."
                else if (art.size < n) shenim = (if (shenim.isNotEmpty()) "$shenim " else "") + "Shfaqen " + art.size + " nga " + n + " afate."
            }
            "hequr" -> { njeAfat(); if (eVertete(ng["pronariUid"]) && ng["pronariUid"] != ng["uid"]) rreshtat.add("I përket" to iKujt()) }
            "rikthyer" -> njeAfat()
            "heqje-pranuar", "heqje-refuzuar" -> { njeAfat(); rreshtat.add("E hoqi" to if (njejte(ng["kerkuesUid"], uidIm)) "ti" else ose(ng["kerkuesEmri"]).ifEmpty { "një koleg" }) }
            "admin-afat" -> { njeAfat(); rreshtat.add("I përket" to iKujt()) }
            "kerkese-heqje" -> {
                produktet()
                rreshtat.add("Për" to if (eVertete(ng["perUid"])) (if (njejte(ng["perUid"], uidIm)) "ty" else ose(ng["perEmri"]).ifEmpty { "një koleg" }) else "të gjithë grupin")
                tekst = ose(ng["shenim"])
            }
            "kerkese-kryer" -> { produktet(); rreshtat.add("E kërkoi" to if (njejte(ng["kerkuesUid"], uidIm)) "ti" else ose(ng["kerkuesEmri"]).ifEmpty { "një koleg" }) }
            "anetar-i-ri" -> {
                if (eVertete(ng["anetariUid"]) && ng["anetariUid"] != ng["uid"]) rreshtat.add("E pranoi" to if (njejte(ng["uid"], uidIm)) "ti" else ose(ng["emri"]).ifEmpty { "administratori" })
                else if (eVertete(ng["ftuarNga"])) rreshtat.add("E ftoi" to jsString(ng["ftuarNga"]))
            }
            else -> tekst = t.detaje
        }
        return Detajet(t.lloji, t.kush, t.cfare, t.avatar?.ifEmpty { null } ?: ose(ng["emri"]),
            if (ko != 0L) titulliDites(ko, tani, zona) + " · " + ora(ko, zona) else "", rreshtat, tekst, art, shenim)
    }

    /** v297 / Hyrja 59: "Afat për një koleg" (ekipa.js). Kolegu e pranon ose e refuzon; pa vendim brenda 10 ditëve i kthehet dërguesit. */
    const val AFAT_KOLEGU_DITE = 10
    const val AFAT_KOLEGU_MS = AFAT_KOLEGU_DITE * 86_400_000L

    /** Vetëm fushat që i nevojiten kolegut (marketi është i dërguesit), si afatiPerKolegun te ekipa.js */
    fun afatiPerKolegun(a0: Any?): MObj {
        val a = a0.siObj() ?: emptyMap()
        val o = MObj()
        o["barkodi"] = (if (a["barkodi"] == null) "" else jsString(a["barkodi"])).replace(Regex("\\s+"), "").let { if (it.length > 64) it.substring(0, 64) else it }
        o["emri"] = (if (a["emri"] == null) "" else jsString(a["emri"])).trim().let { if (it.length > 200) it.substring(0, 200) else it }
        val d = a["data"]
        if (d is String && Regex("^\\d{4}-\\d{2}-\\d{2}$").matches(d)) o["data"] = d
        val s = a["sasia"]
        if (s is Number && s.toDouble().isFinite() && s.toDouble() >= 0) o["sasia"] = Math.floor(s.toDouble()).toLong()
        val f = (if (a["furnizuesi"] == null) "" else jsString(a["furnizuesi"])).trim().let { if (it.length > 200) it.substring(0, 200) else it }
        if (f.isNotEmpty()) o["furnizuesi"] = f
        return o
    }

    /** 'pritet' | 'pranuar' | 'refuzuar' | 'skadoi' */
    fun gjendjaEAfatitKolegut(nj: Obj?, tani: Long): String {
        if (nj == null) return "skadoi"
        val v = nj["vendim"]
        if (v == "pranuar" || v == "refuzuar" || v == "skadoi") return v as String
        val k = jsNumber(nj["koha"]).let { if (it.isNaN()) 0.0 else it }
        return if (tani - k >= AFAT_KOLEGU_MS) "skadoi" else "pritet"
    }
    fun idKthimit(dergimId: String) = "k$dergimId"
    fun idPranimit(dergimId: String) = "p$dergimId"
    fun idAfatitKthyer(dergimId: String) = "kd$dergimId"

    /** v297 / Hyrja 59: afati që një koleg ta dërgon (nj.afat), si produktiIAfatitDerguar te ekipa.js */
    fun produktiIAfatitDerguar(nj: Obj?): String {
        val a = nj?.get("afat").siObj() ?: emptyMap()
        var t = ose(a["emri"], a["barkodi"]).ifEmpty { "produkt" }
        if (eVertete(a["data"])) t += " · " + Afatet.formato(a["data"])
        val s = a["sasia"]
        if (s is Number) t += " · " + jsString(s) + " copë"
        return t
    }

    /** Teksti i një njoftimi personal (zilja) */
    fun tekstiNjoftimit(nj: Obj): String {
        val kush = ose(nj["emri"])
        val produkti = ose(nj["produkti"], nj["barkodi"]).ifEmpty { "produkt" }
        return when (nj["lloji"]) {
            "afat-dergim" -> kush.ifEmpty { "Një koleg" } + " të dërgoi një afat: " + produktiIAfatitDerguar(nj)
            "afat-pranuar" -> kush.ifEmpty { "Kolegu" } + " e pranoi afatin që i dërgove: " + produktiIAfatitDerguar(nj)
            "afat-kthyer" -> kush.ifEmpty { "Kolegu" } + (if (nj["arsye"] == "skadoi") " s'e pranoi brenda 10 ditëve afatin: " else " s'e pranoi afatin: ") +
                produktiIAfatitDerguar(nj) + ". E ke te lista jote."
            "kerkese-heqje" -> kush.ifEmpty { "Një koleg" } + (if (eVertete(nj["perKrejt"])) " i kërkon grupit ta heqë nga rafti: " else " të kërkon ta heqësh nga rafti: ") +
                produktiIKerkeses(nj) + (if (eVertete(nj["shenim"])) " · " + jsString(nj["shenim"]) else "")
            "kerkese-kryer" -> kush.ifEmpty { "Një koleg" } + " e hoqi nga rafti: " + produktiIKerkeses(nj) + " (kërkesa jote)"
            "hequr" -> kush.ifEmpty { "Një koleg" } + " e hoqi nga rafti: " + produkti + (if (eVertete(nj["data"])) " (skadoi më " + Afatet.formato(nj["data"]) + ")" else "")
            "heqje-pranuar" -> kush.ifEmpty { "Kolegu" } + " e pranoi heqjen nga rafti: " + produkti
            "heqje-refuzuar" -> kush.ifEmpty { "Kolegu" } + " e refuzoi heqjen nga rafti: " + produkti + " (mbetet në raft)"
            "lajmerim" -> kush.ifEmpty { "Administratori" } + ": " + tx(nj, "tekst")
            "admin-i-ri" -> kush.ifEmpty { "Admini" } + " u largua nga grupi dhe tani ti je admini i grupit."
            "admin-afat" -> kush.ifEmpty { "Administratori" } + " " + (FJALA_E_VEPRIMIT[nj["veprimi"]] ?: "ndryshoi") + ": " + produkti
            else -> tx(nj, "tekst")
        }
    }

    // ---------- Anëtarët me afatet ----------
    /**
     * Anëtarët (me veten edhe kur s'ka ardhur ende dokumenti) me afatet e secilit (pronariUid, pronariEmri, heqjet në pritje):
     * unë së pari, pastaj online, pastaj sipas emrit. permbledhjet: uid → { emri, afatet }.
     */
    fun anetaretMeAfate(anetaret: List<Obj>, permbledhjet: Map<String, Obj>?, uidIm: String?, emriIm: String, afatetEMia: List<Obj>,
                        ngjarjet: List<Obj>, tani: Long = System.currentTimeMillis()): List<MObj> {
        val harta = hartaEHeqjeve(ngjarjet)
        val lista = anetaret.toMutableList()
        if (uidIm != null && lista.none { it["uid"] == uidIm }) lista.add(obj("uid" to uidIm, "emri" to emriIm, "aktivSe" to tani, "online" to true))
        return lista.map { a ->
            val u = jsString(a["uid"])
            val une = u == uidIm
            val p = if (une) null else permbledhjet?.get(u)
            val burimi = if (une) afatetEMia else p?.get("afatet").siListe().mapNotNull { it.siObj() }
            a.me("uneJam" to une, "ngarkuar" to (une || p != null), "afatet" to burimi.map { af -> mbivendosHeqjen(af, u, harta).me("pronariUid" to u, "pronariEmri" to a["emri"]) })
        }.sortedWith { x, y ->
            val ux = x["uneJam"] == true; val uy = y["uneJam"] == true
            if (ux != uy) return@sortedWith if (ux) -1 else 1
            val ox = eshteOnline(x, tani); val oy = eshteOnline(y, tani)
            if (ox != oy) return@sortedWith if (ox) -1 else 1
            krahasoTekst(jsString(x["emri"] ?: ""), jsString(y["emri"] ?: ""))
        }
    }
}
