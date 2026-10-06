package site.stoku.ora

import android.app.PendingIntent
import android.content.Intent
import androidx.wear.watchface.complications.data.ComplicationData
import androidx.wear.watchface.complications.data.ComplicationType
import androidx.wear.watchface.complications.data.PlainComplicationText
import androidx.wear.watchface.complications.data.ShortTextComplicationData
import androidx.wear.watchface.complications.datasource.ComplicationRequest
import androidx.wear.watchface.complications.datasource.SuspendingComplicationDataSourceService
import kotlinx.coroutines.withTimeoutOrNull

// Komplikacioni: sa produkte duhen hequr nga rafti (skadojnë sot + kanë skaduar), në fytyrën e orës
class StokuKomplikacion : SuspendingComplicationDataSourceService() {

    override suspend fun onComplicationRequest(request: ComplicationRequest): ComplicationData? {
        if (request.complicationType != ComplicationType.SHORT_TEXT) return null
        val l = withTimeoutOrNull(12000) { Api.merrMeCache(this@StokuKomplikacion) } ?: Api.listaERuajtur(this)
        return krijo(l?.let { it.sot.size + it.skaduara })
    }

    override fun getPreviewData(type: ComplicationType): ComplicationData? =
        if (type == ComplicationType.SHORT_TEXT) krijo(3) else null

    private fun krijo(n: Int?): ComplicationData {
        val hap = PendingIntent.getActivity(
            this, 0, Intent(this, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )
        val tekst = n?.toString() ?: "–"
        return ShortTextComplicationData.Builder(
            PlainComplicationText.Builder(tekst).build(),
            PlainComplicationText.Builder(if (n == null) "Stoku" else "Për t'u hequr nga rafti: $n").build(),
        )
            .setTitle(PlainComplicationText.Builder("STOKU").build())
            .setTapAction(hap)
            .build()
    }
}
