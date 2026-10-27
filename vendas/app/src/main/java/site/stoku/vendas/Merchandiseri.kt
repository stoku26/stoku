package site.stoku.vendas

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationManager
import android.os.Build
import androidx.core.content.ContextCompat
import androidx.core.location.LocationManagerCompat
import androidx.core.os.CancellationSignal
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions
import kotlinx.coroutines.MainScope
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withTimeoutOrNull
import site.stoku.logjika.Json
import site.stoku.logjika.Marketet
import site.stoku.logjika.Obj
import site.stoku.logjika.me
import site.stoku.logjika.numerOse0
import site.stoku.logjika.obj
import site.stoku.logjika.siObj
import site.stoku.vendas.ui.Toast
import java.io.File
import kotlin.math.roundToLong

/**
 * Marketet e merchandiserit (si v241–v253 te app-tel.js): pikat e përbashkëta të Stoku-t (pikat/{id}), lista e marketeve të
 * dyqanit (sinkronizohet si folderat) = pikat, marketi aktiv i këtij telefoni ("Je te: …") me GPS ose me dorë, "Ku je?",
 * marketi i ri vetëm brenda tij (vendndodhje e saktë, asnjë market tjetër aty). Logjika = marketet.js (`Marketet.kt`).
 * Vendndodhja s'ruhet dhe s'dërgohet askund: krahasohet vetëm në telefon me pikat e marketeve.
 */
object Merchandiseri {
    private val scope = MainScope()

    // ---------------- Pikat e Stoku-t ----------------
    private val _pikat = MutableStateFlow<List<Obj>>(emptyList())
    val pikat: StateFlow<List<Obj>> get() = _pikat
    private var pikatGati = false
    private var pikatOk = false
    private var pikatServeri = false
    private var ndalPikat: (() -> Unit)? = null
    private var pikatUid: String? = null
    private val lidhjeNeRruge = HashSet<String>()

    // ---------------- Marketi aktiv i këtij telefoni ----------------
    private val _aktivi = MutableStateFlow(Marketet.Aktivi(null))
    val aktivi: StateFlow<Marketet.Aktivi> get() = _aktivi

    // Vendndodhja e fundit, vetëm në memorie (15 min): "Ku je?" tregon pikat afër edhe kur GPS-i e ka gjetur marketin
    private var poz: Marketet.Pozita? = null
    private var pozKoha = 0L
    fun pozEFundit(): Marketet.Pozita? = if (System.currentTimeMillis() - pozKoha < 15 * 60 * 1000L) poz else null

    /** Dritaret që i hap logjika: "Ku je?" (qellimi "zgjidh" ose "te-reja") ose "Market i ri" */
    sealed class Dritarja {
        class KuJe(val qellimi: String, val poz: Marketet.Pozita?, val panjohur: Boolean, val paqarte: Boolean = false, val kurZgjedh: ((String?) -> Unit)? = null) : Dritarja()
        object MarketIRi : Dritarja()
    }
    val dritarja = MutableStateFlow<Dritarja?>(null)
    /** "Marketet" te "Ku je?": hap Cilësimet → Marketet */
    val hapFaqen = MutableStateFlow(false)
    /** Ekrani duhet ta kërkojë lejen e vendndodhjes (pastaj thirret pasLejes) */
    val kerkoLejen = MutableStateFlow(false)

    private var gpsDukePunuar = false
    private var gabimiTreguar = false
    private var lejaEPyetur = false
    private var meDorePasLejes = false
    private var nisur = false

