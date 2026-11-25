# Stoku (R8, vetëm ndërtimet "release": APK github dhe AAB play). Kodi i Stoku-t s'ndryshohet as s'riemërtohet: lexon JSON me
# Map-a, por e mbajmë krejt që asnjë pjesë (Compose, korutinat, shërbimi FCM, aliaset e ikonës) të mos prishet pa telefon për provë.
# Libraritë (Firebase, Compose, MapLibre, CameraX, ML Kit, OkHttp, Play) kanë rregullat e tyre brenda (consumer rules).
-keep class site.stoku.** { *; }
-keepattributes SourceFile,LineNumberTable,*Annotation*,Signature,InnerClasses,EnclosingMethod
# Shënimet vetëm për kompajlerin (Guava, OkHttp): mungojnë në kohën e ekzekutimit dhe s'duhen
-dontwarn com.google.errorprone.annotations.**
-dontwarn javax.annotation.**
-dontwarn org.checkerframework.**
-dontwarn com.google.j2objc.annotations.**
-dontwarn org.codehaus.mojo.animal_sniffer.**
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**
-dontwarn org.openjsse.**
