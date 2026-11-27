# Ora: rregullat e përbashkëta të R8-it për ndërtimet "release" (APK github + AAB play), si vendas/app/proguard-rules.pro.
# Libraritë (Compose, Wear Tiles/ProtoLayout, komplikacionet) kanë rregullat e tyre brenda. Ora s'përdor reflection (JSON me org.json);
# komponentët e manifest-it (MainActivity, StokuTile, StokuKomplikacion, StokuOraApp) i mban vetë AAPT; .github/apk/aab.sh e kontrollon.
-keepattributes SourceFile,LineNumberTable,*Annotation*,Signature,InnerClasses,EnclosingMethod
-renamesourcefileattribute SourceFile
-dontwarn com.google.errorprone.annotations.**
-dontwarn javax.annotation.**
-dontwarn org.checkerframework.**
-dontwarn com.google.j2objc.annotations.**
