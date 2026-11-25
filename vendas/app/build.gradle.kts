plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.plugin.compose")
}

// Numri i ndërtimit në GitHub Actions = versioni (aplikacioni e krahason me Releases "vendas-vNN" për t'u përditësuar vetë)
val numri = (System.getenv("GITHUB_RUN_NUMBER") ?: "1").toInt()

android {
    namespace = "site.stoku.vendas"
    // Android 17 (API 37): telefoni i pronarit (S24 Ultra, One UI 9). Minimumi mbetet Android 8 (API 26), si më parë.
    compileSdk = 37

    defaultConfig {
        applicationId = "site.stoku.vendas"
        minSdk = 26
        targetSdk = 37
        versionCode = numri
        versionName = "0.1.$numri"
        // v256: harta (MapLibre) ka biblioteka native të mëdha: vetëm për telefonat dhe PDA-të ARM (krejt pajisjet e vërteta)
        ndk { abiFilters += listOf("arm64-v8a", "armeabi-v7a") }
    }

    // Çelësi i vjetër (publik) te tel/ (aty kanë mbetur vetëm çelësat); GitHub Actions e rinënshkruan me
    // .github/apk/nenshkruaj.sh (vula e re e tel/)
    signingConfigs {
        create("stoku") {
            storeFile = file("../../tel/stoku-tel.jks")
            storePassword = "stokutel"
            keyAlias = "stoku"
            keyPassword = "stokutel"
        }
    }
    buildTypes {
        release {
            // Play Console (25.11.2026: "DEX code optimization ... Obfuscation 1%", afati shkurt 2027): R8 e ngjesh dhe e fsheh kodin e
            // librarive (Firebase, Compose, MapLibre, CameraX, ML Kit kanë rregullat e veta). Kodi i Stoku-t (site.stoku.**) mbetet i
            // paprekur (proguard-rules.pro), që asgjë e jona të mos prishet; AAB-ja e mban vetë skedarin "mapping" për Play-in.
            isMinifyEnabled = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            signingConfig = signingConfigs.getByName("stoku")
        }
        debug { signingConfig = signingConfigs.getByName("stoku") }
    }
    // Play Store (pronari 21.11.2026): dy versione nga i njëjti kod. "github" = si më parë (APK te Releases "vendas-vNN", përditësimi
    // i vetvetishëm); "play" = AAB për Google Play: pa shkarkimin e APK-së dhe pa lejen REQUEST_INSTALL_PACKAGES, përditësimet vetëm nga
    // Play (Play In-App Updates, PerditesimiPlay.kt). E njëjta paketë site.stoku.vendas.
    flavorDimensions += "shperndarja"
    productFlavors {
        create("github") { dimension = "shperndarja"; isDefault = true; buildConfigField("boolean", "PLAY", "false") }
        // Pronari (24.11.2026): versioni i Play-it ka paketën "app.stoku.android" (aplikacion më vete në telefon); versioni github mbetet
        // "site.stoku.vendas". Kodi (namespace, klasat) s'ndryshon; çdo vend që do paketën e merr nga packageName / ${applicationId}.
        create("play") { dimension = "shperndarja"; applicationId = "app.stoku.android"; buildConfigField("boolean", "PLAY", "true") }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    // AGP 9: Kotlin i brendshëm (pa pluginin kotlin-android); jvmTarget merret nga compileOptions (17)
    buildFeatures { compose = true; buildConfig = true }
    packaging { resources { excludes += "/META-INF/{AL2.0,LGPL2.1}" } }
    // Pamjet e ekraneve (Robolectric + Roborazzi, pa telefon): app/build/pamjet/*.png, për krahasim me web-in
    testOptions {
        unitTests {
            isIncludeAndroidResources = true
            all {
                it.systemProperty("robolectric.graphicsMode", "NATIVE")
                it.systemProperty("roborazzi.test.record", "true")
            }
        }
    }
    lint {
        checkReleaseBuilds = false
        abortOnError = false
    }
}

dependencies {
    implementation(project(":logjika"))
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.activity:activity-compose:1.9.2")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.6")
    implementation(platform("androidx.compose:compose-bom:2024.09.02"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.foundation:foundation")
    implementation("androidx.compose.material3:material3")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-play-services:1.8.1")
    implementation(platform("com.google.firebase:firebase-bom:33.3.0"))
    implementation("com.google.firebase:firebase-auth")
    implementation("com.google.firebase:firebase-firestore")
    implementation("com.google.firebase:firebase-messaging") // njoftimet push (Grupi, njoftimi ditor) nga stoku-push
    // Kamera: CameraX + ML Kit (njohja e barkodit e Google-it, si te Google Lens), punon edhe pa internet. CameraX 1.4.2: libraria
    // native (libimage_processing_util_jni) me faqe 16 KB, që Google Play e kërkon (1.3.4 kishte 4 KB; kontrolli te .github/apk/aab.sh)
    implementation("androidx.camera:camera-camera2:1.4.2")
    implementation("androidx.camera:camera-lifecycle:1.4.2")
    implementation("androidx.camera:camera-view:1.4.2")
    implementation("com.google.mlkit:barcode-scanning:17.3.0")
    implementation("com.google.guava:guava:33.3.1-android") // ListenableFuture e CameraX-it
    implementation("androidx.exifinterface:exifinterface:1.3.7") // fotoja e fletës drejt (rrotullimi i kamerës)
    // v256: harta e marketeve (si harta.js te web-i): MapLibre Native me pllakat e OpenFreeMap dhe satelitin e Esri-t
    implementation("org.maplibre.gl:android-sdk:11.8.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0") // Referer-i stoku.site për satelitin (çelësi i Esri-t është i kufizuar te faqja)

    "playImplementation"("com.google.android.play:app-update:2.1.0") // përditësimet nga Google Play (vetëm versioni "play")

    testImplementation("junit:junit:4.13.2")
    testImplementation("org.robolectric:robolectric:4.13")
    testImplementation(platform("androidx.compose:compose-bom:2024.09.02"))
    testImplementation("androidx.compose.ui:ui-test-junit4")
    testImplementation("io.github.takahirom.roborazzi:roborazzi:1.32.2")
    testImplementation("io.github.takahirom.roborazzi:roborazzi-compose:1.32.2")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}
