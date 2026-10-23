package site.stoku.logjika

/*
 * Bashkimi i të dhënave mes pajisjeve: përkthim besnik i bashkimi.js (web-i). Të njëjtat rregulla, që aplikacioni Stoku
 * për Android, web-i dhe kompjuteri ta bashkojnë dyqanin njësoj:
 *  - produkti në të dyja anët: fiton prekurSe më i ri (barazim → ana lokale);
 *  - fshirjet ruhen si shënime me kohë (fshira), që një pajisje me kopje të vjetër të mos i ringjallë;
 *  - folderat, afatet dhe marketet: ndryshuarSe më i ri; renditja e folderave sipas rendiKoha;
 *  - shënimet e fshirjeve më të vjetra se 120 ditë hiqen.
 */
object Bashkimi {
    const val MBAJ_FSHIRJET_MS = 120.0 * 24 * 60 * 60 * 1000
    private val LLOJET = listOf("produktet", "foldera", "afatet", "marketet")

    fun celesi(kategoriaId: Any?, barkodi: Any?): String = jsString(kategoriaId) + "::" + jsString(barkodi)

    fun produktIVlefshem(p: Any?): Boolean {
        val o = p.siObj() ?: return false
        val b = o["barkodi"]
        return b is String && b != "" && o["kategoriaId"] is String
    }

    fun kohaProd(p: Obj?): Double = koha(p, "prekurSe")
    fun kohaFold(f: Obj?): Double = koha(f, "ndryshuarSe")

    private fun bashkoFshirjet(a: Any?, b: Any?, tani: Double): LinkedHashMap<String, LinkedHashMap<String, Double>> {
        val kufiri = tani - MBAJ_FSHIRJET_MS
        val rez = LinkedHashMap<String, LinkedHashMap<String, Double>>()
        LLOJET.forEach { rez[it] = LinkedHashMap() }
        LLOJET.forEach { lloji ->
            listOf(a, b).forEach { burimi ->
                val m = burimi.siObj()?.get(lloji).siObj() ?: return@forEach
                m.keys.forEach { k ->
                    val t = numerOse0(m[k])
                    if (t < kufiri) return@forEach
                    val r = rez[lloji]!!
                    if (r[k] == null || r[k] == 0.0 || t > r[k]!!) r[k] = t
                }
            }
        }
        return rez
    }

    private fun folderIVlefshem(f: Any?): Boolean { val o = f.siObj() ?: return false; val id = o["id"]; return id is String && id != "" }

    fun pastroFolderat(l: Any?): List<Obj> = l.siListe().filter { folderIVlefshem(it) }.map {
        val f = it.siObj()!!
        if (f["emri"] is String) f else f.me("emri" to (f["emri"]?.let { e -> jsString(e) } ?: ""))
    }

    private fun pastroProduktin(p: Obj): Obj {
        val s = p["sasia"]; val e = p["emri"]
        if (eNumer(s) && (e == null || e is String)) return p
        val n = jsNumber(s)
        return p.me("sasia" to (if (n.isFinite()) numerPerRuajtje(jsRound(n)) else 0L), "emri" to (if (e == null) "" else jsString(e)))
    }

    fun pastroProduktet(l: Any?): List<Obj> = l.siListe().map { x ->
        val p = x.siObj()
        if (p != null && p["barkodi"] is Number && eNumer(p["barkodi"])) p.me("barkodi" to jsString(p["barkodi"])) else x
    }.filter { produktIVlefshem(it) }.map { pastroProduktin(it.siObj()!!) }

    fun pastroAfatet(l: Any?): List<Obj> = l.siListe().filter {
        val a = it.siObj(); a != null && a["id"] != null && a["id"] != ""
    }.map { val a = it.siObj()!!; if (a["id"] is String) a else a.me("id" to jsString(a["id"])) }

