package site.stoku.vendas

import android.content.Context
import com.google.firebase.FirebaseNetworkException
import com.google.firebase.FirebaseTooManyRequestsException
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseAuthException
import com.google.firebase.auth.FirebaseAuthInvalidCredentialsException
import com.google.firebase.auth.FirebaseAuthInvalidUserException
import com.google.firebase.auth.FirebaseAuthUserCollisionException
import com.google.firebase.auth.FirebaseAuthWeakPasswordException
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import com.google.firebase.firestore.MetadataChanges
import com.google.firebase.firestore.SetOptions
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.launch
import kotlinx.coroutines.plus
import site.stoku.logjika.Json
import site.stoku.logjika.Lejet
import site.stoku.logjika.MObj
import site.stoku.logjika.Obj
import site.stoku.logjika.siObj

/**
 * Llogaria (si firebase-tel.js + porta.js): hyrja me emrin e përdoruesit (emri@stoku-app.local), krijimi i llogarisë
 * (me "Punoj si merchandiser"), dalja, regjistrimi te perdoruesit/{uid}, lejet e llogarisë (lejet/{uid}) dhe flamuri
 * "merchandiser".
 */
data class Perdoruesi(val uid: String, val emri: String)

object Llogaria {
    private val scope = kotlinx.coroutines.MainScope() + StokuApp.trajtuesi(false) // v302: regjistroEmrin
    private val auth: FirebaseAuth get() = FirebaseAuth.getInstance()
    private val db: FirebaseFirestore get() = FirebaseFirestore.getInstance()

    private val _perdoruesi = MutableStateFlow<Perdoruesi?>(null)
    val perdoruesi: StateFlow<Perdoruesi?> get() = _perdoruesi
    /** Firebase e ka thënë a je i kyçur (para kësaj porta tregon "Duke u lidhur…") */
    private val _gati = MutableStateFlow(false)
    val gati: StateFlow<Boolean> get() = _gati

    /** Lejet e kësaj llogarie: null = krejt të lejuara (pa dokument, ose administratori) */
    private val _lejet = MutableStateFlow<Obj?>(null)
    val lejet: StateFlow<Obj?> get() = _lejet
    private val _merchandiser = MutableStateFlow(false)
    val merchandiserIRegjistrimit: StateFlow<Boolean> get() = _merchandiser

    private lateinit var ctx: Context
    private var dLejet: ListenerRegistration? = null
    private var dMerch: ListenerRegistration? = null
    private var dFshirja: ListenerRegistration? = null
    private var dPamja: ListenerRegistration? = null
    private var poFshihet = false

    /** Mesazhi një-herësh për hyrjen (si "stoku:porta:mesazh" te web-i), p.sh. kur administratori e fshiu llogarinë */
    val mesazhiIHyrjes = MutableStateFlow("")

    /**
     * Prova si vizitor (si "Hyr si vizitor" te porta.js): pa llogari, me të dhëna shembull vetëm në këtë telefon (s'sinkronizohen,
     * pa Grup, AI, njoftime apo orë). Kur hyn një llogari, të dhënat e provës hiqen (si te çdo ndërrim llogarie).
     */
    private val _vizitor = MutableStateFlow(false)
    val vizitor: StateFlow<Boolean> get() = _vizitor
    fun eshteVizitor(): Boolean = _vizitor.value && _perdoruesi.value == null
    /** Prova është ende në këtë telefon ("Vazhdo provën si vizitor") */
    fun provaEkziston(): Boolean = Dyqani.g.pronari == Dyqani.VIZITOR && Dyqani.kaTeDhena()
    /** Në telefon janë të dhënat e një llogarie (p.sh. pas "Dil"): pyetet para se të hiqen për provën */
    fun kaTeDhenaTeLlogarise(): Boolean = Dyqani.g.pronari.let { it != null && it != Dyqani.VIZITOR } && Dyqani.kaTeDhena()

