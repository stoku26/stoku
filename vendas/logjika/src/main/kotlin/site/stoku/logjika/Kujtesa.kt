package site.stoku.logjika

import java.util.Locale

/** Ku ruhet kujtesa (localStorage te web-i; skedar në Android). shkruaj merr tekstin vetëm kur i duhet (p.sh. me vonesë). */
interface RuajtjaEKujteses {
    fun lexo(): String?
    fun shkruaj(teksti: () -> String)
}

/**
 * Kujtesa e produkteve (krijoKujtesen te afatet.js, v196 → v248): barkodi → { emri, furnizuesi } dhe furnizuesit e ruajtur
 * më vete ("furnizuesi " + emri). Hyrja: { e: emri, f: furnizuesi, k: koha, n: kush e shtoi, a: 1 = mësuar automatikisht,
 * m: 1 = ndryshuar me dorë, s: 1 = nga administratori, x: 1 = harruar, r: 1 = pret kontrollin }.
 * Klasat kur dy hyrje përplasen: administratori (s) > përdoruesi / e harruar > automatike; brenda klasës fiton më e reja.
 * (Migrimi v238 i web-it s'vlen këtu: aplikacioni nis me kujtesë të re.)
 */
class Kujtesa(private val ruajtja: RuajtjaEKujteses?, private val ora: () -> Long = { System.currentTimeMillis() }) {

    class Hyrja(var e: String = "", var f: String = "", var k: Long = 0, var n: String = "",
                var a: Boolean = false, var m: Boolean = false, var s: Boolean = false, var x: Boolean = false, var r: Boolean = false) {
        /** Si objekti i web-it (vetëm fushat që ka) */
        fun siObj(): MObj {
            if (x) return obj("x" to 1L, "k" to k).also { if (s) it["s"] = 1L }
            val o = obj("e" to e, "f" to f, "k" to k)
            if (m) o["m"] = 1L
            if (a) o["a"] = 1L
            if (s) o["s"] = 1L
            if (r) o["r"] = 1L
            if (n.isNotEmpty()) o["n"] = n
            return o
        }
    }
    class Produkti(val barkodi: String, val emri: String, val furnizuesi: String, val koha: Long, val meDore: Boolean,
                   val ngaAdmini: Boolean, val nga: String, val automatik: Boolean, val nePritje: Boolean)
    class FurnizuesiIRuajtur(val emri: String, val fshire: Boolean, val koha: Long, val nePritje: Boolean, val nga: String)
    class Rreshti(val barkodi: Any?, val emri: Any?, val furnizuesi: Any?)

