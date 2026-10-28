package site.stoku.vendas.ui

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import site.stoku.vendas.R

/**
 * Logoja e plotë "Stoku" (v259, paketa Stoku_brand_assets: logo/stoku-logo*.png, 568 x 208, pa hapësirën bosh djathtas):
 * shenja blu + emri; e errëta në temën e errët
 */
@Composable
fun LogoEPlote(modifier: Modifier = Modifier) {
    Image(painterResource(if (N.erret) R.drawable.stoku_logo_dark else R.drawable.stoku_logo), "Stoku", modifier)
}

/** Etiketa në krye të Stoku-t (stk-etiketa): logoja e vogël (36 dp, si te web-i) dhe emri i përdoruesit */
@Composable
fun EtiketaStoku(emri: String, onClick: () -> Unit, modifier: Modifier = Modifier) {
    val n = N
    val forma = RoundedCornerShape(10.dp)
    Column(
        modifier.width(152.dp).clip(forma).background(n.surface).border(1.dp, n.line, forma).clickable(onClick = onClick).padding(start = 14.dp, end = 14.dp, top = 7.dp, bottom = 6.dp),
        horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(3.dp)
    ) {
        LogoEPlote(Modifier.height(36.dp))
        Text(emri, style = txMono(10f, n.muted, 500).copy(letterSpacing = 1.sp),
            maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.height(13.dp))
    }
}