    fun hyrSiVizitor() {
        val mbush = !Dyqani.kaTeDhena() || Dyqani.g.pronari != Dyqani.VIZITOR
        if (mbush) Dyqani.mbushProven()
        StokuApp.prefs(ctx).edit().putBoolean("vizitor", true).apply()
        _vizitor.value = true
    }
    /** "Hyr" nga prova: hapet hyrja; prova mbetet derisa të hyjë një llogari */
    fun hapHyrjenNgaProva() {
        StokuApp.prefs(ctx).edit().putBoolean("vizitor", false).apply()
        _vizitor.value = false
    }
    /** "Fillo nga e para": të dhënat shembull rikthehen */
    fun rinisProven() { if (Dyqani.g.pronari == Dyqani.VIZITOR) Dyqani.mbushProven() }

    /** Vetëm për testet e pamjeve */
    fun vendosPerProve(p: Perdoruesi?, merchandiser: Boolean = false, vizitor: Boolean = false) {
        _perdoruesi.value = p; _gati.value = true; _merchandiser.value = merchandiser; _vizitor.value = vizitor
    }

    /** Vetëm për PamjetTest (web v352: tabet e ndaluara) */
    fun vendosLejetPerProve(l: Obj?) { _lejet.value = l }
    fun emailIBrendshem(emri: String) = emri.trim().lowercase() + "@stoku-app.local"

    fun nis(c: Context) {
        ctx = c.applicationContext
        // Lejet e fundit të kësaj pajisjeje: vlejnë që në hapje, edhe pa internet
        val pr = StokuApp.prefs(ctx)
        Json.lexoOse(pr.getString("lejet", null)).siObj()?.let { x -> _lejet.value = x["lejet"].siObj() }
        _merchandiser.value = pr.getBoolean("merchandiser", false)
        _vizitor.value = pr.getBoolean("vizitor", false)
        auth.addAuthStateListener { a ->
            val u = a.currentUser
            val p = u?.let { Perdoruesi(it.uid, (it.email ?: "").removeSuffix("@stoku-app.local")) }
            if (p?.uid != _perdoruesi.value?.uid) {
                _perdoruesi.value = p
                ndalDegjuesit()
                if (p != null) {
                    if (_vizitor.value) { _vizitor.value = false; pr.edit().putBoolean("vizitor", false).apply() } // me llogari s'ka më provë
                    if (pr.getString("lejet_uid", null) != p.uid) { _lejet.value = null; _merchandiser.value = false; pr.edit().remove("lejet").putBoolean("merchandiser", false).apply() }
                    pr.edit().putString("lejet_uid", p.uid).apply()
                    regjistroPerdoruesin(p)
                    degjoLejet(p)
                    degjoMerchandiserin(p)
                    degjoFshirjen(p)
                    degjoPamjen(p) // v311
                    Pajisjet.nis(p.uid) { Pajisjet.dilNgaDistanca() } // Hyrja 81: pajisjet ku je i kyçur
                } else { _lejet.value = null; _merchandiser.value = false; Pajisjet.harro() }
            }
            _gati.value = true
        }
    }

    private fun ndalDegjuesit() { dLejet?.remove(); dLejet = null; dMerch?.remove(); dMerch = null; dFshirja?.remove(); dFshirja = null; dPamja?.remove(); dPamja = null }

    // v311 (web v311): pamja (tema + ngjyrat) ruhet te llogaria, perdoruesit/{uid}.pamja = { tema, e, c, t }, e njëjtë në çdo pajisje
    // (web telefon, PC, Android). Cloud-i fiton kur ka vlerë; nëse s'ka ende dhe kjo pajisje ka zgjedhje jo të parazgjedhura, ngarkohet.
    private fun degjoPamjen(p: Perdoruesi) {
        dPamja = db.collection("perdoruesit").document(p.uid).addSnapshotListener(MetadataChanges.INCLUDE) { s, e ->
            if (e != null || s == null || _perdoruesi.value?.uid != p.uid) return@addSnapshotListener
            if (s.metadata.hasPendingWrites()) return@addSnapshotListener // jehona e ndryshimit tim
            if (!s.exists() && s.metadata.isFromCache) return@addSnapshotListener
            val x = s.get("pamja") as? Map<*, *>
            if (x != null) Opsionet.zbatoPamjenNgaLlogaria(x["tema"] as? String, (x["e"] as? Number)?.toInt(), (x["c"] as? Number)?.toInt())
            else if (!s.metadata.isFromCache && !Opsionet.pamjaEParazgjedhur()) ruajPamjen()
        }
    }

