package site.stoku.ora

import android.content.ComponentName
import android.content.Context
import androidx.wear.tiles.TileService
import androidx.wear.watchface.complications.datasource.ComplicationDataSourceUpdateRequester
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.security.SecureRandom
import java.util.TimeZone

// v241: marketi = emri i marketit (`mk`), kur përdoruesi punon në disa markete (merchandiserët)
data class Afat(val id: String, val emri: String, val barkodi: String, val data: String, val sasia: Int?, val furnizuesi: String = "", val marketi: String = "")

// v238: krejt afatet aktive (GET /ora/krejt): d7/d30 = data e sotme + 7 / + 30 ditë (krahasime teksti, si te serveri)
data class Krejt(val dita: String, val d7: String, val d30: String, val krejt: List<Afat>)

data class Lista(
    val dita: String,
    val sot: List<Afat>,
    val java: List<Afat>,
    val javaN: Int,
    val skaduara: Int,
    val skaduaraL: List<Afat>,
    val ekipa: Boolean,
    val emri: String,
)

data class Koleg(val uid: String, val emri: String)

class DuhetRilidhur : Exception("rilidh")

class PaLidhje : Exception("pa-lidhje")

// Lidhja me serverin stoku-push (Cloudflare). Ora identifikohet me një sekret 64-hex që krijohet këtu dhe
// lidhet me llogarinë kur përdoruesi e shkruan kodin 6-shifror te telefoni (Cilësimet → Ora e dorës → Lidh orën).
object Api {
    private const val SERVERI = "https://stoku-push.mendurb.workers.dev"
    private val rastesi = SecureRandom()

    private fun prefs(ctx: Context) = ctx.getSharedPreferences("stoku", Context.MODE_PRIVATE)

    fun sekreti(ctx: Context): String {
        val p = prefs(ctx)
        p.getString("sekret", null)?.let { return it }
        val b = ByteArray(32).also { rastesi.nextBytes(it) }
        val s = b.joinToString("") { "%02x".format(it) }
        p.edit().putString("sekret", s).apply()
        return s
    }

    fun kodi(ctx: Context): String {
        val p = prefs(ctx)
        p.getString("kodi", null)?.let { return it }
        return kodiIRi(ctx)
    }

    fun kodiIRi(ctx: Context): String {
        val k = (100000 + rastesi.nextInt(900000)).toString()
        prefs(ctx).edit().putString("kodi", k).apply()
        return k
    }

    fun lidhur(ctx: Context) = prefs(ctx).getBoolean("lidhur", false)

    // Shkëputja: serveri e fshin lidhjen dhe këtu krijohet sekret i ri, që ora të mos e lexojë më llogarinë e vjetër
    suspend fun shkeput(ctx: Context) {
        val sekret = prefs(ctx).getString("sekret", null)
        if (sekret != null) withContext(Dispatchers.IO) { try { thirr("POST", "/ora/shkeput", JSONObject(), sekret) } catch (e: Exception) { } }
        prefs(ctx).edit().clear().apply()
        rifreskoTileDheKomplikacionin(ctx)
    }

    // shpejt: për tile-in dhe komplikacionin. Kërkesa e bllokuar s'ndalet nga withTimeoutOrNull, prandaj kufijtë e
    // lidhjes janë vetë të shkurtër (përndryshe tile-i rrinte bosh deri në 25 s para se të shfaqte listën e ruajtur)
    private fun thirr(metoda: String, rruga: String, trup: JSONObject?, sekret: String?, shpejt: Boolean = false): Pair<Int, JSONObject> {
        val c = URL(SERVERI + rruga).openConnection() as HttpURLConnection
        try {
            c.requestMethod = metoda
            c.connectTimeout = if (shpejt) 4000 else 10000
            c.readTimeout = if (shpejt) 5000 else 15000
            c.setRequestProperty("Accept", "application/json")
            if (sekret != null) c.setRequestProperty("X-Stoku-Ora", sekret)
            if (trup != null) {
                c.doOutput = true
                c.setRequestProperty("Content-Type", "application/json")
                c.outputStream.use { it.write(trup.toString().toByteArray(Charsets.UTF_8)) }
            }
            val kodi = c.responseCode
            val tekst = (if (kodi < 400) c.inputStream else c.errorStream)?.bufferedReader()?.use { it.readText() } ?: "{}"
            return kodi to (try { JSONObject(tekst) } catch (e: Exception) { JSONObject() })
        } finally {
            c.disconnect()
        }
    }