    companion object {
        const val MAKS = 20000
        const val FURN_PARA = "furnizuesi "
        private val HAPESIRAT = Regex("[$JS_HAPESIRAT]+")
        private val BARKODI = Regex("^[^$JS_HAPESIRAT]{1,40}$")
        private val SQ: Locale = Locale.forLanguageTag("sq")
        fun vogel(t: String): String = t.lowercase(SQ)
        fun pastroBarkodin(b: Any?): String = (if (b == null) "" else jsString(b)).replace(HAPESIRAT, "").take(40)
        fun pastroTekstin(t: Any?, n: Int): String = jsTrim((if (t == null) "" else jsString(t)).replace(HAPESIRAT, " ")).take(n)
        fun klasa(x: Hyrja?): Int = if (x == null) -1 else if (x.x) (if (x.s) 2 else 1) else if (x.s) 2 else if (x.a && !x.m) 0 else 1
        fun eshteNePritje(x: Hyrja?): Boolean = x != null && !x.x && (if (x.s) x.r else (x.n.isNotEmpty() || x.r))
        fun celesIFurnizuesit(emri: Any?): String { val e = pastroTekstin(emri, 80); return if (e.isEmpty()) "" else FURN_PARA + e }
        fun eshteCelesFurnizuesi(k: String): Boolean = k.startsWith(FURN_PARA) && k.length > FURN_PARA.length && k.length <= FURN_PARA.length + 80
        fun celesIVlefshem(k: String): Boolean = BARKODI.matches(k) || eshteCelesFurnizuesi(k)
        private fun nr(v: Any?): Long { val d = jsNumber(v); return if (d.isNaN() || d.isInfinite()) 0L else d.toLong() }

        /** A duhet që hyrja r (p.sh. nga grupi) ta zëvendësojë hyrjen l (këtu)? (furnizuesit: e fshirë kundër në pritje → më e reja) */
        fun hyrjaFiton(r: Hyrja, l: Hyrja?, b: String): Boolean {
            if (l == null) return true
            if (eshteCelesFurnizuesi(b) && ((r.x && eshteNePritje(l)) || (l.x && eshteNePritje(r)))) return r.k > l.k
            val cr = klasa(r); val cl = klasa(l)
            if (cr != cl) return cr > cl
            return r.k > l.k
        }

        /** Hyrje e pastër (nga grupi ose regjistri): vetëm fushat e njohura, me gjatësi të kufizuar */
        fun hyrjaEPastruar(x0: Any?): Hyrja? {
            val x = x0.siObj() ?: return null
            val k = nr(x["k"])
            if (eVertete(x["x"])) return Hyrja(k = k, x = true, s = eVertete(x["s"]))
            val e = pastroTekstin(x["e"] as? String ?: "", 120); val f = pastroTekstin(x["f"] as? String ?: "", 80)
            if (e.isEmpty() && f.isEmpty()) return null
            val r = Hyrja(e, f, k)
            if (eVertete(x["m"])) r.m = true else if (eVertete(x["a"])) r.a = true
            if (eVertete(x["s"])) r.s = true
            if (eVertete(x["r"])) r.r = true
            r.n = pastroTekstin(x["n"] as? String ?: "", 40)
            return r
        }
    }

    private var harta: LinkedHashMap<String, Hyrja>? = null
    private val degjuesit = ArrayList<(List<String>) -> Unit>()
    private var autoriEmri = ""
    private var autoriAdmin = false

    private fun tani(): Long = ora()

    @Synchronized private fun lexo(): LinkedHashMap<String, Hyrja> {
        harta?.let { return it }
        val h = LinkedHashMap<String, Hyrja>()
        try {
            ruajtja?.lexo()?.let { t -> Json.lexo(t).siObj()?.forEach { (b, v) -> hyrjaNgaRuajtja(v)?.let { h[b] = it } } }
        } catch (e: Exception) { /* e prishur: nis bosh */ }
        harta = h
        return h
    }
    // Hyrja siç u ruajt (pa e shkurtuar): si JSON.parse te web-i
    private fun hyrjaNgaRuajtja(v: Any?): Hyrja? {
        val o = v.siObj() ?: return null
        return Hyrja(o["e"] as? String ?: "", o["f"] as? String ?: "", nr(o["k"]), o["n"] as? String ?: "",
            eVertete(o["a"]), eVertete(o["m"]), eVertete(o["s"]), eVertete(o["x"]), eVertete(o["r"]))
    }
    /** Object.keys(h): çelësat-indeks (barkodet e shkurtra numerike) të parët, pastaj sipas radhës së futjes */
    private fun celesat(h: Map<String, Hyrja>): List<String> = renditjaJs(h)

    @Synchronized fun tekstiPerRuajtje(): String {
        val h = lexo(); val o = MObj()
        celesat(h).forEach { o[it] = h[it]!!.siObj() }
        return Json.shkruaj(o)
    }

