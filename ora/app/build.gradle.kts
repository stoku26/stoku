plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.plugin.compose")
}

val numri = (System.getenv("GITHUB_RUN_NUMBER") ?: "1").toInt()

android {
    namespace = "site.stoku.ora"
    // Wear OS 6 / One UI 8 Watch (Android 16, API 36): ora e pronarit (Galaxy Watch Ultra 2025). Minimumi mbetet API 30.
    compileSdk = 37

    defaultConfig {
        applicationId = "site.stoku.ora"
        minSdk = 30
        targetSdk = 36
        versionCode = numri
        versionName = "1.0.$numri"
    }

    // Çelësi i VJETËR i nënshkrimit (publik në repo, prandaj s'mbron më). Gradle-i nënshkruan me të; GitHub Actions pastaj
    // e rinënshkruan APK-në me .github/apk/nenshkruaj.sh: v3 me vulën e re të enkriptuar + zinxhirin e ndërrimit (README.md).
    signingConfigs {
        create("stoku") {
            storeFile = file("../stoku-ora.jks")
            storePassword = "stokuora"
            keyAlias = "stoku"
            keyPassword = "stokuora"
        }
    }
    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("stoku")
        }
        debug { signingConfig = signingConfigs.getByName("stoku") }
    }
    // Google Play (pronari 26.11.2026: "Krejt 100% identik ... edhe e qesmi bashk me telefon"): dy versione nga i njëjti kod, si te vendas/.
    // "github" = si deri tani (APK te Releases "ora-vNN", përditësimi vetë). "play" = AAB për Google Play te i njëjti aplikacion si telefoni:
    // e njëjta paketë app.stoku.android (Play i bashkon telefonin dhe orën vetëm me paketë të njëjtë), përditësimi vetëm nga Play,
    // versionCode 1 000 000 + numri (çdo AAB i një aplikacioni në Play duhet numër tjetër; telefoni është në qindëshe).
    flavorDimensions += "shperndarja"
    productFlavors {
        create("github") { dimension = "shperndarja"; isDefault = true }
        create("play") { dimension = "shperndarja"; applicationId = "app.stoku.android"; versionCode = 1_000_000 + numri }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    // AGP 9: Kotlin i brendshëm (pa pluginin kotlin-android); jvmTarget merret nga compileOptions (17)
    buildFeatures { compose = true }
    lint {
        checkReleaseBuilds = false
        abortOnError = false
    }
}

dependencies {
    implementation(platform("androidx.compose:compose-bom:2024.09.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.activity:activity-compose:1.9.2")
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.wear.compose:compose-material:1.4.0")
    implementation("androidx.wear.compose:compose-foundation:1.4.0")
    implementation("androidx.wear.tiles:tiles:1.4.0")
    implementation("androidx.wear.protolayout:protolayout:1.2.0")
    implementation("androidx.wear.watchface:watchface-complications-data-source-ktx:1.2.1")
    implementation("androidx.concurrent:concurrent-futures-ktx:1.2.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")
}
