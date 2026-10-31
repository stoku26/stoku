package site.stoku.vendas

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.FirebaseFirestoreException
import com.google.firebase.messaging.FirebaseMessaging
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.MainScope
import kotlinx.coroutines.plus
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeoutOrNull
import site.stoku.logjika.Json
import site.stoku.logjika.Marketet
import site.stoku.logjika.Obj
import site.stoku.logjika.eVertete
import site.stoku.logjika.jsString
import site.stoku.logjika.siListe
import site.stoku.logjika.siObj
import java.net.HttpURLConnection
import java.net.URL
import java.util.TimeZone

/*
 * Njoftimet push me Firebase Cloud Messaging (si ekipa.js në aplikacionin e vjetër Android):
 *  - Grupi: kjo pajisje regjistrohet te grupet/{g}/push/{uid_hash} = { uid, emri, platforma, koha, endpoint: "fcm:…", fcm }
 *    (Worker-i ua dërgon kërkesat dhe njoftimet e grupit vetëm këtyre). Pa lejen "Grupi" s'regjistrohet.
 *  - Njoftimi ditor: POST /orari { aktiv, ora, tz, platforma, pajisja } te stoku-push (Cron-i e dërgon në orën e zgjedhur);
 *    kopja e afateve { afatet: [{ i, e, b, d, s, f, mk }] } i dërgohet serverit kur ndryshon (ose një herë në ditë).
 *  - Ora e dorës: /ora/lidh me kodin 6-shifror, /ora/hequrat (heqjet e bëra në orë zbatohen këtu).
 */
object Push {
    const val URL_PUSH = "https://stoku-push.mendurb.workers.dev"
    const val VERSIONI_WORKER = 163
    private val scope = MainScope() + StokuApp.trajtuesi(false)
    private val _tokeni = MutableStateFlow(StokuApp.prefsOse("fcm", ""))
    val tokeni: StateFlow<String> get() = _tokeni
    /** Ndryshon kur ndryshon gjendja e regjistrimit/orarit (që Cilësimet të rifreskohen) */
    val versioni = MutableStateFlow(0)

    fun tokeniIRi(t: String) {
        if (t.isBlank() || t == _tokeni.value) return
        StokuApp.vendosPref("fcm", t)
        _tokeni.value = t
        scope.launch { try { aktivizo(true); rinovoOrarinPerTokenin() } catch (e: Exception) { } }
    }

    private var nisur = false
    fun nis() {
        if (nisur) return
        nisur = true
        scope.launch { try { FirebaseMessaging.getInstance().token.await()?.let { tokeniIRi(it) } } catch (e: Exception) { } }
        // Hyrja/dalja, grupi dhe lejet: pajisja regjistrohet ose hiqet nga grupi
        scope.launch {
            combine(Llogaria.perdoruesi, Grupi.gjendja, Llogaria.lejet) { p, g, _ -> Triple(p?.uid, if (g.qasja == "anetar") g.grupi else null, Llogaria.leja("grupi")) }
                .distinctUntilChanged().collect { (u, _, lejaGrupi) ->
                    if (u == null) return@collect
                    try { if (lejaGrupi) aktivizo(false) else hiqNgaGrupi() } catch (e: Exception) { }
                    try { pastroOrarinEJetim() } catch (e: Exception) { }
                }
        }
        // Afatet → kopja për njoftimin ditor dhe orën (me pak vonesë, që ndryshimet e njëpasnjëshme të shkojnë bashkë)
        scope.launch {
            var pune: Job? = null
            combine(Dyqani.gjendja, Llogaria.perdoruesi, Llogaria.lejet) { g, p, _ -> Triple(g.afatet, g.marketet, p?.uid) }
                .distinctUntilChanged().collect { (_, _, u) ->
                    if (u == null) return@collect
                    pune?.cancel()
                    pune = scope.launch { delay(5000); try { dergoAfatet() } catch (e: Exception) { } }
                }
        }
    }

