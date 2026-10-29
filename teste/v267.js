// v267: pllakat e folderit me emrat e qartë ("Skano me kamerë", "Skanim i shpejtë", "Eksporto Excel", "Eksporto PDF") dhe vetëm një
// tekst me një madhësi (përdoruesi: "sdi palidhje jan te emrume ... leje veq 1 font jo 2 tmadhe edhe tvogel"). E çelët dhe e errët.
const { chromium } = require('./pw.js');
const { hapFaqen } = require('./kamera-e-rreme.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };

(async () => {
  for (const tema of ['light', 'dark']) {
    const { b, p } = await hapFaqen(chromium);
    await p.evaluate(t => localStorage.setItem('stoku:tema', t), tema);
    await p.reload(); await p.waitForTimeout(2000);
    await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => { if (!d.classList.contains('faqe-e-plote')) d.classList.remove('hapur'); }));
    await p.click('.folder-karta >> text=Pije'); await p.waitForTimeout(600);
    const l = await p.evaluate(() => Array.from(document.querySelectorAll('#folderPllakat .sb-pllaka')).filter(x => x.offsetParent).map(x => {
      const tekstet = Array.from(x.querySelectorAll('span')).filter(s => !s.querySelector('span, svg') && s.textContent.trim());
      const t = x.querySelector('.sb-pllaka__t');
      return { emri: x.textContent.trim(), tekste: tekstet.length, madhesia: getComputedStyle(t).fontSize, pesha: getComputedStyle(t).fontWeight,
        pritet: t.scrollWidth > t.clientWidth + 1, rreshta: Math.round(t.getBoundingClientRect().height / parseFloat(getComputedStyle(t).lineHeight)) };
    }));
    ok(l.map(x => x.emri).join(' | ') === 'Skano me kamerë | Skanim i shpejtë | Eksporto Excel | Eksporto PDF', tema + ' 1. emrat e qartë', l.map(x => x.emri));
    ok(l.every(x => x.tekste === 1 && x.madhesia === '15px' && x.pesha === '600'), tema + ' 2. vetëm një tekst, një madhësi (15px)', l.map(x => [x.tekste, x.madhesia, x.pesha]));
    ok(l.every(x => !x.pritet && x.rreshta <= 2), tema + ' 3. emri s\'pritet (më së shumti 2 rreshta)', l.map(x => x.rreshta));
    if (tema === 'light') {
      const sw = await p.evaluate(() => fetch('sw.js').then(x => x.text()));
      const nr = rx => Number((sw.match(rx) || [])[1]);
      ok(nr(/stoku-v(\d+)/) >= 267 && nr(/app-tel\.js\?v=(\d+)/) >= 267 && nr(/teRejat\.js\?v=(\d+)/) >= 267 && nr(/stoku\.css\?v=(\d+)/) >= 52, '4. CACHE, app-tel.js, teRejat.js ≥ 267, stoku.css ≥ 52');
      const tr = await p.evaluate(() => fetch('teRejat.js?v=' + Date.now()).then(x => x.text()));
      ok(/\{ v: 267,[^\n]*platforma: 'tel'/.test(tr), '4. teRejat v267 (telefon)');
    }
    ok(!p.__gab.length, tema + ' 5. pa gabime JS', p.__gab);
    await b.close();
  }
  console.log(g ? 'GABIME: ' + g : 'Krejt në rregull');
  process.exit(g ? 1 : 0);
})();
