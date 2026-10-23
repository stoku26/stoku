package site.stoku.vendas

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.core.view.WindowInsetsControllerCompat
import site.stoku.logjika.Afatet
import site.stoku.vendas.ui.AfatetEkrani
import site.stoku.vendas.ui.CilesimetEkrani
import site.stoku.vendas.ui.DukeULidhur
import site.stoku.vendas.ui.Ik
import site.stoku.vendas.ui.N
import site.stoku.vendas.ui.DritaretEMarketeve
import site.stoku.vendas.ui.GrupiEkrani
import site.stoku.vendas.ui.Porta
import site.stoku.vendas.ui.Shenja
import site.stoku.vendas.ui.Skaneri
import site.stoku.vendas.ui.StokuEkrani
import site.stoku.vendas.ui.StokuTema
import site.stoku.vendas.ui.ToastPamja
import site.stoku.vendas.ui.tx

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge(statusBarStyle = SystemBarStyle.auto(0, 0), navigationBarStyle = SystemBarStyle.auto(0, 0))
        setContent {
            var tema by remember { mutableStateOf(StokuApp.prefsOse("tema", "auto")) }
            StokuTema(tema) {
                val erret = N.erret
                LaunchedEffect(erret) {
                    WindowInsetsControllerCompat(window, window.decorView).apply {
                        isAppearanceLightStatusBars = !erret; isAppearanceLightNavigationBars = !erret
                    }
                }
                Rrenja(tema) { tema = it; StokuApp.vendosPref("tema", it) }
            }
        }
        Perditesimi.kontrollo(this, false)
    }

    override fun onResume() {
        super.onResume()
        Perditesimi.vazhdoNesePritej(this)
        Sinkronizimi.neRikthim()
        Merchandiseri.kontrolloGps(false) // si web-i: vendndodhja kur hapet Stoku (jo më shpesh se 2 min)
    }

    override fun onStart() {
        super.onStart()
        Grupi.vendosPerpara(true) // prania te kolegët e grupit ("Online tani")
    }

    override fun onStop() {
        super.onStop()
        Sinkronizimi.dergoNesePret() // ndryshimi i fundit shkon në cloud edhe kur aplikacioni kalon në sfond
        Grupi.vendosPerpara(false)
    }
}