    // Kthen true kur telefoni e ka lidhur orën me llogarinë
    suspend fun kontrolloLidhjen(ctx: Context): Boolean = withContext(Dispatchers.IO) {
        var (st, j) = thirr("POST", "/ora/kodi", JSONObject().put("kodi", kodi(ctx)).put("sekret", sekreti(ctx)), null)
        if (st == 409) { // kodi i zënë nga një orë tjetër: krijohet një i ri
            kodiIRi(ctx)
            val r = thirr("POST", "/ora/kodi", JSONObject().put("kodi", kodi(ctx)).put("sekret", sekreti(ctx)), null)
            st = r.first; j = r.second
        }
        val ok = st == 200 && j.optBoolean("lidhur")
        if (ok) {
            prefs(ctx).edit().putBoolean("lidhur", true).putString("emri", j.optString("emri")).apply()
            rifreskoTileDheKomplikacionin(ctx)
        }
        ok
    }

    suspend fun merrListen(ctx: Context, shpejt: Boolean = false): Lista = withContext(Dispatchers.IO) {
        dergoRadhenPaGabim(ctx) // v252: heqjet e bëra pa internet shkojnë te serveri para listës së re
        val tz = URLEncoder.encode(TimeZone.getDefault().id, "UTF-8")
        val (st, j) = thirr("GET", "/ora/sot?tz=$tz", null, sekreti(ctx), shpejt)
        if (st == 401) {
            prefs(ctx).edit().putBoolean("lidhur", false).remove("lista").apply()
            throw PaLidhje()
        }
        if (st != 200 || !j.optBoolean("ok")) throw Exception("serveri-$st")
        prefs(ctx).edit().putString("lista", j.toString()).putLong("listaKoha", System.currentTimeMillis()).apply()
        listaNdryshoi = false
        paHequrat(ctx, lexo(j))
    }

    // Lista ndryshoi te ora (heqje, zhbërje): tile-i dhe komplikacioni e marrin sërish nga serveri, jo nga kopja e ruajtur
    @Volatile var listaNdryshoi = false

    // Lista e ndryshuar këtu (heqje nga rafti): ruhet si kopja e fundit, që tile-i dhe komplikacioni ta shohin edhe pa internet
    fun ruajListen(ctx: Context, l: Lista) {
        fun arr(a: List<Afat>) = JSONArray().also { j ->
            a.forEach { x -> j.put(JSONObject().put("i", x.id).put("e", x.emri).put("b", x.barkodi).put("d", x.data).also { o -> x.sasia?.let { o.put("s", it) }; if (x.furnizuesi.isNotBlank()) o.put("f", x.furnizuesi); if (x.marketi.isNotBlank()) o.put("mk", x.marketi) }) }
        }
        val j = JSONObject().put("ok", true).put("dita", l.dita).put("sot", arr(l.sot)).put("java", arr(l.java)).put("javaN", l.javaN)
            .put("skaduara", l.skaduara).put("skaduaraL", arr(l.skaduaraL)).put("ekipa", l.ekipa).put("emri", l.emri)
        prefs(ctx).edit().putString("lista", j.toString()).apply()
    }

