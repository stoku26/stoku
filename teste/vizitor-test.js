// v217: "Hyr si vizitor" te porta: provë pa llogari me të dhëna shembull, pa cloud; hyrja me llogari i fshin
const { chromium } = require('./pw.js');
const PORTI = process.env.PORTI || '8765';
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
// Cloud-i i rremë: përdoruesi mbetet "i kyçur" edhe pas rifreskimit (sessionStorage); çdo shkrim në cloud numërohet
const MOCK = () => {
  window.__dergime = JSON.parse(sessionStorage.getItem('dergime') || '[]');
  function u() { var x = sessionStorage.getItem('mockUser'); return x ? { uid: x, email: x + '@stoku-app.local' } : null; }
  function regjistro(lloji, gj) { window.__dergime.push({ lloji: lloji, produkte: gj ? (gj.produktet || []).map(p => p.emri) : null }); sessionStorage.setItem('dergime', JSON.stringify(window.__dergime)); }
  window.__stokuCloud = { authGati: true, perdoruesiAktual: u, token: async () => 't',
    merr: async () => { regjistro('merr'); return { ok: true, gjendja: null }; },
    bashkoDheRuaj: async fn => { var gj = fn(null); regjistro('ruaj', gj); return { ok: true, gjendja: gj }; },
    degjo: () => () => {}, degjoFletet: () => () => {}, dil: async () => {},
    hyr: async (emri) => { sessionStorage.setItem('mockUser', 'u_' + emri); setTimeout(() => window.dispatchEvent(new Event('stoku-auth-ndryshoi')), 30); return { ok: true }; },
    regjistrohu: async (emri) => { sessionStorage.setItem('mockUser', 'u_' + emri); setTimeout(() => window.dispatchEvent(new Event('stoku-auth-ndryshoi')), 30); return { ok: true }; } };
};
async function faqe(b, pc, fillim) {
  const ctx = await b.newContext(pc ? { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140', viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' }
    : { userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
  await ctx.addInitScript(MOCK);
  if (fillim) await ctx.addInitScript(f => { if (!sessionStorage.getItem('fillimi')) { sessionStorage.setItem('fillimi', '1'); Object.keys(f).forEach(k => localStorage.setItem(k, f[k])); } }, fillim);
  const p = await ctx.newPage();
  p.on('pageerror', e => { g++; console.log('pageerror', e.message); });
  await p.goto('http://127.0.0.1:' + PORTI + '/' + (pc ? 'pc.html' : 'index.html'));
  await p.waitForTimeout(1500);
  return { p, ctx };
}
const ls = (p, k) => p.evaluate(k => localStorage.getItem(k), k);
const json = async (p, k) => JSON.parse((await ls(p, k)) || 'null');
const dukshem = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); if (!e) return false; const st = getComputedStyle(e);
  return st.display !== 'none' && !e.hidden && !e.classList.contains('po-zhduket') && (e.offsetParent !== null || st.position === 'fixed'); }, sel);

