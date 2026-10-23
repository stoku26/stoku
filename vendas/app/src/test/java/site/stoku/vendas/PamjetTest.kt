package site.stoku.vendas

import android.app.Application
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performClick
import com.github.takahirom.roborazzi.ExperimentalRoborazziApi
import com.github.takahirom.roborazzi.captureRoboImage
import com.github.takahirom.roborazzi.captureScreenRoboImage
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
import site.stoku.vendas.ui.Porta
import site.stoku.vendas.ui.StokuTema
import java.time.LocalDate

/** Aplikacioni pa Firebase për testet e pamjeve */
class ProvaApp : Application() {
    override fun onCreate() { super.onCreate(); StokuApp.vendosPerProve(this) }
}

/**
 * Pamjet e ekraneve (si teste/… për web-in): të njëjtat të dhëna shembull si pamjet e web-it, e çelët dhe e errët.
 * Dalja: skedarët PNG te app/build/pamjet (GitHub Actions i jep si blob-e, për krahasim me web-in).
 */
@OptIn(ExperimentalRoborazziApi::class)
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [34], qualifiers = "w390dp-h844dp-xhdpi", application = ProvaApp::class)
class PamjetTest {
    @get:Rule val r = createComposeRule()

    private fun mbush() {
        val t = System.currentTimeMillis()
        val sot = LocalDate.now()
        fun data(n: Long) = Afatet.isoNgaData(sot.plusDays(n))
        val pm = LinkedHashMap<String, Obj>()
        listOf("Ujë Rugove 1.5L", "Coca Cola 0.5L", "Fanta 1L", "Lëng Pjeshke 1L", "Birra Peja 0.5L", "Ujë Dea 0.5L").forEachIndexed { i, e ->
            val p = obj("kategoriaId" to "pije", "barkodi" to "38900" + (1000 + i), "emri" to e, "sasia" to ((i * 7) % 23 + 1).toLong(), "prekurSe" to t - i * 60000L)
            pm[Bashkimi.celesi("pije", p["barkodi"])] = p
        }
        listOf("Miell 1kg", "Sheqer 1kg", "Oriz 500g").forEachIndexed { i, e ->
            val p = obj("kategoriaId" to "ushqimore", "barkodi" to "38911" + (1000 + i), "emri" to e, "sasia" to (5 + i).toLong(), "prekurSe" to t - i * 60000L)
            pm[Bashkimi.celesi("ushqimore", p["barkodi"])] = p
        }
        val afatet = listOf(
            obj("id" to "a1", "barkodi" to "389001000", "emri" to "Kos Vita 500g", "data" to data(-2), "sasia" to 3L, "statusi" to "aktiv", "ndryshuarSe" to t, "furnizuesi" to "Vita"),
            obj("id" to "a2", "barkodi" to "389001001", "emri" to "Qumësht Vita 1L", "data" to data(0), "sasia" to 6L, "statusi" to "aktiv", "ndryshuarSe" to t, "furnizuesi" to "Vita"),
            obj("id" to "a3", "barkodi" to "389001002", "emri" to "Djathë i bardhë", "data" to data(4), "sasia" to 2L, "statusi" to "aktiv", "ndryshuarSe" to t, "furnizuesi" to "Bylmeti"),
            obj("id" to "a4", "barkodi" to "389001003", "emri" to "Jogurt 200g", "data" to data(12), "sasia" to 10L, "statusi" to "aktiv", "ndryshuarSe" to t, "furnizuesi" to "Bylmeti"),
            obj("id" to "a5", "barkodi" to "389001004", "emri" to "Bukë e zezë", "data" to data(45), "sasia" to 4L, "statusi" to "aktiv", "ndryshuarSe" to t)
        )
        Dyqani.vendosPerProve(Gjendja(
            foldera = listOf(obj("id" to "ushqimore", "emri" to "Ushqimore"), obj("id" to "pije", "emri" to "Pije"), obj("id" to "higjiene", "emri" to "Higjiene"), obj("id" to "fresh", "emri" to "Fresh")),
            produktet = pm, afatet = afatet, pronari = "u1"
        ))
        Llogaria.vendosPerProve(Perdoruesi("u1", "besa"))
    }

    private fun foto(emri: String) { r.waitForIdle(); r.onRoot().captureRoboImage("build/pamjet/$emri.png") }
    private fun fotoEkrani(emri: String) { r.waitForIdle(); captureScreenRoboImage("build/pamjet/$emri.png") }
    private fun kliko(t: String) { r.onAllNodesWithText(t)[0].performClick(); r.waitForIdle() }