    private fun shkruaj() {
        val h = lexo()
        if (h.size > MAKS) {
            // Hiqen produktet më të vjetra; furnizuesit s'hiqen kurrë. Së pari të mësuarat vetë dhe të kolegëve, të fundit të administratorit.
            val ks = celesat(h)
            ks.filter { !eshteCelesFurnizuesi(it) }.sortedWith { a, b -> val d = klasa(h[a]) - klasa(h[b]); if (d != 0) d else h[a]!!.k.compareTo(h[b]!!.k) }
                .take(ks.size - MAKS).forEach { h.remove(it) }
        }
        ruajtja?.shkruaj { tekstiPerRuajtje() }
    }
    private fun njofto(b: List<String>) { if (b.isNotEmpty()) degjuesit.toList().forEach { try { it(b.toList()) } catch (e: Exception) { } } }

    private fun celesatEFurnizuesit(h: Map<String, Hyrja>, v: String, idx: Map<String, MutableList<String>>?): List<String> {
        if (idx != null) return (idx[v] ?: emptyList<String>()).filter { c -> h[c]?.x == false }
        return celesat(h).filter { c -> eshteCelesFurnizuesi(c) && !h[c]!!.x && vogel(c.substring(FURN_PARA.length)) == v }
    }
    private fun indeksiIFurnizuesve(h: Map<String, Hyrja>): HashMap<String, MutableList<String>> {
        val idx = HashMap<String, MutableList<String>>()
        celesat(h).forEach { c -> if (eshteCelesFurnizuesi(c) && !h[c]!!.x) shtoNeIndeks(idx, c) }
        return idx
    }
    private fun shtoNeIndeks(idx: HashMap<String, MutableList<String>>?, c: String) {
        if (idx == null) return
        val l = idx.getOrPut(vogel(c.substring(FURN_PARA.length))) { ArrayList() }
        if (!l.contains(c)) l.add(c)
    }

    /** Administratori e ruan furnizuesin (detyro: me dorë, edhe mbi një të fshirë ose në pritje) */
    private fun regjistro(h: LinkedHashMap<String, Hyrja>, emri0: String, kohaE: Long, detyro: Boolean, ndr: MutableList<String>?) {
        if (!autoriAdmin) return
        val emri = pastroTekstin(emri0, 80)
        val c = celesIFurnizuesit(emri); if (c.isEmpty()) return
        val x = h[c]
        if (detyro) {
            if (x != null && !x.x && x.s && !x.r && x.e == emri) return
        } else {
            val v = vogel(emri)
            if (h.keys.any { eshteCelesFurnizuesi(it) && vogel(it.substring(FURN_PARA.length)) == v }) return
        }
        h[c] = Hyrja(emri, "", if (kohaE != 0L) kohaE else if (detyro) tani() else 1L, s = true)
        ndr?.add(c)
    }

    /** v214: furnizuesi i ri që e shkruan dikush gjatë punës: ruhet më vete dhe pret kontrollin */
    private fun regjistroIRi(h: LinkedHashMap<String, Hyrja>, emri0: String, kohaE: Long, ndr: MutableList<String>?, idx: HashMap<String, MutableList<String>>? = null) {
        val emri = pastroTekstin(emri0, 80)
        val c = celesIFurnizuesit(emri); if (c.isEmpty()) return
        if (celesatEFurnizuesit(h, vogel(emri), idx).isNotEmpty()) return
        val ri = Hyrja(emri, "", if (kohaE != 0L) kohaE else tani())
        if (autoriAdmin) { ri.s = true; ri.r = true }
        if (autoriEmri.isNotEmpty()) ri.n = autoriEmri
        else if (!autoriAdmin) ri.r = true
        h[c] = ri
        shtoNeIndeks(idx, c)
        ndr?.add(c)
    }

