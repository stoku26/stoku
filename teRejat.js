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
