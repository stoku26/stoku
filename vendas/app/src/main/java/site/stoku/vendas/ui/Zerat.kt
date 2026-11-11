package site.stoku.vendas.ui

import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import kotlin.math.PI
import kotlin.math.min
import kotlin.math.pow
import kotlin.math.sin

/**
 * Pronari (v292 / Hyrja 54): 10 zëra të ndryshëm kur skanohet një barkod, zgjidhen te Cilësimet → Skanimi.
 * Të njëjtat nota si `ZERAT` te app-tel.js (testi teste/v292.js i krahason): kur ndryshon njëra anë, ndryshoje edhe tjetrën.
 * Nota: frekuenca Hz, fillimi ms, kohëzgjatja ms, forma, frekuenca në fund (rrëshqitje; 0 = pa), shuhet ngadalë.
 */
data class Nota(val f: Double, val fillimi: Int, val zgjat: Int, val forma: String, val fFund: Double = 0.0, val shuhet: Boolean = false)
data class Zeri(val id: String, val emri: String, val notat: List<Nota>)

object Zerat {
    val LISTA = listOf(
        Zeri("klasik", "Bip klasik", listOf(Nota(1800.0, 0, 150, "square"))),
        Zeri("bute", "Bip i butë", listOf(Nota(1200.0, 0, 130, "sine"))),
        Zeri("dyfish", "Dy bipa", listOf(Nota(1600.0, 0, 70, "square"), Nota(1600.0, 110, 70, "square"))),
        Zeri("ding", "Ding", listOf(Nota(1760.0, 0, 420, "sine", 0.0, true))),
        Zeri("ngjitje", "Ngjitje", listOf(Nota(880.0, 0, 80, "triangle"), Nota(1320.0, 90, 110, "triangle"))),
        Zeri("zbritje", "Zbritje", listOf(Nota(1320.0, 0, 80, "triangle"), Nota(880.0, 90, 110, "triangle"))),
        Zeri("arka", "Arka", listOf(Nota(2093.0, 0, 60, "sine", 0.0, true), Nota(2637.0, 70, 260, "sine", 0.0, true))),
        Zeri("akord", "Tre nota", listOf(Nota(1047.0, 0, 70, "sine"), Nota(1319.0, 75, 70, "sine"), Nota(1568.0, 150, 120, "sine"))),
        Zeri("ulet", "Pip i ulët", listOf(Nota(620.0, 0, 170, "triangle"))),
        Zeri("cicerime", "Cicërimë", listOf(Nota(1800.0, 0, 120, "sine", 3200.0)))
    )
    private val VOLUMI = mapOf("square" to 0.2, "sine" to 0.38, "triangle" to 0.38)
    private const val SHPEJTESIA = 44100

    fun sipasId(id: String): Zeri = LISTA.firstOrNull { it.id == id } ?: LISTA[0]

    /** Zëri si mostra 16-bit mono (si oshilatorët e web-it, me hyrje/dalje të butë që të mos kërcasë) */
    fun mostrat(z: Zeri): ShortArray {
        val gjithsejMs = z.notat.maxOf { it.fillimi + it.zgjat } + 15
        val miks = FloatArray(SHPEJTESIA * gjithsejMs / 1000)
        for (n in z.notat) {
            val fil = SHPEJTESIA * n.fillimi / 1000
            val gjat = SHPEJTESIA * n.zgjat / 1000
            val v = min(0.9, (VOLUMI[n.forma] ?: 0.2) * 2.5)
            val hyrja = SHPEJTESIA * 4 / 1000
            val dalja = SHPEJTESIA * 8 / 1000
            var faza = 0.0
            for (i in 0 until gjat) {
                val k = fil + i
                if (k >= miks.size) break
                val pjesa = i.toDouble() / gjat
                val f = if (n.fFund > 0) n.f + (n.fFund - n.f) * pjesa else n.f
                faza += f / SHPEJTESIA
                faza -= faza.toInt()
                val vala = when (n.forma) {
                    "square" -> if (faza < 0.5) 1.0 else -1.0
                    "triangle" -> 1.0 - 4.0 * kotlin.math.abs(faza - 0.5)
                    else -> sin(2 * PI * faza)
                }
                var g = if (n.shuhet) v * 0.001.pow(pjesa) else v
                if (i < hyrja) g *= i.toDouble() / hyrja
                if (!n.shuhet && i > gjat - dalja) g *= (gjat - i).toDouble() / dalja
                miks[k] += (vala * g).toFloat()
            }
        }
        return ShortArray(miks.size) { (miks[it].coerceIn(-1f, 1f) * 32767).toInt().toShort() }
    }

    private val gati = HashMap<String, AudioTrack>()

    fun luaj(id: String) {
        try {
            val z = sipasId(id)
            val t = synchronized(gati) {
                gati.getOrPut(z.id) {
                    val m = mostrat(z)
                    AudioTrack.Builder()
                        .setAudioAttributes(AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build())
                        .setAudioFormat(AudioFormat.Builder().setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                            .setSampleRate(SHPEJTESIA).setChannelMask(AudioFormat.CHANNEL_OUT_MONO).build())
                        .setBufferSizeInBytes(m.size * 2)
                        .setTransferMode(AudioTrack.MODE_STATIC)
                        .build().also { it.write(m, 0, m.size) }
                }
            }
            if (t.playState == AudioTrack.PLAYSTATE_PLAYING) t.stop()
            t.reloadStaticData()
            t.play()
        } catch (e: Exception) { }
    }
}
