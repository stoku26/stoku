# Stoku: rregullat e përbashkëta të R8-it për ndërtimet "release" (APK github + AAB play). Libraritë (Firebase, Compose, MapLibre,
# CameraX, ML Kit, OkHttp, Play) kanë rregullat e tyre brenda (consumer rules). Stoku s'përdor reflection (JSON lexohet me Map-a,
# Firestore pa klasa modeli), prandaj R8 mund ta riemërtojë edhe kodin tonë. Komponentët e manifest-it (MainActivity, FcmSherbimi,
# StokuApp, aliaset e ikonës) i mban vetë AAPT.
# Rreshtat e gabimeve: numrat e rreshtave mbeten (Play Console i kthen emrat me "mapping"-un e AAB-së)
-keepattributes SourceFile,LineNumberTable,*Annotation*,Signature,InnerClasses,EnclosingMethod
-renamesourcefileattribute SourceFile
# Shënimet vetëm për kompajlerin (Guava, OkHttp): mungojnë në kohën e ekzekutimit dhe s'duhen
-dontwarn com.google.errorprone.annotations.**
-dontwarn javax.annotation.**
-dontwarn org.checkerframework.**
-dontwarn com.google.j2objc.annotations.**
-dontwarn org.codehaus.mojo.animal_sniffer.**
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**
-dontwarn org.openjsse.**
# gRPC (Firestore) i referon OkHttp 2 (com.squareup.okhttp), që s'përdoret: s'duhet (versioni github pa ngjeshje e sheh)
-dontwarn com.squareup.okhttp.**