    /**
     * cloud, lokal: { foldera, produktet, afatet, marketet, rendiKoha, fshira }. cloud mund të jetë null.
     * Kthen gjendjen e bashkuar (gati për t'u ruajtur në cloud dhe për t'u zbatuar në telefon).
     */
    fun bashko(cloud0: Obj?, lokal0: Obj?, taniMs: Long = System.currentTimeMillis()): MObj {
        val tani = taniMs.toDouble()
        val c0 = cloud0 ?: emptyMap(); val l0 = lokal0 ?: emptyMap()
        val cloud = c0.me("foldera" to pastroFolderat(c0["foldera"]), "produktet" to pastroProduktet(c0["produktet"]), "afatet" to pastroAfatet(c0["afatet"]))
        val lokal = l0.me("foldera" to pastroFolderat(l0["foldera"]), "produktet" to pastroProduktet(l0["produktet"]), "afatet" to pastroAfatet(l0["afatet"]))
        val fshira = bashkoFshirjet(cloud["fshira"], lokal["fshira"], tani)

        // ---- Produktet ----
        val pm = LinkedHashMap<String, Obj>()
        cloud["produktet"].siListe().forEach { x -> val p = x.siObj()!!; if (produktIVlefshem(p)) pm[celesi(p["kategoriaId"], p["barkodi"])] = p }
        lokal["produktet"].siListe().forEach { x ->
            val p = x.siObj()!!
            if (!produktIVlefshem(p)) return@forEach
            val k = celesi(p["kategoriaId"], p["barkodi"])
            if (pm[k] == null || kohaProd(p) >= kohaProd(pm[k])) pm[k] = p
        }
        pm.keys.toList().forEach { k ->
            val t = fshira["produktet"]!![k] ?: return@forEach
            if (t >= kohaProd(pm[k])) pm.remove(k) else fshira["produktet"]!!.remove(k)
        }

        // ---- Folderat ----
        val fm = LinkedHashMap<String, Obj>()
        cloud["foldera"].siListe().forEach { x -> val f = x.siObj()!!; fm[f["id"] as String] = f }
        lokal["foldera"].siListe().forEach { x ->
            val f = x.siObj()!!; val id = f["id"] as String
            if (fm[id] == null || kohaFold(f) >= kohaFold(fm[id])) fm[id] = f
        }
        val meIRiPerFolder = HashMap<String, Double>()
        pm.values.forEach { p ->
            val kid = p["kategoriaId"] as String; val t = kohaProd(p)
            val m = meIRiPerFolder[kid]
            if (m == null || m == 0.0 || t > m) meIRiPerFolder[kid] = t
        }
        fshira["foldera"]!!.keys.toList().forEach { id ->
            val t = fshira["foldera"]!![id]!!
            val jeta = maxOf(kohaFold(fm[id]), meIRiPerFolder[id] ?: 0.0)
            if (t >= jeta) fm.remove(id)
            else if (fm[id] != null) fshira["foldera"]!!.remove(id)
        }
        pm.keys.toList().forEach { k ->
            val kid = pm[k]!!["kategoriaId"] as String
            if (fm[kid] == null && fshira["foldera"]!!.containsKey(kid)) pm.remove(k)
        }

        // ---- Afatet ----
        val am = LinkedHashMap<String, Obj>()
        cloud["afatet"].siListe().forEach { x -> val a = x.siObj()!!; am[a["id"] as String] = a }
        lokal["afatet"].siListe().forEach { x ->
            val a = x.siObj()!!; val id = a["id"] as String
            if (am[id] == null || kohaFold(a) >= kohaFold(am[id])) am[id] = a
        }
        am.keys.toList().forEach { id ->
            val t = fshira["afatet"]!![id] ?: return@forEach
            if (t >= kohaFold(am[id])) am.remove(id) else fshira["afatet"]!!.remove(id)
        }
        val afatet = am.values.sortedWith { a, b ->
            krahasoTekst(dataTekst(a["data"]), dataTekst(b["data"])).let { if (it != 0) it else krahasoTekst(jsString(a["id"]), jsString(b["id"])) }
        }

        // ---- Marketet ----
        val mm = HashMap<String, Obj>(); val rendiM = ArrayList<String>()
        listOf(cloud["marketet"], lokal["marketet"]).forEachIndexed { i, l ->
            l.siListe().forEach { x ->
                val m = x.siObj() ?: return@forEach
                val id = m["id"] as? String ?: return@forEach
                if (id == "") return@forEach
                if (mm[id] == null) rendiM.add(id)
                if (mm[id] == null || (if (i == 1) kohaFold(m) >= kohaFold(mm[id]) else kohaFold(m) > kohaFold(mm[id]))) mm[id] = m
            }
        }
        mm.keys.toList().forEach { id ->
            val t = fshira["marketet"]!![id] ?: return@forEach
            if (t >= kohaFold(mm[id])) mm.remove(id) else fshira["marketet"]!!.remove(id)
        }

        // ---- Renditja ----
        val kohaCloud = numerOse0(cloud["rendiKoha"]); val kohaLokale = numerOse0(lokal["rendiKoha"])
        val burimi = if (kohaCloud > kohaLokale) cloud["foldera"] else lokal["foldera"]
        val tjetri = if (kohaCloud > kohaLokale) lokal["foldera"] else cloud["foldera"]
        val renditur = ArrayList<Obj>(); val vendosur = HashSet<String>()
        listOf(burimi, tjetri).forEach { l ->
            l.siListe().forEach { x ->
                val id = x.siObj()!!["id"] as String
                if (fm[id] != null && vendosur.add(id)) renditur.add(fm[id]!!)
            }
        }

        val fsh = MObj()
        fshira.forEach { (lloji, m) -> fsh[lloji] = LinkedHashMap<String, Any?>().also { r -> m.forEach { (k, v) -> r[k] = numerPerRuajtje(v) } } }
        return obj(
            "app" to "stoku", "version" to 3L, "koha" to isoNgaMs(taniMs),
            "rendiKoha" to numerPerRuajtje(maxOf(kohaCloud, kohaLokale)),
            "foldera" to renditur,
            "produktet" to renditjaJs(pm).map { pm[it]!! },
            "afatet" to afatet,
            "marketet" to rendiM.filter { mm[it] != null }.map { mm[it]!! },
            "fshira" to fsh
        )
    }

