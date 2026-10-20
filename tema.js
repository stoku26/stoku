// v238: u nxor nga 404.html (CSP pa 'unsafe-inline': faqet s'kanë më skripta të brendshme). Kur ndryshon, rrite ?v= te 404.html dhe sw.js.
  // Tema si te aplikacioni: zgjedhja e përdoruesit (Cilësimet → Tema), përndryshe ajo e sistemit
  (function () {
    var t = null;
    try { t = localStorage.getItem('stoku:tema'); } catch (e) { /* ok */ }
    if (t !== 'dark' && t !== 'light') t = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    document.documentElement.setAttribute('data-tema', t);
  })();