    // v238: krejt produktet (butonat "8 deri 30 ditë", "Mbi 30 ditë" dhe kërkimi); kopja e fundit ruhet për pa internet
    suspend fun merrKrejt(ctx: Context): Krejt = withContext(Dispatchers.IO) {
        dergoRadhenPaGabim(ctx)
        val tz = URLEncoder.encode(TimeZone.getDefault().id, "UTF-8")
        val (st, j) = thirr("GET", "/ora/krejt?tz=$tz", null, sekreti(ctx))
        if (st == 401) {
            prefs(ctx).edit().putBoolean("lidhur", false).remove("lista").remove("krejt").apply()
            throw PaLidhje()
        }
        if (st != 200 || !j.optBoolean("ok")) throw Exception("serveri-$st")
        prefs(ctx).edit().putString("krejt", j.toString()).apply()
        val k = lexoKrejt(j)
        val h = teHequratNeRadhe(ctx)
        if (h.isEmpty()) k else k.copy(krejt = k.krejt.filter { it.id !in h })
    }
    fun krejtERuajtur(ctx: Context): Krejt? = try {
        prefs(ctx).getString("krejt", null)?.let { lexoKrejt(JSONObject(it)) }
    } catch (e: Exception) { null }
    private fun lexoKrejt(j: JSONObject) = Krejt(dita = j.optString("dita"), d7 = j.optString("d7"), d30 = j.optString("d30"), krejt = afatet(j.optJSONArray("krejt")))

    // Lista e fundit e ruajtur (për tile-in dhe komplikacionin kur s'ka internet)
    fun listaERuajtur(ctx: Context): Lista? = try {
        prefs(ctx).getString("lista", null)?.let { lexo(JSONObject(it)) }
    } catch (e: Exception) { null }

    // Tile-i dhe komplikacioni: kopja e ruajtur kur është e freskët (< 3 min, e së njëjtës ditë), që hapja e aplikacionit
    // të mos bëjë tre kërkesa njëra pas tjetrës (aplikacioni, tile-i, komplikacioni) përmes Bluetooth-it
    suspend fun merrMeCache(ctx: Context): Lista? {
        if (!lidhur(ctx)) return null
        val ruajtur = listaERuajtur(ctx)
        val mosha = System.currentTimeMillis() - prefs(ctx).getLong("listaKoha", 0L)
        if (!listaNdryshoi && ruajtur != null && mosha in 0..180_000L && ruajtur.dita == java.time.LocalDate.now().toString()) return ruajtur
        return try { merrListen(ctx, shpejt = true) } catch (e: Exception) { if (lidhur(ctx)) listaERuajtur(ctx) else null }
    }

