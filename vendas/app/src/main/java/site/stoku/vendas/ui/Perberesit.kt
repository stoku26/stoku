package site.stoku.vendas.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

// ---------------- Kartat dhe butonat ----------------

/** Karta e bardhë me vijë 1 px (var(--sb-ring)) */
@Composable
fun Karta(modifier: Modifier = Modifier, rrezja: Dp = 16.dp, sfondi: Color? = null, vija: Color? = null, onClick: (() -> Unit)? = null,
          content: @Composable ColumnScope.() -> Unit) {
    val n = N
    val forma = RoundedCornerShape(rrezja)
    var m = modifier.clip(forma).background(sfondi ?: n.surface, forma).border(1.dp, vija ?: n.line, forma)
    if (onClick != null) m = m.clickable(onClick = onClick)
    Column(m, content = content)
}

/** Butoni i rrumbullakët 44×44 (btn-ikone), me shenjë numri opsionale */
@Composable
fun ButonIkone(ikona: ImageVector, pershkrimi: String, onClick: () -> Unit, modifier: Modifier = Modifier, madhesia: Dp = 46.dp,
               shenja: String? = null, ngjyra: Color? = null) {
    val n = N
    Box(modifier.size(madhesia)) {
        Box(
            Modifier.size(madhesia).clip(CircleShape).background(n.surface).border(1.dp, n.line, CircleShape).clickable(onClick = onClick),
            contentAlignment = Alignment.Center
        ) { Icon(ikona, pershkrimi, Modifier.size(22.dp), tint = ngjyra ?: n.ink) }
        if (shenja != null) Shenja(shenja, Modifier.align(Alignment.TopEnd))
    }
}

/** Shenja e kuqe me numër (af-shenje) */
@Composable
fun Shenja(teksti: String, modifier: Modifier = Modifier, ngjyra: Color? = null) {
    val n = N
    Box(modifier.heightIn(min = 18.dp).clip(RoundedCornerShape(9.dp)).background(ngjyra ?: n.badge).padding(horizontal = 5.dp),
        contentAlignment = Alignment.Center) {
        Text(teksti, style = tx(11, 700, Color.White))
    }
}