    private fun dataTekst(d: Any?): String = if (d == null || d == "" || d == false || (d is Number && d.toDouble() == 0.0)) "" else jsString(d)

    val FOLDERAT_PARAZGJEDHUR = listOf("ushqimore" to "Ushqimore", "pije" to "Pije", "higjiene" to "Higjiene", "fresh" to "Fresh")
    private const val FSHIRJE_E_FRESKET_MS = 10 * 60 * 1000.0

    /** v233: dyqani s'mbetet pa asnjë folder */
    fun sigurojFolderat(g: Obj?, taniMs: Long = System.currentTimeMillis()): Obj? {
        if (g == null || g["foldera"].siListe().isNotEmpty()) return g
        val tani = taniMs.toDouble()
        val fsh = g["fshira"].siObj()?.get("foldera").siObj() ?: emptyMap()
        if (fsh.keys.any { Math.abs(tani - numerOse0(fsh[it])) < FSHIRJE_E_FRESKET_MS }) return g
        val parazgjedhur = FOLDERAT_PARAZGJEDHUR.map { it.first }.toSet()
        val mbeten = MObj(); fsh.forEach { (id, t) -> if (id !in parazgjedhur) mbeten[id] = t }
        val fshira = (g["fshira"].siObj() ?: emptyMap()).me("foldera" to mbeten)
        return g.me(
            "foldera" to FOLDERAT_PARAZGJEDHUR.map { obj("id" to it.first, "emri" to it.second, "ndryshuarSe" to taniMs) },
            "fshira" to fshira
        )
    }

    /** Heq shënimet e fshirjeve më të vjetra se 120 ditë (pas një sinkronizimi të suksesshëm) */
    fun pastroFshirjetEVjetra(fshira: MutableMap<String, Any?>, taniMs: Long = System.currentTimeMillis()): MutableMap<String, Any?> {
        val kufiri = taniMs - MBAJ_FSHIRJET_MS
        LLOJET.forEach { l ->
            @Suppress("UNCHECKED_CAST") val m = fshira[l] as? MutableMap<String, Any?> ?: return@forEach
            m.keys.toList().forEach { k -> if (numerOse0(m[k]) < kufiri) m.remove(k) }
        }
        return fshira
    }

    /** A kanë dy gjendje të njëjtat foldera, produkte, afate dhe markete? (për të mos rivizatuar kot) */
    fun eNjejte(a: Obj?, b: Obj?): Boolean = nenshkrim(a) == nenshkrim(b)

    private fun ose(x: Any?): String = if (x == null || x == "" || x == false || (x is Number && (x.toDouble() == 0.0 || x.toDouble().isNaN()))) "" else jsString(x)

    private fun nenshkrim(g0: Obj?): String {
        val g = g0 ?: emptyMap()
        val f = g["foldera"].siListe().mapNotNull { it.siObj() }.joinToString("\u0002") { x -> jsString(x["id"]) + "\u0001" + jsString(x["emri"]) + "\u0001" + ose(x["ikona"]) }
        val p = g["produktet"].siListe().mapNotNull { it.siObj() }.map { x ->
            celesi(x["kategoriaId"], x["barkodi"]) + "\u0001" + ose(x["emri"]) + "\u0001" + jsString(x["sasia"].takeUnless { it == null } ?: "undefined") + "\u0001" + numriSiTekst(kohaProd(x))
        }.sorted().joinToString("\u0002")
        val a = g["afatet"].siListe().mapNotNull { it.siObj() }.map { x ->
            jsString(x["id"]) + "\u0001" + numriSiTekst(kohaFold(x)) + "\u0001" + ose(x["statusi"]) + "\u0001" + ose(x["data"]) + "\u0001" +
                (if (!x.containsKey("sasia")) "" else jsString(x["sasia"])) + "\u0001" + ose(x["m"])
        }.sorted().joinToString("\u0002")
        val m = g["marketet"].siListe().mapNotNull { it.siObj() }.map { x ->
            jsString(x["id"]) + "\u0001" + ose(x["emri"]) + "\u0001" + numriSiTekst(kohaFold(x)) + "\u0001" + ose(x["lat"]) + "\u0001" + ose(x["lng"])
        }.sorted().joinToString("\u0002")
        return f + "\u0003" + p + "\u0003" + a + "\u0003" + m
    }
}