    /** Përdoruesi e ndryshoi temën ose ngjyrat (ose kjo pajisje e ngarkon të parën): ruhet te llogaria */
    fun ruajPamjen() {
        val p = _perdoruesi.value ?: return
        val te = mapOf("pamja" to mapOf("tema" to Opsionet.tema.value, "e" to Opsionet.ngjyratE.value, "c" to Opsionet.ngjyratC.value,
            "t" to System.currentTimeMillis()))
        try { db.collection("perdoruesit").document(p.uid).set(te, SetOptions.merge()) } catch (e: Exception) { }
    }

    // Administratori e fshiu këtë llogari (ekipa_fshire/{uid}, si degjoFshirjen te ekipa.js): njoftimi ditor hiqet nga serveri,
    // llogaria e hyrjes fshihet (ose të paktën dilet), të dhënat e saj hiqen nga telefoni dhe hyrja e tregon arsyen
    private fun degjoFshirjen(p: Perdoruesi) {
        dFshirja = db.collection("ekipa_fshire").document(p.uid).addSnapshotListener { s, e ->
            if (e != null || s == null || !s.exists() || _perdoruesi.value?.uid != p.uid) return@addSnapshotListener
            llogariaUFshi(s.getString("fshireNga") == "vete")
        }
    }

    private fun llogariaUFshi(vete: Boolean = false) {
        if (poFshihet) return
        poFshihet = true
        kotlinx.coroutines.MainScope().launch(StokuApp.trajtuesi(false)) {
            try { kotlinx.coroutines.withTimeoutOrNull(9000) { Push.caktivizo() } } catch (e: Exception) { }
            ndalDegjuesit()
            StokuApp.prefs(ctx).edit().remove("ora_rt").apply()
            mesazhiIHyrjes.value = if (vete) "Llogaria jote u fshi." else "Kjo llogari u fshi nga administratori."
            try { kotlinx.coroutines.withTimeoutOrNull(9000) { auth.currentUser?.delete()?.await() } } catch (e: Exception) { }
            try { if (auth.currentUser != null) auth.signOut() } catch (e: Exception) { }
            Dyqani.vendosPronarin("llogari-e-fshire") // të dhënat e llogarisë së fshirë s'mbeten në telefon
            poFshihet = false
        }
    }

