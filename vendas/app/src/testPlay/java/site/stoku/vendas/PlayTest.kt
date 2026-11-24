package site.stoku.vendas

import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onAllNodesWithContentDescription
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.onRoot
import com.github.takahirom.roborazzi.captureRoboImage
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import site.stoku.logjika.Afatet
import site.stoku.logjika.Bashkimi
import site.stoku.logjika.Obj
import site.stoku.logjika.obj
import site.stoku.vendas.ui.Gjuha
import site.stoku.vendas.ui.StokuTema
import java.time.LocalDate

/**
 * Pronari (24.11.2026): versioni i Play-it = paketa "app.stoku.android", nis në anglisht, asnjë tekst shqip në ekrane.
 * Vetëm për versionin play: gradle :app:testPlayDebugUnitTest --tests site.stoku.vendas.PlayTest
 */
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [34], qualifiers = "w390dp-h844dp-xhdpi", application = ProvaApp::class)
class PlayTest {
    @get:Rule val r = createComposeRule()

    private val SHQIP = Regex("[ëçËÇ]|\\b(dhe|të|nuk|për|nga|një|ose|janë|është|Shto|Ruaj|Fshi|Hiq|Mbyll|Anulo|Krejt|Kërko|Zgjidh|Afatet|Malli|Grupi|Ballina|Dil|Hyr|Skano|Sot|Nesër|copë|ditë)\\b")

    private fun mbush() {
        val t = System.currentTimeMillis()
        val sot = LocalDate.now()
        fun data(n: Long) = Afatet.isoNgaData(sot.plusDays(n))
        val pm = LinkedHashMap<String, Obj>()
        listOf("Water 1.5L", "Cola 0.5L", "Juice 1L").forEachIndexed { i, e ->
            val p = obj("kategoriaId" to "drinks", "barkodi" to "38900" + (1000 + i), "emri" to e, "sasia" to (i + 3).toLong(), "prekurSe" to t - i * 60000L, "furnizuesi" to "Supplier A")
            pm[Bashkimi.celesi("drinks", p["barkodi"])] = p
        }
        val afatet = listOf(
            obj("id" to "a1", "barkodi" to "389001000", "emri" to "Yogurt 500g", "data" to data(-2), "sasia" to 3L, "statusi" to "aktiv", "ndryshuarSe" to t, "furnizuesi" to "Supplier A"),
            obj("id" to "a2", "barkodi" to "389001001", "emri" to "Milk 1L", "data" to data(0), "sasia" to 6L, "statusi" to "aktiv", "ndryshuarSe" to t, "furnizuesi" to "Supplier A"),
            obj("id" to "a3", "barkodi" to "389001002", "emri" to "Cheese", "data" to data(4), "sasia" to 2L, "statusi" to "aktiv", "ndryshuarSe" to t, "furnizuesi" to "Supplier B"),
            obj("id" to "a4", "barkodi" to "389001003", "emri" to "Bread", "data" to data(40), "sasia" to 4L, "statusi" to "aktiv", "ndryshuarSe" to t)
        )
        Dyqani.vendosPerProve(Gjendja(foldera = listOf(obj("id" to "drinks", "emri" to "Drinks")), produktet = pm, afatet = afatet, pronari = "u1"))
        Llogaria.vendosPerProve(Perdoruesi("u1", "besa"))
    }

    /** Krejt tekstet e dukshme të ekranit që duken shqip */
    private fun shqipNeEkran(ku: String, l: MutableList<String>) {
        r.waitForIdle()
        r.onAllNodes(SemanticsMatcher.keyIsDefined(SemanticsProperties.Text), useUnmergedTree = true).fetchSemanticsNodes().forEach { nd ->
            nd.config.getOrNull(SemanticsProperties.Text)?.forEach { a -> if (SHQIP.containsMatchIn(a.text)) l.add("$ku: ${a.text}") }
        }
    }

    /** Pamjet për Play Store në anglisht: app/build/pamjet/play-en-*.png */
    private fun foto(emri: String) { r.waitForIdle(); r.onRoot().captureRoboImage("build/pamjet/play-en-$emri.png") }

    private fun kliko(t: String): Boolean {
        val n = r.onAllNodesWithText(t)
        if (n.fetchSemanticsNodes().isEmpty()) return false
        n[0].performClick(); r.waitForIdle(); return true
    }

    @Test fun paketaDheAnglishtja() {
        assertEquals("app.stoku.android", BuildConfig.APPLICATION_ID)
        assertTrue(BuildConfig.PLAY)
        // telefon i ri: pa zgjedhje të ruajtur → anglisht
        StokuApp.prefs(StokuApp.app).edit().clear().commit()
        Gjuha.nis(StokuApp.app)
        assertTrue("versioni play nis në anglisht", Gjuha.en)
        assertEquals("All", Gjuha.t("Krejt"))
        assertEquals("app.stoku.android.skedaret", StokuApp.app.packageName + ".skedaret")

        mbush()
        r.setContent { StokuTema("light") { Rrenja("light") {} } }
        val l = mutableListOf<String>()
        shqipNeEkran("Home", l); foto("1-home")
        var i = 2
        for (tab in listOf("Stock", "Expiry dates", "Group", "Settings")) { if (kliko(tab)) { shqipNeEkran(tab, l); foto("${i++}-" + tab.lowercase().replace(' ', '-')) } }
        kliko("Stock"); if (kliko("Drinks")) shqipNeEkran("Drinks", l)
        if (r.onAllNodesWithContentDescription("Folders").fetchSemanticsNodes().isNotEmpty()) { r.onAllNodesWithContentDescription("Folders")[0].performClick(); r.waitForIdle() }
        // Cilësimet: çdo faqe
        val faqet = listOf("Pamja", "Skenimi", "Njoftimet", "Marketet", "Ora e dorës", "Lista e furnizuesve", "Llogaria", "Përdoruesit", "Privatësia", "Kushtet e përdorimit").map { Gjuha.t(it) }
        for (f in faqet) {
            kliko("Settings")
            if (kliko(f)) shqipNeEkran("Settings → $f", l)
            if (r.onAllNodesWithContentDescription("Back").fetchSemanticsNodes().isNotEmpty()) { r.onAllNodesWithContentDescription("Back")[0].performClick(); r.waitForIdle() }
        }
        println("PlayTest: tekste shqip: " + l.size); l.take(40).forEach { println("  " + it) }
        assertEquals("tekste shqip në versionin play (anglisht): " + l.take(15), 0, l.size)
    }
}
