plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// Numri i ndërtimit në GitHub Actions = versioni (aplikacioni e krahason me Releases "tel-vNN" për t'u përditësuar vetë)
val numri = (System.getenv("GITHUB_RUN_NUMBER") ?: "1").toInt()

android {
    namespace = "site.stoku.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "site.stoku.app"
        minSdk = 26
        targetSdk = 34
        versionCode = numri
        versionName = "1.0.$numri"
    }

    // Çelësi i nënshkrimit është në repo që çdo version i ri të instalohet sipër të vjetrit (pa i humbur të dhënat).
    signingConfigs {
        create("stoku") {
            storeFile = file("../stoku-tel.jks")
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
    buildFeatures { buildConfig = true }
    lint {
        checkReleaseBuilds = false
        abortOnError = false
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation(platform("com.google.firebase:firebase-bom:33.3.0"))
    implementation("com.google.firebase:firebase-messaging")
}