    // ---------- v252: heqjet pa internet ----------
    // Heqja (ose zhbërja) që s'arrin te serveri sepse s'ka internet ruhet në orë (radha, me renditjen e bërjes) dhe
    // dërgohet vetë sa ka lidhje: kur hapet aplikacioni, kur rifreskohet tile-i/komplikacioni dhe kur kthehet rrjeti.
    // Lista e serverit shfaqet pa produktet që presin heqjen. Zhbërja e një heqjeje ende në radhë thjesht e anulon.
    private val radhaM = Mutex()
    private fun radha(ctx: Context): JSONArray = try { JSONArray(prefs(ctx).getString("radha", "[]")) } catch (e: Exception) { JSONArray() }
    private fun ruajRadhen(ctx: Context, r: JSONArray) { prefs(ctx).edit().putString("radha", r.toString()).apply() }
    fun neRadhe(ctx: Context): Int = radha(ctx).length()
    // Id-të që presin heqjen (heqja e fundit për secilin, pa zhbërje pas saj)
    fun teHequratNeRadhe(ctx: Context): Set<String> {
        val r = radha(ctx)
        val h = mutableSetOf<String>()
        for (i in 0 until r.length()) {
            val o = r.getJSONObject(i)
            if (o.optBoolean("z")) h.remove(o.optString("i")) else h.add(o.optString("i"))
        }
        return h
    }
    private fun paHequrat(ctx: Context, l: Lista): Lista {
        val h = teHequratNeRadhe(ctx)
        if (h.isEmpty()) return l
        return l.copy(
            sot = l.sot.filter { it.id !in h },
            java = l.java.filter { it.id !in h },
            javaN = (l.javaN - l.java.count { it.id in h }).coerceAtLeast(0),
            skaduaraL = l.skaduaraL.filter { it.id !in h },
            skaduara = (l.skaduara - l.skaduaraL.count { it.id in h }).coerceAtLeast(0),
        )
    }
    private fun shtoNeRadhe(ctx: Context, ids: List<String>, zhbej: Boolean) {
        val r = radha(ctx)
        if (zhbej && ids.size == 1) {
            // heqja e këtij produkti s'është dërguar ende: zhbërja e anulon (asgjë s'shkon te serveri)
            var j = r.length() - 1
            while (j >= 0 && !(r.getJSONObject(j).optString("i") == ids[0] && !r.getJSONObject(j).optBoolean("z"))) j--
            if (j >= 0) {
                val e = JSONArray()
                for (i in 0 until r.length()) if (i != j) e.put(r.getJSONObject(i))
                ruajRadhen(ctx, e)
                return
            }
        }
        ids.forEach { r.put(JSONObject().put("i", it).put("z", zhbej)) }
        ruajRadhen(ctx, r)
    }
    // Dërgon radhën me renditje; kthen true kur u zbraz. Pa internet ndalet (provohet herën tjetër).
    private suspend fun dergoRadhenPaKyc(ctx: Context): Boolean {
        val sekret = prefs(ctx).getString("sekret", null) ?: return true
        var njeNgaNje = false
        while (true) {
            val r = radha(ctx)
            if (r.length() == 0) return true
            val o = r.getJSONObject(0)
            val z = o.optBoolean("z")
            var n = 1
            if (!z && !njeNgaNje) while (n < r.length() && !r.getJSONObject(n).optBoolean("z")) n++
            val trup = if (n > 1) JSONObject().put("ids", JSONArray((0 until n).map { r.getJSONObject(it).optString("i") })).put("i", "")
                else JSONObject().put("i", o.optString("i")).put("zhbej", z)
            val st = try { thirr("POST", "/ora/hiq", trup, sekret).first } catch (e: java.io.IOException) { return false }
            if (st == 401) throw PaLidhje()
            if (st == 400 && n > 1) { njeNgaNje = true; continue } // serveri i vjetër (pa "ids"): një nga një
            if (st >= 500) return false // provohet më vonë
            // u ruajt (ose s'ruhet dot kurrë, p.sh. afati s'ekziston më): hiqet nga radha
            val e = JSONArray()
            for (i in n until r.length()) e.put(r.getJSONObject(i))
            ruajRadhen(ctx, e)
            if (n == 1 && e.length() > 0) delay(1100) // KV-ja pranon ~1 shkrim në sekondë për të njëjtin çelës
        }
    }
    suspend fun dergoRadhen(ctx: Context): Boolean = withContext(Dispatchers.IO) { radhaM.withLock { dergoRadhenPaKyc(ctx) } }
    private suspend fun dergoRadhenPaGabim(ctx: Context) {
        if (neRadhe(ctx) == 0) return
        try { dergoRadhen(ctx) } catch (e: PaLidhje) { throw e } catch (e: kotlinx.coroutines.CancellationException) { throw e } catch (e: Exception) { }
    }

    // Kthen true kur serveri e ruajti, false kur s'ka internet (heqja u ruajt në orë dhe dërgohet vetë më vonë);
    // gabimet e serverit hidhen (që aplikacioni të mos thotë "u shënua" pa qenë e vërtetë)
    suspend fun hiq(ctx: Context, id: String, zhbej: Boolean = false): Boolean = withContext(Dispatchers.IO) {
        radhaM.withLock {
            if (!dergoRadhenPaKyc(ctx)) { shtoNeRadhe(ctx, listOf(id), zhbej); return@withLock false } // renditja: radha e para
            val (st, j) = try { thirr("POST", "/ora/hiq", JSONObject().put("i", id).put("zhbej", zhbej), sekreti(ctx)) }
                catch (e: java.io.IOException) { shtoNeRadhe(ctx, listOf(id), zhbej); return@withLock false }
            if (st == 401) throw PaLidhje()
            if (st != 200 || !j.optBoolean("ok", true)) throw Exception("serveri-$st")
            true
        }
    }