    /**
     * Web v351 (Google Play, pronari 21.11.2026): përdoruesi e fshin VETË llogarinë (Cilësimet → Llogaria → Fshi llogarinë), si
     * fshijLlogarineTime te ekipa.js: konfirmimi me fjalëkalimin, shënimi ekipa_fshire/{uid} (fshireNga "vete": rregullat ia mbyllin
     * shkrimin në krejt pajisjet, që dalin vetë), të dhënat në cloud (grupi: admin bëhet më i vjetri; i vetmi: grupi fshihet), serveri i
     * njoftimeve (Worker 176), pastaj llogaria e hyrjes dhe të dhënat në telefon. Emrat (emrat/) mbeten të rezervuar. Jo administratori.
     * → null kur u fshi, ose "fjalekalimi", "rrjeti", "admin".
     */
    suspend fun fshiLlogarineTime(fjalekalimi: String): String? {
        val p = _perdoruesi.value ?: return "rrjeti"
        val u = p.uid
        if (Lejet.eshteAdmin(u)) return "admin"
        val cu = auth.currentUser ?: return "rrjeti"
        val email = cu.email ?: return "rrjeti"
        try { cu.reauthenticate(com.google.firebase.auth.EmailAuthProvider.getCredential(email, fjalekalimi)).await() }
        catch (e: Exception) { return if (e is FirebaseNetworkException) "rrjeti" else "fjalekalimi" }
        poFshihet = true
        try { kotlinx.coroutines.withTimeoutOrNull(9000) { Push.caktivizo() } } catch (e: Exception) { }
        val gU = try { db.collection("perdoruesit").document(u).get().await().getString("grupi") } catch (e: Exception) { null }
        try {
            db.collection("ekipa_fshire").document(u).set(mapOf("emri" to p.emri, "fshireSe" to System.currentTimeMillis(), "fshireNga" to "vete")).await()
        } catch (e: Exception) { poFshihet = false; return "rrjeti" }
        ndalDegjuesit()
        suspend fun fshij(ref: com.google.firebase.firestore.DocumentReference) { try { ref.delete().await() } catch (e: Exception) { } }
        suspend fun fshijPyetjen(q: com.google.firebase.firestore.Query) { try { q.get().await().documents.forEach { fshij(it.reference) } } catch (e: Exception) { } }
        for (g in listOfNotNull(gU, Grupi.grupi()).filter { it.isNotEmpty() }.distinct()) {
            val gr = db.collection("grupet").document(g)
            val anet = try { gr.collection("anetaret").get().await().documents } catch (e: Exception) { continue }
            val une = anet.firstOrNull { it.id == u } ?: continue
            val tjeret = anet.filter { it.id != u }
            fshijPyetjen(gr.collection("push").whereEqualTo("uid", u))
            fshijPyetjen(gr.collection("feed").whereEqualTo("uid", u))
            fshij(gr.collection("afatet").document(u)); fshij(gr.collection("malli").document(u))
            if (une.getString("roli") == "pronar" && tjeret.isEmpty()) {
                for (n in listOf("feed", "kujtesa", "push", "afatet", "malli")) fshijPyetjen(gr.collection(n))
                fshijPyetjen(db.collection("ftesat").whereEqualTo("gid", g))
                fshijPyetjen(db.collection("kerkesat_grupi").whereEqualTo("gid", g))
                fshij(db.collection("grupet_publike").document(g)); fshij(gr)
            } else if (une.getString("roli") == "pronar" && tjeret.none { it.getString("roli") == "pronar" }) {
                val i = tjeret.minByOrNull { (it.get("hyriSe") as? Number)?.toLong() ?: 0L }!!
                try { gr.collection("anetaret").document(i.id).set(mapOf("roli" to "pronar"), SetOptions.merge()).await() } catch (e: Exception) { }
            }
            fshij(gr.collection("anetaret").document(u))
        }
        fshij(db.collection("ekipa_anetaret").document(u)); fshij(db.collection("ekipa_afatet").document(u))
        fshijPyetjen(db.collection("ftesat").whereEqualTo("uid", u))
        fshijPyetjen(db.collection("kerkesat_grupi").whereEqualTo("uid", u))
        val dq = db.collection("dyqane").document(u)
        try { dq.collection("skedaret").get().await().documents.forEach { fshijPyetjen(it.reference.collection("pjeset")); fshij(it.reference) } } catch (e: Exception) { }
        fshijPyetjen(dq.collection("pjeset")); fshijPyetjen(dq.collection("fletet")); fshij(dq)
        val pr = db.collection("perdoruesit").document(u)
        fshijPyetjen(pr.collection("njoftimet")); fshijPyetjen(pr.collection("pajisjet")); fshij(pr)
        fshij(db.collection("lejet").document(u)); fshij(db.collection("kujtesa_pritje").document(u))
        try { kotlinx.coroutines.withTimeoutOrNull(9000) { Push.fshiLlogarineTeServeri(u) } } catch (e: Exception) { }
        StokuApp.prefs(ctx).edit().remove("ora_rt").apply()
        mesazhiIHyrjes.value = "Llogaria jote u fshi."
        try { kotlinx.coroutines.withTimeoutOrNull(9000) { auth.currentUser?.delete()?.await() } } catch (e: Exception) { }
        try { if (auth.currentUser != null) auth.signOut() } catch (e: Exception) { }
        Dyqani.vendosPronarin("llogari-e-fshire") // të dhënat e llogarisë s'mbeten në telefon
        poFshihet = false
        return null
    }

