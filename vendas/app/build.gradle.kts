plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

// Numri i ndërtimit në GitHub Actions = versioni (aplikacioni e krahason me Releases "vendas-vNN" për t'u përditësuar vetë)
val numri = (System.getenv("GITHUB_RUN_NUMBER") ?: "1").toInt()

android {
    namespace = "site.stoku.vendas"
    compileSdk = 34

    defaultConfig {
        applicationId = "site.stoku.vendas"
        minSdk = 26
        targetSdk = 34
        versionCode = numri
        versionName = "0.1.$numri"
    }

    // Çelësi i vjetër (publik) si te tel/; GitHub Actions e rinënshkruan me .github/apk/nenshkruaj.sh (vula e re e tel/)
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
    // Kamera: CameraX + ML Kit (njohja e barkodit e Google-it, si te Google Lens), punon edhe pa internet
    implementation("androidx.camera:camera-camera2:1.3.4")
    implementation("androidx.camera:camera-lifecycle:1.3.4")
    implementation("androidx.camera:camera-view:1.3.4")
    implementation("com.google.mlkit:barcode-scanning:17.3.0")
    implementation("com.google.guava:guava:33.3.1-android") // ListenableFuture e CameraX-it
    implementation("androidx.exifinterface:exifinterface:1.3.7") // fotoja e fletës drejt (rrotullimi i kamerës)

    testImplementation("junit:junit:4.13.2")
    testImplementation("org.robolectric:robolectric:4.13")
    testImplementation(platform("androidx.compose:compose-bom:2024.09.02"))
    testImplementation("androidx.compose.ui:ui-test-junit4")
    testImplementation("io.github.takahirom.roborazzi:roborazzi:1.32.2")
    testImplementation("io.github.takahirom.roborazzi:roborazzi-compose:1.32.2")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}
