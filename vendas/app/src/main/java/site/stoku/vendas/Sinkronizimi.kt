package site.stoku.vendas

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.os.Handler
import android.os.Looper
import com.google.firebase.firestore.DocumentReference
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import site.stoku.logjika.Bashkimi
import site.stoku.logjika.MObj
import site.stoku.logjika.Obj
import site.stoku.logjika.Ruajtja
import site.stoku.logjika.numerOse0
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Sinkronizimi me Firebase, si te web-i (app-tel.js + ruajtja.js):
 *  - hyrja: merret dyqani nga cloud-i dhe bashkohet me këtë telefon (telefon i ri e merr ashtu siç është);
 *  - çdo ndryshim: pas 1.5 s (afatet 0.3 s) lexim + bashkim + shkrim në një transaksion (dy pajisje njëkohësisht s'ia
 *    fshijnë ndryshimet njëra-tjetrës); vetëm pjesët që ndryshuan rishkruhen;
 *  - dëgjuesi: ndryshimet e pajisjeve të tjera vijnë brenda sekondës;
 *  - pa internet: ndryshimet mbeten në telefon dhe dërgohen vetë sa kthehet lidhja (riprovim çdo 15 s).
 */
object Sinkronizimi {
    private val db: FirebaseFirestore get() = FirebaseFirestore.getInstance()
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private val dora = Handler(Looper.getMainLooper())

    private val _statusi = MutableStateFlow("")
    /** "Duke sinkronizuar…", "U sinkronizua 12:30.", "S'u sinkronizua (pa internet?)…" */
    val statusi: StateFlow<String> get() = _statusi
    private val _gabim = MutableStateFlow(false)
    val gabim: StateFlow<Boolean> get() = _gabim

    private var uid: String? = null
    private var dukeSinkronizuar = false
    private var serish = false
    private var deshtoi = false
    private var uidISinkronizuar: String? = null
    private var remoteNePritje: Obj? = null
    private var dKryesori: ListenerRegistration? = null
    private var dPjeset: ListenerRegistration? = null
    private val kohezi = Runnable { kryeSinkronizimin() }
    private var kaKohezues = false

    fun nis(ctx: Context) {
        Llogaria.nis(ctx)
        Dyqani.kurNdryshon = { ms -> planifiko(ms) }
        scope.launch {
            Llogaria.perdoruesi.collect { p ->
                if (p?.uid == uid) return@collect
                ndalDegjuesin()
                uid = p?.uid
                uidISinkronizuar = null
                if (p != null) {
                    Dyqani.vendosPronarin(p.uid)
                    Regjistri.nis()
                    sinkronizoNeHyrje()
                } else { Regjistri.ndal(); _statusi.value = "" }
            }
        }
        // Kthehet interneti: dërgohet menjëherë çka pret dhe rinis dëgjuesi
        try {
            val cm = ctx.getSystemService(ConnectivityManager::class.java)
            cm?.registerDefaultNetworkCallback(object : ConnectivityManager.NetworkCallback() {
                override fun onAvailable(network: Network) {
                    dora.post {
                        if (uid == null) return@post
                        if (uidISinkronizuar != uid) sinkronizoNeHyrje()
                        else { kryeSinkronizimin(); if (dKryesori == null) nisDegjuesin() }
                    }
                }
            })
        } catch (e: Exception) { /* ok */ }
    }

    private fun ora(): String = SimpleDateFormat("HH:mm", Locale.ROOT).format(Date())

    fun planifiko(ms: Long = 1500) {
        if (uid == null) return
        dora.removeCallbacks(kohezi)
        dora.postDelayed(kohezi, ms)
        kaKohezues = true
    }

    /** Aplikacioni kalon në sfond me një ruajtje në pritje: dërgohet menjëherë */
    fun dergoNesePret() { if (kaKohezues && uid != null) kryeSinkronizimin() }

    /** Kur kthehesh në aplikacion pas një dështimi */
    fun neRikthim() { if (deshtoi && uid != null) kryeSinkronizimin() }

    // ---------------- Ruajtja në Firestore (ruajtja.js) ----------------
    private fun refKryesor(u: String): DocumentReference = db.collection("dyqane").document(u)
    private fun refPjesa(u: String, i: Int): DocumentReference = db.collection("dyqane").document(u).collection("pjeset").document("p$i")