    /** Administratori (v302: sipas uid-së, Lejet.ADMIN_UID) i ka të gjitha lejet */
    fun eshteAdmin(): Boolean = Lejet.eshteAdmin(_perdoruesi.value?.uid)

    fun leja(k: String): Boolean {
        if (k == "marketet") return eshteMerchandiser()
        if (eshteAdmin()) return true
        return Lejet.lejohet(_lejet.value, k)
    }

    /** Fiton zgjedhja e administratorit (lejet/{uid}.marketet); pa të, "Punoj si merchandiser" i regjistrimit */
    fun eshteMerchandiser(): Boolean {
        if (_perdoruesi.value == null) return false
        if (!eshteAdmin() && !Lejet.lejohet(_lejet.value, "afatet")) return false
        val z = if (eshteAdmin()) null else Lejet.zgjedhja(_lejet.value, "marketet")
        return z ?: _merchandiser.value
    }

    private fun regjistroPerdoruesin(p: Perdoruesi) {
        if (p.emri.isEmpty()) return
        db.collection("perdoruesit").document(p.uid)
            .set(mapOf("perdoruesi" to p.emri.lowercase(), "kycurSe" to System.currentTimeMillis()), SetOptions.merge())
        regjistroEmrin(p)
    }

    /** v302: emrat/{emri} → { uid }, që pronari i grupit ta ftojë llogarinë sipas uid-së (si ekipa.js regjistroEmrin).
     *  Një herë për llogari/emër në këtë pajisje; kur emri ndryshon, i mëparshmi fshihet (nëse është ende i kësaj llogarie). */
    private fun regjistroEmrin(p: Perdoruesi) {
        val em = p.emri.lowercase()
        if (!Regex("^[a-z0-9_.-]{3,40}$").matches(em)) return
        val celes = p.uid + "|" + em
        val para = StokuApp.prefsOse("emri_regjistruar", "")
        if (para == celes) return
        scope.launch {
            try {
                // Hyrja 71: emri i zënë nga një llogari tjetër s'mbishkruhet; emri i mëparshëm s'fshihet më (mbetet i kësaj llogarie)
                val ref = db.collection("emrat").document(em)
                if (!ref.get().await().exists()) ref.set(mapOf("uid" to p.uid, "ndryshuarSe" to System.currentTimeMillis())).await()
            } catch (e: Exception) { return@launch }
            if (_perdoruesi.value?.uid == p.uid) StokuApp.vendosPref("emri_regjistruar", celes)
        }
    }

    private fun degjoLejet(p: Perdoruesi) {
        if (Lejet.eshteAdmin(p.uid)) { _lejet.value = null; return }
        dLejet = db.collection("lejet").document(p.uid).addSnapshotListener { s, e ->
            if (e != null || s == null || _perdoruesi.value?.uid != p.uid) return@addSnapshotListener
            val l = if (s.exists()) s.get("lejet").siObj()?.let { Lejet.pastro(it) } else null
            _lejet.value = l
            StokuApp.prefs(ctx).edit().putString("lejet", if (l == null) null else Json.shkruaj(mapOf("lejet" to l))).apply()
        }
    }

