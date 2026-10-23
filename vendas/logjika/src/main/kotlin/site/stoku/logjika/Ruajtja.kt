package site.stoku.logjika

/*
 * Ndarja e dyqanit në disa dokumente të Firestore-it (ruajtja.js), pjesa pa Firebase:
 *   dyqane/{uid}               → kryesori: folderat, renditja, fshirjet, sa "pjesë" ka (pjeset)
 *   dyqane/{uid}/pjeset/p0..   → produktet dhe afatet, sipas hash-it të çelësit (secila pjesë ~600 KB)
 * Hash-i dhe ndarja janë të njëjta me web-in, që një produkt të bjerë te e njëjta pjesë në çdo pajisje.
 */
object Ruajtja {
    const val PJESA_SYNIMI = 600 * 1024
    const val PJESA_MAKS = 900 * 1024
    const val PJESE_MAKS = 400

    /** FNV-1a mbi njësitë UTF-16 (si hash() te ruajtja.js, me Math.imul), pa shenjë */
    fun hash(s: String): Long {
        var h = 2166136261L.toInt()
        for (c in s) { h = h xor c.code; h *= 16777619 }
        return h.toLong() and 0xFFFFFFFFL
    }

    fun celesiProduktit(p: Obj): String = jsString(p["kategoriaId"]) + "::" + jsString(p["barkodi"])

    /** Një pjesë pa marrë parasysh rendin e produkteve/afateve (që një pjesë e pandryshuar të mos rishkruhet) */
    fun pjesaKanonike(pj: Obj?): String? {
        if (pj == null) return null
        val o = MObj()
        pj.forEach { (k, v) ->
            o[k] = if ((k == "produktet" || k == "afatet") && v is List<*>) v.map { kanonik(it) }.sorted() else v
        }
        return kanonik(o)
    }

    /** Kryesori pa "koha" (bashkimi e vendos të re çdo herë): po s'ndryshoi gjë tjetër, s'rishkruhet */
    fun kryesoriKanonik(k: Obj?): String? {
        if (k == null) return null
        val o = MObj(); k.forEach { (x, v) -> if (x != "koha") o[x] = v }
        return kanonik(o)
    }

    /** Kryesori + pjesët → gjendja e plotë (një produkt/afat në dy vende → më i riu) */
    fun bashkoPjeset(kryesori0: Obj?, pjeset: List<Obj?>?): MObj? {
        if (kryesori0 == null && (pjeset == null || pjeset.isEmpty())) return null
        val kryesori = kryesori0 ?: emptyMap()
        val pm = LinkedHashMap<String, Obj>(); val am = LinkedHashMap<String, Obj>()
        fun shtoP(x: Any?) {
            val p = x.siObj() ?: return
            if (p["barkodi"] !is String || p["kategoriaId"] !is String) return
            val k = celesiProduktit(p)
            if (pm[k] == null || koha(p, "prekurSe") > koha(pm[k], "prekurSe")) pm[k] = p
        }
        fun shtoA(x: Any?) {
            val a = x.siObj() ?: return
            val id = a["id"]
            if (id == null || id == "" || id == false || (id is Number && id.toDouble() == 0.0)) return
            val k = jsString(id)
            if (am[k] == null || koha(a, "ndryshuarSe") > koha(am[k], "ndryshuarSe")) am[k] = a
        }
        kryesori["produktet"].siListe().forEach { shtoP(it) }
        kryesori["afatet"].siListe().forEach { shtoA(it) }
        pjeset?.forEach { pj ->
            if (pj == null) return@forEach
            pj["produktet"].siListe().forEach { shtoP(it) }
            pj["afatet"].siListe().forEach { shtoA(it) }
        }
        val g = MObj()
        renditjaJs(kryesori).forEach { k -> if (k != "produktet" && k != "afatet" && k != "pjeset") g[k] = kryesori[k] }
        g["produktet"] = renditjaJs(pm).map { pm[it]!! }
        g["afatet"] = renditjaJs(am).map { am[it]!! }
        return g
    }

    class Ndarja(val kryesori: MObj, val pjeset: List<MObj>)

    /** Gjendja e plotë → kryesori + n pjesë (n s'zvogëlohet kurrë) */
    fun ndajNePjese(gjendja: Obj?, nMeparshem: Int): Ndarja {
        val kryesori = MObj()
        (gjendja ?: emptyMap()).forEach { (k, v) -> if (k != "produktet" && k != "afatet") kryesori[k] = v }
        val produktet = gjendja?.get("produktet").siListe(); val afatet = gjendja?.get("afatet").siListe()
        var n = maxOf(1, nMeparshem, Math.ceil((bajt(produktet) + bajt(afatet)).toDouble() / PJESA_SYNIMI).toInt())
        while (true) {
            val pjeset = (0 until n).map { obj("produktet" to ArrayList<Any?>(), "afatet" to ArrayList<Any?>()) }
            produktet.forEach { p ->
                @Suppress("UNCHECKED_CAST")
                (pjeset[(hash("p:" + celesiProduktit(p.siObj() ?: emptyMap())) % n).toInt()]["produktet"] as ArrayList<Any?>).add(p)
            }
            afatet.forEach { a ->
                @Suppress("UNCHECKED_CAST")
                (pjeset[(hash("a:" + jsString(a.siObj()?.get("id"))) % n).toInt()]["afatet"] as ArrayList<Any?>).add(a)
            }
            val eMadhe = pjeset.any { bajt(it) > PJESA_MAKS }
            if (!eMadhe || n >= PJESE_MAKS) { kryesori["pjeset"] = n.toLong(); return Ndarja(kryesori, pjeset) }
            n = minOf(PJESE_MAKS, n * 2)
        }
    }
}
