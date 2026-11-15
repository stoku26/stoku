package site.stoku.vendas

import site.stoku.logjika.GrupiLogjika
import site.stoku.logjika.Json
import site.stoku.logjika.Obj
import site.stoku.logjika.siListe
import site.stoku.logjika.siObj

/**
 * v308 (si Emrat te ekipa.js): emri i TANISHËM i një personi kudo (Aktiviteti, njoftimet, afatet, ftesat, regjistri, pikat, lejet),
 * sipas uid-së. Dokumentet e vjetra mbajnë emrin që kishte personi atëherë (p.sh. "mendurberisha" pas ndryshimit në "duli96").
 * Emrat e tanishëm: unë, anëtarët e grupit, llogaritë (administratori), plus ata të ruajtur në telefon. Emrat e vjetër mësohen nga
 * dokumentet që kanë edhe uid-në; një fushë vetëm me emër ndërrohet vetëm kur ai emër i ka përkitur një personi të vetëm.
 */
object Emrat {
    private const val PREF = "emrat_v1"
    private val aktualR = HashMap<String, String>()
    private val aliaset = HashMap<String, MutableList<String>>()
    private var ngarkuar = false

    @Synchronized private fun ngarko() {
        if (ngarkuar) return
        ngarkuar = true
        try {
            val o = Json.lexo(StokuApp.prefsOse(PREF, "{}")).siObj() ?: return
            o["aktual"].siObj()?.forEach { (k, v) -> if (v is String && v.isNotBlank()) aktualR[k] = v }
            o["aliaset"].siObj()?.forEach { (k, v) -> aliaset[k] = v.siListe().filterIsInstance<String>().toMutableList() }
        } catch (e: Exception) { /* ok */ }
    }

    @Synchronized private fun ruaj() {
        try { StokuApp.vendosPref(PREF, Json.shkruaj(mapOf("aktual" to HashMap(aktualR), "aliaset" to aliaset.mapValues { it.value.toList() }))) } catch (e: Exception) { /* ok */ }
    }

    @Synchronized private fun shtoAlias(uid: String, emri: String): Boolean {
        val k = GrupiLogjika.celesEmrit(emri)
        if (k.isEmpty() || uid.isEmpty()) return false
        val l = aliaset.getOrPut(k) { ArrayList() }
        if (uid in l) return false
        l.add(uid)
        while (l.size > 5) l.removeAt(0)
        return true
    }

    /** Emrat e tanishëm (uid → emri); kthen true kur ndryshoi diçka */
    @Synchronized fun vendosAktuale(lista: List<Pair<String, String>>): Boolean {
        ngarko()
        var ndr = false
        lista.forEach { (u, e0) ->
            val e = e0.trim()
            if (u.isEmpty() || e.isEmpty() || e == u) return@forEach
            if (aktualR[u] != e) { aktualR[u] = e; ndr = true }
            if (shtoAlias(u, e)) ndr = true
        }
        if (ndr) ruaj()
        return ndr
    }

    /** Mëson çiftet (uid, emri) nga dokumentet */
    @Synchronized fun meso(dokumentet: List<Obj>) {
        ngarko()
        var ndr = false
        dokumentet.forEach { o -> GrupiLogjika.ciftetEEmrave(o).forEach { (u, e) -> if (shtoAlias(u, e)) ndr = true } }
        if (ndr) ruaj()
    }

    /** Emrat e tanishëm nga burimet e gjalla (unë, anëtarët, llogaritë) */
    private fun teGjalla(): List<Pair<String, String>> {
        val l = ArrayList<Pair<String, String>>()
        try {
            Admini.llogarite.value?.forEach { l.add(it.uid to it.emri) }
            Grupi.anetaret.value.forEach { a -> val u = a["uid"] as? String; val e = a["emri"] as? String; if (!u.isNullOrEmpty() && !e.isNullOrEmpty()) l.add(u to e) }
            Llogaria.perdoruesi.value?.let { l.add(it.uid to it.emri) }
        } catch (e: Exception) { /* testet e pamjeve: pa Firebase */ }
        return l
    }

    @Synchronized fun harta(): GrupiLogjika.HartaEEmrave {
        vendosAktuale(teGjalla())
        return GrupiLogjika.HartaEEmrave(HashMap(aktualR), aliaset.mapValues { it.value.toList() })
    }

    /** Emri i tanishëm: me uid (kur dihet), ose sipas emrit të vjetër */
    fun emri(uid: String?, emri: String?): String = GrupiLogjika.emriAktual(harta(), uid, emri) ?: (emri ?: "")
    fun emri(emri: String?): String = emri(null, emri)

    fun perditeso(o: Obj): Obj = GrupiLogjika.meEmratAktuale(o, harta())
    fun perditesoListen(l: List<Obj>): List<Obj> {
        meso(l)
        val h = harta()
        return l.map { GrupiLogjika.meEmratAktuale(it, h) }
    }
}