    // v251: vetëm dokumenti nga serveri vendos; "po" e kësaj pajisjeje s'kthehet në "jo" nga dokumenti
    private fun degjoMerchandiserin(p: Perdoruesi) {
        val ref = db.collection("perdoruesit").document(p.uid)
        dMerch = ref.addSnapshotListener(MetadataChanges.INCLUDE) { d, e ->
            if (e != null || d == null || d.metadata.isFromCache || _perdoruesi.value?.uid != p.uid) return@addSnapshotListener
            val neDok = d.exists() && d.getBoolean("merchandiser") == true
            if (!neDok && _merchandiser.value) {
                if (d.exists()) ref.set(mapOf("merchandiser" to true), SetOptions.merge())
                return@addSnapshotListener
            }
            _merchandiser.value = neDok
            StokuApp.prefs(ctx).edit().putBoolean("merchandiser", neDok).apply()
        }
    }

    /** → null (u hy) ose teksti i gabimit */
    suspend fun hyr(emri: String, fjalekalimi: String): String? = try {
        auth.signInWithEmailAndPassword(emailIBrendshem(emri), fjalekalimi).await()
        mesazhiIHyrjes.value = ""
        ruajEmrinEFundit(emri.trim().lowercase())
        tokeniPerOren(emailIBrendshem(emri), fjalekalimi)
        null
    } catch (e: Exception) { tekstiGabimit(e) }

    /**
     * Ora e dorës vepron në emrin e llogarisë (kërkesat te Grupi) me një "refresh token", si web-i (`rt` te /ora/lidh).
     * Firebase-i i Android-it s'e jep tokenin e vet, prandaj merret një i veçantë me API-në e Firebase Auth në hyrje
     * (dhe pas ndryshimit të fjalëkalimit). Ruhet vetëm në këtë telefon; hiqet në dalje.
     */
    private fun tokeniPerOren(email: String, fjalekalimi: String) {
        kotlinx.coroutines.MainScope().launch(kotlinx.coroutines.Dispatchers.IO + StokuApp.trajtuesi(false)) {
            try {
                val c = java.net.URL("https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=" + StokuApp.CELESI_PUBLIK).openConnection() as java.net.HttpURLConnection
                c.requestMethod = "POST"; c.doOutput = true; c.connectTimeout = 15000; c.readTimeout = 15000
                c.setRequestProperty("Content-Type", "application/json")
                c.outputStream.use { it.write(Json.shkruaj(mapOf("email" to email, "password" to fjalekalimi, "returnSecureToken" to true)).toByteArray()) }
                if (c.responseCode !in 200..299) return@launch
                val j = Json.lexo(c.inputStream.use { it.readBytes().toString(Charsets.UTF_8) }).siObj()
                (j?.get("refreshToken") as? String)?.let { StokuApp.prefs(ctx).edit().putString("ora_rt", it).apply() }
            } catch (e: Exception) { }
        }
    }

    /** Hyrja 71 (si pronariIEmrit te firebase-tel.js): pronari i një emri (emrat/{emri}) → uid, "" (i lirë) ose null (s'u lexua) */
    suspend fun pronariIEmrit(emri: String): String? = try {
        val s = db.collection("emrat").document(emri.trim().lowercase()).get().await()
        if (s.exists()) (s.getString("uid") ?: "") else ""
    } catch (e: Exception) { null }

    suspend fun regjistrohu(emri: String, fjalekalimi: String, merchandiser: Boolean, kushtet: Boolean = false): String? {
        // Hyrja 71: emri që e ka (ose e ka pasur) një llogari tjetër s'merret
        if (!kushtet) return "Për të vazhduar, duhet t'i lexoni dhe t'i pranoni Kushtet e përdorimit." // Hyrja 105: pa Kushtet, pa llogari
        if (!pronariIEmrit(emri).isNullOrEmpty()) return EMRI_I_ZENE
        return regjistrohuTani(emri, fjalekalimi, merchandiser, kushtet)
    }