    private fun uid(): String? = try { FirebaseAuth.getInstance().currentUser?.uid } catch (e: Exception) { null }
    private fun emri(): String = Llogaria.perdoruesi.value?.emri.orEmpty()

    /** hashTekst i ekipa.js (djb2 me xor), në bazën 36 */
    fun hashTekst(t: String): String {
        var h = 5381L
        for (c in t) h = ((h * 33) xor c.code.toLong()) and 0xFFFFFFFFL
        return h.toString(36)
    }

    private fun pajisja(): Map<String, String>? = _tokeni.value.takeIf { it.isNotBlank() }?.let { mapOf("endpoint" to "fcm:$it", "fcm" to it) }

    // ---------------- Kërkesat te Worker-i ----------------
    class Pergjigja(val ok: Boolean, val te: Obj, val arsye: String)

    private suspend fun kerkese(rruga: String, trup: Any?, meToken: Boolean = true): Pergjigja = withContext(Dispatchers.IO) {
        try {
            val token = if (meToken) (withTimeoutOrNull(15000) { FirebaseAuth.getInstance().currentUser?.getIdToken(false)?.await()?.token }
                ?: return@withContext Pergjigja(false, emptyMap(), "pa-hyrje")) else null
            val c = URL(URL_PUSH + rruga).openConnection() as HttpURLConnection
            c.connectTimeout = 15000; c.readTimeout = 20000
            if (trup != null) {
                c.requestMethod = "POST"; c.doOutput = true
                c.setRequestProperty("Content-Type", "application/json")
            }
            if (token != null) c.setRequestProperty("Authorization", "Bearer $token")
            if (trup != null) c.outputStream.use { it.write(Json.shkruaj(trup).toByteArray(Charsets.UTF_8)) }
            val kodi = c.responseCode
            val tekst = (if (kodi in 200..299) c.inputStream else c.errorStream)?.use { it.readBytes().toString(Charsets.UTF_8) } ?: ""
            val j = try { Json.lexo(tekst).siObj() ?: emptyMap() } catch (e: Exception) { emptyMap() }
            val ok = kodi in 200..299 && j["ok"] == true
            if (ok) StokuApp.vendosPref("push_server", System.currentTimeMillis().toString())
            Pergjigja(ok, j, (j["arsye"] as? String) ?: if (ok) "" else "http-$kodi")
        } catch (e: Exception) { Pergjigja(false, emptyMap(), "rrjeti") }
    }

    /** Gjendja e serverit (GET /): { ok, versioni, celesat, fcm, fotot, cron, cronShprehja, cronGabim } */
    suspend fun serveri(): Obj? = kerkese("/", null, meToken = false).te.takeIf { it.isNotEmpty() }

    // ---------------- Grupi ----------------
    private fun lexoPref(k: String): Obj? = try { Json.lexo(StokuApp.prefsOse(k, "")).siObj() } catch (e: Exception) { null }
    private fun shkruajPref(k: String, v: Obj?) = StokuApp.vendosPref(k, if (v == null) "" else Json.shkruaj(v))

