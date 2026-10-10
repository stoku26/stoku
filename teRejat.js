/*
 * "Çka ka të re" — lista e ndryshimeve që u tregohet përdoruesve në hyrje (telefon dhe PC).
 *
 * SI PUNON: sa herë del një version i ri, shto NJË HYRJE NË KRYE të listës, me:
 *   v      = numri i versionit — I NJËJTI me numrin te sw.js (var CACHE = 'stoku-vNN') dhe te "teRejat.js?v=NN"
 *   versioni = ai që sheh përdoruesi, "1.0.1" (MAJOR.MINOR.PATCH): rregullim i vogël → rrit të fundit (1.0.1 → 1.0.2);
 *            diçka e re → rrit të mesit, i fundit 0 (1.0.2 → 1.1.0); ndryshim i madh i krejt aplikacionit → 2.0.0.
 *            Nëse ka dy hyrje me të njëjtin v (tel + pc), të dyja e kanë të njëjtin `versioni`.
 *            në index.html, pc.html dhe sw.js (SHELL);
 *   data   = data e publikimit (VVVV-MM-DD);
 *   titulli = një rresht i shkurtër;
 *   pikat  = çka u shtua ose u përmirësua, me fjalë të thjeshta për punëtorët dhe menaxheren (jo teknike).
 *   platforma (opsionale) = 'tel' (vetëm telefoni) ose 'pc' (vetëm kompjuteri); pa të = të dyja.
 *            Telefoni s'i tregon hyrjet 'pc', kompjuteri s'i tregon hyrjet 'tel'.
 * Aplikacioni e mban mend versionin e fundit që përdoruesi e ka parë; në hyrje i tregon vetëm hyrjet më të reja.
 */
