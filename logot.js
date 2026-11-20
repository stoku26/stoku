/* v314: logoja e Stoku-t vetëm me shkronja "stoku." (Onest 800, pika e gjelbër) dhe ikona nr. 4 e pronarit
 * ("stoku." e bardhë mbi të zezë; në madhësi shumë të vogla "s."). Zgjedhja e 25 ngjyrave të v313 u hoq (pronari:
 * "te cilesimet pamja qato logot komplet fshij"); `stoku:logoja` dhe data-logo të vjetra fshihen.
 * Të dhënat (midis LOGOT-FILLIMI dhe LOGOT-FUNDI) i shkruan VETËM teste/logot-gjenero.py: mos i ndrysho me dorë. */
(function (root) {
  'use strict';
  /* LOGOT-FILLIMI */
  var DATA = {
    // Logoja: shkronjat "stoku." (t) dhe pika (p), 100.52 x 26.97
    fjala: { w: 100.52, h: 26.97, t: 'M40.6 26.68Q37.66 26.68 35.38 25.5Q33.09 24.32 31.78 22.06Q30.47 19.8 30.47 16.62Q30.47 13.38 31.8 11.09Q33.13 8.8 35.4 7.59Q37.67 6.37 40.53 6.37Q43.45 6.37 45.7 7.62Q47.95 8.86 49.24 11.16Q50.53 13.47 50.53 16.71Q50.53 19.86 49.28 22.1Q48.03 24.35 45.79 25.52Q43.56 26.68 40.6 26.68ZM52.48 26.4V0H58.4V13.99H60.66L65.13 6.74H71.75L65.57 16.11L72.25 26.4H65.42L60.83 19.25H58.4V26.4ZM81.86 26.68Q77.43 26.68 75.03 24.45Q72.62 22.21 72.62 17.7V6.74H78.54V17.25Q78.54 18.42 78.86 19.34Q79.18 20.25 79.92 20.79Q80.65 21.32 81.86 21.32Q83.2 21.32 83.87 20.73Q84.53 20.13 84.74 19.19Q84.95 18.24 84.95 17.25V6.74H90.87V17.7Q90.87 22.45 88.46 24.57Q86.04 26.68 81.86 26.68ZM8.92 26.68Q7.49 26.68 6.02 26.36Q4.56 26.04 3.29 25.29Q2.03 24.54 1.16 23.23Q0.28 21.92 0 19.96H5.98Q6.18 20.55 6.66 20.97Q7.14 21.4 7.81 21.61Q8.49 21.83 9.22 21.83Q9.7 21.83 10.14 21.75Q10.58 21.68 10.93 21.49Q11.29 21.3 11.48 21.01Q11.68 20.72 11.68 20.31Q11.68 19.8 11.36 19.52Q11.04 19.25 10.49 19.08Q9.94 18.91 9.2 18.76Q8.5 18.58 7.74 18.44Q6.99 18.31 6.26 18.14Q4.83 17.79 3.52 17.18Q2.22 16.56 1.39 15.42Q0.57 14.29 0.57 12.39Q0.57 10.73 1.28 9.57Q1.99 8.42 3.19 7.72Q4.38 7.01 5.83 6.69Q7.28 6.37 8.73 6.37Q10.79 6.37 12.54 7.03Q14.3 7.69 15.47 9.12Q16.64 10.55 16.92 12.86H11.23Q11.12 12.11 10.36 11.67Q9.61 11.23 8.5 11.23Q8.09 11.23 7.68 11.31Q7.28 11.38 6.95 11.53Q6.62 11.68 6.43 11.94Q6.24 12.2 6.24 12.56Q6.24 12.84 6.41 13.11Q6.59 13.39 6.97 13.59Q7.35 13.79 7.91 13.93Q9.06 14.19 10.27 14.42Q11.48 14.66 12.56 14.93Q13.78 15.21 14.89 15.76Q16.01 16.32 16.73 17.37Q17.45 18.42 17.45 20.22Q17.45 22.09 16.68 23.34Q15.92 24.6 14.66 25.32Q13.4 26.04 11.89 26.36Q10.39 26.68 8.92 26.68ZM27.51 26.4Q24.98 26.4 23.33 25.82Q21.69 25.24 20.88 23.8Q20.07 22.37 20.07 19.76V12.02H17.25V6.74H20.07V1.66H25.98V6.74H29.93V12.02H25.98V18.89Q25.98 19.86 26.32 20.48Q26.66 21.1 28.03 21.1H29.73V26.4ZM40.52 21.23Q42.08 21.23 43.01 20.56Q43.94 19.89 44.34 18.83Q44.74 17.77 44.74 16.65Q44.74 15.53 44.34 14.42Q43.94 13.32 43.03 12.58Q42.11 11.85 40.52 11.85Q38.96 11.85 38.01 12.58Q37.07 13.32 36.67 14.41Q36.27 15.5 36.27 16.65Q36.27 17.8 36.68 18.86Q37.1 19.92 38.03 20.57Q38.96 21.23 40.52 21.23Z', p: 'M97.03 26.97Q95.58 26.97 94.55 26.07Q93.51 25.16 93.51 23.45Q93.51 21.7 94.58 20.72Q95.64 19.75 97.06 19.75Q98.48 19.75 99.5 20.71Q100.52 21.67 100.52 23.42Q100.52 25.16 99.5 26.07Q98.48 26.97 97.03 26.97Z' },
    // Ikona (rrjeta 108, zona e dukshme 18..90): fjala e plotë dhe "s." për madhësitë e vogla
    ikona: { t: 'M48.34 61.74Q46.61 61.74 45.28 61.04Q43.94 60.35 43.17 59.03Q42.4 57.7 42.4 55.84Q42.4 53.94 43.18 52.6Q43.96 51.26 45.29 50.54Q46.62 49.83 48.3 49.83Q50.01 49.83 51.32 50.56Q52.64 51.29 53.4 52.64Q54.16 53.99 54.16 55.89Q54.16 57.74 53.43 59.05Q52.69 60.37 51.38 61.05Q50.07 61.74 48.34 61.74ZM55.3 61.57V46.1H58.77V54.3H60.1L62.71 50.05H66.59L62.97 55.54L66.89 61.57H62.88L60.19 57.38H58.77V61.57ZM72.52 61.74Q69.93 61.74 68.52 60.43Q67.11 59.11 67.11 56.47V50.05H70.57V56.21Q70.57 56.89 70.76 57.43Q70.95 57.97 71.38 58.28Q71.81 58.59 72.52 58.59Q73.31 58.59 73.7 58.25Q74.08 57.9 74.21 57.34Q74.33 56.79 74.33 56.21V50.05H77.8V56.47Q77.8 59.25 76.39 60.5Q74.97 61.74 72.52 61.74ZM29.77 61.74Q28.93 61.74 28.07 61.55Q27.21 61.36 26.47 60.92Q25.73 60.48 25.22 59.71Q24.71 58.95 24.54 57.8H28.05Q28.16 58.14 28.44 58.39Q28.73 58.64 29.12 58.76Q29.52 58.89 29.95 58.89Q30.23 58.89 30.48 58.85Q30.74 58.8 30.95 58.69Q31.16 58.58 31.27 58.41Q31.39 58.24 31.39 58Q31.39 57.7 31.2 57.54Q31.01 57.38 30.69 57.28Q30.37 57.18 29.93 57.09Q29.52 56.99 29.08 56.91Q28.64 56.83 28.21 56.73Q27.37 56.52 26.61 56.16Q25.84 55.8 25.36 55.14Q24.87 54.47 24.87 53.36Q24.87 52.38 25.29 51.71Q25.71 51.03 26.41 50.62Q27.11 50.21 27.96 50.02Q28.81 49.83 29.66 49.83Q30.86 49.83 31.89 50.22Q32.92 50.6 33.61 51.44Q34.3 52.28 34.46 53.63H31.12Q31.06 53.19 30.61 52.94Q30.17 52.68 29.53 52.68Q29.28 52.68 29.05 52.72Q28.81 52.77 28.62 52.86Q28.42 52.94 28.31 53.09Q28.2 53.25 28.2 53.46Q28.2 53.62 28.3 53.78Q28.4 53.95 28.63 54.06Q28.85 54.18 29.18 54.26Q29.85 54.41 30.56 54.55Q31.27 54.69 31.9 54.85Q32.62 55.01 33.27 55.34Q33.92 55.66 34.35 56.28Q34.77 56.89 34.77 57.95Q34.77 59.04 34.32 59.78Q33.87 60.51 33.13 60.94Q32.39 61.36 31.51 61.55Q30.63 61.74 29.77 61.74ZM40.67 61.57Q39.18 61.57 38.22 61.23Q37.25 60.89 36.78 60.05Q36.3 59.21 36.3 57.68V53.14H34.65V50.05H36.3V47.07H39.77V50.05H42.08V53.14H39.77V57.17Q39.77 57.74 39.97 58.1Q40.17 58.46 40.97 58.46H41.97V61.57ZM48.29 58.54Q49.21 58.54 49.75 58.15Q50.29 57.75 50.53 57.13Q50.76 56.51 50.76 55.86Q50.76 55.2 50.53 54.55Q50.29 53.9 49.76 53.47Q49.22 53.04 48.29 53.04Q47.37 53.04 46.82 53.47Q46.27 53.9 46.03 54.54Q45.8 55.18 45.8 55.86Q45.8 56.53 46.04 57.15Q46.29 57.77 46.83 58.16Q47.37 58.54 48.29 58.54Z', p: 'M81.41 61.9Q80.56 61.9 79.96 61.37Q79.35 60.84 79.35 59.84Q79.35 58.82 79.97 58.24Q80.6 57.67 81.43 57.67Q82.26 57.67 82.86 58.23Q83.46 58.8 83.46 59.82Q83.46 60.84 82.86 61.37Q82.26 61.9 81.41 61.9Z' },
    ikonaS: { t: 'M48.41 67.55Q46.47 67.55 44.49 67.12Q42.5 66.68 40.79 65.66Q39.08 64.64 37.9 62.88Q36.72 61.11 36.33 58.46H44.43Q44.69 59.25 45.34 59.82Q46 60.39 46.91 60.69Q47.82 60.98 48.81 60.98Q49.46 60.98 50.05 60.88Q50.65 60.78 51.13 60.52Q51.61 60.26 51.88 59.87Q52.14 59.48 52.14 58.92Q52.14 58.23 51.71 57.86Q51.27 57.49 50.53 57.26Q49.78 57.03 48.78 56.83Q47.83 56.59 46.81 56.4Q45.79 56.22 44.8 55.98Q42.87 55.52 41.1 54.69Q39.33 53.85 38.22 52.31Q37.1 50.77 37.1 48.21Q37.1 45.96 38.07 44.4Q39.03 42.84 40.65 41.89Q42.26 40.93 44.22 40.5Q46.19 40.06 48.15 40.06Q50.93 40.06 53.31 40.96Q55.69 41.85 57.27 43.78Q58.86 45.72 59.23 48.85H51.53Q51.38 47.83 50.36 47.23Q49.34 46.64 47.84 46.64Q47.28 46.64 46.73 46.74Q46.19 46.85 45.74 47.05Q45.3 47.25 45.04 47.6Q44.77 47.95 44.77 48.43Q44.77 48.82 45.01 49.19Q45.25 49.56 45.76 49.84Q46.28 50.11 47.03 50.29Q48.6 50.64 50.23 50.96Q51.87 51.28 53.32 51.64Q54.98 52.03 56.49 52.77Q58 53.52 58.97 54.94Q59.95 56.37 59.95 58.8Q59.95 61.33 58.91 63.03Q57.88 64.73 56.17 65.7Q54.46 66.68 52.43 67.12Q50.4 67.55 48.41 67.55Z', p: 'M66.94 67.94Q64.98 67.94 63.58 66.71Q62.18 65.49 62.18 63.17Q62.18 60.81 63.62 59.49Q65.06 58.16 66.98 58.16Q68.9 58.16 70.28 59.47Q71.67 60.77 71.67 63.13Q71.67 65.49 70.28 66.71Q68.9 67.94 66.94 67.94Z' },
    ngjyrat: { bg: '#14161b', fg: '#ffffff', ac: '#4ade80', acL: '#16a34a', acD: '#4ade80' },
    // Ikona e çelët (nr. 5) për temën e çelët
    celet: { bg: '#ffffff', fg: '#14161b', ac: '#16a34a' }
  };
  /* LOGOT-FUNDI */

  // v324 (pronari zgjodhi GIF-in 02: "bone sa ma high quality ... edhe tjen nloop mos tdoket keq ne nisje edhe mbarim. Kudo qe osht
  // qashtu e madhe logoja"): në vend të valës (v322), te logot e mëdha një barkod kthehet në "stoku." me një vijë skanimi të gjelbër,
  // në loop pa kërcim (6 s): barkodi → vija (majtas → djathtas) → logoja mbetet ~3 s → vija → barkodi. E vizatuar si SVG (e mprehtë në
  // çdo madhësi). Të dy shtresat priten (clipPath) nga një drejtkëndësh 150 i gjerë që lëviz me translateX: kur kalon nga një pjesë e
  // loop-it te tjetra mbulon gjithmonë krejt logon ose asgjë, prandaj s'ka kërcim. Të njëjtat kohë si ValaELogos/SkanimiILogos (Android).
  // Barkodi: shtylla deterministe (si GIF-i). "Zvogëlo lëvizjet": vetëm logoja, pa lëvizje.
  // v325 (pronari: "nonstop po rrin tu u bo her barkod her logo. Bone kshtu ... me u shendrru prej barkodit ne logo pas 1 sekonde ...
  // edhe me nejt logo ... vetem 1 her me u pa deri ne loginin tjeter"): pa loop. Barkodi 1 s → skanimi 1 s → logoja mbetet. Hyrja
  // (#porta) e luan sa herë del; koka e luan NJË herë pas çdo hyrjeje (KEY_SKANUAR; e fshin porta.js kur hapet hyrja), pastaj vetëm logo,
  // edhe kur aplikacioni mbyllet e hapet. Të njëjtat kohë si SkanimiILogos (Android).
  // v349 (pronari: "pas 1.5 sekondave me u ndryshu nga barkodi ne logo ... Nese bohesh login niher ... edhe mo me met veq logo stoku deri
  // sa te mbyllet e hapet prap"): barkodi 1.5 s → skanimi 1 s (2.5 s gjithsej). Hyrja: sa herë del. Koka: NJË herë për çdo hapje të
  // Stoku-t (sessionStorage: mbetet gjatë rifreskimeve, fshihet kur mbyllet skeda/aplikacioni) dhe sërish pas çdo hyrjeje.
  var SK_CSS =
    '@keyframes stkSkL{0%{transform:translateX(-153px)}60%{transform:translateX(-153px);animation-timing-function:ease-in-out}100%{transform:translateX(-46px)}}' +
    '@keyframes stkSkB{0%{transform:translateX(-3px)}60%{transform:translateX(-3px);animation-timing-function:ease-in-out}100%{transform:translateX(104px)}}' +
    '@keyframes stkSkV{0%{transform:translateX(-3px);opacity:0}59.99%{transform:translateX(-3px);opacity:0}60%{transform:translateX(-3px);opacity:1;animation-timing-function:ease-in-out}' +
    '99.99%{transform:translateX(104px);opacity:1}100%{transform:translateX(104px);opacity:0}}' +
    '.stk-logo .sk-l{transform:translateX(-20px)}.stk-logo .sk-b{transform:translateX(104px)}.stk-logo .sk-v{opacity:0}' +
    '.stk-logo--skanim .sk-l{animation:stkSkL 2.5s linear both}.stk-logo--skanim .sk-b{animation:stkSkB 2.5s linear both}' +
    '.stk-logo--skanim .sk-v{animation:stkSkV 2.5s linear both}' +
    '.stk-logo .sk-v rect{fill:#4ade80}' +
    '@media (prefers-reduced-motion: reduce){.stk-logo--skanim .sk-l,.stk-logo--skanim .sk-b,.stk-logo--skanim .sk-v{animation:none}}';
  var KEY_SKANUAR = 'stoku:logo:skanuar';
  function shtoStilinESkanimit() {
    if (!root.document || root.document.getElementById('stkSkanimStil')) return;
    var st = root.document.createElement('style'); st.id = 'stkSkanimStil'; st.textContent = SK_CSS;
    (root.document.head || root.document.documentElement).appendChild(st);
  }
  // Shtyllat e barkodit (njësitë e logos 100.52 x 26.97), të njëjtat si te GIF-i dhe te Android-i
  var BARKODI = (function () {
    var s = 7, r = function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }, W = [0.9, 1.8, 2.7], x = 2, d = '';
    while (x < 98) { var w = W[Math.floor(r() * 3)]; d += 'M' + x.toFixed(2) + ' 0h' + w + 'v26.97h-' + w + 'z'; x += w + W[Math.floor(r() * 3)]; }
    return d;
  })();
  var skNr = 0;
  function brendaSkanimit(t, p) {
    var n = ++skNr, L = 'stkSkL' + n, B = 'stkSkB' + n;
    return '<defs><clipPath id="' + L + '"><rect class="sk-l" x="0" y="-8" width="150" height="45"></rect></clipPath>' +
      '<clipPath id="' + B + '"><rect class="sk-b" x="0" y="-8" width="150" height="45"></rect></clipPath></defs>' +
      '<g clip-path="url(#' + B + ')"><path class="lg-t lg-bk" d="' + BARKODI + '"></path></g>' +
      '<g clip-path="url(#' + L + ')"><path class="lg-t" d="' + t + '"></path><path class="lg-a" d="' + p + '"></path></g>' +
      '<g class="sk-v"><rect x="-6" y="-4" width="6" height="35" opacity=".12"></rect><rect x="-.35" y="-4" width=".7" height="35"></rect></g>';
  }
  // v349: për hapje (sessionStorage), jo përgjithmonë; shënimi i vjetër te localStorage (v325) hiqet
  try { localStorage.removeItem(KEY_SKANUAR); } catch (e) { /* ok */ }
  function skanuar() { try { return sessionStorage.getItem(KEY_SKANUAR) === '1'; } catch (e) { return false; } }
  var kokatNePritje = [];
  function luajKoken(svg) { svg.classList.add('stk-logo--skanim'); try { sessionStorage.setItem(KEY_SKANUAR, '1'); } catch (e) { /* ok */ } }
  function skanim(svg) {
    if (!svg || svg.__skanim) return;
    svg.__skanim = 1;
    var t = svg.querySelector('.lg-t'), p = svg.querySelector('.lg-a');
    if (t && p && !svg.querySelector('.lg-bk')) svg.innerHTML = brendaSkanimit(t.getAttribute('d'), p.getAttribute('d'));
    if (svg.closest && svg.closest('#porta')) { svg.classList.add('stk-logo--skanim'); return; } // hyrja: sa herë del
    if (skanuar()) return; // koka: tashmë u pa pas kësaj hyrjeje → vetëm logoja
    kokatNePritje.push(svg); // luhet kur mbyllet hyrja (porta.js: "stoku-porta-hapur" = dyqani u hap)
  }
  if (root.addEventListener) root.addEventListener('stoku-porta-hapur', function () {
    var l = kokatNePritje; kokatNePritje = [];
    if (!skanuar()) l.forEach(luajKoken);
  });
  function skanimKudo() { shtoStilinESkanimit(); Array.prototype.forEach.call(root.document.querySelectorAll('svg.stk-logo'), skanim); }

  // Logoja brenda faqes: shkronjat me ngjyrën e tekstit (currentColor), pika nga css/stoku-logot.css; v324 me skanimin
  function svgLogo(klasa) {
    var F = DATA.fjala;
    shtoStilinESkanimit();
    // svgLogo përdoret te hyrja (porta.js, luhet sa herë del) dhe te faqja bosh e PC-së (vetëm logoja)
    var luaj = /porta/.test(klasa || '');
    return '<svg class="stk-logo' + (luaj ? ' stk-logo--skanim' : '') + (klasa ? ' ' + klasa : '') + '" viewBox="0 0 ' + F.w + ' ' + F.h + '" aria-hidden="true" focusable="false">' +
      brendaSkanimit(F.t, F.p) + '</svg>';
  }
  // Vizatimi në canvas (PDF, fotoja e afateve). o: { erret, tekst (ngjyra e shkronjave) }. Kthen gjerësinë.
  function vizatoLogon(c, x, y, h, o) {
    o = o || {};
    var F = DATA.fjala, k = h / F.h;
    if (!root.Path2D) return 0;
    c.save(); c.translate(x, y); c.scale(k, k);
    c.fillStyle = o.tekst || (o.erret ? '#f5f5f7' : '#14161b'); c.fill(new Path2D(F.t));
    c.fillStyle = o.erret ? DATA.ngjyrat.acD : DATA.ngjyrat.acL; c.fill(new Path2D(F.p));
    c.restore();
    return F.w * k;
  }
  // Ikona e aplikacionit (katror i rrumbullakosur) me madhësi s; nën 40 px me "s." që të lexohet
  function vizatoIkonen(c, x, y, s) {
    if (!root.Path2D) return;
    var I = s < 40 ? DATA.ikonaS : DATA.ikona, k = s / 72, N = DATA.ngjyrat;
    c.save(); c.translate(x, y); c.scale(k, k);
    c.fillStyle = N.bg; c.beginPath();
    if (c.roundRect) c.roundRect(0, 0, 72, 72, 17); else c.rect(0, 0, 72, 72);
    c.fill();
    c.translate(-18, -18);
    c.fillStyle = N.fg; c.fill(new Path2D(I.t));
    c.fillStyle = N.ac; c.fill(new Path2D(I.p));
    c.restore();
  }

  // v314 (pronari: "4-shin kur e ka perdoruesi dark mode ... 5-shin ne white mode"): ikona e skedës (favicon) ndjek temën e Stoku-t
  function svgIkona(erret, eVogel) {
    var I = eVogel ? DATA.ikonaS : DATA.ikona, N = erret ? DATA.ngjyrat : DATA.celet;
    return '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="18 18 72 72"><rect x="18" y="18" width="72" height="72" rx="17" fill="' + N.bg + '"' +
      (erret ? '' : ' stroke="#d9d7d2" stroke-width="0.6"') + '/><path fill="' + N.fg + '" d="' + I.t + '"/><path fill="' + N.ac + '" d="' + I.p + '"/></svg>';
  }
  var faviconTani = null;
  function rifreskoFavicon() {
    if (typeof document === 'undefined') return;
    var erret = document.documentElement.getAttribute('data-tema') === 'dark';
    if (faviconTani === erret) return;
    faviconTani = erret;
    var href = 'data:image/svg+xml,' + encodeURIComponent(svgIkona(erret, true));
    Array.prototype.forEach.call(document.querySelectorAll('link[rel="icon"]'), function (l) { l.setAttribute('href', href); l.setAttribute('type', 'image/svg+xml'); });
  }
  if (root.document) {
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', skanimKudo); else skanimKudo();
  }
  root.StokuLogot = { logoW: DATA.fjala.w, logoH: DATA.fjala.h, svgLogo: svgLogo, vizatoLogon: vizatoLogon, vizatoIkonen: vizatoIkonen, svgIkona: svgIkona, rifreskoFavicon: rifreskoFavicon, barkodi: BARKODI, KEY_SKANUAR: KEY_SKANUAR };
  // Pastrimi i zgjedhjes së vjetër të logos (v313)
  try { localStorage.removeItem('stoku:logoja'); } catch (e) { /* ok */ }
  if (typeof document !== 'undefined') {
    try { document.documentElement.removeAttribute('data-logo'); } catch (e) { /* ok */ }
    try {
      rifreskoFavicon();
      if (root.MutationObserver) new MutationObserver(rifreskoFavicon).observe(document.documentElement, { attributes: true, attributeFilter: ['data-tema'] });
    } catch (e) { /* ok */ }
  }
})(typeof window !== 'undefined' ? window : this);