    /** Regjistron këtë pajisje te grupi (shkruan vetëm kur ndryshon diçka ose çdo 7 ditë).
     *  → "ok", "pa-grup" (s'je në asnjë grup: s'ka çka të regjistrohet) ose arsyeja ("rrjeti", "rregullat", "pa-token"…) */
    suspend fun aktivizo(detyro: Boolean): String {
        val u = uid() ?: return "pa-hyrje"
        if (!Njoftimet.lejuar(StokuApp.app)) return "pa-leje"
        val j = pajisja() ?: return "pa-token"
        val g = Grupi.grupi()
        val id = u + "_" + hashTekst(j["endpoint"]!!)
        val r = lexoPref("push_regjistrim")
        if (g != null && Llogaria.leja("grupi") && (detyro || r == null || r["id"] != id || r["grupi"] != g ||
                System.currentTimeMillis() - ((r["koha"] as? Number)?.toLong() ?: 0L) > 7 * 86400000L)) {
            val db = FirebaseFirestore.getInstance()
            if (r != null && r["uid"] == u && r["grupi"] is String && (r["id"] != id || r["grupi"] != g)) {
                try { withTimeoutOrNull(8000) { db.collection("grupet").document(r["grupi"] as String).collection("push").document(r["id"] as String).delete().await() } } catch (e: Exception) { }
            }
            try {
                withTimeoutOrNull(15000) {
                    db.collection("grupet").document(g).collection("push").document(id)
                        .set(mapOf("uid" to u, "emri" to emri(), "platforma" to "tel", "koha" to System.currentTimeMillis()) + j).await()
                } ?: return "rrjeti"
            } catch (e: FirebaseFirestoreException) {
                // rregullat e Firestore-it s'e lejuan (p.sh. s'je më anëtar i këtij grupi): jo "kontrollo internetin"
                return if (e.code == FirebaseFirestoreException.Code.PERMISSION_DENIED) "rregullat" else "rrjeti"
            } catch (e: Exception) { return "rrjeti" }
            shkruajPref("push_regjistrim", mapOf("uid" to u, "id" to id, "endpoint" to j["endpoint"], "grupi" to g, "koha" to System.currentTimeMillis()))
        }
        // Si te web-i (aktivizoPush → kontrolloServerin): serveri i njoftimeve pyetet, që gjendja të mos mbetet "Aktive kur Stoku
        // është hapur" vetëm pse serveri s'është pyetur në 7 ditët e fundit (pushAktiv e kërkon)
        if (detyro && g != null && Llogaria.leja("grupi")) serveri()
        versioni.value++
        return if (g == null) "pa-grup" else "ok"
    }

    /** Pa lejen "Grupi" ose pas daljes: pajisja s'merr më kërkesat dhe njoftimet e grupit */
    suspend fun hiqNgaGrupi() {
        val r = lexoPref("push_regjistrim") ?: return
        val g = r["grupi"] as? String; val id = r["id"] as? String
        if (g != null && id != null) try { withTimeoutOrNull(5000) { FirebaseFirestore.getInstance().collection("grupet").document(g).collection("push").document(id).delete().await() } } catch (e: Exception) { }
        shkruajPref("push_regjistrim", null)
        versioni.value++
    }

    /** Push-i i grupit punon (pajisja e regjistruar te ky grup, serveri u përgjigj në 7 ditët e fundit) */
    fun pushAktiv(): Boolean {
        val r = lexoPref("push_regjistrim") ?: return false
        val s = StokuApp.prefsOse("push_server", "").toLongOrNull() ?: 0L
        return r["uid"] == uid() && Grupi.grupi() != null && r["grupi"] == Grupi.grupi() && System.currentTimeMillis() - s < 7 * 86400000L &&
            Njoftimet.lejuar(StokuApp.app)
    }

    // ---------------- Njoftimi ditor ----------------
    /** Orari i kësaj pajisjeje: { uid, aktiv, ora, endpoint, koha } ose null */
    fun orariIm(): Obj? = lexoPref("orari")?.takeIf { it["uid"] == uid() }
    fun oraEZgjedhur(): String = (orariIm()?.get("ora") as? String ?: StokuApp.prefsOse("orari_ora", "")).takeIf { Regex("^\\d\\d:\\d\\d$").matches(it) } ?: "08:00"

