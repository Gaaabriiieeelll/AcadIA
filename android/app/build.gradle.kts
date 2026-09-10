plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    namespace = "br.edu.ifpb.acadia"
    compileSdk = 37

    defaultConfig {
        applicationId = "br.edu.ifpb.acadia"
        minSdk = 26
        targetSdk = 37
        versionCode = 1
        versionName = "0.1.0"

        val acadiaBaseUrl = providers.gradleProperty("ACADIA_BASE_URL")
            .orElse("https://acadia.example")
            .get()
        buildConfigField("String", "ACADIA_BASE_URL", "\"$acadiaBaseUrl\"")
    }

    buildFeatures {
        buildConfig = true
        compose = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

}

dependencies {
    implementation("androidx.core:core-ktx:1.19.0")
    implementation("androidx.glance:glance-appwidget:1.2.0")
    implementation("androidx.work:work-runtime-ktx:2.11.2")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.11.0")
}