(function (root) {
  'use strict';

  var LISTA = [
    { v: 204, versioni: '1.18.3', data: '2026-10-10', titulli: 'Dalja nga llogaria me një klik', pikat: [
      'Në kompjuter, poshtë majtas te karta e llogarisë, ka një buton të vogël për të dalë nga llogaria. Kur e mban mausin mbi të, shkruan "Dil nga llogaria".'
    ] },
    { v: 203, versioni: '1.18.2', data: '2026-10-10', titulli: 'Krejt produktet në listë', pikat: [
      'Cilësimet → Stoku → Produktet: kur ka shumë produkte, në fund të listës del butoni "Shfaq edhe …" që i shton të tjerat, pa pasur nevojë të kërkosh.'
    ] },
    { v: 202, versioni: '1.18.1', data: '2026-10-10', titulli: 'Stoku në telefon pa scroll të gjatë', pikat: [
      'Cilësimet → Stoku: Furnizuesit, Produktet e reja dhe Produktet janë tash rreshta me numrin e tyre. Prek njërin për ta hapur listën në faqe më vete.',
      'Butoni "←" (ose "mbrapa" i telefonit) të kthen te Stoku.'
    ] },
    { v: 201, versioni: '1.18.0', data: '2026-10-10', titulli: 'Produktet e reja presin kontrollin', pikat: [
      'Produktet që i shkruajnë kolegët s\'shkojnë më direkt te lista e produkteve: presin te Cilësimet → Stoku → Produktet e reja.',
      'Administratori i kontrollon emrat, i ndryshon nëse duhet dhe i ruan: pastaj kalojnë te Produktet.',
      'Te menyja e Cilësimeve, administratori sheh sa produkte të reja presin kontrollin.'
    ] },
    { v: 200, versioni: '1.17.3', data: '2026-10-10', titulli: 'Cilësimet më të rregullta në kompjuter', pikat: [
      'Cilësimet → Stoku: Furnizuesit dhe Produktet dalin të mbyllura, me numrin e tyre. Kliko te njëra për ta hapur listën.',
      'Butoni për mbylljen e Cilësimeve është tash jashtë dritares, lart djathtas, dhe s\'lëviz kur bën scroll.'
    ] },
    { v: 199, versioni: '1.17.2', data: '2026-10-10', titulli: 'Cilësimet → Stoku për të gjithë', pikat: [
      'Cilësimet → Stoku e sheh sërish kushdo: renditjen fillestare e zgjedh secili vetë, ndërsa furnizuesit dhe produktet mund t\'i shohë.',
      'Emrat e furnizuesve dhe produktet i ndryshon vetëm administratori.'
    ] },
    { v: 198, versioni: '1.17.1', data: '2026-10-09', titulli: 'Produktet i rregullon administratori', pikat: [
      'Cilësimet → Stoku e sheh vetëm administratori. Produktet e reja që shkruajnë kolegët ruhen aty me emrin e tyre, që t\'i rregullojë.',
      'Kur skanon një produkt, del emri dhe furnitori siç i ka ruajtur administratori. Mund t\'i ndryshosh për afatin tënd, por produkti mbetet siç e ka bërë ai.',
      'Produktet e mësuara s\'fshihen kur del nga grupi: mbeten si kujtesë.'
    ] },
    { v: 197, versioni: '1.17.0', data: '2026-10-09', titulli: 'Produktet e përbashkëta për krejt grupin', pikat: [
      'Produktet që Stoku i mban mend (emri dhe furnitori sipas barkodit) tash janë të përbashkëta për krejt kolegët e grupit: kur dikush e plotëson një produkt, e njohin të gjithë, në telefon, aplikacionin Android dhe kompjuter.',
      'Ndryshimet te Cilësimet → Stoku → Produktet (ndrysho ose harroje) vlejnë për krejt grupin. Pa grup, produktet mbeten vetëm në pajisjen tënde.'
    ] },
    { v: 196, versioni: '1.16.0', data: '2026-10-09', titulli: 'Stoku i mban mend produktet', pikat: [
      'Kur e skanon një barkod që e ke plotësuar një herë, emri (p.sh. "Coca Cola 1.25L") dhe furnitori plotësohen vetë: te afati i ri, te leximi i fletës me foto dhe te Stoku.',
      'Stoku i mëson edhe nga afatet dhe produktet që i ke tashmë, si dhe nga afatet e kolegëve të grupit. Ruhen vetëm në këtë pajisje, nuk zënë vend në llogari.',
      'Cilësimet → Stoku → Produktet: kërko, ndrysho emrin ose furnitorin e një produkti, ose harroje.',
      'Rregullim: kur ndryshon sasinë e një produkti te Stoku, furnitori i tij s\'humb më.'
    ] },
    { v: 195, versioni: '1.15.0', data: '2026-10-09', titulli: 'Njoftimet e Grupit edhe me Stoku të mbyllur', pikat: [
      'Kur një koleg heq një produkt tëndin dhe pret miratimin, kur e pranon ose e refuzon heqjen, kur administratori të ndryshon një afat ose njofton krejt grupin: njoftimi vjen menjëherë, edhe kur Stoku është i mbyllur (telefon, aplikacioni Android, kompjuter).',
      'Njoftimi s\'del dy herë: kur e hap Stoku-n, i njëjti njoftim vetëm përditësohet.'
    ] },
    { v: 194, versioni: '1.14.7', data: '2026-10-09', titulli: 'Anëtarët tash quhen Kolegët', pikat: [
      'Te Grupi, "Anëtarët" tash quhen "Kolegët" (telefon dhe kompjuter), një fjalë që vlen për të gjithë.'
    ] },
    { v: 193, versioni: '1.14.6', data: '2026-10-09', titulli: 'Tabela e anëtarëve rregulluar', platforma: 'pc', pikat: [
      'Te Grupi → Anëtarët, butonat "Bëje admin", "Hiq nga grupi" dhe "Fshij" tash nxihen të plotë brenda tabelës (më parë "Fshij" s\'shihej).',
      'Flluska e kurorës / mburojës s\'i nxjerr më butonat jashtë tabelës; kur s\'ka vend lart, del poshtë ose anash ikonës.',
      'Në ekrane më të ngushta emri shkurtohet, ndërsa kurora dhe mburoja mbeten gjithmonë të dukshme.'
    ] },
    { v: 192, versioni: '1.14.5', data: '2026-10-09', titulli: 'Flluska e rolit te Anëtarët', platforma: 'pc', pikat: [
      'Te Grupi → Anëtarët, kur klikon kurorën ose mburojën, flluska "Admin i Grupit" / "Administrator" tash shihet e plotë (më parë mbetej e prerë nën kokën e tabelës).'
    ] },
    { v: 191, versioni: '1.14.4', data: '2026-10-09', titulli: 'Grupi pa butonin mbrapa', platforma: 'tel', pikat: [
      'Te Grupi, kur je te Afatet, Aktiviteti, Kalendari ose Anëtarët, s\'ka më buton mbrapa lart. Kalon nga kategoritë sipër; mbrapa i telefonit të kthen te Përmbledhja.'
    ] },
    { v: 190, versioni: '1.14.3', data: '2026-10-09', titulli: 'Kontroll i plotë, rregullime të vogla', pikat: [
      'Te Grupi s\'del më "ti" pas emrit (as te "Online tani" në kompjuter, as te afatet e kolegëve).',
      'Butoni "Rikthe tani" te Llogaria s\'nis dy rikthime njëkohësisht kur preket dy herë.',
      'Ora: kur s\'ka internet, Stoku në ekranin që del kur e rrëshqet orën tregon që lista është e një dite tjetër.'
    ] },
    { v: 189, versioni: '1.14.2', data: '2026-10-08', titulli: 'Ikonat e roleve vetëm te Anëtarët', pikat: [
      'Kurora dhe mburoja shihen tash vetëm te Grupi → Anëtarët, jo më te "Online tani" apo te pulti.'
    ] },
    { v: 188, versioni: '1.14.1', data: '2026-10-08', titulli: 'Ikonat e roleve kudo, rregullime', pikat: [
      'Kurora dhe mburoja shihen tash edhe te "Online tani" dhe te anëtarët në kompjuter.',
      'Te Grupi, koha e fundit online dhe statistikat me shkrim më të lexueshëm.',
      'Aplikacioni Android dhe ora e gjejnë gjithmonë versionin e ri, edhe kur ka shumë publikime.',
      'Grupi harxhon më pak internet (u hoq dëgjimi i chat-it që s\'ekziston më).'
    ] },
    { v: 187, versioni: '1.14.0', data: '2026-10-08', titulli: 'Ekipa tash quhet Grupi', pikat: [
      'Kudo në Stoku (telefon, kompjuter, ora dhe aplikacioni Android) "Ekipa" tash quhet "Grupi".',
      'S\'ka më "pronar": kurora te emri tregon "Admin i Grupit", mburoja "Administrator".'
    ] },
    { v: 186, versioni: '1.13.4', data: '2026-10-08', titulli: 'Flluska mbi ikonë, filtrat me zbehje', pikat: [
      'Flluska e kurorës dhe e mburojës tash del gjithmonë mbi ikonë dhe mbyllet vetë pas 5 sekondash.',
      'Te Afatet, rreshtat e filtrave zbehen butë te skajet kur ka edhe butona anash.'
    ] },
    { v: 185, versioni: '1.13.3', data: '2026-10-08', titulli: 'Rregullime të vogla në pamje', pikat: [
      'Kur prek kurorën ose mburojën te Anëtarët, shpjegimi del në një flluskë të vogël pikërisht te ikona.',
      'Te Afatet, rreshtat e filtrave (statusi dhe muajt) rrëshqasin brenda kufijve të faqes, pa dalë skaj më skaj.'
    ] },
    { v: 184, versioni: '1.13.2', data: '2026-10-08', titulli: 'Rolet me ikona', pikat: [
      'Te Ekipa, në vend të teksteve "pronar" dhe "admin" tash dalin ikona të vogla: kurora për pronarin, mburoja për administratorin. Kur i prek, të tregon çka janë.',
      'Shenja "ti" u hoq.'
    ] },
    { v: 183, versioni: '1.13.1', data: '2026-10-08', titulli: 'Ekipa: pa Stokun, ikona e re offline', pikat: [
      'Te Ekipa u hoq "Stoku".',
      'Kur një koleg është offline, tash del pajisja e tij (telefon ose kompjuter) me ngjyrë gri dhe pikë gri, pastaj kur u pa së fundi.'
    ] },
    { v: 182, versioni: '1.13.0', data: '2026-10-08', titulli: 'Ekipa: Përmbledhja e re, pa chat', pikat: [
      'Chat-i i ekipës u hoq.',
      'Te Ekipa e para del Përmbledhja: numrat (në raft, të skaduara, ≤ 7 ditë, afër skadimit, hequr këtë muaj, online), kërkesa për heqje, kolegët, çka duhet hequr, aktiviteti i fundit dhe statistikat.',
      'Statistika u bashkua te Përmbledhja.',
      'Menyja e Ekipës rri gjithmonë në të njëjtin vend: kur kalon te Afatet, Aktiviteti e të tjerat, faqja s\'lëviz më lart e poshtë.'
    ] },
    { v: 181, versioni: '1.12.2', data: '2026-10-08', titulli: 'Ekipa më e pastër', platforma: 'tel', pikat: [
      'Te Ekipa u hoq kartela "Në raft te krejt ekipa".',
      'Afatet, Aktiviteti, Kalendari, Anëtarët, Statistika dhe Stoku tash janë butona me ikona, me emrin poshtë, në temë të çelët dhe të errët.'
    ] },
    { v: 180, versioni: '1.12.1', data: '2026-10-08', titulli: 'Njoftimet më të shkurtra', pikat: [
      'Njoftimi kur një koleg e heq produktin tënd tash është i shkurtër; poshtë tij janë vetëm butonat "Prano" dhe "Refuzo".'
    ] },
    { v: 179, versioni: '1.12.0', data: '2026-10-08', titulli: 'Heqja nga kolegu me miratim', pikat: [
      'Kur një koleg e heq nga rafti një produkt tëndin, ai s\'hiqet menjëherë: te zilja e Ekipës të del njoftimi me "Prano" dhe "Refuzo".',
      'Produkti hiqet nga afatet e tua vetëm kur e pranon; nëse e refuzon, mbetet në raft dhe kolegu njoftohet.',
      'Deri atëherë te Ekipa produkti shfaqet "Në pritje" të miratimit.'
    ] },
    { v: 178, versioni: '1.11.6', data: '2026-10-08', titulli: 'Ora: produktet me ngjyra si te telefoni', pikat: [
      'Ora: produktet që kanë skaduar dalin në kartela të kuqe, ato që skadojnë sot ose këtë javë në kartela të verdha, njësoj si te telefoni.'
    ] },
    { v: 177, versioni: '1.11.5', data: '2026-10-07', titulli: 'Ora: rifreskimi sillet', pikat: [
      'Ora: kur e prek butonin e rifreskimit, ikona sillet derisa të ngarkohet lista.',
      'Ora: Cilësimet s\'kanë më butonin mbrapa; kthehesh me butonin e orës ose duke rrëshqitur djathtas.'
    ] },
    { v: 176, versioni: '1.11.4', data: '2026-10-07', titulli: 'Ora: butoni i rifreskimit', pikat: [
      'Ora: lista rifreskohet vetë vetëm kur hyn në Stoku; poshtë, majtas ingranazhit të Cilësimeve, ka butonin e rifreskimit.'
    ] },
    { v: 175, versioni: '1.11.3', data: '2026-10-07', titulli: 'Ora: rifreskim vetë dhe Cilësimet me ingranazh', pikat: [
      'Ora: lista rifreskohet vetë kur e hap ose kthehesh në Stoku, dhe çdo minutë; prekja e "Rifreskuar ..." e rifreskon menjëherë. Rrëshqitja poshtë u hoq, sepse hapte panelin e orës.',
      'Ora: Cilësimet hapen me butonin e rrumbullakët me ingranazh, si te telefoni.',
      'Ora: llogaria dhe versioni dalin në fund të Cilësimeve.'
    ] },
    { v: 174, versioni: '1.11.2', data: '2026-10-07', titulli: 'Përmbledhja e bardhë në temën e çelët', pikat: [
      'Në temën e çelët kartela "Produkte gjithsej" tash është e bardhë si kartelat e tjera; në temën e errët mbetet e errët.'
    ] },
    { v: 173, versioni: '1.11.1', data: '2026-10-07', titulli: 'Lidhja e orës më e qartë', platforma: 'tel', pikat: [
      'Te "Lidh orën" fusha e kodit tash shkruan "Kodi nga ora" në vend të një numri shembull që dukej si kod i vërtetë.'
    ] },
    { v: 172, versioni: '1.11.0', data: '2026-10-07', titulli: 'Ora: Pamja me ngjyra dhe rifreskim me rrëshqitje', pikat: [
      'Ora: te Cilësimet ka opsion të ri "Pamja" ku zgjedh ngjyrën kryesore (8 ngjyra).',
      'Ora: lista rifreskohet duke e tërhequr poshtë; butoni "Rifresko" u hoq.',
      'Ora: Cilësimet kanë shigjetën mbrapa në rreth, njësoj si telefoni.',
      'Kodi 6-shifror për lidhjen e orës ndërrohet çdo 15 sekonda.'
    ] },
    { v: 171, versioni: '1.10.2', data: '2026-10-07', titulli: 'Shigjeta mbrapa më e pastër', platforma: 'tel', pikat: [
      'Butoni mbrapa në krye të faqeve ka tash një shigjetë të re, të hollë dhe në mes të rrethit.'
    ] },
    { v: 170, versioni: '1.10.1', data: '2026-10-07', titulli: 'Cilësimet më të pastra', platforma: 'tel', pikat: [
      'Te Cilësimet kategoria "Ora e dorës" ka vetëm lidhjen e orës.',
      'Aplikacioni Android: "Kontrollo për përditësim" (ose "Shkarko aplikacionin Android" në Chrome) është tash një buton i hollë poshtë "Çka ka të re".',
      'Shigjeta "←" në krye të faqeve ka tash rreth, si butonat e tjerë.'
    ] },
    { v: 169, versioni: '1.10.0', data: '2026-10-07', titulli: 'Cilësimet e orës dhe Ekipa më e qartë', pikat: [
      'Te Cilësimet ka kategori të re "Ora dhe aplikacioni" (në iPhone "Ora e dorës"): aty e lidh orën dhe, në Android, e shkarkon aplikacionin Stoku. Njoftimet tash kanë vetëm njoftimet.',
      'Ekipa tash është një gjë e vetme: s\'ka më "grup". Te Ekipa → Anëtarët e sheh ekipën tënde, i fton shokët dhe largohesh.',
      'Ora: Cilësimet e reja në orë, me "Kontrollo për përditësim" dhe "Përditëso tani" direkt nga ora.'
    ] },
    { v: 168, versioni: '1.9.1', data: '2026-10-07', titulli: 'Ora e dorës dhe rregullime', pikat: [
      'Kudo në Stoku (telefon, kompjuter, aplikacioni Android dhe ora) tash shkruan "ora" në vend të "sahat".',
      'Ora: produktet që kanë skaduar dalin të parat, me butonin "Hiqi krejt nga rafti".',
      'Aplikacioni Android: njoftimi i prekur hap direkt chat-in ose afatet, pa e ringarkuar Stoku-n.'
    ] },
    { v: 167, versioni: '1.9.0', data: '2026-10-06', titulli: 'Stoku si aplikacion Android', pikat: [
      'Aplikacioni i ri Stoku për Android: s\'del nga llogaria kur i fshin cookies dhe të dhënat e Chrome-it, dhe njoftimet vijnë menjëherë. Shkarkohet te Cilësimet, poshtë "Çka ka të re": "Shkarko aplikacionin Android".',
      'Çdo përmirësim i Stoku-t del njëkohësisht në telefon, kompjuter dhe aplikacion. Kur del version i ri i vetë aplikacionit (edhe në orë), të pyet vetë "Përditëso".'
    ] },
    { v: 166, versioni: '1.8.2', data: '2026-10-06', titulli: 'Cilësimet e llogarisë më të thjeshta', pikat: [
      'U hoq opsioni "Mos dil kur i fshin të dhënat" te Cilësimet → Llogaria.'
    ] },
    { v: 164, versioni: '1.8.0', data: '2026-10-06', titulli: 'Ekipa me ftesa', pikat: [
      'Ekipa tash është me ftesa: krijo ekipën tënde dhe fto shokët me emrin e tyre të përdoruesit. Vetëm anëtarët e një ekipe e shohin njëri-tjetrin, chat-in, aktivitetin dhe kërkesat.',
      'Kush sapo është regjistruar s\'sheh askënd derisa ta krijojë një ekipë ose ta pranojë një ftesë.',
      'Pronari i ekipës fton dhe heq anëtarë, ia ndërron emrin ekipës dhe mund ta bëjë edhe dikë tjetër pronar.',
      'Ekipa e deritanishme vazhdon si ekipa "Ekipa", me anëtarët dhe historikun e vet.'
    ] },
    { v: 163, versioni: '1.7.0', data: '2026-10-06', titulli: 'Excel sipas furnizuesit dhe hyrje që mbetet', pikat: [
      'Te Afatet → Eksporto Excel mund të zgjedhësh vetëm një furnizues: në skedar dalin vetëm afatet e tij.',
      'Kur e fshin historinë dhe të dhënat e shfletuesit, Stoku hyn vetë me fjalëkalimin e ruajtur në Chrome (ose të pyet me një prekje). Në iPhone, Keychain e plotëson vetë emrin dhe fjalëkalimin.',
      'iPhone (Safari): shiriti me tabe poshtë rri tash sa më poshtë.'
    ] },
    { v: 162, versioni: '1.6.0', data: '2026-10-06', titulli: 'Kërkesa te ekipa nga ora', pikat: [
      'Nga ora mund t\'i kërkosh një kolegu (ose krejt ekipës) ta heqë një produkt nga rafti; ai merr njoftim si nga telefoni.',
      'Në orë dalin edhe produktet që kanë skaduar, jo vetëm ato të sotme.',
      'Ikona e re e Stoku-t në orë. Orën e lidhur më herët lidhe edhe një herë me kodin, që të mund të dërgojë kërkesa.'
    ] },
    { v: 161, versioni: '1.5.1', data: '2026-10-02', titulli: 'Ikona e orës më e qartë', platforma: 'tel', pikat: [
      'Ikona e Stoku-t në orë tash është e verdhë, që të duket mirë mbi sfondin e zi të Galaxy Watch.',
      'Kur serveri s\'është përditësuar, "Lidh orën" e thotë qartë këtë.'
    ] },
    { v: 160, versioni: '1.5.0', data: '2026-10-02', titulli: 'Stoku në orë (Galaxy Watch)', pikat: [
      'Aplikacioni i ri Stoku për Galaxy Watch: në orë sheh produktet që skadojnë sot, me tile dhe numër në fytyrën e orës.',
      'Lidhja: hape Stoku në orë dhe shkruaje kodin te Cilësimet → Njoftimet → Galaxy Watch → Lidh orën.',
      'Kur e shënon një produkt "u hoq" në orë, shënohet vetë edhe këtu sapo e hap Stoku-n.'
    ] },
    { v: 159, versioni: '1.4.10', data: '2026-10-02', titulli: 'Njoftimi ditor merr edhe afatet nga kompjuteri', pikat: [
      'Afatet që i shton ose i ndryshon në kompjuter futen menjëherë edhe në njoftimin ditor të telefonit, pa pasur nevojë ta hapësh Stoku-n në telefon.'
    ] },
    { v: 158, versioni: '1.4.9', data: '2026-10-02', titulli: 'Njoftimi ditor vetëm për sot', platforma: 'tel', pikat: [
      'Në orën që zgjedh, njoftimi të tregon vetëm produktet që skadojnë atë ditë. Nëse s\'skadon asnjë, s\'vjen njoftim.'
    ] },
    { v: 157, versioni: '1.4.8', data: '2026-10-02', titulli: 'Kontroll më i qartë i serverit', platforma: 'tel', pikat: [
      'Te Cilësimet → Njoftimet, kontrolli i serverit tregon me fjalë sa shpesh punon ora automatike dhe, nëse serveri ka gabim, çka saktësisht nuk po punon.'
    ] },
    { v: 156, versioni: '1.4.7', data: '2026-10-02', titulli: 'Njoftimi ditor rregullohet vetë', platforma: 'tel', pikat: [
      'Nëse serveri e humb lidhjen me telefonin (p.sh. pas riinstalimit të Stoku-t), njoftimi ditor regjistrohet vetë sërish kur e hap aplikacionin.'
    ] },
    { v: 155, versioni: '1.4.6', data: '2026-10-02', titulli: 'Pa njoftime të tepërta', platforma: 'tel', pikat: [
      'Kur njoftimi ditor është i ndezur, njoftimi "X produkte skadojnë brenda 30 ditëve" s\'del më kur hapet Stoku: afatet vijnë vetëm në orën e zgjedhur.'
    ] },
    { v: 154, versioni: '1.4.5', data: '2026-10-02', titulli: 'Ndryshimi i orës vlen që sot', platforma: 'tel', pikat: [
      'Kur e ndryshon orën e njoftimit ditor, njoftimi vjen që sot në orën e re (nëse ajo s\'ka kaluar), edhe nëse sot ka ardhur një herë.'
    ] },
    { v: 153, versioni: '1.4.4', data: '2026-10-02', titulli: 'Ora 24-orëshe', platforma: 'tel', pikat: [
      'Ora e njoftimit ditor shkruhet në formatin 24-orësh (p.sh. 17:05), pa AM/PM. Mjafton të shkruash shifrat, ":" vendoset vetë.'
    ] },
    { v: 152, versioni: '1.4.3', data: '2026-10-02', titulli: 'Njoftimi ditor në minutë të saktë', platforma: 'tel', pikat: [
      'Te Cilësimet → Njoftimet ora e njoftimit ditor shkruhet lirshëm, me orë dhe minuta (p.sh. 17:07), dhe njoftimi vjen pikërisht atëherë.'
    ] },
    { v: 151, versioni: '1.4.2', data: '2026-10-02', titulli: 'Njoftimi ditor: kontroll i serverit', platforma: 'tel', pikat: [
      'Te Cilësimet → Njoftimet, kur njoftimi ditor është ndezur, shfaqet a punon serveri dhe çka ndodhi sot ("u dërgua", "s\'kishte afate", ose çka duhet rregulluar).',
      'Derisa serveri i njoftimit ditor të mos jetë gati, njoftimet e zakonshme për afatet vijnë si më parë, që të mos mbetesh pa asnjë njoftim.'
    ] },
    { v: 150, versioni: '1.4.1', data: '2026-10-01', titulli: 'Rregullime pas kontrollit të plotë', pikat: [
      'Kërkesat për heqje nga rafti mbeten te zilja derisa të shtypet "E hoqa". Kur i kërkohet krejt ekipës dhe një koleg e heq, të tjerët shohin "✓ E hoqi …" në vend të butonit.',
      'Telefon: tabet e Ekipës (Afatet … Statistika) s\'priten më në ekranet e ngushta.',
      'Kompjuter: tabela "Duhet vepruar" te Ekipa ka më shumë vend për emrin e produktit.'
    ] },
    { v: 149, versioni: '1.4.0', data: '2026-10-01', titulli: 'Njoftimi ditor në orën tënde', platforma: 'tel', pikat: [
      'Te Cilësimet → Njoftimet ndiz "Përmbledhje çdo ditë" dhe zgjedh orën. Çdo ditë në atë orë të vjen një njoftim me produktet e skaduara dhe ato që skadojnë këtë javë, edhe kur Stoku është i mbyllur.',
      'Butoni "Dërgo njoftim provë" u hoq.'
    ] },
    { v: 148, versioni: '1.3.1', data: '2026-10-01', titulli: 'Kërko heqje: zgjedh nga lista', pikat: [
      'Te "Kërko heqje nga rafti" s\'ke më nevojë të shkruash emrin ose barkodin: shëno produktet nga lista, te "Të skaduarat" ose "Produktet e mia". Mund të zgjedhësh disa njëherësh.',
      'Kolegu i sheh krejt produktet e kërkesës te Njoftimet, me barkodin dhe datën e skadimit.'
    ] },
    { v: 147, versioni: '1.3.0', data: '2026-10-01', titulli: 'Kërko heqje nga rafti', pikat: [
      'Te Ekipa ka butonin "Kërko heqje nga rafti": zgjedh produktin (ose shkruan barkodin), kolegun ose krejt ekipën dhe një shënim. Vlen edhe për produkte pa afat në Stoku.',
      'Kolegu e merr njoftimin edhe në telefon. Te Njoftimet shtyp "E hoqa nga rafti" dhe ti njoftohesh që u krye. Krejt kjo shihet edhe te Aktiviteti.'
    ] },
    { v: 146, versioni: '1.2.2', data: '2026-10-01', titulli: 'Cilësimet më të pastra', pikat: [
      'Poshtë te Cilësimet mbeti vetëm "Stoku" me versionin, pa ikonën.'
    ] },
    { v: 145, versioni: '1.2.1', data: '2026-10-01', titulli: 'Hapje më e shpejtë', pikat: [
      'Kur je i kyçur, Stoku hapet direkt te dyqani, pa ekranin "Duke hyrë si…" pas ekranit të hapjes së telefonit.'
    ] },
    { v: 144, versioni: '1.2.0', data: '2026-10-01', titulli: 'Ikona për folderat', pikat: [
      'Folderat kanë tani ikona (shportë, pije, gjethe, bulmet, furrë, të ngrira e të tjera) që përshtaten me temën e çelët dhe të errët. Folderat ekzistues e marrin ikonën vetë sipas emrit.',
      'Te "Folder i ri" zgjedh ikonën nga 16; në kompjuter mund ta ndryshosh edhe më vonë (Veprime → Ndrysho emrin / ikonën).',
      'Logoja lart s\'dridhet më kur hapet aplikacioni.'
    ] },
    { v: 143, versioni: '1.1.2', data: '2026-10-01', titulli: 'Më mbaj mend emrin', pikat: [
      'Te hyrja ka një kuti "Më mbaj mend emrin e përdoruesit". Kur është e shënuar, emri del i shkruar vetë herën tjetër; kur e heq shenjën, emri s\'ruhet. Fjalëkalimi nuk ruhet kurrë.'
    ] },
    { v: 142, versioni: '1.1.1', data: '2026-10-01', titulli: 'Logo e re në krye', pikat: [
      'Lart majtas Stoku ka logo të re si etiketë barkodi, me emrin tënd poshtë. Përshtatet vetë me temën e çelët dhe të errët.'
    ] },
    { v: 141, versioni: '1.1.0', data: '2026-10-01', titulli: 'Foto e profilit', pikat: [
      'Te Cilësimet → Llogaria mund të vendosësh foton tënde të profilit (ose ta heqësh). Fotoja del te Ekipa, chat-i, aktiviteti dhe Cilësimet, dhe e sheh krejt ekipa.'
    ] },
    { v: 140, versioni: '1.0.2', data: '2026-10-01', titulli: 'Administratori njihet gjithmonë', pikat: [
      'Llogaria "mendurberisha" njihet si administrator direkt nga llogaria: pranimi i anëtarëve, fshirja e llogarive, lejet dhe veprimet te afatet e kolegëve punojnë pa ndonjë cilësim shtesë në Firebase.'
    ] },
    { v: 139, versioni: '1.0.1', data: '2026-10-01', titulli: 'Pa zgjedhje të krejt faqes', platforma: 'tel', pikat: [
      'Shtypja e gjatë s\'e zgjedh më krejt faqen (titujt, butonat, menytë). Barkodet, emrat e produkteve, mesazhet e chat-it dhe fushat mund të zgjidhen dhe kopjohen si më parë.'
    ] },
    { v: 139, versioni: '1.0.1', data: '2026-10-01', titulli: 'Butonat pa zgjedhje teksti', platforma: 'pc', pikat: [
      'Dykliku te butonat, menyja anësore dhe titujt s\'e zgjedh më tekstin e tyre.'
    ] },
    { v: 138, versioni: '1.0.0', data: '2026-10-01', titulli: 'Stoku 1.0.0', pikat: [
      'Versionet tani kanë tre numra. Numri i fundit rritet për rregullime të vogla (1.0.1, 1.0.2…), ai i mesit kur shtohet diçka e re (1.1.0) dhe i pari vetëm kur ndryshon krejt aplikacioni (2.0.0).'
    ] },
    { v: 137, data: '2026-10-01', titulli: 'Furnizuesit te Cilësimet', pikat: [
      'Për administratorin: te Cilësimet → Stoku ka listën e krejt furnizuesve, me sa afate ka secili.',
      'Prek një furnizues për t\'ia ndryshuar emrin: ndryshon te krejt afatet dhe produktet. Nëse i jep emrin e një furnizuesi tjetër (p.sh. "laberion" dhe "Laberion"), të dy bashkohen në një.',
      'Në telefon, kategoria "Lista" te Cilësimet tani quhet "Stoku", si te kompjuteri.'
    ] },
    { v: 134, data: '2026-10-01', titulli: 'Pa "Sasi e ulët"', platforma: 'tel', pikat: [
      'U hoq "Sasi e ulët" dhe ngjyra portokalli te sasitë. Me të kuqe mbetet vetëm sasia 0.',
      'Te karta e kryefaqes, në vend të "Sasi e ulët" tani shihet sa afate të skaduara janë ende në raft.'
    ] },
    { v: 134, data: '2026-10-01', titulli: 'Pa "Sasi e ulët"', platforma: 'pc', pikat: [
      'U hoqën kutia dhe filtri "Sasi e ulët" dhe ngjyra portokalli te sasitë. Me të kuqe mbetet vetëm sasia 0.',
      'Te Përmbledhja, karta "Sasia më e ulët" u bë "Pa stok": produktet me sasi 0, që duhen porositur.'
    ] },
    { v: 133, data: '2026-10-01', titulli: 'Anësorja më e pastër', platforma: 'pc', pikat: [
      'Cilësimet hapen nga rreshti "Cilësimet" te menyja anësore (ikona e vogël pranë emrit u hoq).',
      'U hoq "Importo nga Excel / CSV" nga fundi i anësores. Importi mbetet: klik i djathtë (ose ···) te një folder → "Importo në këtë folder…", ose Ctrl+I.',
      'U hoq cilësimi "Kufiri i sasisë së ulët". "Sasi e ulët" është tani gjithmonë 1 deri 5 copë, si te telefoni.'
    ] },
    { v: 132, data: '2026-10-01', titulli: 'Rregullime në kompjuter', platforma: 'pc', pikat: [
      'Me "Madhësia e shkronjave: E madhe" faqja mund të mbetej e prerë lart (pa titull dhe pa kërkim) dhe s\'kthehej me scroll. U rregullua: faqja mbetet gjithmonë sa ekrani.',
      'Te menyja anësore ka tani butonin "Cilësimet" (poshtë "Shkurtoret e tastierës").',
      'Dritarja e Cilësimeve del e plotë edhe në ekrane të ulëta (laptopë).'
    ] },
    { v: 131, data: '2026-10-01', titulli: 'Njoftimet edhe në Apple Watch', platforma: 'tel', pikat: [
      'Njoftimet e chat-it vijnë edhe në iPhone (Stoku i shtuar në ekranin bazë) dhe në Apple Watch.',
      'Te Cilësimet → Njoftimet, te "Njoftimet në orë" zgjidh Galaxy Watch ose Apple Watch për udhëzimin hap pas hapi.'
    ] },
    { v: 130, data: '2026-10-01', titulli: 'Njoftimet e chat-it edhe me Stoku të mbyllur', platforma: 'tel', pikat: [
      'Kur dikush shkruan te chat-i i ekipës, të vjen njoftim edhe kur Stoku është krejt i mbyllur.',
      'Njoftimet dalin edhe në orë (p.sh. Galaxy Watch). Te Cilësimet → Njoftimet ke udhëzimin hap pas hapi dhe butonin "Dërgo njoftim provë".',
      'Ikona e vogël e njoftimeve tani është barkodi i Stoku-t.'
    ] },
    { v: 130, data: '2026-10-01', titulli: 'Njoftimet e chat-it edhe me Stoku të mbyllur', platforma: 'pc', pikat: [
      'Kur dikush shkruan te chat-i i ekipës, të vjen njoftim edhe kur Stoku është i mbyllur (pasi t\'i lejosh njoftimet te Ekipa → zilja).'
    ] },
    { v: 129, data: '2026-10-01', titulli: 'Rregullime të vogla', platforma: 'tel', pikat: [
      'Butoni i sinkronizimit lart te Afatet (reja me pikën e gjelbër) tani shihet qartë.',
      'Brenda folderit, sasia 0 del me të kuqe dhe sasia e ulët (1 deri 5) me portokalli.',
      'Te Cilësimet u hoq "Versioni për kompjuter".'
    ] },
    { v: 129, data: '2026-10-01', titulli: 'Rregullime të vogla', platforma: 'pc', pikat: [
      'Numrat dhe titujt te menyja anësore lexohen më lehtë.'
    ] },
    { v: 128, data: '2026-10-01', titulli: 'Cilësimet e reja dhe afatet me ngjyra', platforma: 'tel', pikat: [
      'Cilësimet kanë pamje të re: llogaria në krye, grupe të qarta me ikona me ngjyra dhe shembull i drejtpërdrejtë te Pamja.',
      'Te Afatet, kartat kanë sërish ngjyra të lehta: e kuqe për të skaduarat, e verdhë për ato afër skadimit, e gjelbër për ato në rregull.',
      'Renditja e listës zgjidhet me një prekje. Te "Çka ka të re" mund t\'i shohësh ndryshimet e fundit kurdo.',
      'U hoqën "Ngjyra kryesore" dhe "Motivi i sfondit".'
    ] },
    { v: 128, data: '2026-10-01', titulli: 'Cilësimet e reja dhe afatet me ngjyra', platforma: 'pc', pikat: [
      'Cilësimet kanë pamje të re: menyja me ikona majtas, llogaria në krye dhe zgjedhje me pamje për temën, dendësinë dhe shkronjat.',
      'Te Afatet, rreshtat kanë ngjyra të lehta: e kuqe për të skaduarat, e verdhë për ato afër skadimit, e gjelbër për ato në rregull.',
      'Te Cilësimet ka "Çka ka të re", për t\'i parë ndryshimet e fundit kurdo.',
      'U hoq "Ngjyra kryesore".'
    ] },
    { v: 127, data: '2026-10-01', titulli: 'Logo e re', pikat: [
      'Stoku ka logo të re: një barkod i bardhë me një vijë të verdhë, në telefon, në kompjuter dhe te ikona e aplikacionit.'
    ] },
    { v: 126, data: '2026-09-30', titulli: 'Stoku me pamje të re', pikat: [
      'Pamje e re në telefon dhe në kompjuter: ngjyra më të qeta, shkronja më të qarta dhe logo e re.',
      'Tema e errët punon kudo. Në kompjuter ndërrohet shpejt poshtë menysë anësore (Tema: E çelët / E errët).',
      'Telefoni: faqja kryesore tregon sa produkte ke, sasitë e ulëta dhe çka ndryshove së fundi. Te "Afat i ri" ka data të shpejta dhe butonat − / + për sasinë.',
      'Kompjuteri: logo, kërkimi dhe llogaria janë te menyja anësore; numrat kryesorë dalin në krye të Përmbledhjes.'
    ] },
    { v: 123, data: '2026-09-30', titulli: 'Numrat e afateve si më parë', pikat: [
      'Numrat te Afatet (datat, sasitë, ditët) u kthyen në fontin dhe madhësinë e mëparshme, në telefon dhe në kompjuter.'
    ] },
    { v: 122, data: '2026-09-30', titulli: 'Ekipa me ikona dhe afatet më të qarta', pikat: [
      'Te Ekipa, kush është online tregohet me ikonën e telefonit ose të kompjuterit dhe një pikë të gjelbër; kush s\'është, me ikonën "jashtë linje" dhe kohën kur u pa.',
      'Te Afatet në kompjuter, kolona "Çfarë duhet bërë" u bë "Ditët e mbetura", me numrin të madh; nën datë s\'përsëriten më ditët.',
      'Numrat në kompjuter kanë të njëjtin font si në telefon; shkronjat në telefon u kthyen në madhësinë e mëparshme.',
      'U hoqën butonat për mesazhin e furnizuesit ("Kopjo mesazhin për furnizuesin" dhe "Dërgo listën").'
    ] },
    { v: 121, data: '2026-09-30', titulli: 'Afatet më të lexueshme', pikat: [
      'Datat, sasitë dhe ditët te Afatet kanë font të ri, më të madh dhe më të trashë, që lexohen menjëherë.',
      'Emrat e produkteve dhe tekstet te Afatet janë pak më të mëdha.',
      'U hoqën "Lajmëro furnizuesin" dhe butoni "Lajmërova".'
    ] },
    { v: 120, data: '2026-09-30', titulli: 'Afatet: import nga Excel dhe muajt', pikat: [
      'Te Afatet ka butonin "Importo" (Excel ose CSV): kolonat gjenden vetë, dhe para importit sheh çka shtohet, çka ekziston dhe çka ka gabim.',
      'Fletët me emër muaji në Excel (p.sh. "Nëntor", "Nëntor2") lexohen si ai muaj; numri pas emrit harrohet.',
      'Mbi listën e afateve ka butona për muajt (Tetor, Nëntor…): kliko njërin dhe shfaqen vetëm afatet që skadojnë atë muaj.',
      'Eksporti në Excel të pyet cilin muaj don: vetëm Tetorin, vetëm Nëntorin, ose të gjithë muajt.'
    ] },
    { v: 119, data: '2026-09-30', titulli: '"Çka ka të re" s\'humbet më', pikat: [
      'Kjo dritare s\'zhduket më kur aplikacioni rifreskohet vetë për përditësim: del pasi të përfundojë përditësimi.',
      'Shënohet si e lexuar vetëm kur e mbyll ti. Nëse e humb, del sërish herën tjetër.'
    ] },
    { v: 118, data: '2026-09-30', titulli: 'Kompjuter me ekran më të vogël', pikat: [
      'Në laptopë dhe ekrane më të vogla (1024 deri 1366), emri i produktit s\'zhduket më nga tabelat e stokut, afateve dhe ekipës.',
      'Te Ekipa, butonat e administratorit dhe emrat e anëtarëve s\'dalin më jashtë tabelës.',
      'Përmbledhja s\'del më jashtë ekranit kur një folder ka emër të gjatë.'
    ], platforma: 'pc' },
    { v: 117, data: '2026-09-30', titulli: 'Anësore më e qartë në kompjuter', pikat: [
      'Kategoritë Stoku, Afatet dhe Ekipa kanë secila ikonën dhe ngjyrën e vet, me një vijë ndarëse, që dallohet menjëherë ku fillon secila.',
      'Shigjeta në të djathtë të secilës kategori tani është buton më vete: e hap ose e mbyll kategorinë pa të çuar te ajo.',
      'Tekstet në aplikacion u pastruan: pa viza të gjata, me shenja më të thjeshta.'
    ], platforma: 'pc' },
    { v: 116, data: '2026-09-30', titulli: 'Administratori: heqja dhe fshirja e anëtarëve', pikat: [
      'Te Ekipa → Anëtarët administratori mund ta heqë kujtdo nga ekipa, ose ta fshijë llogarinë komplet (stoku, afatet dhe profili).',
      'Llogaria e fshirë del vetë nga Stoku dhe s\'mund të hyjë më; emri lirohet për një llogari të re.',
      'Edhe kërkesat për t\'u bashkuar kanë butonin "Fshij", për llogaritë e panjohura.'
    ] },
    { v: 115, data: '2026-09-30', titulli: 'Hyrja më e qëndrueshme', pikat: [
      'Me internet të dobët, "Hyr" pret derisa të lidhet me serverin, në vend që të thotë menjëherë "s\'ka internet".',
      'Në telefona ose PDA me shfletues shumë të vjetër, ekrani i hyrjes tregon saktë se duhet përditësuar Chrome / Android System WebView.',
      'Administratori sheh në krye të Ekipës kush pret miratimin dhe i pranon me një prekje.'
    ] },
    { v: 114, data: '2026-09-30', titulli: 'Ekipa me pamje të re', pikat: [
      'Ekipa hapet me një përmbledhje: sa produkte kanë skaduar, sa janë afër skadimit dhe sa janë në rregull te krejt ekipa.',
      'Poshtë saj: kush është online tani, çka duhet hequr nga rafti (me "Unë e hoqa" aty për aty) dhe çka skadon këtë javë.',
      'Aktiviteti, Kalendari, Anëtarët dhe Statistika hapen nga butonat me ikona; "mbrapa" të kthen te përmbledhja.'
    ] },
    { v: 113, data: '2026-09-30', titulli: 'Rregullime gabimesh', pikat: [
      'Një e dhënë e dëmtuar (p.sh. një folder ose afat pa emër/id) s\'e bllokon më aplikacionin: hiqet ose rregullohet vetë.',
      'Kur del nga llogaria pa internet, aplikacioni të paralajmëron që ndryshimet e fundit s\'janë ruajtur ende në cloud.',
      'Importi i Excel-it (kompjuter) s\'ngrin më me skedarë që kanë shumë rreshta bosh në fund.'
    ] },
    { v: 112, data: '2026-09-30', titulli: 'Administratori: opsione të reja', pikat: [
      'Administratori sheh te Ekipa → "Stoku" stokun e plotë të secilit anëtar dhe e shkarkon në Excel.',
      'Administratori mund ta heqë nga rafti, ta kthejë ose ta fshijë afatin e kujtdo, dhe pronari njoftohet.',
      'Administratori ua jep ose ua heq lejen e butonave +/- kujtdo (te Anëtarët), dhe dërgon një njoftim që i del krejt ekipës te zilja.',
      'Administratori mund ta pastrojë krejt chat-in ose aktivitetin.'
    ] },
    { v: 111, data: '2026-09-30', titulli: 'Ekipa: chat-i lart djathtas', pikat: [
      'Chat-i i ekipës tani hapet nga ikona lart djathtas, pranë njoftimeve. Pika e kuqe tregon mesazh të ri. Prekja sërish të kthen aty ku ishe.'
    ] },
    { v: 110, data: '2026-09-29', titulli: 'Ekipa më e sigurt, sinkronizim më i shpejtë', pikat: [
      'Një llogari e re e sheh Ekipën vetëm pasi ta pranojë administratori (te Ekipa → Anëtarët). Anëtarët e sotëm mbeten në ekipë.',
      'Kolegët shohin vetëm afatet e tua, ndërsa stoku yt mbetet vetëm i yti.',
      'Mesazhet e chat-it dhe "Unë e hoqa" s\'humbin pa internet: dërgohen vetë sapo të kthehet interneti, edhe nëse e mbyll aplikacionin.',
      'Ndryshimet nga pajisjet e tjera s\'humbin më kur mbërrijnë gjatë një ruajtjeje, dhe ruajtja në cloud dërgon vetëm pjesët që ndryshuan (më shpejt, më pak internet).'
    ] },
    { v: 109, data: '2026-09-29', titulli: 'Ekipa: afatet, aktiviteti, chat-i dhe më shumë', pikat: [
      '"Ekipi" tani quhet "Ekipa" dhe tregon vetëm afatet e kolegëve (jo stokun).',
      'Kur një produkt i një kolegu ka skaduar, mund ta heqësh ti nga rafti me "Unë e hoqa", dhe kolegu njoftohet me emrin tënd.',
      'Zilja lart djathtas: njoftimet, p.sh. kur dikush e heq nga rafti një produkt tëndin.',
      'Aktiviteti (kush çka hoqi, shtoi ose lajmëroi), chat-i i ekipës, kalendari me ngjyra për çdo ditë, anëtarët (kush është online tani) dhe statistika.'
    ] },
    { v: 105, data: '2026-09-29', titulli: 'Ekipi: stoku i përbashkët i krejt llogarive', pikat: [
      'U shtua "Ekipi": te telefoni si tab i tretë (mas Stoku dhe Afatet), te kompjuteri si seksion i tretë në anësore.',
      'Aty shihen stoku dhe afatet e KREJT llogarive, të shënuara me emrin e secilit përdorues.',
      'Secili sheh gjithçka, por fshin/ndryshon vetëm produktet dhe afatet e veta. Të tjerëve u shikohen, s\'u ndryshohen.'
    ] },
    { v: 103, platforma: 'pc', data: '2026-09-29', titulli: 'Kompjuteri: përmirësime te anësorja', pikat: [
      '"Stoku" dhe "Afatet" tani mund të jenë të dyja të hapura njëkohësisht, dhe hapja/mbyllja rrëshqet butë.',
      'Nën "Afatet" u shtuan "Të skaduara" dhe "Afër skadimit" si shkurtore të drejtpërdrejta.',
      'Fletët e dërguara nga telefoni tani shfaqen te faqja e duhur: fletët e stokut te "Stoku", fletët e afateve te "Afatet" (jo më të dyja te Afatet).'
    ] },
    { v: 101, platforma: 'pc', data: '2026-09-29', titulli: 'Kompjuteri: "Stoku"/"Afatet" si akordion në anësore', pikat: [
      '"Stoku" dhe "Afatet" tani janë ngjitur njëri pas tjetrit lart në anësore. Kliko njërin dhe hapet vetëm ai, me opsionet e tij poshtë emrit.'
    ] },
    { v: 99, platforma: 'pc', data: '2026-09-29', titulli: 'Kompjuteri: "Stoku" dhe "Afatet" të ndarë në anësore', pikat: [
      'Anësorja majtas tani i ka të dyja të qarta: "Stoku" lart (Përmbledhja, Të gjitha produktet, folderat) dhe "Afatet" poshtë (Afatet e produkteve).'
    ] },
    { v: 94, platforma: 'tel', data: '2026-09-29', titulli: 'Importi i stokut: furnizuesi + dërgo në kompjuter', pikat: [
      'Te importi i stokut nga foto, tani lexohet edhe furnizuesi për çdo produkt (jo vetëm barkodi/emri/sasia).',
      'Pas fotos, mund të zgjedhësh: vazhdo këtu në telefon, ose dërgoje në kompjuter për ta kontrolluar atje, njësoj si te Afatet.'
    ] },
    { v: 93, platforma: 'tel', data: '2026-09-29', titulli: 'Importi i stokut: krijo folder të ri aty për aty', pikat: [
      'Te importi i stokut nga foto, në zgjedhjen e folderit tani ka edhe "+ Folder i ri…", që e krijon dhe e zgjedh menjëherë, pa dalë nga kontrolli i listës.'
    ] },
    { v: 92, platforma: 'tel', data: '2026-09-29', titulli: 'Importo stokun nga një fletë e fotografuar', pikat: [
      'Në faqen kryesore, lart djathtas: fotografo (ose zgjidh nga galeria) një fletë ku janë shkruar produktet (barkodi, emri, sasia) dhe AI-ja i lexon rreshtat.',
      'I kontrollon dhe i korrigjon njësoj si te Afatet, zgjedh folderin ku shkojnë, dhe i ruan; nëse barkodi ekziston tashmë atje, sasia i shtohet.'
    ] },
    { v: 91, data: '2026-09-27', titulli: 'Përditësim automatik dhe kjo dritare', pikat: [
      'Aplikacioni e kontrollon vetë në sfond a ka version të ri sa herë hapet, dhe kalon te versioni i ri pa u dashur të mbyllet e të rihapet.',
      'Sa herë shtohet diçka e re ose përmirësohet, të tregohet këtu në hyrje.'
    ] },
    { v: 90, platforma: 'tel', data: '2026-09-27', titulli: 'Tabet poshtë ekranit (telefon)', pikat: [
      'Shirit i ri poshtë ekranit me tri tabe: Stoku, Afatet dhe Cilësimet, që arrihen me gishtin e madh, pa e lëvizur dorën.',
      'Te tabi Afatet shihet gjithmonë numri i produkteve të skaduara ose afër skadimit.',
      '"Opsionet" tani quhen "Cilësimet".'
    ] },
    { v: 89, platforma: 'tel', data: '2026-09-27', titulli: 'Afatet: më lehtë për t\'u shkruar', pikat: [
      'Data e skadimit shkruhet me vit 2-shifror: 011226 bëhet 01-12-26.',
      'Fusha e sasisë tregon "Copë" si tekst ndihmës.',
      'Ekrani nuk zmadhohet më me dy gishta.',
      'Mesazhi i afateve: "lajmëro furnizuesin sa më parë".'
    ] },
    { v: 86, platforma: 'tel', data: '2026-09-26', titulli: 'Njoftime, Excel dhe rregullime', pikat: [
      'Njoftime në telefon kur një produkti i kanë mbetur 30 ditë deri në skadim, dhe kur skadon.',
      'Te Afatet: zgjidh produkte dhe eksportoji në Excel, me kolonat që i zgjedh vetë.',
      'Ikona e cloud-it në krye të faqes së afateve tregon a janë ruajtur në cloud.',
      '"U hoq nga rafti" del vetëm për produktet e skaduara.',
      'Emri i aplikacionit tani është vetëm "Stoku".',
      'U rregulluan disa gabime të sinkronizimit mes telefonit dhe kompjuterit.'
    ] }
  ];

  function versioni() { return LISTA.length ? LISTA[0].v : 0; }
  // Hyrjet më të reja se versioni i fundit që përdoruesi e ka parë (nga më e reja te më e vjetra), vetëm për
  // këtë platformë ('tel' | 'pc'): hyrjet pa `platforma` vlejnë për të dyja.
  function teRejatPas(vPare, platforma) {
    return LISTA.filter(function (h) {
      return h.v > (Number(vPare) || 0) && (!h.platforma || !platforma || h.platforma === platforma);
    });
  }
  function formatoDaten(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    return m ? m[3] + '.' + m[2] + '.' + m[1] : (iso || '');
  }

  // Emri i versionit që sheh përdoruesi ("Stoku 1.0.1") = fusha `versioni` e hyrjes me atë `v` (numri i brendshëm v,
  // CACHE te sw.js, mbetet për përditësimet). Hyrjet pa `versioni` (para 1.0.0) shfaqen vetëm me datë.
  function emriVersionit(v) {
    v = Number(v) || 0;
    for (var i = 0; i < LISTA.length; i++) if (LISTA[i].v === v && LISTA[i].versioni) return LISTA[i].versioni;
    return '';
  }
  var MUAJT = ['janar', 'shkurt', 'mars', 'prill', 'maj', 'qershor', 'korrik', 'gusht', 'shtator', 'tetor', 'nëntor', 'dhjetor'];
  // "2026-10-01" → "1 tetor 2026"
  function dataEPlote(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    return m ? Number(m[3]) + ' ' + MUAJT[Number(m[2]) - 1] + ' ' + m[1] : (iso || '');
  }

  // Rreshti nën titullin e një hyrjeje: "Stoku 1.0 · 1 tetor 2026" (ose vetëm data për përditësimet e vjetra)
  function etiketa(h) {
    var e = emriVersionit(h.v);
    return (e ? 'Stoku ' + e + ' · ' : '') + dataEPlote(h.data);
  }

  var api = { LISTA: LISTA, versioni: versioni, teRejatPas: teRejatPas, formatoDaten: formatoDaten, emriVersionit: emriVersionit, dataEPlote: dataEPlote, etiketa: etiketa };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.StokuTeRejat = api;
})(typeof self !== 'undefined' ? self : this);
