package site.stoku.logjika

import java.text.Collator
import java.util.Locale

/**
 * Furnizuesit te Cilësimet → Stoku (afatet.js: listaEFurnizuesve, renditSipasRuajtjes, furnizuesiEkzistues,
 * riemertoFurnizuesin): lista me sa afate e produkte ka secili, cilët presin kontrollin, ndryshimi i emrit.
 */
object Furnizuesit {
    class Rreshti(val emri: String, val afate: Int, val produkte: Int, val nePritje: Boolean, val nga: List<String>, val regjistruar: Boolean, val koha: Long)
    private val HAPESIRAT = Regex("[$JS_HAPESIRAT]+")
    private fun nrm(t: Any?): String = jsTrim((if (t == null || t == false || t == "") "" else jsString(t)).replace(HAPESIRAT, " "))
    private val BAZA: Collator = Collator.getInstance(Locale.forLanguageTag("sq")).apply { strength = Collator.PRIMARY }
    /** localeCompare(…, 'sq', { sensitivity: 'base' }): si ICU, hapësira vjen para shkronjave (Collator-i i Java-s e injoron) */
    fun krahasoBaze(a: String, b: String): Int {
        val pa = a.split(' '); val pb = b.split(' ')
        for (i in 0 until minOf(pa.size, pb.size)) { val d = BAZA.compare(pa[i], pb[i]); if (d != 0) return d }
        return pa.size.compareTo(pb.size)
    }

    private class R(val emri: String) {
        var afate = 0; val b = LinkedHashSet<String>(); var vetemPritje = true; val nga = LinkedHashSet<String>()
        var regjistruar = false; var regPritje = false; var kohaR = 0L; var kohaP = 0L
    }

    /** kujtesa: Kujtesa.lista() (produktet), regjistri: Kujtesa.furnizuesit() */
    fun lista(afatet: List<Obj>, produktet: Map<String, Obj>, kujtesa: List<Kujtesa.Produkti>, regjistri: List<Kujtesa.FurnizuesiIRuajtur>): List<Rreshti> {
        val m = LinkedHashMap<String, R>(); val fshire = HashSet<String>()
        fun rec(e: Any?): R? { val emri = nrm(e); if (emri.isEmpty()) return null; return m.getOrPut(emri) { R(emri) } }
        regjistri.forEach { x ->
            if (x.emri.isEmpty()) return@forEach
            if (x.fshire) { fshire.add(Kujtesa.vogel(x.emri)); return@forEach }
            val r = rec(x.emri) ?: return@forEach
            if (x.nePritje) { r.regPritje = true; if (x.nga.isNotEmpty()) r.nga.add(x.nga); r.kohaP = maxOf(r.kohaP, x.koha); return@forEach }
            r.regjistruar = true; r.vetemPritje = false
            if (x.koha > 1) r.kohaR = maxOf(r.kohaR, x.koha)
        }
        afatet.forEach { a -> rec(a["furnizuesi"])?.let { it.afate++; it.vetemPritje = false } }
        renditjaJs(produktet).forEach { k -> val p = produktet[k] ?: return@forEach
            rec(p["furnizuesi"])?.let { it.b.add((p["barkodi"] as? String)?.ifEmpty { null } ?: k); it.vetemPritje = false } }
        kujtesa.forEach { x ->
            val r = rec(x.furnizuesi) ?: return@forEach
            r.b.add(x.barkodi)
            if (!x.nePritje) r.vetemPritje = false else { if (x.nga.isNotEmpty()) r.nga.add(x.nga); r.kohaP = maxOf(r.kohaP, x.koha) }
        }
        return m.values.filter { r -> !fshire.contains(Kujtesa.vogel(r.emri)) || r.regjistruar || r.regPritje || (r.vetemPritje && r.nga.isNotEmpty()) }
            .map { r -> val pritje = !r.regjistruar
                Rreshti(r.emri, r.afate, r.b.size, pritje, if (pritje) r.nga.toList() else emptyList(), r.regjistruar, if (pritje) r.kohaP else r.kohaR) }
            .sortedWith { a, b -> krahasoBaze(a.emri, b.emri).let { if (it != 0) it else Afatet.KOLATORI.compare(a.emri, b.emri) } }
    }

    /** Produktet: koha e ruajtjes nga administratori (0 = e mësuar vetë, pa kohë ruajtjeje) */
    fun kohaERuajtjes(x: Kujtesa.Produkti): Long = if (!x.nePritje && !(x.ngaAdmini && !x.automatik)) 0L else x.koha
    /** Të ruajturat nga administratori në krye, më e reja e para; të tjerat pas tyre, në rendin që kishin */
    fun <T> renditSipasRuajtjes(lista: List<T>, koha: (T) -> Long): List<T> =
        lista.withIndex().sortedWith { a, b -> val d = koha(b.value).compareTo(koha(a.value)); if (d != 0) d else a.index - b.index }.map { it.value }

    /** A ekziston një furnizues tjetër me këtë emër (pa dallim shkronjash)? Emri i tij ose "" */
    fun ekzistues(lista: List<Rreshti>, emri: String, pervec: String?): String {
        val e = Kujtesa.vogel(jsTrim(emri))
        return lista.firstOrNull { it.emri != pervec && Kujtesa.vogel(it.emri) == e }?.emri ?: ""
    }

    class Riemertimi(val afatet: List<Obj>, val produktet: Map<String, Obj>, val nAfate: Int, val nProdukte: Int)
    /** Ndryshon emrin e furnizuesit te krejt afatet (ndryshuarSe = tani) dhe produktet (prekurSe + 1 ms) */
    fun riemerto(afatet: List<Obj>, produktet: Map<String, Obj>, vjeter0: String, iRi0: String, tani: Long): Riemertimi {
        val vjeter = nrm(vjeter0); val iRi = nrm(iRi0)
        var nA = 0; var nP = 0
        val aRe = afatet.map { a -> if (vjeter.isEmpty() || iRi.isEmpty() || nrm(a["furnizuesi"]) != vjeter) a else { nA++; a.me("furnizuesi" to iRi, "ndryshuarSe" to tani) } }
        val pRe = LinkedHashMap<String, Obj>()
        produktet.forEach { (k, x) ->
            if (vjeter.isNotEmpty() && iRi.isNotEmpty() && nrm(x["furnizuesi"]) == vjeter) {
                nP++
                pRe[k] = x.me("furnizuesi" to iRi, "prekurSe" to numerPerRuajtje((if (eNumer(x["prekurSe"])) jsNumber(x["prekurSe"]) else 0.0) + 1))
            } else pRe[k] = x
        }
        return Riemertimi(aRe, pRe, nA, nP)
    }
}