    private suspend fun merr(u: String): Obj? {
        val k = refKryesor(u).get().await()
        val kryesori = if (k.exists()) k.data else null
        val n = numerOse0(kryesori?.get("pjeset")).toInt()
        val pjeset = (0 until n).map { i -> refPjesa(u, i).get().await().let { if (it.exists()) it.data else null } }
        return Ruajtja.bashkoPjeset(kryesori, pjeset)
    }

    /** Lexim + bashkim + shkrim në një transaksion; kthen gjendjen e bashkuar */
    private suspend fun bashkoDheRuaj(u: String, fnBashko: (Obj?) -> Obj): Obj = db.runTransaction { tx ->
        val s = tx.get(refKryesor(u))
        val k = if (s.exists()) s.data else null
        val nPara = numerOse0(k?.get("pjeset")).toInt()
        val pjesetPara = (0 until nPara).map { i -> tx.get(refPjesa(u, i)).let { if (it.exists()) it.data else null } }
        val eRe = fnBashko(Ruajtja.bashkoPjeset(k, pjesetPara))
        val nd = Ruajtja.ndajNePjese(eRe, nPara)
        if (k == null || Ruajtja.kryesoriKanonik(k) != Ruajtja.kryesoriKanonik(nd.kryesori)) tx.set(refKryesor(u), nd.kryesori)
        nd.pjeset.forEachIndexed { i, pj ->
            val para = pjesetPara.getOrNull(i)
            if (para == null || Ruajtja.pjesaKanonike(para) != Ruajtja.pjesaKanonike(pj)) tx.set(refPjesa(u, i), pj)
        }
        eRe
    }.await()

    private fun bashkoPaFshirje(cloud: Obj?, lokal: Obj): Obj = Bashkimi.sigurojFolderat(Bashkimi.bashko(cloud, lokal))!!

    // ---------------- Sinkronizimi ----------------
    private fun sinkronizoNeHyrje() {
        val u = uid ?: return
        if (uidISinkronizuar == u) return
        uidISinkronizuar = u
        _statusi.value = "Duke sinkronizuar…"
        scope.launch {
            try {
                val g = merr(u)
                if (uid != u) return@launch
                if (g != null) {
                    if (Dyqani.eshteIPaprekur() && (g["foldera"] as? List<*>)?.isNotEmpty() == true) Dyqani.zbatoGjendjenNgaCloud(g)
                    else Dyqani.zbatoGjendjenNgaCloud(bashkoPaFshirje(g, Dyqani.gjendjaPerCloud()))
                }
            } catch (e: Exception) {
                uidISinkronizuar = null // pa internet: provohet sërish kur kthehet lidhja
                _statusi.value = "S'u sinkronizua (pa internet?) · " + ora()
                _gabim.value = true
                return@launch
            }
            kryeSinkronizimin()
            nisDegjuesin()
        }
    }

    fun kryeSinkronizimin() {
        val u = uid ?: return
        dora.removeCallbacks(kohezi); kaKohezues = false
        if (dukeSinkronizuar) { serish = true; return }
        dukeSinkronizuar = true
        _statusi.value = "Duke sinkronizuar…"
        val versioniPara = Dyqani.versioniLokal
        scope.launch {
            var ok: Obj? = null
            try { ok = bashkoDheRuaj(u) { cloud -> bashkoPaFshirje(cloud, Dyqani.gjendjaPerCloud()) } } catch (e: Exception) { /* pa internet */ }
            dukeSinkronizuar = false
            if (uid != u) return@launch
            if (ok != null) {
                Dyqani.pastroFshirjet()
                if (versioniPara == Dyqani.versioniLokal) Dyqani.zbatoBashkimin(ok) else planifiko()
                _statusi.value = "U sinkronizua " + ora() + "."
                _gabim.value = false
                deshtoi = false
            } else {
                _statusi.value = "S'u sinkronizua (pa internet?) · riprovohet vetë"
                _gabim.value = true
                deshtoi = true
                dora.removeCallbacks(kohezi); dora.postDelayed(kohezi, 15000); kaKohezues = true
            }
            if (serish) { serish = false; planifiko() }
            zbatoRemoteNePritje()
        }
    }

