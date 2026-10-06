package site.stoku.ora

import androidx.concurrent.futures.CallbackToFutureAdapter
import androidx.wear.protolayout.ActionBuilders
import androidx.wear.protolayout.ColorBuilders.argb
import androidx.wear.protolayout.DimensionBuilders.dp
import androidx.wear.protolayout.DimensionBuilders.expand
import androidx.wear.protolayout.DimensionBuilders.sp
import androidx.wear.protolayout.LayoutElementBuilders
import androidx.wear.protolayout.ModifiersBuilders
import androidx.wear.protolayout.ResourceBuilders
import androidx.wear.protolayout.TimelineBuilders
import androidx.wear.tiles.RequestBuilders
import androidx.wear.tiles.TileBuilders
import androidx.wear.tiles.TileService
import com.google.common.util.concurrent.ListenableFuture
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeoutOrNull

// Tile: rrëshqit ekranin e orës dhe sheh sa produkte skadojnë sot. Prekja e hap aplikacionin.
class StokuTile : TileService() {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    override fun onDestroy() {
        scope.cancel()
        super.onDestroy()
    }

    override fun onTileRequest(requestParams: RequestBuilders.TileRequest): ListenableFuture<TileBuilders.Tile> =
        CallbackToFutureAdapter.getFuture { c ->
            scope.launch {
                val lista = withTimeoutOrNull(12000) { Api.merrMeCache(this@StokuTile) } ?: Api.listaERuajtur(this@StokuTile)
                c.set(tile(lista))
            }
            "stoku-tile"
        }

    override fun onTileResourcesRequest(requestParams: RequestBuilders.ResourcesRequest): ListenableFuture<ResourceBuilders.Resources> =
        CallbackToFutureAdapter.getFuture { c ->
            c.set(ResourceBuilders.Resources.Builder().setVersion(VERSIONI).build())
            "stoku-burimet"
        }

    private fun teksti(t: String, madhesia: Float, ngjyra: Int, trashe: Boolean = false) =
        LayoutElementBuilders.Text.Builder()
            .setText(t)
            .setMaxLines(2)
            .setMultilineAlignment(LayoutElementBuilders.TEXT_ALIGN_CENTER)
            .setFontStyle(
                LayoutElementBuilders.FontStyle.Builder()
                    .setSize(sp(madhesia))
                    .setColor(argb(ngjyra))
                    .setWeight(if (trashe) LayoutElementBuilders.FONT_WEIGHT_BOLD else LayoutElementBuilders.FONT_WEIGHT_NORMAL)
                    .build()
            )
            .build()

    private fun hapesire(h: Float) = LayoutElementBuilders.Spacer.Builder().setHeight(dp(h)).build()

    private fun tile(l: Lista?): TileBuilders.Tile {
        val hap = ActionBuilders.LaunchAction.Builder()
            .setAndroidActivity(
                ActionBuilders.AndroidActivity.Builder()
                    .setPackageName(packageName)
                    .setClassName(MainActivity::class.java.name)
                    .build()
            )
            .build()
        val klikim = ModifiersBuilders.Clickable.Builder().setId("hap").setOnClick(hap).build()

        val kolona = LayoutElementBuilders.Column.Builder()
            .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_CENTER)
            .addContent(teksti("STOKU", 13f, BARDHE, true))
            .addContent(hapesire(4f))
        if (l == null) {
            kolona.addContent(teksti(if (Api.lidhur(this)) "S'ka lidhje" else "Hape Stoku për ta lidhur me telefonin", 15f, GRI))
        } else {
            kolona.addContent(teksti(l.sot.size.toString(), 64f, if (l.sot.isEmpty()) GJELBER else VERDHE, true))
                .addContent(teksti(if (l.sot.size == 1) "skadon sot" else "skadojnë sot", 17f, BARDHE, true))
            if (l.skaduara > 0) kolona.addContent(hapesire(2f)).addContent(teksti("${l.skaduara} kanë skaduar", 14f, KUQE, true))
            if (l.javaN > 0) kolona.addContent(hapesire(2f)).addContent(teksti("+ ${l.javaN} këtë javë", 13f, GRI))
        }
        kolona.addContent(hapesire(10f))
            .addContent(
                LayoutElementBuilders.Box.Builder()
                    .setWidth(dp(120f))
                    .setHeight(dp(36f))
                    .setModifiers(
                        ModifiersBuilders.Modifiers.Builder()
                            .setBackground(
                                ModifiersBuilders.Background.Builder()
                                    .setColor(argb(VERDHE))
                                    .setCorner(ModifiersBuilders.Corner.Builder().setRadius(dp(18f)).build())
                                    .build()
                            )
                            .setClickable(klikim)
                            .build()
                    )
                    .addContent(teksti("Shiko listën", 14f, ZEZE, true))
                    .build()
            )

        val rrenja = LayoutElementBuilders.Box.Builder()
            .setWidth(expand())
            .setHeight(expand())
            .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_CENTER)
            .setVerticalAlignment(LayoutElementBuilders.VERTICAL_ALIGN_CENTER)
            .setModifiers(ModifiersBuilders.Modifiers.Builder().setClickable(klikim).build())
            .addContent(kolona.build())
            .build()

        return TileBuilders.Tile.Builder()
            .setResourcesVersion(VERSIONI)
            .setFreshnessIntervalMillis(30 * 60 * 1000L)
            .setTileTimeline(TimelineBuilders.Timeline.fromLayoutElement(rrenja))
            .build()
    }

    companion object {
        const val VERSIONI = "1"
        const val VERDHE = 0xFFF5B70A.toInt()
        const val GJELBER = 0xFF3DDC84.toInt()
        const val GRI = 0xFF9AA0A8.toInt()
        const val BARDHE = 0xFFFFFFFF.toInt()
        const val KUQE = 0xFFFF5A4E.toInt()
        const val ZEZE = 0xFF111111.toInt()
    }
}