@Composable
internal fun Rrenja(tema: String, ndryshoTemen: (String) -> Unit) {
    val n = N
    val gati by Llogaria.gati.collectAsState()
    val p by Llogaria.perdoruesi.collectAsState()
    when {
        !gati -> { DukeULidhur(); return }
        p == null -> { Porta(); Box(Modifier.fillMaxSize(), contentAlignment = Alignment.BottomCenter) { ToastPamja(poshte = 40.dp) }; return }
    }
    val lejet by Llogaria.lejet.collectAsState()
    val merch by Llogaria.merchandiserIRegjistrimit.collectAsState()
    remember(lejet, merch) { 0 } // rivizatohet kur ndryshojnë lejet
    var tabi by rememberSaveable { mutableStateOf("stoku") }
    var folderi by rememberSaveable { mutableStateOf<String?>(null) }
    var skanimi by remember { mutableStateOf<((String) -> Unit)?>(null) }
    val g by Dyqani.gjendja.collectAsState()
    val aktiviM by Merchandiseri.aktivi.collectAsState() // numri te tabi Afatet sipas marketit ku je
    val njGr by Grupi.njoftimet.collectAsState()
    val ftGr by Grupi.ftesatEMia.collectAsState()
    val krGr by Grupi.kerkesatEGrupit.collectAsState()
    val ngjGr by Grupi.ngjarjet.collectAsState()
    val gjGr by Grupi.gjendja.collectAsState()

    // Pjesa e parë e lejuar (pa "Stoku" hapet "Afatet")
    val tabet = listOfNotNull(
        if (Llogaria.leja("stoku")) Triple("stoku", "Stoku", Ik.Stoku) else null,
        if (Llogaria.leja("afatet")) Triple("afatet", "Afatet", Ik.Afatet) else null,
        if (Llogaria.leja("grupi")) Triple("grupi", "Grupi", Ik.Grupi) else null,
        Triple("cilesimet", "Cilësimet", Ik.Cilesimet)
    )
    if (tabet.none { it.first == tabi }) tabi = tabet.first().first

    BackHandler(enabled = skanimi == null && (folderi != null || tabi != tabet.first().first)) {
        if (tabi == "stoku" && folderi != null) folderi = null else tabi = tabet.first().first
    }

    Box(Modifier.fillMaxSize().background(n.bg)) {
        // Brenda një folderi shiriti me tabe fshihet (si te web-i: faqja e folderit zë krejt ekranin)
        val meTabe = !(tabi == "stoku" && folderi != null)
        Column(Modifier.fillMaxSize()) {
            Box(Modifier.weight(1f).statusBarsPadding().then(if (meTabe) Modifier else Modifier.navigationBarsPadding())) {
                val skano: ((String) -> Unit) -> Unit = { cb -> skanimi = cb }
                when (tabi) {
                    "stoku" -> StokuEkrani(folderi, { folderi = it }, skano)
                    "afatet" -> AfatetEkrani(skano)
                    "grupi" -> GrupiEkrani()
                    else -> CilesimetEkrani(tema, ndryshoTemen)
                }
            }
            // Shiriti me tabe poshtë
            if (meTabe) Box(Modifier.fillMaxWidth().height(1.dp).background(n.line))
            if (meTabe) Row(Modifier.fillMaxWidth().background(n.surface).navigationBarsPadding().height(64.dp)) {
                val nAf = remember(g, aktiviM, lejet, merch) { Afatet.numero(Merchandiseri.afatetEMarketit(g.afatet)) }
                val nGr = remember(njGr, ftGr, krGr, ngjGr, gjGr) { Grupi.numriNjoftimeve() + Grupi.numriKerkesave() } // si te web-i: zilja + ftesat/kërkesat
                tabet.forEach { (k, t, ik) ->
                    val nr = when (k) { "afatet" -> nAf.skaduar + nAf.afer + nAf.paDate; "grupi" -> nGr; else -> 0 }
                    val shenja = nr.takeIf { it > 0 }?.let { if (it > 99) "99+" else it.toString() }
                    Tabi(t, ik, tabi == k, shenja, Modifier.weight(1f)) {
                        if (k == "stoku" && tabi == "stoku") folderi = null
                        tabi = k
                    }
                }
            }
        }
        ToastPamja(Modifier.align(Alignment.BottomCenter), poshte = if (meTabe) 90.dp else 40.dp)
        DritaretEMarketeve(hapMarketet = { tabi = "cilesimet"; Merchandiseri.hapFaqen.value = true })
        skanimi?.let { cb ->
            Skaneri(mbyll = { skanimi = null }) { b -> skanimi = null; cb(b) }
        }
    }
}

@Composable
private fun Tabi(t: String, ik: ImageVector, aktiv: Boolean, shenja: String?, modifier: Modifier, onClick: () -> Unit) {
    val n = N
    val ngjyra = if (aktiv) n.accentText else n.faint
    Column(modifier.fillMaxSize().clickable(interactionSource = remember { MutableInteractionSource() }, indication = null, onClick = onClick),
        horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = androidx.compose.foundation.layout.Arrangement.Center) {
        Box {
            Icon(ik, t, Modifier.size(26.dp), tint = ngjyra)
            if (shenja != null) Shenja(shenja, Modifier.align(Alignment.TopEnd).offset(x = 12.dp, y = (-6).dp))
        }
        Text(t, style = tx(11, if (aktiv) 600 else 500, ngjyra), modifier = Modifier.padding(top = 4.dp))
    }
}