    /** v214: produktet në pritje me një furnizues pa hyrjen e vet: krijohet hyrja e furnizuesit në pritje */
    private fun siguroFurnizuesitNePritje(h: LinkedHashMap<String, Hyrja>): List<String> {
        val ndr = ArrayList<String>(); val fshire = HashMap<String, Long>(); val idx = indeksiIFurnizuesve(h)
        val ks = celesat(h)
        ks.forEach { c ->
            if (!eshteCelesFurnizuesi(c) || !h[c]!!.x) return@forEach
            val v = vogel(c.substring(FURN_PARA.length))
            fshire[v] = maxOf(fshire[v] ?: 0L, h[c]!!.k)
        }
        ks.forEach { b ->
            val x = h[b] ?: return@forEach
            if (eshteCelesFurnizuesi(b) || !eshteNePritje(x) || x.f.isEmpty()) return@forEach
            val v = vogel(x.f); val c = celesIFurnizuesit(x.f)
            if (c.isEmpty() || celesatEFurnizuesit(h, v, idx).isNotEmpty()) return@forEach
            val fv = fshire[v]
            if (fv != null && fv != 0L && fv >= x.k) return@forEach
            val y = if (x.s) Hyrja(x.f, "", if (x.k != 0L) x.k else 1L, x.n, s = true, r = true) else Hyrja(x.f, "", if (x.k != 0L) x.k else 1L, x.n)
            if (y.n.isEmpty() && !x.s) y.r = true // v238: pa autor (i mësuar vetë): pret kontrollin me r
            h[c] = y
            shtoNeIndeks(idx, c)
            ndr.add(c)
        }
        return ndr
    }

    /** menyra "mbishkruaj" (ruajtje nga përdoruesi) | "plotëso" (në sfond: vetëm hyrje të reja ose plotësim i atyre automatike) */
    private fun mesoNje(h: LinkedHashMap<String, Hyrja>, b0: Any?, emri0: Any?, furn0: Any?, menyra: String?, kohaE: Long,
                        ndr: MutableList<String>, idx: HashMap<String, MutableList<String>>?): String? {
        val b = pastroBarkodin(b0); val emri = pastroTekstin(emri0, 120); val furn = pastroTekstin(furn0, 80)
        if (b.isEmpty() || (emri.isEmpty() && furn.isEmpty())) return null
        val x = h[b]
        val ri: Hyrja
        if (menyra == "plotëso") {
            if (x != null && klasa(x) != 0) return null
            ri = Hyrja(x?.e?.ifEmpty { null } ?: emri, x?.f?.ifEmpty { null } ?: furn, if (kohaE != 0L) kohaE else tani(), a = true)
            if (x != null && ri.e == x.e && ri.f == x.f) return null
            if (x == null || eshteNePritje(x)) ri.r = true
        } else {
            val vjeter = if (x != null && !x.x) x else null
            if (x != null && x.s && !autoriAdmin) return null
            ri = Hyrja(emri.ifEmpty { null } ?: vjeter?.e?.ifEmpty { null } ?: "", furn.ifEmpty { null } ?: vjeter?.f?.ifEmpty { null } ?: "", if (kohaE != 0L) kohaE else tani())
            if (vjeter != null && vjeter.m) ri.m = true
            if (autoriAdmin) { ri.s = true; if (vjeter == null || ri.e != vjeter.e || ri.f != vjeter.f || eshteNePritje(vjeter)) ri.r = true }
            if (vjeter != null && !vjeter.a && vjeter.s == ri.s && ri.e == vjeter.e && ri.f == vjeter.f) return null
            if (autoriEmri.isNotEmpty() && (autoriAdmin || vjeter == null || ri.e != vjeter.e || ri.f != vjeter.f)) ri.n = autoriEmri
            else if (vjeter != null && vjeter.n.isNotEmpty()) ri.n = vjeter.n
            if (!autoriAdmin && ri.n.isEmpty() && (vjeter == null || ri.e != vjeter.e || ri.f != vjeter.f || eshteNePritje(vjeter))) ri.r = true
            if (ri.f.isNotEmpty()) regjistroIRi(h, ri.f, ri.k, ndr, idx)
        }
        h[b] = ri
        return b
    }

    // ---------------- API (si objekti që kthen krijoKujtesen) ----------------
    @Synchronized fun merr(b0: Any?): Produkti? {
        val b = pastroBarkodin(b0)
        val x = if (b.isEmpty()) null else lexo()[b]
        return if (x != null && !x.x) Produkti(b, x.e, x.f, x.k, x.m, x.s, x.n, x.a, eshteNePritje(x)) else null
    }