    fun nis(ctx: Context) {
        if (nisur) return
        nisur = true
        _aktivi.value = lexoAktivin()
        scope.launch {
            combine(Llogaria.perdoruesi, Llogaria.lejet, Llogaria.merchandiserIRegjistrimit) { p, _, _ -> Triple(p?.uid, Llogaria.eshteMerchandiser(), Llogaria.eshteAdmin()) }
                .distinctUntilChanged().collect { (_, merch, _) ->
                    nisPikat()
                    if (merch) { delay(300); kontrolloGps(false) }
                }
        }
        // Marketet nga cloud-i (një pajisje tjetër): edhe ato sipas pikave
        scope.launch { Dyqani.gjendja.map { it.marketet }.distinctUntilChanged().collect { if (pikatOk) pasPikave() } }
    }

    /** Vetëm për testet e pamjeve */
    fun vendosPerProve(pikat: List<Obj>, aktivi: String?) {
        _pikat.value = Marketet.pastroPikat(pikat); pikatGati = true; pikatOk = true
        _aktivi.value = Marketet.Aktivi(aktivi, "dore", System.currentTimeMillis(), System.currentTimeMillis())
    }

    // ---------------- Pyetjet e ekranit ----------------
    fun marketet(): List<Obj> = Marketet.pastro(Dyqani.g.marketet)
    fun kaMarkete(): Boolean = Dyqani.g.marketet.isNotEmpty() && Llogaria.eshteMerchandiser()
    /** Merchandiseri pa asnjë market: çipi "Shto marketin ku punon" */
    fun paMarkete(): Boolean = Dyqani.g.marketet.isEmpty() && Llogaria.eshteMerchandiser()
    fun idAktiv(): String? { val id = _aktivi.value.id; return if (kaMarkete() && id != null && Marketet.sipasId(marketet(), id) != null) id else null }
    fun afatetEMarketit(afatet: List<Obj>): List<Obj> = Marketet.filtro(afatet, idAktiv())
    fun emri(id: Any?): String = Marketet.emri(marketet(), id)
    fun afateAktive(id: String?): Int = Dyqani.g.afatet.count { (id == null || it["m"] == id) && it["statusi"] != "hequr" }

    // ---------------- Marketi aktiv ----------------
    private fun lexoAktivin(): Marketet.Aktivi {
        val x = Json.lexoOse(StokuApp.prefsOse("marketi_aktiv", "")).siObj() ?: return Marketet.Aktivi(null)
        val id = x["id"] as? String
        return Marketet.Aktivi(id, if (x["menyra"] == "dore") "dore" else "gps", numerOse0(x["koha"]).toLong(), numerOse0(x["kontrolluarSe"]).toLong())
    }
    private fun ruajAktivin(a: Marketet.Aktivi) {
        _aktivi.value = a
        try { StokuApp.vendosPref("marketi_aktiv", Json.shkruaj(mapOf("id" to a.id, "menyra" to a.menyra, "koha" to a.koha, "kontrolluarSe" to a.kontrolluarSe))) } catch (e: Exception) { }
    }
    fun vendosAktivin(id: String?, menyra: String = "dore") {
        ruajAktivin(Marketet.Aktivi(id, menyra, System.currentTimeMillis(), _aktivi.value.kontrolluarSe))
    }

    // ---------------- Pikat (pikat/{id}) ----------------
    private fun nisPikat() {
        val u = Llogaria.perdoruesi.value
        val duhen = u != null && (Llogaria.eshteMerchandiser() || Llogaria.eshteAdmin()) // v256: edhe administratori (harta te Marketet)
        if (ndalPikat != null && (!duhen || pikatUid != u?.uid)) {
            ndalPikat?.invoke(); ndalPikat = null; _pikat.value = emptyList(); pikatGati = false; pikatOk = false
        }
        if (!duhen || ndalPikat != null || u == null) return
        pikatUid = u.uid
        val ref = FirebaseFirestore.getInstance().collection("pikat")
        val kopja = KoleksioniMeKopje(File(StokuApp.app.filesDir, "kopja-pikat.json"))
        ndalPikat = kopja.degjo(ref, ref.limit(3000), { l, serveri ->
            _pikat.value = Marketet.pastroPikat(l); pikatGati = true; pikatOk = true; pikatServeri = serveri; pasPikave()
        }, { pikatGati = true; pikatOk = false }) // pa leje te rregullat: marketet punojnë si më parë
    }

