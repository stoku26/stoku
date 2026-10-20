// v238: u nxor nga android.html (CSP pa 'unsafe-inline': faqet s'kanë më skripta të brendshme). Kur ndryshon, rrite ?v= te android.html dhe sw.js.
  fetch('https://api.github.com/repos/stoku26/stoku/releases?per_page=100').then(function (r) { return r.json(); }).then(function (l) {
    var m = null;
    (l || []).forEach(function (r) {
      var n = /^tel-v(\d+)$/.exec(r.tag_name || ''); if (!n || r.draft) return;
      (r.assets || []).forEach(function (a) { if (/\.apk$/.test(a.name) && (!m || +n[1] > m.n)) m = { n: +n[1], url: a.browser_download_url }; });
    });
    if (m) { document.getElementById('shkarko').href = m.url; document.getElementById('info').textContent = 'Versioni 1.0.' + m.n; }
    else document.getElementById('info').textContent = 'Versioni i parë po përgatitet. Provo pas pak minutash.';
  }).catch(function () { document.getElementById('info').textContent = ''; });