    private suspend fun regjistrohuTani(emri: String, fjalekalimi: String, merchandiser: Boolean, kushtet: Boolean = false): String? = try {
        val kred = auth.createUserWithEmailAndPassword(emailIBrendshem(emri), fjalekalimi).await()
        mesazhiIHyrjes.value = ""
        val uid = kred.user?.uid
        if (uid != null) {
            _merchandiser.value = merchandiser
            StokuApp.prefs(ctx).edit().putBoolean("merchandiser", merchandiser).putString("lejet_uid", uid).apply()
            val fillimi = MObj(); fillimi["krijuarSe"] = System.currentTimeMillis()
            if (merchandiser) fillimi["merchandiser"] = true
            if (kushtet) fillimi["kushtetPranuarSe"] = fillimi["krijuarSe"] // Hyrja 105: kur u pranuan Kushtet e përdorimit
            db.collection("perdoruesit").document(uid).set(fillimi, SetOptions.merge())
        }
        ruajEmrinEFundit(emri.trim().lowercase())
        null
    } catch (e: Exception) { tekstiGabimit(e) }

    fun dil() { ndalDegjuesit(); Pajisjet.harro(); StokuApp.prefs(ctx).edit().remove("ora_rt").apply(); auth.signOut() }

    // ---------------- Ndryshimi i emrit dhe i fjalëkalimit (si firebase-tel.js) ----------------
    /**
     * Emri i ri i përdoruesit (emri@stoku-app.local). Firebase-i i Android-it s'e ka më `updateEmail`, prandaj bëhet me
     * API-në e Firebase Auth (si `updateEmail` i web-it). → null (u ndryshua) ose arsyeja: "emri", "zene", "rihyrje",
     * "konfigurim" (Email enumeration protection), "rrjeti".
     */
    suspend fun ndryshoEmrin(emriRi0: String): String? {
        val emriRi = emriRi0.trim().lowercase()
        if (!Regex("^[a-z0-9_.-]{3,40}$").matches(emriRi)) return "emri"
        val u = auth.currentUser ?: return "pa-hyrje"
        // Hyrja 71: vetëm një emër i lirë ose një emër që e ka pasur vetë kjo llogari
        val pr = pronariIEmrit(emriRi)
        if (!pr.isNullOrEmpty() && pr != u.uid) return "zene"
        return try {
            val token = u.getIdToken(true).await().token ?: return "rrjeti"
            val gabim = kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) {
                val c = java.net.URL("https://identitytoolkit.googleapis.com/v1/accounts:update?key=" + StokuApp.CELESI_PUBLIK).openConnection() as java.net.HttpURLConnection
                c.requestMethod = "POST"; c.doOutput = true; c.connectTimeout = 15000; c.readTimeout = 20000
                c.setRequestProperty("Content-Type", "application/json")
                c.outputStream.use { it.write(Json.shkruaj(mapOf("idToken" to token, "email" to emailIBrendshem(emriRi), "returnSecureToken" to false)).toByteArray()) }
                if (c.responseCode in 200..299) null
                else (c.errorStream?.bufferedReader()?.readText() ?: "").let { t ->
                    when {
                        t.contains("EMAIL_EXISTS") -> "zene"
                        t.contains("CREDENTIAL_TOO_OLD") || t.contains("TOKEN_EXPIRED") -> "rihyrje"
                        t.contains("OPERATION_NOT_ALLOWED") -> "konfigurim"
                        t.contains("INVALID_EMAIL") -> "emri"
                        else -> "rrjeti"
                    }
                }
            }
            if (gabim != null) return gabim
            try { u.reload().await() } catch (e: Exception) { }
            _perdoruesi.value = Perdoruesi(u.uid, emriRi)
            regjistroPerdoruesin(Perdoruesi(u.uid, emriRi)) // lista e kolegëve e merr emrin e ri menjëherë
            ruajEmrinEFundit(emriRi)
            try { Push.oretELidhura() } catch (e: Exception) { } // Hyrja 78: emri i ri edhe te ora (pa e lidhur prapë)
            null
        } catch (e: Exception) { "rrjeti" }
    }

    /** → null, "rihyrje" (duhet fjalëkalimi aktual), "i-dobet" ose "rrjeti" */
    suspend fun ndryshoFjalekalimin(fjalekalimiRi: String): String? {
        val u = auth.currentUser ?: return "pa-hyrje"
        return try { u.updatePassword(fjalekalimiRi).await(); u.email?.let { tokeniPerOren(it, fjalekalimiRi) }; null } catch (e: Exception) {
            when (e) {
                is com.google.firebase.auth.FirebaseAuthRecentLoginRequiredException -> "rihyrje"
                is FirebaseAuthWeakPasswordException -> "i-dobet"
                else -> "rrjeti"
            }
        }
    }

    /** Konfirmimi me fjalëkalimin aktual (Firebase e kërkon për ndryshimet e llogarisë pas një kohe) → true kur u pranua */
    suspend fun riautentifikohu(fjalekalimiAktual: String): Boolean {
        val u = auth.currentUser ?: return false
        val email = u.email ?: return false
        return try { u.reauthenticate(com.google.firebase.auth.EmailAuthProvider.getCredential(email, fjalekalimiAktual)).await(); true } catch (e: Exception) { false }
    }

    fun emriIFundit(): String = StokuApp.prefs(StokuApp.app).getString("emri_i_fundit", "") ?: ""
    /** "Më mbaj mend emrin e përdoruesit" (si porta.js): parazgjedhja po; fjalëkalimi s'ruhet kurrë */
    fun mbajEmrin(): Boolean = StokuApp.prefsOseB("mbaj_emrin", true)
    fun vendosMbajEmrin(po: Boolean) {
        val e = StokuApp.prefs(StokuApp.app).edit().putBoolean("mbaj_emrin", po)
        if (!po) e.remove("emri_i_fundit") // hiqet menjëherë emri i ruajtur
        e.apply()
    }
    private fun ruajEmrinEFundit(emri: String) { if (mbajEmrin() && emri.isNotEmpty()) StokuApp.vendosPref("emri_i_fundit", emri) }

    private val EMRI_I_ZENE = "Ky emër përdoruesi është i zënë. Zgjidh një tjetër, ose hyr nëse është llogaria jote."

    private fun tekstiGabimit(e: Exception): String = when (e) {
        is FirebaseAuthUserCollisionException -> EMRI_I_ZENE
        is FirebaseAuthWeakPasswordException -> "Fjalëkalimi duhet të ketë të paktën 6 shenja."
        is FirebaseAuthInvalidUserException ->
            if (e.errorCode == "ERROR_USER_DISABLED") "Kjo llogari është çaktivizuar. Kontakto administratorin."
            else "Emri i përdoruesit ose fjalëkalimi është gabim."
        is FirebaseAuthInvalidCredentialsException ->
            if (e.errorCode == "ERROR_INVALID_EMAIL") "Emri i përdoruesit ka shenja të palejuara. Përdor vetëm a–z, 0–9, _ . -"
            else "Emri i përdoruesit ose fjalëkalimi është gabim."
        is FirebaseTooManyRequestsException -> "Shumë prova të gabuara. Prit pak minuta dhe provo përsëri."
        is FirebaseNetworkException -> "S'ka lidhje me internetin. Kontrollo internetin dhe provo përsëri." + detaji(e)
        is FirebaseAuthException -> "S'u hy (" + e.errorCode + "). Provo përsëri pas pak." + detaji(e)
        else -> "S'u lidh me serverin. Kontrollo internetin dhe provo përsëri." + detaji(e)
    }

    /** Arsyeja teknike (e shkurtër) poshtë mesazhit, që gabimi i rrallë të gjendet pa telefon në dorë */
    private fun detaji(e: Exception): String {
        val m = (e.message ?: "").replace(Regex("\\s+"), " ").trim().take(160)
        return "\n(" + e.javaClass.simpleName + (if (m.isNotEmpty()) ": $m" else "") + ")"
    }
}