(async () => {
  const b = await chromium.launch();
  // ===== 1. Telefoni: pajisje e re → "Hyr si vizitor" =====
  {
    const { p, ctx } = await faqe(b, false);
    ok(await dukshem(p, '#porta') && (await p.textContent('#pkVizitor')) === 'Hyr si vizitor', '1. porta ka butonin "Hyr si vizitor"', await p.textContent('#pkVizitor'));
    ok((await p.textContent('#pkShenim')) === 'Rekomandohet hapja e një llogarie, që të dhënat të ruhen në cloud.', '1a. teksti nën "Hyr": rekomandohet llogaria', await p.textContent('#pkShenim'));
    ok((await p.textContent('#pkVizitorShenim')) === 'Hyr si vizitor për të parë si funksionojnë shërbimet e Stoku-t (kujdes: të dhënat nuk ruhen në cloud).', '1a2. teksti nën "Hyr si vizitor"', await p.textContent('#pkVizitorShenim'));
    await p.click('#pkVizitor'); await p.waitForTimeout(2200);
    ok(!(await dukshem(p, '#porta')), '1b. pas rifreskimit porta s\'del');
    const pr = await json(p, 'stoku:produktet:v2'), af = await json(p, 'stoku:afatet:v1');
    ok(Object.keys(pr).length === 12 && af.length === 7 && (await ls(p, 'stoku:pronari-uid')) === 'vizitor' && (await ls(p, 'stoku:vizitor')) === '1', '1c. të dhënat shembull: 12 produkte, 7 afate, pronari "vizitor"', [Object.keys(pr).length, af.length]);
    ok(await dukshem(p, '#vizShirit') && (await p.textContent('#sbDyqani')) === 'Vizitor · provë', '1d. shiriti i vizitorit + "Vizitor · provë" poshtë logos', await p.textContent('#sbDyqani'));
    ok(!(await dukshem(p, '#dlgTeRejat')), '1e. s\'del lista "Çka ka të re"');
    // ndryshim → asnjë shkrim në cloud
    await p.click('.folder-karta[data-id="pije"]'); await p.waitForTimeout(300);
    await p.fill('#barkodi', '2000200000020'); await p.press('#barkodi', 'Enter'); await p.waitForTimeout(300);
    await p.fill('#dlgSasia', '5'); await p.click('#dlgRuaj'); await p.waitForTimeout(2500);
    ok((await json(p, 'stoku:produktet:v2'))['pije::2000200000020'].sasia === 5, '1f. vizitori ndryshon sasinë (ruhet lokalisht)');
    ok((await p.evaluate(() => window.__dergime.filter(x => x.lloji === 'ruaj').length)) === 0, '1g. asnjë shkrim në cloud', await p.evaluate(() => window.__dergime));
    // Cilësimet → Llogaria: pa formë hyrjeje, me butonat e provës
    await p.evaluate(() => document.getElementById('btnMbrapa').click()); await p.waitForTimeout(300);
    const forma = await p.evaluate(() => getComputedStyle(document.getElementById('cloudUsername').closest('.fushe')).display);
    ok(forma === 'none' && await p.evaluate(() => document.getElementById('cloudHyrjeSeksion').classList.contains('si-vizitor')), '1h. te Cilësimet s\'ka formë hyrjeje (hyrja bëhet te porta)', forma);
    // Grupi: kërkon llogari; butoni hap portën, "Vazhdo provën si vizitor" kthen te prova
    await p.click('#btnEkipi'); await p.waitForTimeout(500);
    ok(await p.evaluate(() => !!document.querySelector('#ekipiLista .ek-viz-hyr') && /Grupi punon me llogari/.test(document.getElementById('ekipiLista').textContent)), '1h2. Grupi: "Grupi punon me llogari" + butoni për hyrje');
    await p.click('#ekipiLista .ek-viz-hyr'); await p.waitForTimeout(400);
    ok(await dukshem(p, '#porta'), '1h3. butoni te Grupi hap portën');
    await p.click('#pkVizitor'); await p.waitForTimeout(500);
    await p.click('#tabStoku'); await p.waitForTimeout(400);
    ok(!(await dukshem(p, '#porta')) && await dukshem(p, '#vizShirit'), '1h4. kthimi te prova, te Stoku');
    // "Hyr" → porta; "Vazhdo provën si vizitor" → kthehet pa humbur gjë
    await p.click('#vizShiritHyr'); await p.waitForTimeout(400);
    ok(await dukshem(p, '#porta') && (await p.textContent('#pkVizitor')) === 'Vazhdo provën si vizitor', '1i. "Hyr" hap portën, me "Vazhdo provën si vizitor"', await p.textContent('#pkVizitor'));
    ok(/^Prova jote si vizitor është ende në këtë pajisje \(kujdes: të dhënat nuk ruhen në cloud\)\.$/.test(await p.textContent('#pkVizitorShenim')), '1i2. teksti kur prova ekziston', await p.textContent('#pkVizitorShenim'));
    await p.click('#pkVizitor'); await p.waitForTimeout(500);
    ok(!(await dukshem(p, '#porta')) && (await json(p, 'stoku:produktet:v2'))['pije::2000200000020'].sasia === 5, '1j. prova vazhdon me ndryshimet e veta');
    // Hyrja me llogari te porta: prova fshihet, s'kalon kurrë në cloud
    await p.click('#vizShiritHyr'); await p.waitForTimeout(300);
    await p.fill('#pkEmri', 'agim'); await p.fill('#pkFjalekalimi', 'sekret123');
    await p.click('#pkDergo'); await p.waitForTimeout(3500);
    const pas = await json(p, 'stoku:produktet:v2');
    const dergimet = await p.evaluate(() => window.__dergime);
    ok((await ls(p, 'stoku:pronari-uid')) === 'u_agim' && (await ls(p, 'stoku:vizitor')) === null, '1k. pas hyrjes: pronari = llogaria, prova mbaroi', [await ls(p, 'stoku:pronari-uid'), await ls(p, 'stoku:vizitor')]);
    ok(!pas || !Object.values(pas).some(x => /Lëng portokalli|Bukë e bardhë/.test(x.emri)), '1l. të dhënat shembull u hoqën nga pajisja', pas && Object.keys(pas).length);
    ok(!dergimet.some(d => d.produkte && d.produkte.some(e => /Lëng portokalli|Bukë e bardhë|Qumësht/.test(e))), '1m. asnjë produkt shembull s\'u dërgua në cloud', dergimet.map(d => d.lloji + ':' + (d.produkte ? d.produkte.length : '-')));
    ok(!(await dukshem(p, '#vizShirit')) && (await p.textContent('#sbDyqani')) === 'u_agim', '1n. me llogari s\'del më shiriti i vizitorit', await p.textContent('#sbDyqani'));
    await ctx.close();
  }
  // ===== 2. Pajisje me të dhënat e një llogarie (pas "Dil"): pyetet para se të hiqen =====
  {
    const t = Date.now();
    const { p, ctx } = await faqe(b, false, {
      'stoku:pronari-uid': 'u1', 'stoku:porta:emri': 'besa',
      'stoku:foldera:v1': JSON.stringify([{ id: 'f1', emri: 'Imi' }]),
      'stoku:produktet:v2': JSON.stringify({ 'f1::111': { barkodi: '111', emri: 'Produkti i besës', sasia: 3, kategoriaId: 'f1', prekurSe: t } })
    });
    ok(await dukshem(p, '#porta'), '2. porta (pa hyrje)');
    await p.click('#pkVizitor'); await p.waitForTimeout(300);
    ok(await dukshem(p, '#pkVizKonf') && /besa/.test(await p.textContent('#pkVizKonfTekst')), '2b. paralajmërimi: të dhënat e llogarisë "besa" hiqen nga pajisja', await p.textContent('#pkVizKonfTekst'));
    await p.click('#pkVizJo'); await p.waitForTimeout(200);
    ok((await json(p, 'stoku:produktet:v2'))['f1::111'] && (await ls(p, 'stoku:pronari-uid')) === 'u1' && !(await dukshem(p, '#pkVizKonf')), '2c. "Anulo": asgjë s\'ndryshon');
    await p.click('#pkVizitor'); await p.waitForTimeout(200);
    await p.click('#pkVizPo'); await p.waitForTimeout(2200);
    const pr = await json(p, 'stoku:produktet:v2');
    ok(!pr['f1::111'] && Object.keys(pr).length === 12 && (await ls(p, 'stoku:pronari-uid')) === 'vizitor', '2d. "Vazhdo si vizitor": prova me të dhënat shembull', Object.keys(pr).length);
    // "Fillo nga e para"
    await p.evaluate(() => { var x = JSON.parse(localStorage.getItem('stoku:produktet:v2')); delete x['pije::2000200000013']; localStorage.setItem('stoku:produktet:v2', JSON.stringify(x)); });
    await p.evaluate(() => window.StokuPorta.rinisProven()); await p.waitForTimeout(2200);
    ok(Object.keys(await json(p, 'stoku:produktet:v2')).length === 12 && !(await dukshem(p, '#porta')), '2e. "Fillo nga e para" i kthen të dhënat shembull');
    // Rifreskimi: mbetet vizitor
    await p.reload(); await p.waitForTimeout(1800);
    ok(!(await dukshem(p, '#porta')) && await dukshem(p, '#vizShirit'), '2f. pas rifreskimit mbetet në provë');
    await ctx.close();
  }
  // ===== 3. Kompjuteri =====
  {
    const { p, ctx } = await faqe(b, true);
    ok(await dukshem(p, '#porta') && await dukshem(p, '#pkVizitor'), '3. porta e kompjuterit ka "Hyr si vizitor"');
    await p.click('#pkVizitor'); await p.waitForTimeout(2500);
    ok(!(await dukshem(p, '#porta')) && await dukshem(p, '#kartaVizitori') && !(await dukshem(p, '#kartaMireseardhje')), '3b. karta "Je si vizitor" te Përmbledhja');
    ok((await p.textContent('#sbpBrandNen')) === 'Vizitor · provë', '3c. anësorja: "Vizitor · provë"', await p.textContent('#sbpBrandNen'));
    ok((await p.textContent('#sinkTekst')) === 'Provë pa llogari', '3c2. statusi poshtë: "Provë pa llogari"', await p.textContent('#sinkTekst'));
    const nr = await p.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('stoku:produktet:v2'))).length);
    ok(nr === 12, '3d. 12 produkte shembull edhe në kompjuter', nr);
    await p.evaluate(() => { location.hash = '#/ekipa'; }); await p.waitForTimeout(500);
    ok(/Grupi punon me llogari/.test(await p.textContent('#ekPaLidhjeTekst')) && await dukshem(p, '#ekPaLidhje'), '3d2. Grupi (PC): "Grupi punon me llogari"', await p.textContent('#ekPaLidhjeTekst'));
    await p.evaluate(() => { location.hash = '#/'; }); await p.waitForTimeout(400);
    await p.click('#perdoruesiCip'); await p.waitForTimeout(400);
    ok(await dukshem(p, '#porta') && !(await dukshem(p, '#dlgLlogaria')), '3e. "Hyr" (poshtë majtas) hap portën, jo dritaren e hyrjes së aplikacionit');
    await p.click('#pkVizitor'); await p.waitForTimeout(500);
    ok(!(await dukshem(p, '#porta')), '3f. kthimi te prova');
    ok((await p.evaluate(() => window.__dergime.filter(x => x.lloji === 'ruaj').length)) === 0, '3g. asnjë shkrim në cloud');
    await ctx.close();
  }
  // ===== 4. Dy skeda: prova në njërën, hyrja me llogari në tjetrën =====
  {
    const { p, ctx } = await faqe(b, false);
    await p.click('#pkVizitor'); await p.waitForTimeout(2200);
    const p2 = await ctx.newPage();
    p2.on('pageerror', e => { g++; console.log('pageerror', e.message); });
    await p2.goto('http://127.0.0.1:' + PORTI + '/index.html'); await p2.waitForTimeout(1500);
    ok(!(await dukshem(p2, '#porta')) && await dukshem(p2, '#vizShirit'), '4. skeda e dytë hapet edhe ajo në provë');
    await p.evaluate(() => { window.__eNjejta = 1; });
    await p2.click('#vizShiritHyr'); await p2.waitForTimeout(300);
    await p2.fill('#pkEmri', 'drita'); await p2.fill('#pkFjalekalimi', 'sekret123');
    await p2.click('#pkDergo'); await p2.waitForTimeout(3500);
    ok((await p.evaluate(() => window.__eNjejta)) === undefined, '4b. skeda e provës rinis vetë kur hyn llogaria në skedën tjetër');
    ok(await dukshem(p, '#porta') && !(await dukshem(p, '#vizShirit')), '4c. pas rinisjes s\'është më në provë (porta, deri sa Firebase ta njohë llogarinë)');
    const mbetur = await json(p2, 'stoku:produktet:v2');
    ok((await ls(p2, 'stoku:pronari-uid')) === 'u_drita' && (!mbetur || !Object.values(mbetur).some(x => /Lëng portokalli|Bukë e bardhë/.test(x.emri))), '4d. llogaria s\'ka asnjë produkt shembull', [await ls(p2, 'stoku:pronari-uid'), mbetur && Object.keys(mbetur).length]);
    ok(!(await p2.evaluate(() => window.__dergime)).some(d => d.produkte && d.produkte.some(e => /Lëng portokalli|Bukë e bardhë|Qumësht/.test(e))), '4e. asnjë produkt shembull në cloud');
    await ctx.close();
  }
  // ===== 5. Prova e zbrazur: "Hyr si vizitor" i kthen të dhënat shembull dhe e rifreskon faqen =====
  {
    const { p, ctx } = await faqe(b, false);
    await p.click('#pkVizitor'); await p.waitForTimeout(2200);
    await p.evaluate(() => { localStorage.setItem('stoku:produktet:v2', '{}'); localStorage.setItem('stoku:afatet:v1', '[]'); window.__eNjejta = 1; });
    await p.click('#vizShiritHyr'); await p.waitForTimeout(300);
    ok((await p.textContent('#pkVizitor')) === 'Hyr si vizitor', '5. prova pa të dhëna: butoni thotë "Hyr si vizitor"', await p.textContent('#pkVizitor'));
    await p.click('#pkVizitor'); await p.waitForTimeout(2200);
    ok((await p.evaluate(() => window.__eNjejta)) === undefined && !(await dukshem(p, '#porta')), '5b. faqja rifreskohet');
    ok(Object.keys(await json(p, 'stoku:produktet:v2')).length === 12 && (await p.evaluate(() => document.querySelectorAll('.folder-karta').length)) >= 4, '5c. të dhënat shembull janë sërish në faqe');
    await ctx.close();
  }
  await b.close();
  console.log(g ? '\n✖ ' + g + ' GABIME' : '\n✔ Krejt në rregull');
  process.exit(g ? 1 : 0);
})();
