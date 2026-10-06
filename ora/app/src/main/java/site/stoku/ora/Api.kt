package site.stoku.ora

import android.content.ComponentName
import android.content.Context
import androidx.wear.tiles.TileService
import androidx.wear.watchface.complications.datasource.ComplicationDataSourceUpdateRequester
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.security.SecureRandom
import java.util.TimeZone

data class Afat(val id: String, val emri: String, val barkodi: String, val data: String, val sasia: Int?)

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
// lidhet me llogarinë kur përdoruesi e shkruan kodin 6-shifror te telefoni (Cilësimet → Njoftimet → Lidh orën).
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

    private fun thirr(metoda: String, rruga: String, trup: JSONObject?, sekret: String?): Pair<Int, JSONObject> {
        val c = URL(SERVERI + rruga).openConnection() as HttpURLConnection
        try {
            c.requestMethod = metoda
            c.connectTimeout = 10000
            c.readTimeout = 15000
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

    suspend fun merrListen(ctx: Context): Lista = withContext(Dispatchers.IO) {
        val tz = URLEncoder.encode(TimeZone.getDefault().id, "UTF-8")
        val (st, j) = thirr("GET", "/ora/sot?tz=$tz", null, sekreti(ctx))
        if (st == 401) {
            prefs(ctx).edit().putBoolean("lidhur", false).remove("lista").apply()
            throw PaLidhje()
        }
        if (st != 200 || !j.optBoolean("ok")) throw Exception("serveri-$st")
        prefs(ctx).edit().putString("lista", j.toString()).putLong("listaKoha", System.currentTimeMillis()).apply()
        lexo(j)
    }

    // Lista e fundit e ruajtur (për tile-in dhe komplikacionin kur s'ka internet)
    fun listaERuajtur(ctx: Context): Lista? = try {
        prefs(ctx).getString("lista", null)?.let { lexo(JSONObject(it)) }
    } catch (e: Exception) { null }

    suspend fun merrMeCache(ctx: Context): Lista? = try {
        if (lidhur(ctx)) merrListen(ctx) else null
    } catch (e: Exception) {
        if (lidhur(ctx)) listaERuajtur(ctx) else null
    }

    suspend fun hiq(ctx: Context, id: String, zhbej: Boolean = false): Boolean = withContext(Dispatchers.IO) {
        val (st, _) = thirr("POST", "/ora/hiq", JSONObject().put("i", id).put("zhbej", zhbej), sekreti(ctx))
        if (st == 401) throw PaLidhje()
        st == 200
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

    fun rifreskoTileDheKomplikacionin(ctx: Context) {
        try { TileService.getUpdater(ctx).requestUpdate(StokuTile::class.java) } catch (e: Exception) { }
        try {
            ComplicationDataSourceUpdateRequester.create(ctx, ComponentName(ctx, StokuKomplikacion::class.java)).requestUpdateAll()
        } catch (e: Exception) { }
    }
}