    suspend fun vendosOrarin(aktiv: Boolean, ora: String): String {
        if (uid() == null) return "pa-hyrje"
        StokuApp.vendosPref("orari_ora", ora)
        var j = pajisja()
        if (aktiv && j == null) {
            val t = try { withTimeoutOrNull(15000) { FirebaseMessaging.getInstance().token.await() } } catch (e: Exception) { null }
            if (t != null) { StokuApp.vendosPref("fcm", t); _tokeni.value = t }
            j = pajisja() ?: return "pa-push"
        }
        if (aktiv && !Njoftimet.lejuar(StokuApp.app)) return "pa-leje"
        val ishte = orariIm()
        if (j == null) { shkruajPref("orari", null); versioni.value++; return if (aktiv) "pa-push" else "ok" }
        val r = kerkese("/orari", mapOf("aktiv" to aktiv, "ora" to ora, "tz" to (TimeZone.getDefault().id ?: "Europe/Belgrade"), "platforma" to "tel", "pajisja" to j))
        if (!r.ok) return r.arsye.ifEmpty { "gabim" }
        shkruajPref("orari", if (aktiv) mapOf("uid" to uid(), "aktiv" to true, "ora" to ora, "endpoint" to j["endpoint"], "koha" to System.currentTimeMillis()) else null)
        if (aktiv && ishte?.get("aktiv") != true) shkruajPref("orari_afatet", null) // afatet dërgohen sërish menjëherë
        if (aktiv) dergoAfatet(true)
        versioni.value++
        return "ok"
    }

    /** Tokeni i ri (p.sh. pas riinstalimit): orari ditor rinovohet me të riun */
    private suspend fun rinovoOrarinPerTokenin() {
        val o = orariIm() ?: return
        val j = pajisja() ?: return
        if (o["aktiv"] == true && o["endpoint"] != j["endpoint"]) vendosOrarin(true, o["ora"] as? String ?: "08:00")
    }

    /** Afatet për serverin (si afatetPerServerin + dergoAfatetPerOrarin te web-i) */
    suspend fun dergoAfatet(detyro: Boolean = false): Pergjigja? {
        val u = uid() ?: return null
        val o = orariIm()
        val vetemMeOrar = o?.get("aktiv") != true
        val afatet = if (Llogaria.leja("afatet")) Marketet.meEmra(Dyqani.g.afatet, Merchandiseri.marketet()) else emptyList()
        val l = afatet.filter { a -> a["statusi"] != "hequr" && Regex("^\\d{4}-\\d{2}-\\d{2}$").matches((a["data"] as? String).orEmpty()) }.map { a ->
            val x = linkedMapOf<String, Any?>("i" to jsString(a["id"] ?: "").take(60), "e" to (if (eVertete(a["emri"])) jsString(a["emri"]) else "").take(120),
                "b" to (if (eVertete(a["barkodi"])) jsString(a["barkodi"]) else "").take(40), "d" to a["data"])
            if (a["sasia"] is Number) x["s"] = a["sasia"]
            if (eVertete(a["furnizuesi"])) x["f"] = jsString(a["furnizuesi"]).take(80)
            if (eVertete(a["mk"])) x["mk"] = jsString(a["mk"]).take(60)
            x
        }
        val h = hashTekst(Json.shkruaj(l))
        val r0 = lexoPref("orari_afatet")?.takeIf { it["uid"] == u }
        val tani = System.currentTimeMillis()
        val koha = (r0?.get("koha") as? Number)?.toLong() ?: 0L
        if (!detyro && vetemMeOrar && r0?.get("paOrar") == true && tani - koha < 600000) return null
        if (!detyro && r0?.get("h") == h && tani - koha < 86400000L) return null
        val r = kerkese("/orari", if (vetemMeOrar) mapOf("afatet" to l, "vetemMeOrar" to true) else mapOf("afatet" to l))
        if (r.ok && r.te["paOrar"] == true) shkruajPref("orari_afatet", mapOf("uid" to u, "paOrar" to true, "koha" to tani))
        else if (r.ok) shkruajPref("orari_afatet", mapOf("uid" to u, "h" to h, "koha" to tani))
        return r
    }

    /** Për Cilësimet → Njoftimet: serveri dhe gjendja e orarit të kësaj pajisjeje */
    class Statusi(val serveri: Obj?, val im: Obj?)
    suspend fun statusi(): Statusi {
        val sv = serveri()
        val o = orariIm()
        val j = pajisja()
        if (sv == null || o?.get("aktiv") != true || j == null) return Statusi(sv, null)
        val r = kerkese("/orari", mapOf("statusi" to true, "pajisja" to j))
        return Statusi(sv, r.te.takeIf { it.isNotEmpty() })
    }