    /** Lista e merchandiserit = pikat e Stoku-t (v250): të rejat shtohen, emrat dhe vendet nga pikat, të fshirat hiqen */
    private fun pasPikave() {
        if (!Llogaria.eshteMerchandiser() || !pikatOk) return
        val r = Marketet.sinkronizoMePikat(marketet(), _pikat.value, Dyqani.g.afatet, pikatServeri)
        if (r.ndryshuar) {
            Dyqani.vendosMarketet(r.marketet, hequr = r.hequr)
            if (_aktivi.value.id != null && _aktivi.value.id in r.hequr) ruajAktivin(Marketet.Aktivi(null, "gps", System.currentTimeMillis(), 0))
        }
        marketet().forEach { m -> if (Marketet.kaVend(m) && m["p"] == null) lidhMePike(m["id"] as String) }
    }

    /** Marketi im me vendndodhje, pa pikë → pika e përbashkët (ajo në të njëjtin vend, ose e re) */
    private fun lidhMePike(id: String) {
        val m = Marketet.sipasId(marketet(), id) ?: return
        if (m["p"] != null || !Marketet.kaVend(m) || !pikatGati || id in lidhjeNeRruge) return
        lidhjeNeRruge.add(id)
        scope.launch {
            val pid = (Marketet.pikaPerMarketin(_pikat.value, m)?.get("id") as? String) ?: shtoPiken(m)
            lidhjeNeRruge.remove(id)
            if (pid == null) return@launch
            Dyqani.vendosMarketet(marketet().map { x -> if (x["id"] == id) x.me("p" to pid, "ndryshuarSe" to System.currentTimeMillis()) else x })
        }
    }

    private suspend fun shtoPiken(m: Obj): String? {
        val u = FirebaseAuth.getInstance().currentUser ?: return null
        val id = "p" + idERe().take(20)
        val tani = System.currentTimeMillis()
        return try {
            FirebaseFirestore.getInstance().collection("pikat").document(id).set(mapOf(
                "emri" to ((m["emri"] as? String)?.trim()?.take(60)?.ifEmpty { null } ?: "Market"), "lat" to m["lat"], "lng" to m["lng"],
                "krijuarNga" to u.uid, "krijuarNgaEmri" to (Llogaria.perdoruesi.value?.emri ?: ""), "krijuarSe" to tani, "ndryshuarSe" to tani
            )).await()
            id
        } catch (e: Exception) { null }
    }

    // ---------------- v256: administratori te Marketet (harta): pikat e Stoku-t (si ekipa.js shtoPiken/ndryshoPiken/fshiPiken) ----------------
    /** Administratori vendos një market të ri në hartë; kthen id-në ose null */
    suspend fun shtoPikenNgaAdmini(emri: String, lat: Double, lng: Double): String? {
        if (!Llogaria.eshteAdmin()) return null
        return shtoPiken(mapOf("emri" to emri, "lat" to Math.round(lat * 1e6) / 1e6, "lng" to Math.round(lng * 1e6) / 1e6))
    }
    /** Emri i pikës për krejt Stoku-n (emriNgaAdmini: merchandiseri s'e ndërron më) */
    suspend fun ndryshoEmrinEPikes(id: String, emri: String): Boolean {
        if (FirebaseAuth.getInstance().currentUser == null || !Llogaria.eshteAdmin()) return false
        return try {
            FirebaseFirestore.getInstance().collection("pikat").document(id).set(mapOf("emri" to (emri.trim().take(60).ifEmpty { "Market" }),
                "ndryshuarSe" to System.currentTimeMillis(), "emriNgaAdmini" to true), SetOptions.merge()).await()
            true
        } catch (e: Exception) { false }
    }
    /** Pika e dyfishtë ose e gabuar fshihet (marketet e merchandiserëve me afate mbeten te ata) */
    suspend fun fshiPiken(id: String): Boolean {
        if (FirebaseAuth.getInstance().currentUser == null || !Llogaria.eshteAdmin()) return false
        return try { FirebaseFirestore.getInstance().collection("pikat").document(id).delete().await(); true } catch (e: Exception) { false }
    }

