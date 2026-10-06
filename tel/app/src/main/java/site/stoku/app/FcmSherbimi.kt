package site.stoku.app

import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

/** Njoftimet nga Worker-i (stoku-push): mesazhe "data" me titullin, tekstin, tag-un dhe adresën. */
class FcmSherbimi : FirebaseMessagingService() {
    override fun onNewToken(token: String) {
        StokuApp.ruajTokenin(applicationContext, token)
    }

    override fun onMessageReceived(m: RemoteMessage) {
        val d = m.data
        val lloji = d["lloji"] ?: ""
        // Chat-i kur Stoku është hapur përpara: mesazhi shihet në ekran, pa njoftim (si te web-i)
        if (lloji == "chat" && MainActivity.nePerpara) return
        Njoftimet.shfaq(applicationContext, d["titulli"] ?: "Stoku", d["teksti"] ?: "", d["tag"] ?: "stoku", d["url"] ?: "")
    }
}
