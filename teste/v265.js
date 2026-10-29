// v265: pllakat me ngjyra (ideja 4 e përdoruesit nga Claude Design) kudo ku janë këta butona: brenda folderit (Skano, I shpejtë,
// Excel, PDF; në PDA Tastiera); v266: te Afatet jo (si më parë). Katror me ngjyrë + titulli + shpjegimi, dy nga dy; e çelët dhe e errët.
const { chromium } = require('./pw.js');
const { hapFaqen } = require('./kamera-e-rreme.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };

const pllakat = (p, sel) => p.evaluate(sel => Array.from(document.querySelectorAll(sel)).filter(b => b.offsetParent).map(b => {
  const r = b.getBoundingClientRect(), ik = b.querySelector('.sb-pllaka__ik');
  return { id: b.id, t: b.querySelector('.sb-pllaka__t').textContent, n: b.querySelector('.sb-pllaka__n').textContent,
    x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height),
    ik: ik ? getComputedStyle(ik).backgroundColor : '', sf: getComputedStyle(b).backgroundColor };
}), sel);

(async () => {
  for (const tema of ['light', 'dark']) {
    const { b, p } = await hapFaqen(chromium);
    await p.evaluate(t => localStorage.setItem('stoku:tema', t), tema);
    await p.reload(); await p.waitForTimeout(2000);
    await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => { if (!d.classList.contains('faqe-e-plote')) d.classList.remove('hapur'); }));
    await p.click('.folder-karta >> text=Pije'); await p.waitForTimeout(600);

    // Folderi
    let l = await pllakat(p, '#folderPllakat .sb-pllaka');
    const tekste = l.map(x => x.t + ' / ' + x.n).join(' | ');
    ok(tekste === 'Skano / Me kamerë | I shpejtë / Kamera s\'mbyllet | Excel / Tabela e stokut | PDF / Etiketat me barkod', tema + ' 1. folderi: 4 pllaka me titull dhe shpjegim', tekste);
    ok(l.length === 4 && l[0].y === l[1].y && l[2].y === l[3].y && l[2].y > l[0].y && l[0].x < l[1].x && Math.abs(l[0].w - l[1].w) <= 1 && l.every(x => x.h >= 70),
      tema + ' 1. dy nga dy, njësoj të gjera, të paktën 70px të larta', l.map(x => [x.x, x.y, x.w, x.h]));
    const ngjyrat = l.map(x => x.ik);
    ok(new Set(ngjyrat).size === 4 && ngjyrat[2] === 'rgb(30, 127, 69)' && ngjyrat[3] === 'rgb(194, 48, 48)', tema + ' 1. secila me ngjyrën e vet (blu, e verdhë, e gjelbër, e kuqe)', ngjyrat);
    const sfondi = await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--sb-surface').trim());
    ok(l.every(x => x.sf !== 'rgba(0, 0, 0, 0)') && (tema === 'dark' ? sfondi === '#171a20' : sfondi === '#ffffff'), tema + ' 1. pllaka mbi sfondin e temës', { sfondi, sf: l[0].sf });

    // Klikimet punojnë si më parë
    await p.click('#btnKamera'); await p.waitForTimeout(500);
    ok(await p.evaluate(() => document.getElementById('kamera').classList.contains('hapur')), tema + ' 2. "Skano" hap kamerën');
    await p.click('#mbyllKamere'); await p.waitForTimeout(400);
    await p.click('#btnSkanimShpejt'); await p.waitForTimeout(500);
    ok(await p.evaluate(() => document.getElementById('kamera').classList.contains('shpejt')), tema + ' 2. "I shpejtë" hap Skanimin e shpejtë');
    await p.click('#ssMbaro'); await p.waitForTimeout(400);
    await p.click('#btnEksport'); await p.waitForTimeout(400);
    const toast = await p.evaluate(() => (document.getElementById('toast') || {}).textContent || '');
    ok(/Nuk ka produkte/.test(toast), tema + ' 2. "Excel" thërret eksportin (folder bosh: njoftimi)', toast);

    if (tema === 'light') {
      // PDA: pa Skano / I shpejtë; "Fshih tastierën" si pllakë gri
      await p.evaluate(() => { const c = document.getElementById('opsPda'); c.checked = true; c.dispatchEvent(new Event('change')); });
      await p.waitForTimeout(300);
      l = await pllakat(p, '#folderPllakat .sb-pllaka');
      ok(l.map(x => x.t).join('|') === 'Fshih tastierën|Excel|PDF', '3. PDA: Tastiera, Excel, PDF (pa kamerë)', l.map(x => x.t));
      await p.evaluate(() => { const c = document.getElementById('opsPda'); c.checked = false; c.dispatchEvent(new Event('change')); });
      await p.waitForTimeout(300);
    }

    // Afatet: v266, përdoruesi: "veq te afatet mos e bo" → "Shto" dhe "Excel" si para v265 (pa pllaka)
    await p.click('#btnMbrapa'); await p.waitForTimeout(400);
    await p.click('#btnAfatet'); await p.waitForTimeout(800);
    const af = await p.evaluate(() => ({ pllaka: document.querySelectorAll('#afVeprime .sb-pllaka').length,
      shto: document.getElementById('afShto').className, excel: document.getElementById('afExcel').className, tShto: document.getElementById('afShto').textContent.trim() }));
    ok(af.pllaka === 0 && af.shto === 'sb-action' && af.excel === 'sb-action' && af.tShto === 'Shto', tema + ' 4. Afatet: "Shto" dhe "Excel" si më parë (pa pllaka)', af);
    await p.click('#afExcel'); await p.waitForTimeout(300);
    ok(await p.evaluate(() => !document.getElementById('afExcelMenu').hidden), tema + ' 4. "Excel" hap menynë Importo / Eksporto');

    if (tema === 'light') {
      const sw = await p.evaluate(() => fetch('sw.js').then(x => x.text()));
      const nr = rx => Number((sw.match(rx) || [])[1]);
      ok(nr(/stoku-v(\d+)/) >= 265 && nr(/app-tel\.js\?v=(\d+)/) >= 265 && nr(/teRejat\.js\?v=(\d+)/) >= 265 && nr(/stoku\.css\?v=(\d+)/) >= 50, '5. CACHE, app-tel.js, teRejat.js ≥ 265, stoku.css ≥ 50');
      const tr = await p.evaluate(() => fetch('teRejat.js?v=' + Date.now()).then(x => x.text()));
      ok(/\{ v: 265,[^\n]*platforma: 'tel'/.test(tr), '5. teRejat v265 (telefon)');
    }
    ok(!p.__gab.length, tema + ' 6. pa gabime JS', p.__gab);
    await b.close();
  }
  console.log(g ? 'GABIME: ' + g : 'Krejt në rregull');
  process.exit(g ? 1 : 0);
})();