    @Synchronized fun meso(b: Any?, emri: Any?, furn: Any?, menyra: String? = null): Boolean {
        val h = lexo(); val ndr = ArrayList<String>()
        val r = mesoNje(h, b, emri, furn, menyra, 0, ndr, null) ?: return false
        shkruaj(); njofto(listOf(r) + ndr); return true
    }

    @Synchronized fun mesoShume(lista: List<Rreshti>, menyra: String?): Int {
        val h = lexo(); val ndr = ArrayList<String>(); val t = tani(); val idx = indeksiIFurnizuesve(h)
        lista.forEach { x ->
            val r = mesoNje(h, x.barkodi, x.emri, x.furnizuesi, menyra, t, ndr, idx)
            if (r != null) ndr.add(r)
            // v215: rreshti pa barkod: furnizuesi i ri ruhet prapë më vete, në pritje
            else if (menyra != "plotëso" && eVertete(x.furnizuesi) && pastroBarkodin(x.barkodi).isEmpty()) regjistroIRi(h, jsString(x.furnizuesi), t, ndr, idx)
        }
        if (ndr.isNotEmpty()) { shkruaj(); njofto(ndr) }
        return ndr.size
    }

    /** Ndryshim me dorë (Cilësimet → Produktet): vendos saktësisht; pa emër dhe pa furnizues = e harruar */
    @Synchronized fun vendos(b0: Any?, emri0: Any?, furn0: Any?): Boolean {
        val b = pastroBarkodin(b0); val emri = pastroTekstin(emri0, 120); val furn = pastroTekstin(furn0, 80)
        if (b.isEmpty()) return false
        val h = lexo()
        val ri = if (emri.isEmpty() && furn.isEmpty()) Hyrja(k = tani(), x = true) else Hyrja(emri, furn, tani(), m = true)
        if (autoriAdmin) ri.s = true
        if (!ri.x && autoriEmri.isNotEmpty()) ri.n = autoriEmri
        if (!ri.x && !autoriAdmin && ri.n.isEmpty()) ri.r = true
        h[b] = ri
        val ndr = arrayListOf(b)
        if (ri.f.isNotEmpty()) regjistroIRi(h, ri.f, ri.k, ndr)
        shkruaj(); njofto(ndr)
        return true
    }

    @Synchronized fun fshij(b0: Any?): Boolean {
        val b = pastroBarkodin(b0); val h = lexo()
        val x = h[b]
        if (x == null || (x.x && (x.s || !autoriAdmin))) return false
        h[b] = Hyrja(k = tani(), x = true, s = autoriAdmin)
        shkruaj(); njofto(listOf(b)); return true
    }

    /** Furnizuesi u riemërtua (Cilësimet → Furnizuesit): edhe në kujtesë. Kthen sa produkte. */
    @Synchronized fun riemertoFurnizuesin(vjeter0: Any?, iRi0: Any?): Int {
        val vjeter = pastroTekstin(vjeter0, 80); val iRi = pastroTekstin(iRi0, 80)
        if (vjeter.isEmpty() || iRi.isEmpty() || vjeter == iRi) return 0
        val h = lexo(); val ndr = ArrayList<String>(); val v = vogel(vjeter); val t = tani()
        celesat(h).forEach { b ->
            val x = h[b]!!
            if (!eshteCelesFurnizuesi(b) && !x.x && x.f.isNotEmpty() && vogel(x.f) == v) {
                x.f = iRi; x.k = t; x.a = false
                if (autoriAdmin && !eshteNePritje(x)) x.s = true
                ndr.add(b)
            }
        }
        val nProdukte = ndr.size
        if (autoriAdmin) {
            val cRi = celesIFurnizuesit(iRi)
            celesatEFurnizuesit(h, v, null).forEach { c -> if (c != cRi) { h[c] = Hyrja(k = t, x = true, s = true); ndr.add(c) } }
            regjistro(h, iRi, t, true, ndr)
        }
        if (ndr.isNotEmpty()) { shkruaj(); njofto(ndr) }
        return nProdukte
    }