/** Butoni kryesor (btn): blu, 48 px, rrezja 14 */
@Composable
fun Buton(teksti: String, onClick: () -> Unit, modifier: Modifier = Modifier, aktiv: Boolean = true, lloji: String = "kryesor",
          ikona: ImageVector? = null, lartesia: Dp = 48.dp) {
    val n = N
    val ia = remember { MutableInteractionSource() }
    val shtypur by ia.collectIsPressedAsState()
    val forma = RoundedCornerShape(14.dp)
    val (sfondi, ngjyra, vija) = when {
        !aktiv -> Triple(n.surface2, n.disabled, null)
        lloji == "dyte" -> Triple(if (shtypur) n.surface2 else n.surface, n.ink, n.line)
        lloji == "tekst" -> Triple(Color.Transparent, n.accentText, null)
        lloji == "rrezik" -> Triple(Color.Transparent, n.exp, null)
        lloji == "kuqe" -> Triple(if (shtypur) n.expInk else n.exp, Color.White, null)
        else -> Triple(if (shtypur) n.accentPress else n.accent, Color.White, null)
    }
    var m = modifier.heightIn(min = lartesia).clip(forma).background(sfondi, forma)
    if (vija != null) m = m.border(1.dp, vija, forma)
    Row(m.clickable(enabled = aktiv, interactionSource = ia, indication = null, onClick = onClick).padding(horizontal = 16.dp),
        horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically) {
        if (ikona != null) { Icon(ikona, null, Modifier.size(18.dp), tint = ngjyra); Spacer(Modifier.width(8.dp)) }
        Text(teksti, style = tx(15, 600, ngjyra), maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
}

/** Lidhje teksti (sb-link): "+ Folder i ri" */
@Composable
fun Lidhje(teksti: String, onClick: () -> Unit, modifier: Modifier = Modifier, ngjyra: Color? = null, madhesia: Int = 13) {
    Text(teksti, style = tx(madhesia, 600, ngjyra ?: N.accentText), modifier = modifier.clip(RoundedCornerShape(6.dp)).clickable(onClick = onClick).padding(vertical = 6.dp, horizontal = 2.dp))
}

// ---------------- Fushat ----------------

/** Fusha e tekstit (input): rrezja 14, vijë 1 px, në fokus vijë blu 2 px */
@Composable
fun Fusha(
    vlera: String, ndrysho: (String) -> Unit, modifier: Modifier = Modifier, placeholder: String = "",
    ikona: ImageVector? = null, tastiera: KeyboardType = KeyboardType.Text, veprimi: ImeAction = ImeAction.Done,
    kurVeprim: (() -> Unit)? = null, fjalekalim: Boolean = false, stili: TextStyle? = null, lartesia: Dp = 50.dp,
    fokusi: FocusRequester? = null, vetemLexim: Boolean = false, djathtas: (@Composable () -> Unit)? = null,
    sfondi: Color? = null, ngjyraTekstit: Color? = null, paVije: Boolean = false, rrezja: Dp = 14.dp
) {
    val n = N
    val ia = remember { MutableInteractionSource() }
    val ne by ia.collectIsFocusedAsState()
    val forma = RoundedCornerShape(rrezja)
    val vija = if (paVije) Color.Transparent else if (ne) n.accent else n.line
    val st = (stili ?: tx(16, 400)).copy(color = ngjyraTekstit ?: n.ink)
    val m = modifier.heightIn(min = lartesia).clip(forma).background(sfondi ?: n.surface, forma).border(if (ne && !paVije) 2.dp else 1.dp, vija, forma)
    BasicTextField(
        value = vlera, onValueChange = ndrysho, singleLine = true, readOnly = vetemLexim,
        textStyle = st, cursorBrush = SolidColor(n.accent), interactionSource = ia,
        visualTransformation = if (fjalekalim) PasswordVisualTransformation() else VisualTransformation.None,
        keyboardOptions = KeyboardOptions(keyboardType = if (fjalekalim) KeyboardType.Password else tastiera, imeAction = veprimi),
        keyboardActions = KeyboardActions(onAny = { kurVeprim?.invoke() }),
        modifier = if (fokusi != null) m.focusRequester(fokusi) else m,
        decorationBox = { brenda ->
            Row(Modifier.padding(horizontal = 14.dp).heightIn(min = lartesia), verticalAlignment = Alignment.CenterVertically) {
                if (ikona != null) { Icon(ikona, null, Modifier.size(20.dp), tint = n.faint); Spacer(Modifier.width(10.dp)) }
                Box(Modifier.weight(1f)) {
                    if (vlera.isEmpty()) Text(placeholder, style = st.copy(color = n.faint), maxLines = 1, overflow = TextOverflow.Ellipsis)
                    brenda()
                }
                if (djathtas != null) { Spacer(Modifier.width(8.dp)); djathtas() }
            }
        }
    )
}

// ---------------- Dritaret ----------------

/** Dritarja nga poshtë (si .dialog te web-i): qoshet 32 px, shiriti gri lart */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun Flete(mbyll: () -> Unit, content: @Composable ColumnScope.() -> Unit) {
    val n = N
    val gjendja = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    ModalBottomSheet(
        onDismissRequest = mbyll, sheetState = gjendja,
        shape = RoundedCornerShape(topStart = 32.dp, topEnd = 32.dp),
        containerColor = n.surface, contentColor = n.ink, scrimColor = n.overlay,
        dragHandle = { Box(Modifier.padding(top = 10.dp, bottom = 14.dp).size(40.dp, 5.dp).clip(RoundedCornerShape(3.dp)).background(n.track)) }
    ) {
        Column(
            Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).padding(horizontal = 20.dp).padding(bottom = 20.dp).navigationBarsPadding().imePadding(),
            verticalArrangement = Arrangement.spacedBy(14.dp), content = content
        )
    }
}

/** Konfirmimi (si konfirmo() te web-i): titulli, teksti, "Anulo" + veprimi */
@Composable
fun Konfirmo(titulli: String, teksti: String, veprimi: String, rrezik: Boolean = true, mbyll: () -> Unit, po: () -> Unit) {
    val n = N
    Dialog(onDismissRequest = mbyll) {
        Column(Modifier.clip(RoundedCornerShape(24.dp)).background(n.surface).padding(22.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text(titulli, style = tx(20, 700, n.ink, -0.02))
            Text(teksti, style = tx(15, 400, n.ink2))
            Row(Modifier.fillMaxWidth().padding(top = 8.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Buton("Anulo", mbyll, Modifier.weight(1f), lloji = "dyte")
                Buton(veprimi, { mbyll(); po() }, Modifier.weight(1f), lloji = if (rrezik) "kuqe" else "kryesor")
            }
        }
    }
}

// ---------------- Njoftimi i shkurtër (toast) ----------------

object Toast {
    private val _teksti = MutableStateFlow<Pair<String, Long>?>(null)
    val teksti: StateFlow<Pair<String, Long>?> get() = _teksti
    fun trego(t: String, ms: Long = 2600) { _teksti.value = t to ms }
    fun pastro() { _teksti.value = null }
}

@Composable
fun ToastPamja(modifier: Modifier = Modifier, poshte: Dp = 90.dp) {
    val n = N
    val t by Toast.teksti.collectAsState()
    var duket by remember { mutableStateOf(false) }
    var teksti by remember { mutableStateOf("") }
    LaunchedEffect(t) {
        val x = t ?: return@LaunchedEffect
        teksti = x.first; duket = true
        delay(x.second)
        duket = false
        Toast.pastro()
    }
    Box(modifier.fillMaxWidth().padding(bottom = poshte, start = 16.dp, end = 16.dp), contentAlignment = Alignment.BottomCenter) {
        AnimatedVisibility(duket, enter = fadeIn(), exit = fadeOut()) {
            Text(teksti, style = tx(14, 500, n.invFg), modifier = Modifier.shadow(8.dp, RoundedCornerShape(14.dp))
                .clip(RoundedCornerShape(14.dp)).background(n.invBg).padding(horizontal = 16.dp, vertical = 12.dp))
        }
    }
}

/** Titulli i seksionit (sb-section__title) me lidhje opsionale djathtas */
@Composable
fun TitulliISeksionit(titulli: String, modifier: Modifier = Modifier, djathtas: (@Composable () -> Unit)? = null) {
    Row(modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Text(titulli, style = tx(17, 700, N.ink, -0.01), modifier = Modifier.weight(1f))
        djathtas?.invoke()
    }
}

/** Ikona me katror me ngjyrë (folder-ikona / ngj-*) */
@Composable
fun IkonaMeNgjyre(ikona: ImageVector, ngj: String, madhesia: Dp = 40.dp, rrezja: Dp = 12.dp, ikonaMadhesia: Dp = 21.dp) {
    val (sf, ng) = N.ikonat[ngj] ?: N.ikonat["gri"]!!
    Box(Modifier.size(madhesia).clip(RoundedCornerShape(rrezja)).background(sf), contentAlignment = Alignment.Center) {
        Icon(ikona, null, Modifier.size(ikonaMadhesia), tint = ng)
    }
}

val PaddingFaqe = PaddingValues(horizontal = 20.dp)

@Composable
fun Hapesire(h: Dp) = Spacer(Modifier.height(h))