    private fun krejt(tema: String) {
        mbush()
        r.setContent { StokuTema(tema) { Rrenja(tema) {} } }
        foto("$tema-01-stoku")
        kliko("Pije")
        foto("$tema-02-folderi")
        kliko("Ujë Rugove 1.5L")
        fotoEkrani("$tema-03-produkti")
        kliko("Anulo")
        r.onNodeWithContentDescription("Foldera").performClick(); r.waitForIdle() // brenda folderit s'ka tabe (si te web-i)
        kliko("Afatet")
        foto("$tema-04-afatet")
        kliko("Shto")
        fotoEkrani("$tema-05-afati-ri")
        kliko("Anulo")
        kliko("Cilësimet")
        foto("$tema-06-cilesimet")
    }

    @Test fun eCelet() = krejt("light")
    @Test fun eErret() = krejt("dark")

    /** "Kontrollo fletën": foto provë (fletë e bardhë me rreshta) dhe përgjigje e AI-së pa rrjet */
    private fun fleta(tema: String, stok: Boolean = false) {
        mbush()
        val ctx = org.robolectric.RuntimeEnvironment.getApplication()
        val bm = android.graphics.Bitmap.createBitmap(1200, 1600, android.graphics.Bitmap.Config.ARGB_8888)
        val c = android.graphics.Canvas(bm)
        c.drawColor(android.graphics.Color.WHITE)
        val p = android.graphics.Paint().apply { color = android.graphics.Color.BLACK; textSize = 44f; isAntiAlias = true }
        listOf("389001000   Kos Vita 500g   26.10.26   6", "389001002   Djathe        3?.1?.26   2", "             Jogurt 200g   22.10.26   12").forEachIndexed { i, t ->
            c.drawText(t, 60f, 200f + i * 120f, p)
        }
        val f = java.io.File(ctx.cacheDir, "fleta-prove.jpg")
        f.outputStream().use { bm.compress(android.graphics.Bitmap.CompressFormat.JPEG, 90, it) }
        val sot = LocalDate.now()
        LeximiAI.lexoPerProve = if (stok) { _ ->
            LeximiAI.Rez.Ok(listOf(
                obj("barkodi" to "389001000", "emri" to "Ujë Rugove 1.5L", "sasia" to "60+30", "furnizuesi" to "Rugove"),
                obj("barkodi" to "389009999", "emri" to "Lëng Molle 1L", "sasia" to 12L),
                obj("barkodi" to "", "emri" to "Çaj i zi", "sasia" to "")
            ).map { Afatet.normalizoRreshtin(it) })
        } else { _ ->
            LeximiAI.Rez.Ok(listOf(
                obj("barkodi" to "389001000", "emri" to "Kos Vita 500g", "data" to Afatet.isoNgaData(sot.plusDays(3)), "data_origjinale" to "26.10.26", "sasia" to 6L, "furnizuesi" to "Vita"),
                obj("barkodi" to "389001002", "data" to "", "data_origjinale" to "3?.1?.26", "sasia" to "2", "dyshim" to true),
                obj("emri" to "Jogurt 200g", "data" to Afatet.isoNgaData(sot.minusDays(1)), "sasia" to "12")
            ).map { Afatet.normalizoRreshtin(it) })
        }
        val uri = android.net.Uri.fromFile(f)
        // Robolectric i lexon skedarët e ContentResolver-it vetëm kur regjistrohen
        org.robolectric.Shadows.shadowOf(ctx.contentResolver).registerInputStreamSupplier(uri) { java.io.FileInputStream(f) }
        r.setContent { StokuTema(tema) { site.stoku.vendas.ui.FletaEkrani(uri, {}, stok) } }
        // Fotoja përgatitet në një fill tjetër: prit duke e lënë fillin kryesor të punojë
        val pritur = if (stok) "Importo 3 produkte" else "Ruaj 3 afate"
        var gati = false
        for (i in 0 until 400) {
            r.waitForIdle()
            if (r.onAllNodesWithText(pritur).fetchSemanticsNodes(atLeastOneRootRequired = false).isNotEmpty()) { gati = true; break }
            Thread.sleep(50)
        }
        fotoEkrani(if (stok) "$tema-08-lista" else "$tema-07-fleta")
        if (!gati) throw AssertionError("S'u gjet \"$pritur\". Gabimi: " + LeximiAI.gabimiIFundit)
        LeximiAI.lexoPerProve = null
    }

    @Test fun fletaECelet() = fleta("light")
    @Test fun fletaEErret() = fleta("dark")
    @Test fun listaEStokut() = fleta("light", stok = true)

    @Test fun porta() {
        Llogaria.vendosPerProve(null)
        r.setContent { StokuTema("light") { Porta() } }
        foto("light-00-porta")
    }
}