    @Synchronized fun furnizuesit(): List<FurnizuesiIRuajtur> {
        val h = lexo()
        return celesat(h).filter { eshteCelesFurnizuesi(it) }.map { c -> val x = h[c]!!
            FurnizuesiIRuajtur(x.e.ifEmpty { c.substring(FURN_PARA.length) }, x.x, x.k, eshteNePritje(x), x.n) }
    }

    @Synchronized fun regjistroFurnizuesinERi(emri: Any?): Int {
        val h = lexo(); val ndr = ArrayList<String>()
        regjistroIRi(h, jsString(emri ?: ""), 0, ndr)
        if (ndr.isNotEmpty()) { shkruaj(); njofto(ndr) }
        return ndr.size
    }

    /** v238: sfondi i administratorit: furnizuesit pa asnjë hyrje ruhen NË PRITJE, me kohën 1 */
    @Synchronized fun regjistroFurnizuesitNePritje(emrat: List<String>): Int {
        if (!autoriAdmin) return 0
        val h = lexo(); val ndr = ArrayList<String>(); val njohur = HashSet<String>()
        celesat(h).forEach { c -> if (eshteCelesFurnizuesi(c)) njohur.add(vogel(c.substring(FURN_PARA.length))) }
        emrat.forEach { e0 ->
            val e = pastroTekstin(e0, 80); val c = celesIFurnizuesit(e); val v = vogel(e)
            if (c.isEmpty() || njohur.contains(v)) return@forEach
            h[c] = Hyrja(e, "", 1L, autoriEmri, s = true, r = true)
            njohur.add(v); ndr.add(c)
        }
        if (ndr.isNotEmpty()) { shkruaj(); njofto(ndr) }
        return ndr.size
    }

    /** Administratori: ruaj këta furnizues (të kontrolluar). Pa detyro s'prek ata që janë fshirë me dorë. */
    @Synchronized fun regjistroFurnizuesit(emrat: List<String>, detyro: Boolean): Int {
        if (!autoriAdmin) return 0
        val h = lexo(); val ndr = ArrayList<String>(); val t = if (detyro) tani() else 1L
        emrat.forEach { regjistro(h, it, t, detyro, ndr) }
        if (ndr.isNotEmpty()) { shkruaj(); njofto(ndr) }
        return ndr.size
    }

    /** Administratori e fshin furnizuesin: produktet e tij mbeten, pa furnizues. Kthen sa produkte (-1: s'lejohet). */
    @Synchronized fun fshijFurnizuesin(emri0: Any?): Int {
        if (!autoriAdmin) return -1
        val emri = pastroTekstin(emri0, 80)
        val c = celesIFurnizuesit(emri); if (c.isEmpty()) return -1
        val h = lexo(); val t = tani(); val v = vogel(emri); val ndr = ArrayList<String>()
        (celesatEFurnizuesit(h, v, null) + c).forEach { k -> if (!ndr.contains(k)) { h[k] = Hyrja(k = t, x = true, s = true); ndr.add(k) } }
        val nFurn = ndr.size
        celesat(h).forEach { b ->
            val x = h[b]!!
            if (eshteCelesFurnizuesi(b) || x.x || x.f.isEmpty() || vogel(x.f) != v) return@forEach
            // Produkti që kishte vetëm furnizuesin (pa emër): pa furnizues s'mbetet asgjë, harrohet
            if (x.e.isEmpty()) { h[b] = Hyrja(k = t, x = true, s = true); ndr.add(b); return@forEach }
            x.f = ""; x.k = t; x.a = false
            if (!eshteNePritje(x)) x.s = true
            ndr.add(b)
        }
        shkruaj(); njofto(ndr)
        return ndr.size - nFurn
    }

