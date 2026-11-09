package site.stoku.ora

import android.app.Application

/** v282: aplikacioni i orës (edhe pllaka dhe komplikacioni): ora e Kosovës që në nisje */
class StokuOraApp : Application() {
    override fun onCreate() {
        super.onCreate()
        KohaKosoves.nis(this)
    }
}
