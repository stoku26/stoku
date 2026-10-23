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
    private val _kursori = b("kursori", true)
    /** Pas ruajtjes, kursori kthehet te fusha e barkodit (për skanerin me USB ose Bluetooth) */
    val kursori: StateFlow<Boolean> get() = _kursori

    fun tastieraEFshehur(): Boolean = _pda.value && _paTastiere.value

    fun vendosMadhesine(v: String) { _madhesia.value = v; StokuApp.vendosPref("madhesia", v) }
    fun vendosPda(v: Boolean) { _pda.value = v; StokuApp.vendosPrefB("pda", v) }
    fun vendosPaTastiere(v: Boolean) { _paTastiere.value = v; StokuApp.vendosPrefB("pa_tastiere", v) }
    fun vendosPaEmer(v: Boolean) { _paEmer.value = v; StokuApp.vendosPrefB("pa_emer", v) }
    fun vendosTingullin(v: Boolean) { _tingulli.value = v; StokuApp.vendosPrefB("tingull", v) }
    fun vendosKursorin(v: Boolean) { _kursori.value = v; StokuApp.vendosPrefB("kursori", v) }
}