    // "Hiqi krejt": një kërkesë e vetme (serveri v162). Serveri i vjetër (400: pa "i") → një nga një, me pushim 1.1 s
    // (KV-ja pranon ~1 shkrim në sekondë për të njëjtin çelës). Kthen sa s'u ruajtën; -1 = pa internet (u ruajtën në orë
    // dhe dërgohen vetë më vonë).
    suspend fun hiqShume(ctx: Context, ids: List<String>): Int = withContext(Dispatchers.IO) {
        if (ids.isEmpty()) return@withContext 0
        radhaM.withLock {
            if (!dergoRadhenPaKyc(ctx)) { shtoNeRadhe(ctx, ids, false); return@withLock -1 }
            val (st, j) = try { thirr("POST", "/ora/hiq", JSONObject().put("ids", JSONArray(ids)).put("i", ""), sekreti(ctx)) }
                catch (e: java.io.IOException) { shtoNeRadhe(ctx, ids, false); return@withLock -1 }
            if (st == 401) throw PaLidhje()
            if (st == 200 && j.optBoolean("ok", true)) return@withLock 0
            if (st != 400) throw Exception("serveri-$st")
            var deshtoi = 0
            ids.forEachIndexed { i, id ->
                if (i > 0) delay(1100)
                val r = try { thirr("POST", "/ora/hiq", JSONObject().put("i", id).put("zhbej", false), sekreti(ctx)).first }
                    catch (e: java.io.IOException) { shtoNeRadhe(ctx, ids.drop(i), false); return@withLock -1 }
                if (r == 401) throw PaLidhje()
                if (r != 200) deshtoi++
            }
            deshtoi
        }
    }

    // Kolegët e ekipës (për kërkesat "hiqe nga rafti")
    suspend fun koleget(ctx: Context): List<Koleg> = withContext(Dispatchers.IO) {
        val (st, j) = thirr("GET", "/ora/koleget", null, sekreti(ctx))
        if (st == 401) throw PaLidhje()
        if (st == 403) throw DuhetRilidhur()
        if (st != 200) throw Exception("serveri-$st")
        val a = j.optJSONArray("koleget") ?: JSONArray()
        (0 until a.length()).map { val o = a.getJSONObject(it); Koleg(o.optString("uid"), o.optString("emri")) }
    }

    // Kërkesë për heqje nga rafti te një koleg (ose te krejt ekipa kur koleg == null); kthen sa marrës
    suspend fun kerkoHeqjen(ctx: Context, a: Afat, koleg: Koleg?): Int = withContext(Dispatchers.IO) {
        val p = JSONArray().put(JSONObject().put("produkti", a.emri).put("barkodi", a.barkodi))
        val t = JSONObject().put("produktet", p)
        if (koleg != null) t.put("perUid", koleg.uid).put("perEmri", koleg.emri)
        val (st, j) = thirr("POST", "/ora/kerkese", t, sekreti(ctx))
        if (st == 401) throw PaLidhje()
        if (st == 403) throw DuhetRilidhur()
        if (st != 200) throw Exception(j.optString("arsye", "serveri-$st"))
        j.optInt("n")
    }

    private fun afatet(a: JSONArray?): List<Afat> {
        if (a == null) return emptyList()
        return (0 until a.length()).map { i ->
            val o = a.getJSONObject(i)
            Afat(
                id = o.optString("i"),
                emri = o.optString("e").ifBlank { o.optString("b").ifBlank { "Produkt" } },
                barkodi = o.optString("b"),
                data = o.optString("d"),
                sasia = if (o.has("s")) o.optInt("s") else null,
                furnizuesi = o.optString("f"),
                marketi = o.optString("mk"),
            )
        }
    }

    private fun lexo(j: JSONObject) = Lista(
        dita = j.optString("dita"),
        sot = afatet(j.optJSONArray("sot")),
        java = afatet(j.optJSONArray("java")),
        javaN = j.optInt("javaN"),
        skaduara = j.optInt("skaduara"),
        skaduaraL = afatet(j.optJSONArray("skaduaraL")),
        ekipa = j.optBoolean("ekipa"),
        emri = j.optString("emri"),
    )

    fun rifreskoTileDheKomplikacionin(ctx: Context, ndryshoi: Boolean = false) {
        if (ndryshoi) listaNdryshoi = true
        try { TileService.getUpdater(ctx).requestUpdate(StokuTile::class.java) } catch (e: Exception) { }
        try {
            ComplicationDataSourceUpdateRequester.create(ctx, ComponentName(ctx, StokuKomplikacion::class.java)).requestUpdateAll()
        } catch (e: Exception) { }
    }
}
