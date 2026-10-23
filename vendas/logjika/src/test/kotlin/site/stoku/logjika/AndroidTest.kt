package site.stoku.logjika

import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

/**
 * Gjëra që në kompjuter (JVM, ku punojnë testet) shkojnë, por Android-i (ICU) s'i njeh dhe aplikacioni mbyllet sapo t'i
 * prekë (v24: "(?U)" te Afatet.kt e mbyllte aplikacionin menjëherë pas hyrjes). Kontrollohet vetë kodi.
 */
class AndroidTest {
    private val teNdaluara = listOf("(?U)", "UNICODE_CHARACTER_CLASS")

    @Test fun paShprehjeTePanjohuraNeAndroid() {
        val rrenjet = listOf("src/main/kotlin", "../app/src/main/java", "vendas/logjika/src/main/kotlin", "vendas/app/src/main/java")
            .map { File(it) }.filter { it.isDirectory }
        val gjetur = rrenjet.flatMap { r ->
            r.walk().filter { it.extension == "kt" }.flatMap { f ->
                f.readLines().mapIndexedNotNull { i, l ->
                    if (!l.trimStart().startsWith("//") && teNdaluara.any { l.contains(it) }) f.path + ":" + (i + 1) else null
                }
            }.toList()
        }
        assertTrue("Android-i s'i njeh këto: $gjetur", gjetur.isEmpty())
    }
}
