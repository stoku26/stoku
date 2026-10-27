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
            "lajmerim" -> Teksti("lajmerim", kush, if (une) "njoftove krejt grupin" else "njoftoi krejt grupin", tx(ng, "tekst"))
            "kerkese-heqje" -> Teksti("lajmeruar", kush, (if (une) "kërkove" else "kërkoi") + " heqjen nga rafti: " + produktiIKerkeses(ng),
                (if (eVertete(ng["perUid"])) "për " + (if (ng["perUid"] == uidIm) "ty" else ose(ng["perEmri"]).ifEmpty { "një koleg" }) else "për krejt grupin") +
                    (if (eVertete(ng["shenim"])) " · " + jsString(ng["shenim"]) else ""))
            "kerkese-kryer" -> Teksti("hequr", kush, (if (une) "e hoqe" else "e hoqi") + " nga rafti: " + produktiIKerkeses(ng),
                if (ng["kerkuesUid"] == uidIm) "me kërkesën tënde" else "me kërkesë të " + ose(ng["kerkuesEmri"]).ifEmpty { "një kolegu" })
            "admin-afat" -> Teksti("admin-afat", kush,
                (if (une) (FJALA_E_VEPRIMIT_TI[ng["veprimi"]] ?: "ndryshove") else (FJALA_E_VEPRIMIT[ng["veprimi"]] ?: "ndryshoi")) + ": " + produkti,
                if (ng["pronariUid"] == uidIm) "produkt i yti" else "i përket: " + ose(ng["pronariEmri"]).ifEmpty { "kolegut" })
            else -> Teksti(ose(ng["lloji"]), kush, tx(ng, "tekst"), "")
        }
    }

    /** Teksti i një njoftimi personal (zilja) */
    fun tekstiNjoftimit(nj: Obj): String {
        val kush = ose(nj["emri"])
        val produkti = ose(nj["produkti"], nj["barkodi"]).ifEmpty { "produkt" }
        return when (nj["lloji"]) {
            "kerkese-heqje" -> kush.ifEmpty { "Një koleg" } + (if (eVertete(nj["perKrejt"])) " i kërkon grupit ta heqë nga rafti: " else " të kërkon ta heqësh nga rafti: ") +
                produktiIKerkeses(nj) + (if (eVertete(nj["shenim"])) " · " + jsString(nj["shenim"]) else "")
            "kerkese-kryer" -> kush.ifEmpty { "Një koleg" } + " e hoqi nga rafti: " + produktiIKerkeses(nj) + " (kërkesa jote)"
            "hequr" -> kush.ifEmpty { "Një koleg" } + " e hoqi nga rafti: " + produkti + (if (eVertete(nj["data"])) " (skadoi më " + Afatet.formato(nj["data"]) + ")" else "")
            "heqje-pranuar" -> kush.ifEmpty { "Kolegu" } + " e pranoi heqjen nga rafti: " + produkti
            "heqje-refuzuar" -> kush.ifEmpty { "Kolegu" } + " e refuzoi heqjen nga rafti: " + produkti + " (mbetet në raft)"
            "lajmerim" -> kush.ifEmpty { "Administratori" } + ": " + tx(nj, "tekst")
            "admin-i-ri" -> kush.ifEmpty { "Admini" } + " u largua nga grupi dhe tash ti je admini i grupit."
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
