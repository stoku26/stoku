package site.stoku.vendas.ui

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.PathParser
import androidx.compose.ui.unit.dp

/*
 * Ikonat e Stoku-t: të njëjtat vija si te web-i (index.html, stil "lucide": 24×24, vijë 2, skajet të rrumbullakëta).
 * Ngjyra vjen nga tint-i i Icon-it (currentColor te web-i).
 */
fun ikona(vararg pjeset: String, trashesia: Float = 2f): ImageVector {
    val b = ImageVector.Builder(defaultWidth = 24.dp, defaultHeight = 24.dp, viewportWidth = 24f, viewportHeight = 24f)
    pjeset.flatMap { it.split(" M").mapIndexed { i, x -> if (i == 0) x else "M$x" } }.forEach { d ->
        b.addPath(
            pathData = PathParser().parsePathString(d).toNodes(),
            fill = null,
            stroke = SolidColor(Color.Black),
            strokeLineWidth = trashesia,
            strokeLineCap = StrokeCap.Round,
            strokeLineJoin = StrokeJoin.Round
        )
    }
    return b.build()
}

object Ik {
    val Mbrapa = ikona("M15 18l-6-6 6-6")
    val Perpara = ikona("m9 18 6-6-6-6")
    val Foto = ikona("M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2Z", "M7 9a2 2 0 1 0 4 0a2 2 0 1 0 -4 0Z", "m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21")
    val Kamera = ikona("M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z", "M9 13a3 3 0 1 0 6 0a3 3 0 1 0 -6 0Z")
    val Barkod = ikona("M3 5v14", "M7 5v14", "M11 5v14", "M14 5v14", "M18 5v14", "M21 5v14")
    val Hena = ikona("M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z")
    val Skano = ikona("M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2", "M8 7v10M12 7v10M16 7v10")
    val Zile = ikona("M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9", "M10.3 21a1.94 1.94 0 0 0 3.4 0")
    val Ora = ikona("M9 6h6a3 3 0 0 1 3 3v6a3 3 0 0 1 -3 3h-6a3 3 0 0 1 -3 -3v-6a3 3 0 0 1 3 -3Z", "M9 6l.6-3h4.8L15 6M9 18l.6 3h4.8l.6-3", "M12 10v2.2l1.4 1")
    val Vendi = ikona("M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z", "M9 10a3 3 0 1 0 6 0a3 3 0 1 0 -6 0Z")
    val Rendi = ikona("m3 16 4 4 4-4M7 20V4M21 8l-4-4-4 4M17 4v16")
    val Perdoruesit = ikona("M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", "M5 7a4 4 0 1 0 8 0a4 4 0 1 0 -8 0Z", "m16 11 2 2 4-4")
    val Re = ikona("M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z")
    val TeRejat = ikona("M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z", "M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z")
    val Mburoja = ikona("M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", "M10 11h4a1 1 0 0 1 1 1v3a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-3a1 1 0 0 1 1 -1Z", "M10.5 11V9.5a1.5 1.5 0 0 1 3 0V11")
    val Telefon = ikona("M8.5 2h7a2.5 2.5 0 0 1 2.5 2.5v15a2.5 2.5 0 0 1 -2.5 2.5h-7a2.5 2.5 0 0 1 -2.5 -2.5v-15a2.5 2.5 0 0 1 2.5 -2.5Z", "M11 18h2")
    val Tingull = ikona("M11 5 6 9H2v6h4l5 4z", "M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14")
    val Llogaria = ikona("M20 21a8 8 0 0 0-16 0", "M8 7a4 4 0 1 0 8 0a4 4 0 1 0 -8 0Z")
    val Plus = ikona("M12 5v14M5 12h14")
    val Poshte = ikona("m6 9 6 6 6-6")
    val X = ikona("M18 6 6 18M6 6l12 12")
    val Kosh = ikona("M3 6h18", "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6", "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2", "M10 11v6M14 11v6")
    val Stoku = ikona("M21 8 12 3 3 8v8l9 5 9-5Z", "M3 8l9 5 9-5M12 13v8")
    val Afatet = ikona("M5.5 4h13a2.5 2.5 0 0 1 2.5 2.5v12a2.5 2.5 0 0 1 -2.5 2.5h-13a2.5 2.5 0 0 1 -2.5 -2.5v-12a2.5 2.5 0 0 1 2.5 -2.5Z", "M16 2v4M8 2v4M3 9.5h18", "M12 13v3l2 1.2")
    val Grupi = ikona("M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2", "M5 7a4 4 0 1 0 8 0a4 4 0 1 0 -8 0Z", "M23 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75")
    val Cilesimet = ikona("M9 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0Z", "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z")
    val Kerko = ikona("M4 11a7 7 0 1 0 14 0a7 7 0 1 0 -14 0Z", "m20 20-3.5-3.5")
    val Kontroll = ikona("M20 6 9 17l-5-5")
    val Rikthe = ikona("M3 12a9 9 0 1 0 3-6.7L3 8", "M3 3v5h5")
    val ReOk = ikona("m16.5 14.5-4.8 4.8-2.2-2.2", "M5 17.74A7 7 0 1 1 15.71 10h1.79a4.5 4.5 0 0 1 1.5 8.74")
    val RePune = ikona("M12 13v8", "M4 14.9A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.24", "m8 17 4-4 4 4")
    val ReGabim = ikona("m2 2 20 20", "M5.78 5.78A7 7 0 0 0 9 19h8.5a4.5 4.5 0 0 0 1.31-.19", "M21.53 16.5A4.5 4.5 0 0 0 17.5 10h-1.79A7 7 0 0 0 10 5.07")
    val Drita = ikona("M18 6c0 2-2 2-2 4v10a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V10c0-2-2-2-2-4V2h12z", "M6 6h12M12 12v.01")
    val Folder = ikona("M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z")
    val Syri = ikona("M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z", "M9 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0Z")
    val SyriMbyllur = ikona("M9.9 4.24A9 9 0 0 1 12 4c6.5 0 10 7 10 7a18 18 0 0 1-2.16 3.19M6.6 6.6A18 18 0 0 0 2 12s3.5 7 10 7a9 9 0 0 0 5.4-1.6", "m2 2 20 20", "M14.12 14.12a3 3 0 1 1-4.24-4.24")
    val Dil = ikona("M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "m16 17 5-5-5-5", "M21 12H9")
    val Shkarko = ikona("M12 3v12M7 10l5 5 5-5", "M5 21h14")
    // Grupi (pllakat e menysë, roli, prania)
    val Pulti = ikona("M4.5 3h4a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1 -1.5 1.5h-4a1.5 1.5 0 0 1 -1.5 -1.5v-6a1.5 1.5 0 0 1 1.5 -1.5Z",
        "M15.5 3h4a1.5 1.5 0 0 1 1.5 1.5v2a1.5 1.5 0 0 1 -1.5 1.5h-4a1.5 1.5 0 0 1 -1.5 -1.5v-2a1.5 1.5 0 0 1 1.5 -1.5Z",
        "M15.5 12h4a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1 -1.5 1.5h-4a1.5 1.5 0 0 1 -1.5 -1.5v-6a1.5 1.5 0 0 1 1.5 -1.5Z",
        "M4.5 16h4a1.5 1.5 0 0 1 1.5 1.5v2a1.5 1.5 0 0 1 -1.5 1.5h-4a1.5 1.5 0 0 1 -1.5 -1.5v-2a1.5 1.5 0 0 1 1.5 -1.5Z")
    val Kohe = ikona("M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0Z", "M12 7v5l3 2")
    val Aktiviteti = ikona("M22 12h-4l-3 9L9 3l-3 9H2")
    val Kalendari = ikona("M5.5 4h13a2.5 2.5 0 0 1 2.5 2.5v12a2.5 2.5 0 0 1 -2.5 2.5h-13a2.5 2.5 0 0 1 -2.5 -2.5v-12a2.5 2.5 0 0 1 2.5 -2.5Z", "M16 2v4M8 2v4M3 9.5h18")
    val Koleget = ikona("M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", "M5 7a4 4 0 1 0 8 0a4 4 0 1 0 -8 0Z", "M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75")
    val Kurora = ikona("M3 7l4 4 5-6 5 6 4-4-2 11H5L3 7z", "M5 21h14", trashesia = 2.3f)
    val Administratori = ikona("M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", "m9 12 2 2 4-4", trashesia = 2.3f)
    val KoshX = ikona("M3 7h18", "M5 7v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7", "M9 7V4h6v3", "m10 12 4 4M14 12l-4 4")
    val Kompjuter = ikona("M4 3h16a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-16a2 2 0 0 1 -2 -2v-10a2 2 0 0 1 2 -2Z", "M8 21h8M12 17v4")
}