    /** Serveri e fshin orarin kur Google e refuzon tokenin: nëse telefoni e ka ende të ndezur, regjistrohet sërish */
    suspend fun rinovoNesesMungon(st: Statusi): Boolean {
        val o = orariIm() ?: return false
        if (o["aktiv"] != true || st.im?.get("ok") != true || st.im["ekziston"] == true) return false
        shkruajPref("orari_afatet", null)
        return vendosOrarin(true, o["ora"] as? String ?: "08:00") == "ok"
    }

    /** Në dalje nga llogaria: kjo pajisje s'merr më njoftimet e kësaj llogarie */
    suspend fun caktivizo() {
        val o = orariIm()
        if (o?.get("aktiv") == true) {
            val r = withTimeoutOrNull(8000) { vendosOrarin(false, o["ora"] as? String ?: "08:00") }
            if (r != "ok") StokuApp.vendosPref("orari_pastro", System.currentTimeMillis().toString())
        }
        shkruajPref("orari", null); shkruajPref("orari_afatet", null)
        withTimeoutOrNull(5000) { hiqNgaGrupi() }
    }

    /** Pas një daljeje pa internet: orari i llogarisë së mëparshme për këtë pajisje hiqet nga serveri */
    private suspend fun pastroOrarinEJetim() {
        if (StokuApp.prefsOse("orari_pastro", "").isEmpty() || uid() == null) return
        val j = pajisja() ?: run { StokuApp.vendosPref("orari_pastro", ""); return }
        if (orariIm()?.get("aktiv") == true) { StokuApp.vendosPref("orari_pastro", ""); return }
        val r = kerkese("/orari", mapOf("aktiv" to false, "ora" to "08:00", "tz" to TimeZone.getDefault().id, "platforma" to "tel", "pajisja" to j))
        if (r.ok) StokuApp.vendosPref("orari_pastro", "")
    }

    // ---------------- Ora e dorës ----------------
    suspend fun lidhOren(kodi: String): String {
        if (uid() == null) return "pa-hyrje"
        // rt: që ora të mund t'i dërgojë kërkesa grupit në emrin tënd (merret në hyrje, shih Llogaria.tokeniPerOren)
        val r = kerkese("/ora/lidh", mapOf("kodi" to kodi.filter { it.isDigit() }, "emri" to emri(), "rt" to StokuApp.prefsOse("ora_rt", "")))
        if (r.ok) { shkruajPref("orari_afatet", null); try { dergoAfatet(true) } catch (e: Exception) { } }
        return if (r.ok) "ok" else r.arsye.ifEmpty { "gabim" }
    }

    private var heqjetKoha = 0L
    /** Heqjet nga rafti të bëra në orë: zbatohen këtu (si çdo heqje tjetër) dhe pastrohen te serveri */
    suspend fun zbatoHeqjetNgaOra(detyro: Boolean): Int {
        if (uid() == null || !Llogaria.leja("ora")) return 0
        if (!detyro && System.currentTimeMillis() - heqjetKoha < 120000) return 0
        heqjetKoha = System.currentTimeMillis()
        val r = kerkese("/ora/hequrat", emptyMap<String, Any?>())
        if (!r.ok) return 0
        val kryer = ArrayList<String>()
        var n = 0
        r.te["hequrat"].siListe().forEach { h0 ->
            val h = h0.siObj() ?: return@forEach
            val id = h["i"] as? String ?: return@forEach
            val a = Dyqani.g.afatet.firstOrNull { it["id"] == id } ?: return@forEach // ende pa u sinkronizuar këtu
            kryer.add(id)
            if (a["statusi"] == "hequr") return@forEach
            Dyqani.perditesoAfatin(id, mapOf("statusi" to "hequr", "hequrSe" to ((h["koha"] as? Number)?.toLong() ?: System.currentTimeMillis()), "hequrNga" to emri()))
            Grupi.ngjarjeAfati("hequr", a)
            n++
        }
        if (kryer.isNotEmpty()) kerkese("/ora/hequrat", mapOf("pastro" to kryer))
        return n
    }
}