    private fun zbatoNgaCloudBashkuar(remote: Obj) {
        val b = bashkoPaFshirje(remote, Dyqani.gjendjaPerCloud())
        Dyqani.zbatoBashkimin(b)
        if (!Bashkimi.eNjejte(b, remote) && !kaKohezues) planifiko()
    }

    private fun zbatoRemoteNePritje() {
        val r = remoteNePritje ?: return
        if (dukeSinkronizuar) return
        remoteNePritje = null
        val lok = Dyqani.gjendjaPerCloud()
        if (Bashkimi.eNjejte(bashkoPaFshirje(r, lok), lok)) return
        zbatoNgaCloudBashkuar(r)
    }

    // Dëgjuesi: kryesori + pjesët (si ruajtja.degjo)
    private fun nisDegjuesin() {
        ndalDegjuesin()
        val u = uid ?: return
        var kryesori: Map<String, Any?>? = null; var kaKryesor = false
        var pjeset: Map<String, Map<String, Any?>> = emptyMap(); var kaPjese = false
        var pritjeK = false; var pritjeP = false
        fun njofto() {
            if (!kaKryesor || !kaPjese || uid != u) return
            val n = numerOse0(kryesori?.get("pjeset")).toInt()
            val l = (0 until n).map { pjeset["p$it"] }
            if (l.any { it == null }) return // pjesët e reja ende s'kanë mbërritur
            val remote = Ruajtja.bashkoPjeset(kryesori, l) ?: return
            if (pritjeK || pritjeP || dukeSinkronizuar) { remoteNePritje = remote; return }
            remoteNePritje = null
            zbatoNgaCloudBashkuar(remote)
        }
        dKryesori = refKryesor(u).addSnapshotListener { s, e ->
            if (e != null) { rinisPasPak(); return@addSnapshotListener }
            if (s == null) return@addSnapshotListener
            kryesori = if (s.exists()) s.data else null; kaKryesor = true; pritjeK = s.metadata.hasPendingWrites()
            njofto()
        }
        dPjeset = refKryesor(u).collection("pjeset").addSnapshotListener { s, e ->
            if (e != null) { rinisPasPak(); return@addSnapshotListener }
            if (s == null) return@addSnapshotListener
            pjeset = s.documents.associate { it.id to (it.data ?: emptyMap()) }; kaPjese = true; pritjeP = s.metadata.hasPendingWrites()
            njofto()
        }
    }

    private var pritjaDegjuesit = 15000L
    private fun rinisPasPak() {
        ndalDegjuesin()
        pritjaDegjuesit = minOf(5 * 60000L, pritjaDegjuesit * 2)
        dora.postDelayed({ if (uid != null && dKryesori == null) nisDegjuesin() }, pritjaDegjuesit)
    }

    private fun ndalDegjuesin() {
        dKryesori?.remove(); dKryesori = null
        dPjeset?.remove(); dPjeset = null
        remoteNePritje = null
    }

    /**
     * "Rikthe nga cloud": të dhënat e telefonit zëvendësohen me ato të ruajtura në cloud (si cloudRiktheTani te web-i)
     * → numri i produkteve të rikthyera, -1 kur cloud-i s'ka asgjë, null kur s'u lexua (internet)
     */
    suspend fun riktheNgaCloud(): Int? {
        val u = uid ?: return null
        val g = try { merr(u) } catch (e: Exception) { return null } ?: return -1
        if (uid != u) return null
        ndalDegjuesin()
        Dyqani.harroFshirjet()
        Dyqani.zbatoGjendjenNgaCloud(g)
        uidISinkronizuar = u
        nisDegjuesin()
        _statusi.value = "U rikthye nga cloud " + ora() + "."
        _gabim.value = false
        return Dyqani.g.produktet.size
    }

    /** "Sinkronizo tani" (prekja e logos): edhe rilexim nga cloud-i */
    fun rifresko() {
        if (uid == null) return
        uidISinkronizuar = null
        sinkronizoNeHyrje()
    }

    @Suppress("unused") private fun kopje(m: Map<String, Any?>): MObj = LinkedHashMap(m)
}
