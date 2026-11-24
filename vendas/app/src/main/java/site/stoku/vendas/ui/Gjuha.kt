package site.stoku.vendas.ui

import android.app.Activity
import android.content.Context
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.LocalTextStyle
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.TextUnit
import site.stoku.logjika.Perkthyesi
import site.stoku.vendas.StokuApp

/*
 * v355 (pronari: "A munesh gjuhen anglisht 100% ... edhe android app, edhe android app qe o per playstore"): gjuha e pamjes,
 * Shqip / English (Cilësimet → Pamja → Gjuha), e ruajtur në këtë telefon (pref "gjuha", si "stoku:gjuha" te web-i). Kodi mbetet shqip:
 * vetëm tekstet që shfaqen përkthehen, me fjalorin e përbashkët perkthimi/en.json (assets) dhe motorin site.stoku.logjika.Perkthyesi
 * (binjaku i perkthimi.js). Çdo `Text(...)` i aplikacionit kalon nga mbështjellësi më poshtë (jo material3.Text drejtpërdrejt), edhe
 * Toast-i, butonat dhe fushat. Ndërrimi i gjuhës e rihap ekranin (si rifreskimi i faqes te web-i).
 */
object Gjuha {
    @Volatile private var perkthyesi: Perkthyesi? = null
    @Volatile var en = false
        private set

    fun nis(ctx: Context) {
        // Pronari (24.11.2026): versioni i Play-it nis në anglisht (kush do shqip e ndërron te Cilësimet → Pamja → Gjuha)
        en = StokuApp.prefs(ctx).getString("gjuha", if (site.stoku.vendas.BuildConfig.PLAY) "en" else "sq") == "en"
        if (en && perkthyesi == null) {
            perkthyesi = try { Perkthyesi.ngaJson(ctx.assets.open("en.json").bufferedReader(Charsets.UTF_8).use { it.readText() }) } catch (e: Exception) { null }
        }
    }

    /** A ka përkthim ky tekst (p.sh. hyrjet e "Çfarë ka të re" që shfaqen në anglisht vetëm kur janë përkthyer krejt). */
    fun kaPerkthim(s: String): Boolean = !en || (perkthyesi?.t(s) ?: s) != s

    /** Teksti në gjuhën e zgjedhur (shqip: i njëjti). */
    fun t(s: String): String = if (!en) s else perkthyesi?.t(s) ?: s

    fun vendos(a: Activity, g: String) {
        val v = if (g == "en") "en" else "sq"
        StokuApp.prefs(a).edit().putString("gjuha", v).apply()
        if (v == if (en) "en" else "sq") return
        nis(a)
        a.recreate()
    }
}

/** Si material3.Text, por teksti përkthehet kur gjuha është anglisht. */
@Composable
fun Text(
    text: String,
    modifier: Modifier = Modifier,
    color: Color = Color.Unspecified,
    fontSize: TextUnit = TextUnit.Unspecified,
    fontStyle: FontStyle? = null,
    fontWeight: FontWeight? = null,
    fontFamily: FontFamily? = null,
    letterSpacing: TextUnit = TextUnit.Unspecified,
    textDecoration: TextDecoration? = null,
    textAlign: TextAlign? = null,
    lineHeight: TextUnit = TextUnit.Unspecified,
    overflow: TextOverflow = TextOverflow.Clip,
    softWrap: Boolean = true,
    maxLines: Int = Int.MAX_VALUE,
    minLines: Int = 1,
    onTextLayout: ((TextLayoutResult) -> Unit)? = null,
    style: TextStyle = LocalTextStyle.current
) = androidx.compose.material3.Text(text = Gjuha.t(text), modifier = modifier, color = color, fontSize = fontSize, fontStyle = fontStyle,
    fontWeight = fontWeight, fontFamily = fontFamily, letterSpacing = letterSpacing, textDecoration = textDecoration, textAlign = textAlign,
    lineHeight = lineHeight, overflow = overflow, softWrap = softWrap, maxLines = maxLines, minLines = minLines, onTextLayout = onTextLayout, style = style)

/** AnnotatedString: çdo pjesë me stilin e vet përkthehet veç (p.sh. emri i theksuar + teksti). */
@Composable
fun Text(
    text: AnnotatedString,
    modifier: Modifier = Modifier,
    color: Color = Color.Unspecified,
    fontSize: TextUnit = TextUnit.Unspecified,
    fontStyle: FontStyle? = null,
    fontWeight: FontWeight? = null,
    fontFamily: FontFamily? = null,
    letterSpacing: TextUnit = TextUnit.Unspecified,
    textDecoration: TextDecoration? = null,
    textAlign: TextAlign? = null,
    lineHeight: TextUnit = TextUnit.Unspecified,
    overflow: TextOverflow = TextOverflow.Clip,
    softWrap: Boolean = true,
    maxLines: Int = Int.MAX_VALUE,
    minLines: Int = 1,
    onTextLayout: (TextLayoutResult) -> Unit = {},
    style: TextStyle = LocalTextStyle.current
) = androidx.compose.material3.Text(text = perktheAnnotated(text), modifier = modifier, color = color, fontSize = fontSize, fontStyle = fontStyle,
    fontWeight = fontWeight, fontFamily = fontFamily, letterSpacing = letterSpacing, textDecoration = textDecoration, textAlign = textAlign,
    lineHeight = lineHeight, overflow = overflow, softWrap = softWrap, maxLines = maxLines, minLines = minLines, onTextLayout = onTextLayout, style = style)

private fun perktheAnnotated(a: AnnotatedString): AnnotatedString {
    if (!Gjuha.en) return a
    if (a.spanStyles.isEmpty() && a.paragraphStyles.isEmpty()) return AnnotatedString(Gjuha.t(a.text))
    // kufijtë e stileve e ndajnë tekstin në pjesë; secila përkthehet dhe ruan stilin e saj
    val kufij = sortedSetOf(0, a.length)
    a.spanStyles.forEach { kufij.add(it.start.coerceIn(0, a.length)); kufij.add(it.end.coerceIn(0, a.length)) }
    val l = kufij.toList()
    val b = AnnotatedString.Builder()
    for (i in 0 until l.size - 1) {
        val s = l[i]; val e = l[i + 1]
        val stilet = a.spanStyles.filter { it.start <= s && it.end >= e }
        val nis = b.length
        b.append(Gjuha.t(a.text.substring(s, e)))
        stilet.forEach { b.addStyle(it.item, nis, b.length) }
    }
    return b.toAnnotatedString()
}

/** Si material3.Icon: përshkrimi për lexuesin e ekranit (TalkBack) përkthehet kur gjuha është anglisht. */
@Composable
fun Icon(imageVector: ImageVector, contentDescription: String?, modifier: Modifier = Modifier, tint: Color = LocalContentColor.current) =
    androidx.compose.material3.Icon(imageVector = imageVector, contentDescription = contentDescription?.let { Gjuha.t(it) }, modifier = modifier, tint = tint)
