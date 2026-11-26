package site.stoku.ora

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.wear.compose.foundation.lazy.ScalingLazyColumn
import androidx.wear.compose.foundation.lazy.rememberScalingLazyListState
import androidx.wear.compose.material.Colors
import androidx.wear.compose.material.ListHeader
import androidx.wear.compose.material.MaterialTheme
import androidx.wear.compose.material.PositionIndicator
import androidx.wear.compose.material.Scaffold
import androidx.wear.compose.material.Text
import com.github.takahirom.roborazzi.captureRoboImage
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.time.LocalDate

/**
 * Pronari (26.11.2026: "pamjet sja ke bo ores"): pamjet e orës për Google Play (Wear OS: katrore, të paktën 384 x 384), pa orë të vërtetë.
 * Ekranet e vërteta të aplikacionit (RreshtiAfatit, ChipGrupi, butonat, Detaji, Cilesimet) me të dhëna shembull, pa server:
 * lista kryesore ndërtohet si te ListaEkrani (pamja "Lista"), që s'ka nevojë për internet. Dalja: app/build/pamjet/ora-*.png (454 x 454).
 */
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [34], qualifiers = "w227dp-h227dp-round-xhdpi")
class PamjetOraTest {
    @get:Rule val r = createComposeRule()

    private val sot = LocalDate.now()
    private fun d(n: Long) = sot.plusDays(n).toString()
    private val skaduara = listOf(
        Afat("a1", "Kos 500g", "389001000", d(-2), 4, "Furnizuesi A"),
        Afat("a2", "Jogurt frutash 150g", "389001003", d(-1), 6, "Furnizuesi A"),
    )
    private val sotL = listOf(Afat("a3", "Qumësht 1L", "389001001", d(0), 6, "Furnizuesi A"))
    private val java = listOf(
        Afat("a4", "Djathë i bardhë 400g", "389001002", d(3), 2, "Furnizuesi B"),
        Afat("a5", "Bukë e bardhë 500g", "389001004", d(5), 10, "Furnizuesi C"),
    )

    private fun tema(c: @androidx.compose.runtime.Composable () -> Unit) =
        r.setContent { MaterialTheme(colors = Colors(primary = Verdhe, onPrimary = Color.Black, surface = Kartela)) { c() } }

    private fun foto(emri: String) { r.waitForIdle(); r.onRoot().captureRoboImage("build/pamjet/ora-$emri.png") }

    /** Si ListaEkrani → Pamja.Lista (pa server): të skaduarat, sot, këtë javë, 8 deri 30 ditë, mbi 30 ditë, butonat poshtë */
    @Test fun lista() {
        tema {
            val gjendja = rememberScalingLazyListState()
            Scaffold(positionIndicator = { PositionIndicator(scalingLazyListState = gjendja) }) {
                ScalingLazyColumn(state = gjendja, modifier = Modifier.fillMaxSize().background(Color.Black)) {
                    item { ListHeader { Text("KANË SKADUAR · ${skaduara.size}", color = Kuqe, fontWeight = FontWeight.Bold) } }
                    skaduara.forEach { a -> item { RreshtiAfatit(a, "Skadoi " + dataShkurt(a.data) + (a.sasia?.let { " · $it copë" } ?: ""), Kuqe) {} } }
                    item { ListHeader { Text("SKADOJNË SOT · ${sotL.size}", color = Verdhe, fontWeight = FontWeight.SemiBold) } }
                    sotL.forEach { a -> item { RreshtiAfatit(a, pershkrimi(a), AfatAfer) {} } }
                    item { ListHeader { Text("KËTË JAVË · ${java.size}", color = Gri, fontWeight = FontWeight.SemiBold) } }
                    java.forEach { a -> item { RreshtiAfatit(a, dataShkurt(a.data) + (a.sasia?.let { " · $it copë" } ?: ""), AfatAfer) {} } }
                    item { ChipGrupi("8 deri 30 ditë · 4", "Prek për listën", AfatAfer) {} }
                    item { ChipGrupi("Mbi 30 ditë", "Afat i gjatë", Gjelber) {} }
                    item {
                        Row(Modifier.fillMaxWidth().padding(top = 6.dp), horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically) {
                            ButoniRifresko(duke = false) {}
                            Spacer(Modifier.size(10.dp))
                            ButoniKerko {}
                            Spacer(Modifier.size(10.dp))
                            ButoniCilesimet(kaTeRe = false) {}
                        }
                    }
                }
            }
        }
        foto("1-lista")
    }

    @Test fun detaji() {
        tema { Detaji(skaduara[0], sot = false, skaduar = true, ekipa = true, kurHiqet = {}, kurKerkon = {}, mbrapa = {}) }
        foto("2-detaji")
    }

    @Test fun detajiSot() {
        tema { Detaji(sotL[0], sot = true, ekipa = true, kurHiqet = {}, kurKerkon = {}, mbrapa = {}) }
        foto("3-sot")
    }

    @Test fun cilesimet() {
        tema { Cilesimet(emri = "besa", iRiFillim = null, kurGjendetIRi = {}, kurShkeputet = {}, mbrapa = {}) }
        foto("4-cilesimet")
    }
}
