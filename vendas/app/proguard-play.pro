# Versioni play (Google Play): R8 i plotë (ngjeshja, optimizimi, riemërtimi), pa përjashtime për kodin e Stoku-t.
# Nëse ndonjë pjesë prishet pas riemërtimit, shto këtu vetëm atë klasë, p.sh.: -keep class site.stoku.vendas.Emri { *; }
# Pronari (25.11.2026, foto e rrëzimit te versioni 0.1.347): kamera (Malli, Afatet) mbyllej me NullPointerException te
# BarcodeScanning.getClient: R8 e optimizonte regjistrimin e komponentëve të ML Kit-it (MlKitContext.get(zzg.class) → null).
# ML Kit (skaneri i barkodit) mbetet krejt i paprekur.
-keep class com.google.mlkit.** { *; }
-keep class com.google.android.gms.internal.mlkit_vision_barcode.** { *; }
-keep class com.google.android.gms.internal.mlkit_vision_common.** { *; }
-keep class com.google.android.gms.internal.mlkit_common.** { *; }
-keep class com.google.android.gms.internal.mlkit_vision_barcode_bundled.** { *; }
-keep class com.google.android.gms.vision.** { *; }
# Sistemi i komponentëve që e përdor ML Kit (MlKitContext): i paprekur
-keep class com.google.firebase.components.** { *; }
