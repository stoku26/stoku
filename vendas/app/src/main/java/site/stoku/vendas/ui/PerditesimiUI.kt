package site.stoku.vendas.ui

import android.app.Activity
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import site.stoku.vendas.BuildConfig
import site.stoku.vendas.Perditesimi

/**
 * Hyrja 33 (pronari zgjodhi "ideja 5"): versioni i ri si faqe e plotë me pamjen e Stoku-t (jo dritarja gri e Android-it):
 * ikona, "Përditëso Stoku-n", versioni i tanishëm → i riu, "Çka ka të re" dhe butoni i madh poshtë. Shkarkimi vazhdon në të njëjtën
 * faqe (shiriti, sa MB, "Anulo"). Del sa herë hyn në aplikacion kur ka version të ri (Perditesimi.kontrollo).
 */
@Composable
fun PerditesimiFaqja() {
    val g by Perditesimi.gjendja.collectAsState()
    val x = g ?: return
    val n = N
    val a = LocalContext.current as? Activity
    val shkarkim = x.faza == "shkarkim"
    BackHandler { if (shkarkim) Perditesimi.anulo() else Perditesimi.mbyll() }
    Column(Modifier.fillMaxSize().background(n.bg)
        .clickable(interactionSource = remember { MutableInteractionSource() }, indication = null) { } // prekjet s'kalojnë poshtë
        .statusBarsPadding().navigationBarsPadding().padding(start = 22.dp, end = 22.dp, top = 24.dp, bottom = 18.dp)) {
        Column(Modifier.weight(1f).fillMaxWidth().verticalScroll(rememberScrollState()), horizontalAlignment = Alignment.CenterHorizontally) {
            Box(Modifier.padding(top = 36.dp).size(96.dp).clip(RoundedCornerShape(30.dp)).background(n.accentTint), contentAlignment = Alignment.Center) {
                Icon(Ik.Shkarko, null, Modifier.size(46.dp), tint = n.accentText)
            }
            Text(if (shkarkim) "Duke e shkarkuar…" else "Përditëso Stoku-n", style = tx(28, 700, n.ink, -0.025), textAlign = TextAlign.Center,
                modifier = Modifier.padding(top = 22.dp))
            Row(Modifier.padding(top = 14.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                CipiIVersionit("0.1.${BuildConfig.VERSION_CODE}", n.surface2, n.muted)
                Text("→", style = tx(18, 500, n.muted))
                CipiIVersionit("0.1.${x.n}", n.accentTint, n.accentText)
            }
            if (shkarkim) {
                val pjesa = if (x.gjithsej > 0) (x.lexuar.toFloat() / x.gjithsej).coerceIn(0f, 1f) else 0f
                Box(Modifier.padding(top = 30.dp).fillMaxWidth().height(10.dp).clip(RoundedCornerShape(5.dp)).background(n.surface2)) {
                    Box(Modifier.fillMaxWidth(pjesa).height(10.dp).clip(RoundedCornerShape(5.dp)).background(n.accent))
                }
                Text(when {
                    x.gjithsej > 0 -> Perditesimi.mb(x.lexuar) + " nga " + Perditesimi.mb(x.gjithsej) + " (" + (pjesa * 100).toInt() + "%)"
                    x.lexuar > 0 -> Perditesimi.mb(x.lexuar)
                    else -> "Duke u lidhur…"
                }, style = tx(14, 500, n.muted), modifier = Modifier.padding(top = 10.dp))
            }
            if (x.faza == "gabim") Text(x.mesazhi, style = txR(14f, 500, n.exp), textAlign = TextAlign.Center, modifier = Modifier.padding(top = 18.dp))
            val pikat = x.teReja.flatMap { it.pikat }.take(6)
            if (pikat.isNotEmpty() && !shkarkim) {
                Column(Modifier.padding(top = 26.dp).fillMaxWidth().clip(RoundedCornerShape(20.dp)).background(n.surface)
                    .border(1.dp, n.line, RoundedCornerShape(20.dp)).padding(start = 16.dp, end = 16.dp, top = 14.dp, bottom = 16.dp)) {
                    Text("ÇKA KA TË RE", style = tx(12, 700, n.muted, 0.06))
                    pikat.forEach { t ->
                        Row(Modifier.padding(top = 10.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            Box(Modifier.size(22.dp).clip(RoundedCornerShape(7.dp)).background(n.okTint), contentAlignment = Alignment.Center) {
                                Icon(Ik.Kontroll, null, Modifier.size(14.dp), tint = n.ok)
                            }
                            Text(t, style = txR(14f, 400, n.ink2, 1.35f), modifier = Modifier.weight(1f))
                        }
                    }
                }
            }
            Text("Të dhënat dhe hyrja mbeten siç janë.", style = txR(13.5f, 400, n.muted), textAlign = TextAlign.Center, modifier = Modifier.padding(top = 16.dp))
        }
        if (shkarkim) Buton("Anulo", { Perditesimi.anulo() }, Modifier.fillMaxWidth(), lloji = "dyte", lartesia = 56.dp)
        else {
            Buton(if (x.faza == "gabim") "Provo prapë" else "Përditëso tani", { a?.let { Perditesimi.shkarko(it) } }, Modifier.fillMaxWidth(), lartesia = 56.dp)
            Text("Më vonë", style = tx(15, 600, n.muted), textAlign = TextAlign.Center,
                modifier = Modifier.padding(top = 6.dp).fillMaxWidth().clip(RoundedCornerShape(12.dp)).clickable { Perditesimi.mbyll() }.padding(vertical = 12.dp))
        }
    }
}

/** Versioni si "cip" i rrumbullakët (i tanishmi gri, i riu blu) */
@Composable
private fun CipiIVersionit(t: String, sfondi: Color, ngjyra: Color) {
    Text(t, style = tx(14, 600, ngjyra), modifier = Modifier.clip(RoundedCornerShape(50)).background(sfondi).padding(horizontal = 12.dp, vertical = 6.dp))
}
