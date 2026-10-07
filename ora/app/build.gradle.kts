plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

val numri = (System.getenv("GITHUB_RUN_NUMBER") ?: "1").toInt()

android {
    namespace = "site.stoku.ora"
    compileSdk = 34

    defaultConfig {
        applicationId = "site.stoku.ora"
        minSdk = 30
        targetSdk = 34
        versionCode = numri
        versionName = "1.0.$numri"
    }

    // Çelësi i nënshkrimit është në repo që çdo version i ri të instalohet sipër të vjetrit (pa e fshirë).
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
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
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