    private fun idERe(): String {
        val a = "0123456789abcdefghijklmnopqrstuvwxyz"
        return System.currentTimeMillis().toString(36) + (1..12).map { a.random() }.joinToString("")
    }

    /** Market i ri (te lista ime) nga një pikë; marketi i parë merr edhe afatet pa market */
    fun shtoNgaPika(pika: Obj): Obj {
        Marketet.sipasPikes(marketet(), pika["id"])?.let { return it }
        val tani = System.currentTimeMillis()
        val te = marketet()
        val m = Marketet.ngaPika(pika, tani)
        if (te.isEmpty()) {
            val (af, n) = Marketet.vendosPaMarket(Dyqani.g.afatet, listOf(m), m["id"] as String, tani)
            Dyqani.vendosMarketet(te + m, afatet = if (n > 0) af else null)
        } else Dyqani.vendosMarketet(te + m)
        return m
    }

    private suspend fun pritPikat() {
        val t0 = System.currentTimeMillis()
        while (!pikatGati && ndalPikat != null && System.currentTimeMillis() - t0 < 4000) delay(150)
    }

    // ---------------- Vendndodhja ----------------
    fun kaLeje(ctx: Context = StokuApp.app): Boolean =
        ContextCompat.checkSelfPermission(ctx, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED ||
            ContextCompat.checkSelfPermission(ctx, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED

    /** Vendndodhja e tanishme (e freskët; më e sakta brenda 15 s) → (gabimi, pozita); gabimi: leje | pa-gps | kohe | gabim */
    @SuppressLint("MissingPermission")
    suspend fun pozita(): Pair<String?, Marketet.Pozita?> {
        val ctx = StokuApp.app
        if (!kaLeje(ctx)) return "leje" to null
        val lm = ctx.getSystemService(Context.LOCATION_SERVICE) as? LocationManager ?: return "pa-gps" to null
        val ofruesit = ArrayList<String>()
        try {
            if (Build.VERSION.SDK_INT >= 31 && lm.allProviders.contains(LocationManager.FUSED_PROVIDER) && lm.isProviderEnabled(LocationManager.FUSED_PROVIDER)) ofruesit.add(LocationManager.FUSED_PROVIDER)
            if (lm.isProviderEnabled(LocationManager.GPS_PROVIDER)) ofruesit.add(LocationManager.GPS_PROVIDER)
            if (lm.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) ofruesit.add(LocationManager.NETWORK_PROVIDER)
        } catch (e: Exception) { }
        if (ofruesit.isEmpty()) return "pa-gps" to null
        val kanali = Channel<Location?>(ofruesit.size)
        val anulo = CancellationSignal()
        return try {
            ofruesit.forEach { p -> LocationManagerCompat.getCurrentLocation(lm, p, anulo, ContextCompat.getMainExecutor(ctx)) { l -> kanali.trySend(l) } }
            var mi: Location? = null
            withTimeoutOrNull(15000) {
                repeat(ofruesit.size) {
                    val l = kanali.receive()
                    if (l != null && (mi == null || l.accuracy < mi!!.accuracy)) mi = l
                    if (mi != null && mi!!.accuracy <= 25f) return@withTimeoutOrNull
                }
            }
            anulo.cancel()
            val l = mi ?: return "kohe" to null
            null to Marketet.Pozita(l.latitude, l.longitude, if (l.hasAccuracy()) l.accuracy.toDouble() else null)
        } catch (e: SecurityException) { anulo.cancel(); "leje" to null } catch (e: Exception) { anulo.cancel(); "gabim" to null }
    }

    /** Përgjigjja e ekranit pas kërkesës për lejen e vendndodhjes */
    fun pasLejes(po: Boolean) {
        kerkoLejen.value = false
        if (po) kontrolloGps(meDorePasLejes)
        else {
            ruajAktivin(_aktivi.value.copy(kontrolluarSe = System.currentTimeMillis()))
            if (meDorePasLejes || !gabimiTreguar) { gabimiTreguar = true; Toast.trego(Marketet.tekstiGabimit("leje"), 7000) }
        }
    }

    /**
     * GPS-i (si kontrolloGps): kur hapet aplikacioni (jo më shpesh se 2 min) ose me dorë ("Gjej me GPS"). Je te një market →
     * "Je te: X"; te një pikë e dikujt tjetër → shtohet te marketet e tua; te asnjë → "Ku je?" (jo më shpesh se 3 orë vetë).
     */
    fun kontrolloGps(meDore: Boolean) {
        if (!Llogaria.eshteMerchandiser() || gpsDukePunuar) return
        _aktivi.value = lexoAktivin()
        if (!meDore && System.currentTimeMillis() - _aktivi.value.kontrolluarSe < Marketet.KONTROLLI_MS) return
        if (!kaLeje()) {
            if (meDore || !lejaEPyetur) { lejaEPyetur = true; meDorePasLejes = meDore; kerkoLejen.value = true }
            return
        }
        gpsDukePunuar = true
        if (meDore) Toast.trego("Duke e gjetur vendndodhjen…", 15000)
        scope.launch {
            val (gab, p) = pozita()
            if (gab != null || p == null) {
                gpsDukePunuar = false
                ruajAktivin(_aktivi.value.copy(kontrolluarSe = System.currentTimeMillis()))
                if (meDore || !gabimiTreguar) { gabimiTreguar = true; Toast.trego(Marketet.tekstiGabimit(gab ?: "gabim"), 7000) }
                return@launch
            }
            poz = p; pozKoha = System.currentTimeMillis()
            pritPikat()
            gpsDukePunuar = false
            val para = idAktiv()
            // v257: markete fqinje që GPS-i s'i dallon: mbetet aktivi (nëse është njëri prej tyre), përndryshe pyetet "Ku je?"
            val r = Marketet.gjejMarketin(marketet(), p, _aktivi.value.id)
            var paqarte = r?.paqarte == true
            var gj = r?.gjetur
            var uShtua = false
            if (gj == null && !paqarte) {
                val rp = Marketet.gjejMarketin(_pikat.value, p, Marketet.sipasId(marketet(), _aktivi.value.id)?.get("p"))
                if (rp?.paqarte == true) paqarte = true
                else rp?.gjetur?.let { gp -> // një pikë e njohur e Stoku-t (e shtuar nga dikush tjetër)
                    val n0 = marketet().size
                    val m = shtoNgaPika(gp.marketi)
                    uShtua = marketet().size > n0
                    gj = Marketet.Gjetur(m, gp.largesia)
                }
            }
            val baza = if (meDore) _aktivi.value.copy(menyra = "gps", koha = 0) else _aktivi.value // "Gjej me GPS" fiton ndaj zgjedhjes me dorë
            ruajAktivin(Marketet.pasGps(baza, gj, System.currentTimeMillis(), Marketet.largNgaMarketi(marketet(), baza.id, p))) // v256: larg marketit të zgjedhur: bie
            val pas = idAktiv()
            if (pas != null) {
                if (pas != para || meDore || uShtua) Toast.trego("Je te: " + emri(pas) + if (uShtua) " (u shtua te marketet e tua)" else "", 4000)
                else if (meDore) Toast.trego("Je te: " + emri(pas), 4000)
                return@launch
            }
            if (meDore && !paqarte) Toast.trego("S'je te asnjë market i njohur.", 2500)
            // S'je te asnjë market i njohur
            if (!meDore) {
                val a = _aktivi.value
                if (a.menyra == "dore" && System.currentTimeMillis() - a.koha < Marketet.DORE_MS) return@launch // e zgjodhi vetë së fundi
                val kuje = Json.lexoOse(StokuApp.prefsOse("marketet_kuje", "")).siObj()
                if (kuje != null && kuje["uid"] == Llogaria.perdoruesi.value?.uid && System.currentTimeMillis() - numerOse0(kuje["koha"]).toLong() < Marketet.DORE_MS) return@launch
                if (dritarja.value != null) return@launch // s'e ndërpret një dritare tjetër
            }
            StokuApp.vendosPref("marketet_kuje", Json.shkruaj(mapOf("uid" to Llogaria.perdoruesi.value?.uid, "koha" to System.currentTimeMillis())))
            if (!paqarte && marketet().isEmpty() && Marketet.pikatAfer(_pikat.value, p, 2000.0, 1).isEmpty()) { dritarja.value = Dritarja.MarketIRi; return@launch }
            dritarja.value = Dritarja.KuJe("zgjidh", p, true, paqarte = paqarte)
        }
    }

    /** Çipi "Je te" / "Shto marketin ku punon" */
    fun prekCipin() {
        dritarja.value = if (paMarkete()) Dritarja.MarketIRi else Dritarja.KuJe("zgjidh", pozEFundit(), false)
    }

    /** Zgjedhja te "Ku je?": id e marketit, "p:" + id e pikës, ose null = "Krejt marketet" */
    fun zgjidh(id: String?) {
        if (id != null && id.startsWith("p:")) {
            val pika = _pikat.value.firstOrNull { it["id"] == id.substring(2) } ?: return
            val m = shtoNgaPika(pika)
            vendosAktivin(m["id"] as String, "dore")
            Toast.trego("Je te: " + m["emri"] + " (u shtua te marketet e tua)", 4000)
            return
        }
        vendosAktivin(id, "dore")
    }

    // ---------------- Marketi i ri (v250: vetëm brenda tij) ----------------
    class MarketiIRi(val marketi: Obj, val n: Int, val ekziston: Boolean)

    fun emriIMarketitTeRi(e: String): String = e.trim().replace(Regex("\\s+"), " ").take(Marketet.EMRI_MAKS)
    private fun marketiPaVendMeEmrin(e: String): Obj? {
        val n = e.lowercase()
        return marketet().firstOrNull { !Marketet.kaVend(it) && it["p"] == null && (it["emri"] as String).trim().lowercase().replace(Regex("\\s+"), " ") == n }
    }
    fun gabimiIEmrit(e: String): String? {
        if (e.isEmpty()) return "Shkruaj emrin e marketit."
        if (marketiPaVendMeEmrin(e) != null) return null
        if (Marketet.ekzistonEmri(marketet(), e) || Marketet.ekzistonEmri(_pikat.value, e)) return "Në Stoku ka tashmë një market me këtë emër. Shto edhe vendin, p.sh. \"$e Qendër\"."
        return null
    }
    fun tekstiIMarketitTeRi(r: MarketiIRi): String =
        if (r.ekziston) "Këtu është tashmë marketi \"" + r.marketi["emri"] + "\". Tash je te ai."
        else "\"" + r.marketi["emri"] + "\" u shtua me vendndodhjen." + (if (r.n > 0) " Afatet e deritashme (${r.n}) u vendosën te ky market." else "") + " Tash e shohin krejt merchandiserët."

    /** → (gabimi, null) ose (null, marketi). Kërkon lejen e vendndodhjes nga ekrani kur s'e ka. */
    suspend fun shtoMarketKetu(emri0: String): Pair<String?, MarketiIRi?> {
        val e = emriIMarketitTeRi(emri0)
        gabimiIEmrit(e)?.let { return it to null }
        pritPikat()
        gabimiIEmrit(e)?.let { return it to null } // pikat mund të kenë ardhur ndërkohë
        val (er, p) = pozita()
        if (er != null || p == null) return Marketet.tekstiGabimit(er ?: "gabim") to null
        poz = p; pozKoha = System.currentTimeMillis()
        when (val k = Marketet.kontrolloShtimin(p, marketet(), _pikat.value)) {
            is Marketet.Kontrolli.Pasakte -> return ("Vendndodhja s'është e saktë (rreth " + (if (k.sakt > 0) k.sakt.toString() else "?") + " m). Lejo \"vendndodhjen e saktë\" " +
                "për Stoku-n te leja e vendndodhjes së telefonit (jo \"të përafërt\") dhe provo sërish brenda marketit.") to null
            is Marketet.Kontrolli.Afer -> return ("Afër (" + k.largesia + " m) është marketi \"" + k.emri + "\" dhe vendndodhja ka pasaktësi rreth " + k.sakt +
                " m. Nëse je te ai, zgjidhe te \"Ku je?\". Përndryshe prit pak brenda marketit dhe provo sërish.") to null
            is Marketet.Kontrolli.Ekziston -> {
                val mE = k.marketi ?: shtoNgaPika(k.pika!!)
                vendosAktivin(mE["id"] as String, "gps")
                return null to MarketiIRi(mE, 0, true)
            }
            null -> {}
        }
        val tani = System.currentTimeMillis()
        val lat = (p.lat * 1e6).roundToLong() / 1e6
        val lng = (p.lng * 1e6).roundToLong() / 1e6
        val vjeter = marketiPaVendMeEmrin(e)
        val te = marketet()
        var n = 0
        val m: Obj
        if (vjeter != null) {
            m = vjeter.me("lat" to lat, "lng" to lng, "ndryshuarSe" to tani)
            Dyqani.vendosMarketet(te.map { if (it["id"] == m["id"]) m else it })
        } else {
            m = obj("id" to Marketet.idERe(tani), "emri" to e, "lat" to lat, "lng" to lng, "ndryshuarSe" to tani)
            // Marketi i parë: afatet e deritashme (pa market) shkojnë te ai, që asgjë të mos mbetet jashtë
            if (te.isEmpty()) {
                val (af, nn) = Marketet.vendosPaMarket(Dyqani.g.afatet, listOf(m), m["id"] as String, tani)
                n = nn
                Dyqani.vendosMarketet(te + m, afatet = if (nn > 0) af else null)
            } else Dyqani.vendosMarketet(te + m)
        }
        ruajAktivin(Marketet.Aktivi(m["id"] as String, "gps", tani, tani))
        lidhMePike(m["id"] as String) // bëhet pikë e Stoku-t
        return null to MarketiIRi(m, n, false)
    }

    /** Herën e parë që merchandiseri pa asnjë market hap Afatet: pyetet vetë një herë */
    fun pyetMarketinEPare() {
        if (!paMarkete()) return
        val u = Llogaria.perdoruesi.value?.uid ?: "1"
        if (StokuApp.prefsOse("marketet_pyetur", "") == u) return
        scope.launch {
            delay(600)
            if (paMarkete() && dritarja.value == null) { StokuApp.vendosPref("marketet_pyetur", u); dritarja.value = Dritarja.MarketIRi }
        }
    }

    /** Marketi për afatet e reja (fleta, importi): aktivi, ose pyetet kur shihen krejt marketet. kur(null) = pa market */
    fun marketiPerTeReja(kur: (String?) -> Unit) {
        if (!kaMarkete()) { kur(null); return }
        idAktiv()?.let { kur(it); return }
        dritarja.value = Dritarja.KuJe("te-reja", null, false) { id -> if (id != null) kur(id) }
    }
}