    @Synchronized fun lista(): List<Produkti> {
        val h = lexo()
        return celesat(h).filter { !h[it]!!.x && !eshteCelesFurnizuesi(it) }.map { b -> val x = h[b]!!
            Produkti(b, x.e, x.f, x.k, x.m, x.s, x.n, x.a, eshteNePritje(x)) }
            .sortedWith { a, b -> Afatet.KOLATORI.compare(a.emri.ifEmpty { a.barkodi }, b.emri.ifEmpty { b.barkodi }) }
    }
    @Synchronized fun numri(): Int { val h = lexo(); return h.count { (b, x) -> !x.x && !eshteCelesFurnizuesi(b) } }
    @Synchronized fun numriNePritje(): Int { val h = lexo(); return h.count { (b, x) -> !eshteCelesFurnizuesi(b) && eshteNePritje(x) } }

    /** Kush po shkruan (emri i llogarisë dhe a është administratori i Stoku-t) */
    @Synchronized fun vendosAutorin(emri: String?, admin: Boolean) { autoriEmri = pastroTekstin(emri ?: "", 40); autoriAdmin = admin }

    // ---------------- Sinkronizimi (regjistri, pritja, grupi) ----------------
    @Synchronized fun degjo(fn: (List<String>) -> Unit): () -> Unit { degjuesit.add(fn); return { synchronized(this) { degjuesit.remove(fn) } } }

    /** Hyrjet që vijnë nga jashtë: zëvendësojnë këtu vetëm kur fitojnë (pa njoftuar dëgjuesit) */
    @Synchronized fun bashko(remote: Map<String, Any?>?): Int {
        if (remote == null) return 0
        val h = lexo(); var n = 0
        renditjaJs(remote).forEach { b ->
            if (!celesIVlefshem(b)) return@forEach
            val r = hyrjaEPastruar(remote[b])
            if (r != null && hyrjaFiton(r, h[b], b)) { h[b] = r; n++ }
        }
        val ndr = siguroFurnizuesitNePritje(h)
        if (n > 0 || ndr.isNotEmpty()) shkruaj()
        if (ndr.isNotEmpty()) njofto(ndr)
        return n
    }

    /** Barkodet ku kjo pajisje ka diçka më të mirë se ana tjetër */
    @Synchronized fun perDergim(remote: Map<String, Any?>?): List<String> {
        val h = lexo(); val rm = remote ?: emptyMap()
        return celesat(h).filter { b ->
            if (!celesIVlefshem(b)) return@filter false
            val r = hyrjaEPastruar(rm[b])
            r == null || hyrjaFiton(h[b]!!, r, b)
        }
    }

    /** Hyrjet e plota për dërgim (me krejt fushat, që bashkimi i Firebase-it të mos lërë mbetje nga hyrja e vjetër) */
    @Synchronized fun hyrjePerGrup(barkodet: List<String>): LinkedHashMap<String, MObj> {
        val h = lexo(); val o = LinkedHashMap<String, MObj>()
        barkodet.forEach { b ->
            val x = h[b] ?: return@forEach
            if (!celesIVlefshem(b)) return@forEach
            o[b] = if (x.x) obj("e" to "", "f" to "", "k" to x.k, "a" to 0L, "m" to 0L, "s" to (if (x.s) 1L else 0L), "n" to "", "x" to 1L, "r" to 0L)
            else obj("e" to x.e, "f" to x.f, "k" to x.k, "a" to (if (x.a) 1L else 0L), "m" to (if (x.m) 1L else 0L), "s" to (if (x.s) 1L else 0L),
                "n" to x.n, "x" to 0L, "r" to (if (x.r) 1L else 0L))
        }
        return o
    }

    @Synchronized fun pastro() { harta = LinkedHashMap(); shkruaj() }
    @Synchronized fun harro() { harta = null }
}
