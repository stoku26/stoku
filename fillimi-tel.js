// v238: u nxor nga index.html (CSP pa 'unsafe-inline': faqet s'kanë më skripta të brendshme). Kur ndryshon, rrite ?v= te index.html dhe sw.js.
  // Në kompjuter (Windows, Mac, Chromebook, ose Linux me maus/touchpad) hapet gjithmonë versioni për kompjuter (pc.html).
  // Telefonat, tabletët dhe PDA-të (Zebra) nuk ridrejtohen kurrë.
  // Nuk varet nga madhësia e ekranit, shkalla e Windows-it (125%/150%), ekrani i dytë apo prekja te laptopët:
  // këto më parë e hapnin herë pas here versionin e telefonit në kompjuter.
  // Adresa mbahet e pastër: stoku.site/ (pa "index.html" në shiritin e adresës).
  function adresaEPaster() {
    try {
      var dosja = location.pathname.replace(/[^\/]*$/, '');
      if (location.pathname !== dosja || location.search) history.replaceState(history.state, '', dosja + location.hash);
    } catch (e) { /* ok */ }
  }
  (function () {
    function lexo(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    // Zgjedhja e vjetër "Versioni për telefon" (butoni u hoq nga pc.html) s'vlen më
    try { if (lexo('stoku:pamja') === 'mobile') localStorage.removeItem('stoku:pamja'); } catch (e) { /* ok */ }
    var op = null;
    try { op = JSON.parse(lexo('stoku:opsione:v1') || 'null'); } catch (e) { /* ok */ }
    if (op && op.pda) return;
    var ua = navigator.userAgent || '';
    // iPad-i paraqitet si Mac, por ka ekran me prekje (Mac-ët s'kanë)
    var celular = /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 0);
    if (celular) return;
    // Telefoni/tableti Android me "Desktop site" paraqitet si Linux, por pa maus → mbetet ky version
    var mausi = !!(window.matchMedia && window.matchMedia('(any-pointer: fine)').matches);
    var kompjuter = /Windows|Macintosh|CrOS/.test(ua) || mausi;
    // pc.html e fsheh vetë emrin e vet; faqja e hapur (#/f/...) ruhet edhe pas rifreskimit
    if (kompjuter || lexo('stoku:pamja') === 'pc') {
      // v231: llogaria pa lejen "Stoku në kompjuter" (lejet.js, të ruajtura në këtë pajisje) mbetet te ky version, pa mesazh
      var lj = null;
      try { lj = JSON.parse(lexo('stoku:lejet:v1') || 'null'); } catch (e) { /* ok */ }
      if (lj && lj.lejet && lj.lejet.pc === false) { window.__stokuPaPc = true; return; }
      window.__stokuDrejtPc = true;
      location.replace('pc.html' + (/^#\//.test(location.hash) ? location.hash : ''));
    }
  })();
  if (!window.__stokuDrejtPc) adresaEPaster();
  // Vendos temën para se faqja të vizatohet (që të mos ketë dridhje ndriçimi)
  (function () {
    var t = null;
    try { t = localStorage.getItem('stoku:tema'); } catch (e) {}
    if (t !== 'dark' && t !== 'light') {
      t = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-tema', t);
  })();
  // iPhone në Safari (jo nga ekrani kryesor): shiriti i Safari-t poshtë e mbulon vetë zonën e "home indicator",
  // ndërsa Safari (iOS 26) e raporton prapë env(safe-area-inset-bottom) dhe tabet ngriheshin shumë lart.
  // Atje hapësira poshtë = 0 (--sab), që tabet të rrinë sa më poshtë; në aplikacionin e instaluar mbetet env().
  (function () {
    var ua = navigator.userAgent || '';
    var iphone = /iPhone|iPod/.test(ua);
    var instaluar = navigator.standalone === true || !!(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
    if (iphone && !instaluar) document.documentElement.classList.add('ios-shfletues');
  })();
