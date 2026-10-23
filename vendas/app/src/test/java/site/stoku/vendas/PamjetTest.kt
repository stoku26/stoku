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
    override fun onCreate() { super.onCreate(); StokuApp.vendosPerProve(this); StokuApp.prefs(this).edit().putInt("te_rejat_pare", 999).apply() }
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
    /** I fundit me këtë tekst (p.sh. brenda një dritareje mbi faqe) */
    private fun klikoFundit(t: String) { val l = r.onAllNodesWithText(t); l[l.fetchSemanticsNodes().size - 1].performClick(); r.waitForIdle() }

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

    /** Merchandiseri me dy markete: "Krejt marketet" (afatet sipas marketit), "Ku je?" me marketet afër, Cilësimet → Marketet */
    @Test fun merchandiseri() {
        mbush()
        val t = System.currentTimeMillis()
        val sot = LocalDate.now()
        fun data(n: Long) = Afatet.isoNgaData(sot.plusDays(n))
        val g0 = Dyqani.g
        Dyqani.vendosPerProve(g0.copy(
            marketet = listOf(
                obj("id" to "kp1", "emri" to "Viva Fly", "lat" to 42.66290, "lng" to 21.16550, "p" to "p1", "ndryshuarSe" to t),
                obj("id" to "kp2", "emri" to "Albi Mall", "lat" to 42.64920, "lng" to 21.14600, "p" to "p2", "ndryshuarSe" to t)
            ),
            afatet = listOf(
                obj("id" to "a1", "barkodi" to "389001000", "emri" to "Kos Vita 500g", "data" to data(-2), "sasia" to 3L, "statusi" to "aktiv", "ndryshuarSe" to t, "m" to "kp1"),
                obj("id" to "a2", "barkodi" to "389001001", "emri" to "Qumësht Vita 1L", "data" to data(0), "sasia" to 6L, "statusi" to "aktiv", "ndryshuarSe" to t, "m" to "kp1"),
                obj("id" to "a3", "barkodi" to "389001002", "emri" to "Djathë i bardhë", "data" to data(4), "sasia" to 2L, "statusi" to "aktiv", "ndryshuarSe" to t, "m" to "kp2"),
                obj("id" to "a4", "barkodi" to "389001003", "emri" to "Jogurt 200g", "data" to data(12), "sasia" to 10L, "statusi" to "aktiv", "ndryshuarSe" to t, "m" to "kp2")
            )
        ))
        Llogaria.vendosPerProve(Perdoruesi("u1", "besa"), merchandiser = true)
        Merchandiseri.vendosPerProve(listOf(
            obj("id" to "p1", "emri" to "Viva Fly", "lat" to 42.66290, "lng" to 21.16550),
            obj("id" to "p2", "emri" to "Albi Mall", "lat" to 42.64920, "lng" to 21.14600),
            obj("id" to "p3", "emri" to "Meridian", "lat" to 42.66320, "lng" to 21.16610)
        ), null)
        r.setContent { StokuTema("light") { Rrenja("light") {} } }
        foto("light-09-merch-stoku")
        kliko("Afatet")
        foto("light-10-merch-afatet")
        Merchandiseri.dritarja.value = Merchandiseri.Dritarja.KuJe("zgjidh", site.stoku.logjika.Marketet.Pozita(42.66300, 21.16520, 12.0), true)
        fotoEkrani("light-11-kuje")
        klikoFundit("Viva Fly")
        foto("light-12-je-te")
        kliko("Cilësimet")
        kliko("Marketet")
        fotoEkrani("light-13-marketet")
        Llogaria.vendosPerProve(Perdoruesi("u1", "besa"))
    }

    /** Grupi: të njëjtat të dhëna si pamjet e web-it (scratchpad foto-grupi.js): besa (admin), agim, drini */
    private fun mbushGrupin(): Long {
        val t = System.currentTimeMillis()
        val sot = LocalDate.now()
        fun data(n: Long) = Afatet.isoNgaData(sot.plusDays(n))
        val afA = listOf(
            obj("id" to "b1", "barkodi" to "389002000", "emri" to "Lëng Molle 1L", "data" to data(-5), "sasia" to 4L, "statusi" to "aktiv", "ndryshuarSe" to t, "furnizuesi" to "Frutomania"),
            obj("id" to "b2", "barkodi" to "389002001", "emri" to "Biskota 200g", "data" to data(7), "sasia" to 12L, "statusi" to "aktiv", "ndryshuarSe" to t, "furnizuesi" to "Plazma"),
            obj("id" to "b3", "barkodi" to "389002002", "emri" to "Çokollatë 100g", "data" to data(-1), "sasia" to 2L, "statusi" to "hequr", "hequrSe" to t - 3600_000L, "hequrNga" to "agim", "ndryshuarSe" to t)
        )
        val afD = listOf(obj("id" to "c1", "barkodi" to "389003000", "emri" to "Ujë Dea 0.5L", "data" to data(20), "sasia" to 24L, "statusi" to "aktiv", "ndryshuarSe" to t, "furnizuesi" to "Dea"))
        val an = listOf(
            obj("uid" to "u1", "emri" to "besa", "roli" to "pronar", "pronar" to true, "aktivSe" to t, "online" to true, "platforma" to "tel", "kycurSe" to t - 30 * 86_400_000L),
            obj("uid" to "u2", "emri" to "agim", "roli" to "anetar", "pronar" to false, "aktivSe" to t - 60_000L, "online" to true, "platforma" to "tel", "kycurSe" to t - 20 * 86_400_000L),
            obj("uid" to "u3", "emri" to "drini", "roli" to "anetar", "pronar" to false, "aktivSe" to t - 5 * 3600_000L, "online" to false, "platforma" to "pc", "kycurSe" to t - 10 * 86_400_000L)
        )
        val perm = mapOf<String, Obj>("u2" to obj("emri" to "agim", "afatet" to afA), "u3" to obj("emri" to "drini", "afatet" to afD))
        val ngj = listOf<Obj>(
            obj("id" to "e2", "lloji" to "hequr", "pronariUid" to "u2", "pronariEmri" to "agim", "afatId" to "b3", "produkti" to "Çokollatë 100g", "barkodi" to "389002002",
                "data" to data(-1), "uid" to "u2", "emri" to "agim", "koha" to t - 3600_000L),
            obj("id" to "e1", "lloji" to "afate-te-reja", "n" to 3L, "uid" to "u2", "emri" to "agim", "koha" to t - 2 * 3600_000L)
        )
        Grupi.vendosPerProve(Grupi.Gjendja("anetar", "g1", "pronar"), obj("id" to "g1", "emri" to "Market Besa", "pronarUid" to "u1", "pronarEmri" to "besa"),
            an, perm, ngj, "u1", "besa",
            kerkesatEGrupit = listOf(obj("id" to "g1_u4", "gid" to "g1", "grupiEmri" to "Market Besa", "uid" to "u4", "emri" to "era", "koha" to t - 600_000L)),
            nj = listOf(obj("id" to "nj1", "lloji" to "hequr", "afatId" to "a1", "produkti" to "Kos Vita 500g", "barkodi" to "389001000", "data" to data(-2),
                "grupi" to "g1", "uid" to "u2", "emri" to "agim", "koha" to t - 300_000L, "lexuar" to false)))
        return t
    }

    private fun grupi(tema: String) {
        mbush()
        val t = mbushGrupin()
        r.setContent { StokuTema(tema) { Rrenja(tema) {} } }
        kliko("Grupi")
        foto("$tema-g1-pulti")
        kliko("Afatet") // pllaka e menysë (para tabit poshtë)
        foto("$tema-g2-afatet")
        kliko("Aktiviteti")
        foto("$tema-g3-aktiviteti")
        kliko("Kalendari")
        foto("$tema-g4-kalendari")
        kliko("Kolegët")
        foto("$tema-g5-koleget")
        r.onNodeWithContentDescription("Njoftimet").performClick(); r.waitForIdle()
        fotoEkrani("$tema-g6-zilja")
        klikoFundit("Mbyll")
        kliko("Përmbledhja")
        // Pa grup, me një ftesë (si "era" te web-i)
        Grupi.vendosPerProve(Grupi.Gjendja("pa-grup"), null, emptyList(), null, emptyList(), "u4", "era",
            ftesat = listOf(obj("id" to "g9_era", "gid" to "g9", "grupiEmri" to "Viva Fly Ekipi", "ngaUid" to "u9", "ngaEmri" to "arta", "perdoruesi" to "era", "koha" to t - 600_000L)))
        foto("$tema-g7-pa-grup")
    }

    @Test fun grupiECelet() = grupi("light")
    @Test fun grupiEErret() = grupi("dark")

    /** Cilësimet: një dritare (Skanimi, Pamja, Llogaria, Çka ka të re) */
    private fun cilesimi(rreshti: String, emri: String) {
        mbush()
        r.setContent { StokuTema("light") { Rrenja("light") {} } }
        kliko("Cilësimet")
        kliko(rreshti)
        fotoEkrani("light-$emri")
    }
    @Test fun cilesimetSkanimi() = cilesimi("Skanimi", "14-skanimi")
    @Test fun cilesimetPamja() = cilesimi("Pamja", "15-pamja")
    @Test fun cilesimetLlogaria() = cilesimi("Llogaria", "16-llogaria")
    @Test fun cilesimetTeRejat() = cilesimi("Çka ka të re", "17-terejat")

    /** Excel/PDF: skedari gati ("Dërgo në PC", "Ruaje në telefon", "Ndaje"), Excel-i i afateve, importi */
    @Test fun eksportet() {
        mbush()
        r.setContent { StokuTema("light") { Rrenja("light") {} } }
        kliko("Pije")
        foto("light-18-folderi-excel")
        kliko("Eksporto Excel")
        fotoEkrani("light-19-skedari")
        kliko("Anulo")
        r.onNodeWithContentDescription("Foldera").performClick(); r.waitForIdle()
        kliko("Afatet")
        kliko("Eksporto Excel")
        fotoEkrani("light-20-afatet-excel")
        klikoFundit("Anulo")
        kliko("Importo Excel")
        fotoEkrani("light-21-importi")
    }

    @Test fun porta() {
        Llogaria.vendosPerProve(null)
        r.setContent { StokuTema("light") { Porta() } }
        foto("light-00-porta")
    }
}
