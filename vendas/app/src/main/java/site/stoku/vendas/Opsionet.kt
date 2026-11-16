package site.stoku.vendas

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

/**
 * Opsionet e kësaj pajisjeje (si `opsione` te app-tel.js): madhësia e shkronjave dhe skanimi. Ruhen vetëm në telefon.
 * Parazgjedhjet si te web-i: tingulli dhe kursori te barkodi të ndezur, PDA dhe "pa emër" të fikur.
 */
object Opsionet {
    private fun b(k: String, ose: Boolean) = MutableStateFlow(StokuApp.prefsOseB(k, ose))

    private val _madhesia = MutableStateFlow(StokuApp.prefsOse("madhesia", "normale"))
    /** "normale" ose "e_madhe" (tekst dhe butona pak më të mëdhenj) */
    val madhesia: StateFlow<String> get() = _madhesia
    private val _pda = b("pda", false)
    /** PDA me skaner të brendshëm: ekrani në portret, pa butonin e kamerës, kursori gjithmonë te barkodi */
    val pda: StateFlow<Boolean> get() = _pda
    private val _paTastiere = b("pa_tastiere", false)
    /** Vetëm me PDA: tastiera në ekran s'del (shkruhet me tastierën dhe skanerin e PDA-së) */
    val paTastiere: StateFlow<Boolean> get() = _paTastiere
    private val _paEmer = b("pa_emer", false)
    /** Produktet e reja regjistrohen pa emër (s'rekomandohet) */
    val paEmer: StateFlow<Boolean> get() = _paEmer
    private val _tingulli = b("tingull", true)
    val tingulli: StateFlow<Boolean> get() = _tingulli
    // para _vendiFab: fushat e object-it inicializohen me radhë (përndryshe "Variable 'VENDET_FAB' must be initialized")
    val VENDET_FAB = listOf("majtas", "mes", "djathtas")
    private val _vendiFab = MutableStateFlow(StokuApp.prefsOse("vendi_fab", "mes").takeIf { it in VENDET_FAB } ?: "mes")
    /** Hyrja 32 (pronari): butoni blu/i verdhë i skanimit brenda folderit: "majtas", "mes" (parazgjedhja për krejt) ose "djathtas" */
    val vendiFab: StateFlow<String> get() = _vendiFab
    private val _kursori = b("kursori", true)
    /** Pas ruajtjes, kursori kthehet te fusha e barkodit (për skanerin me USB ose Bluetooth) */
    val kursori: StateFlow<Boolean> get() = _kursori

    private val _tema = MutableStateFlow(StokuApp.prefsOse("tema", "auto").takeIf { it == "light" || it == "dark" } ?: "auto")
    /** Hyrja 73 (web v311): "auto", "light" ose "dark"; ruhet edhe te llogaria (Llogaria.ruajPamjen) */
    val tema: StateFlow<String> get() = _tema
    fun vendosTemen(v: String) { _tema.value = v; StokuApp.vendosPref("tema", v); Llogaria.ruajPamjen() }
    fun pamjaEParazgjedhur(): Boolean = _tema.value == "auto" && _ngjyratE.value == 1 && _ngjyratC.value == 1 &&
        _logoja.value == site.stoku.vendas.ui.Logot.PARAZGJEDHJA
    /** Nga llogaria (pa e ruajtur prapë): tema, ngjyrat dhe logoja që i ka zgjedhur përdoruesi në një pajisje tjetër */
    fun zbatoPamjenNgaLlogaria(t: String?, e: Int?, c: Int?, logo: String? = null) {
        val tema = if (t == "light" || t == "dark") t else "auto"
        val ne = e?.takeIf { it in 1..10 } ?: 1
        val nc = c?.takeIf { it in 1..10 } ?: 1
        val lg = site.stoku.vendas.ui.Logot.varianti(logo).id
        if (_logoja.value != lg) { _logoja.value = lg; StokuApp.vendosPref("logoja", lg) }
        if (_tema.value != tema) { _tema.value = tema; StokuApp.vendosPref("tema", tema) }
        if (_ngjyratE.value != ne) { _ngjyratE.value = ne; StokuApp.vendosPref("ngjyrat_e", ne.toString()) }
        if (_ngjyratC.value != nc) { _ngjyratC.value = nc; StokuApp.vendosPref("ngjyrat_c", nc.toString()) }
    }
    private fun nrTeme(k: String) = MutableStateFlow(StokuApp.prefsOse(k, "1").toIntOrNull()?.takeIf { it in 1..10 } ?: 1)
    private val _ngjyratE = nrTeme("ngjyrat_e")
    private val _ngjyratC = nrTeme("ngjyrat_c")
    /** Hyrja 72 (web v310): tema e errët (1..10) dhe e çelët (1..10) te Cilësimet → Pamja → Ngjyrat; 1 = ngjyrat e deritanishme */
    val ngjyratE: StateFlow<Int> get() = _ngjyratE
    val ngjyratC: StateFlow<Int> get() = _ngjyratC
    fun vendosNgjyratE(n: Int) { if (n !in 1..10) return; _ngjyratE.value = n; StokuApp.vendosPref("ngjyrat_e", n.toString()); Llogaria.ruajPamjen() }
    fun vendosNgjyratC(n: Int) { if (n !in 1..10) return; _ngjyratC.value = n; StokuApp.vendosPref("ngjyrat_c", n.toString()); Llogaria.ruajPamjen() }
    private val _logoja = MutableStateFlow(site.stoku.vendas.ui.Logot.varianti(StokuApp.prefsOse("logoja", site.stoku.vendas.ui.Logot.PARAZGJEDHJA)).id)
    /** Hyrja 75 (web v313): logoja 60 me njërin nga 25 kombinimet e ngjyrave (Cilësimet → Pamja → Logoja); ruhet edhe te llogaria */
    val logoja: StateFlow<String> get() = _logoja
    fun vendosLogon(id: String) {
        val v = site.stoku.vendas.ui.Logot.varianti(id).id
        if (_logoja.value == v) return
        _logoja.value = v; StokuApp.vendosPref("logoja", v); Llogaria.ruajPamjen()
    }

    fun tastieraEFshehur(): Boolean = _pda.value && _paTastiere.value

    fun vendosMadhesine(v: String) { _madhesia.value = v; StokuApp.vendosPref("madhesia", v) }
    fun vendosPda(v: Boolean) { _pda.value = v; StokuApp.vendosPrefB("pda", v) }
    fun vendosPaTastiere(v: Boolean) { _paTastiere.value = v; StokuApp.vendosPrefB("pa_tastiere", v) }
    fun vendosPaEmer(v: Boolean) { _paEmer.value = v; StokuApp.vendosPrefB("pa_emer", v) }
    fun vendosTingullin(v: Boolean) { _tingulli.value = v; StokuApp.vendosPrefB("tingull", v) }
    fun vendosKursorin(v: Boolean) { _kursori.value = v; StokuApp.vendosPrefB("kursori", v) }
    fun vendosVendinEFabit(v: String) { if (v !in VENDET_FAB) return; _vendiFab.value = v; StokuApp.vendosPref("vendi_fab", v) }
}
