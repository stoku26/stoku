// v327 / Android Hyrja 89 (pronari, 18.11.2026):
//  1. Ballina edhe në web app të telefonit (jo PC): Ballina (ikona) në mes të shiritit (rreth pak mbi të), hapet i pari, "Mbrapa" kthen te Ballina,
//     9 pjesët + "Përshtat faqen" (çelësat, radha, Si në fillim), tabi "Stoku" → "Malli"
//  2. Malli pa logon "stoku." (logoja është te Ballina), vetëm titulli "Malli" si te Afatet (web tel + Android)
//  3. Kërkimi kudo te Ballina: produktet/barkodet, folderat, afatet, furnizuesit, kolegët, cilësimet; rezultati hapet (web tel + Android)
const pw = require('./pw.js'); pw.meBallina = true;
const { chromium } = pw;
const fs = require('fs');
const PORTI = process.env.PORTI || '8765';
const RR = __dirname + '/../';
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const lx = f => fs.readFileSync(RR + f, 'utf8');
const K = 'vendas/app/src/main/java/site/stoku/vendas/';
const paKom = t => t.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, '');
const t = Date.now(), d = n => new Date(t + n * 864e5).toISOString().slice(0, 10);
const FOLDERA = [{ id: 'ushqimore', emri: 'Ushqimore' }, { id: 'pije', emri: 'Pije' }];
const PR = {
  'pije::3800001': { kategoriaId: 'pije', barkodi: '3800001', emri: 'Ujë Rugove 1.5L', sasia: 24, furnizuesi: 'Rugove', ndryshuarSe: t },
  'ushqimore::3800002': { kategoriaId: 'ushqimore', barkodi: '3800002', emri: 'Kos Vita 500g', sasia: 6, furnizuesi: 'Vita', ndryshuarSe: t }
};
const AFT = [
  { id: 'a1', emri: 'Qumësht Vita 1L', barkodi: '3890001', data: d(-1), sasia: 3, furnizuesi: 'Vita', statusi: 'aktiv', krijuarSe: t, ndryshuarSe: t },
  { id: 'a2', emri: 'Jogurt Abi', barkodi: '3890002', data: d(3), sasia: 5, furnizuesi: 'Abi', statusi: 'aktiv', krijuarSe: t, ndryshuarSe: t },
  { id: 'a3', emri: 'Lëng Frutti', barkodi: '3890003', data: d(60), sasia: 2, furnizuesi: 'Frutti', statusi: 'aktiv', krijuarSe: t, ndryshuarSe: t }
];

(async () => {
  // ===== Kodi =====
  const ix = lx('index.html'), at = lx('app-tel.js'), pc = lx('pc.html');
  ok(/id="tabBallina"/.test(ix) && /id="tabMalli"[^>]*>[\s\S]*?<span class="tab-tekst">Malli<\/span>/.test(ix) && !/id="tabStoku"/.test(ix) && !/tabBallina|dlgBallina/.test(pc), '1. web tel: shtëpia + "Malli" te shiriti (PC pa Ballina)');
  const iA = ix.indexOf('id="btnAfatet"'), iK = ix.indexOf('id="tabBallina"'), iG = ix.indexOf('id="btnEkipi"');
  ok(iA > 0 && iK > iA && iG > iK, '1. Ballina (ikona) në mes (pas Afatet, para Grupi)');
  const koka = ix.slice(ix.indexOf('<header>'), ix.indexOf('</header>'));
  ok(!/logoSlika|stk-logo/.test(koka) && /<h1 id="titulli" class="titulli-faqes">Malli<\/h1>/.test(koka) && /id="dlgBallina"[\s\S]{0,400}id="logoSlika"/.test(ix), '2. web tel: Malli pa logo (titulli), logoja te Ballina');
  ok(/if \(blAktiv\(\)\) return 'dlgBallina'/.test(at) && /tabLista: 'Malli'/.test(at), '1. Ballina = faqja bazë; Cilësimet → "Malli"');
  const mal = paKom(lx(K + 'ui/MalliEkrani.kt')), kr = lx(K + 'ui/BallinaEkrani.kt');
  const fm = mal.slice(mal.indexOf('private fun FaqjaEMallit'), mal.indexOf('private fun FaqjaEMallit') + 6000);
  ok(!/EtiketaStoku\(/.test(fm) && /Text\("Malli", style = tx\(26, 700/.test(fm), '2. Android: Malli pa logo, titulli "Malli"');
  ok(/fun kerkoKudo\(q: String\)/.test(kr) && /"Kërko kudo: barkod, produkt, afat…"/.test(kr) && ['"Malli"', '"Folderat"', '"Afatet"', '"Furnizuesit"', '"Kolegët"', '"Cilësimet"'].every(x => kr.includes('GrupiIRezultateve(' + x)), '3. Android: kërkimi kudo te Ballina');
  ok(/Hyrja\(89, "2026-11-18", "Ballina edhe në web/.test(lx(K + 'TeRejat.kt')) || /Hyrja\(89, "2026-11-18"/.test(lx(K + 'TeRejat.kt')), '3. TeRejat.kt: Hyrja 89');

  const b = await chromium.launch();
  const ctx = await b.newContext({ userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  await ctx.addInitScript(([f, p, a]) => {
    window.__stokuCloud = { authGati: true, perdoruesiAktual: () => ({ uid: 'u1', email: 'agim@stoku-app.local' }), token: async () => 't',
      merr: async () => ({ ok: true, gjendja: null }), bashkoDheRuaj: async fn => ({ ok: true, gjendja: fn(null) }), degjo: () => () => {}, degjoFletet: () => () => {}, dil: async () => {} };
    localStorage.setItem('stoku:pronari-uid', 'u1'); localStorage.setItem('stoku:porta:hyrja', JSON.stringify({ uid: 'u1', emri: 'agim' }));
    localStorage.setItem('stoku:njoftimet:jo-tani', String(Date.now()));
    if (!sessionStorage.getItem('mbushur')) {
      sessionStorage.setItem('mbushur', '1');
      localStorage.setItem('stoku:foldera:v1', JSON.stringify(f)); localStorage.setItem('stoku:produktet:v2', JSON.stringify(p)); localStorage.setItem('stoku:afatet:v1', JSON.stringify(a));
    }
  }, [FOLDERA, PR, AFT]);
  const p = await ctx.newPage(); const gab = []; p.on('pageerror', e => gab.push(e.message));
  await p.goto('http://127.0.0.1:' + PORTI + '/index.html'); await p.waitForTimeout(3000);
  const gj = () => p.evaluate(() => ({ ballina: document.getElementById('dlgBallina').classList.contains('hapur'), afatet: document.getElementById('dlgAfatet').classList.contains('hapur'),
    tab: (document.querySelector('#tabet .tab.aktiv') || {}).id, pjeset: [...document.querySelectorAll('#blPjeset [data-pjesa]')].map(x => x.getAttribute('data-pjesa')) }));
  let s = await gj();
  ok(s.ballina && s.tab === 'tabBallina' && s.pjeset.join() === 'butonat,afatet,skadojne,grafiku,malli,furnizuesit,grupi', '1. Ballina hapet e para, me pjesët', s);
  const r = await p.evaluate(() => {
    const rr = document.querySelector('#tabBallina .tab-ballina-rreth').getBoundingClientRect(), tb = document.getElementById('tabet').getBoundingClientRect(), l = document.getElementById('logoButon').getBoundingClientRect();
    const af = document.querySelector('#blPjeset [data-pjesa="afatet"]').innerText.replace(/\s+/g, ' ');
    return { mbi: Math.round(tb.top - rr.top), w: Math.round(rr.width), mes: Math.abs((rr.left + rr.right) / 2 - innerWidth / 2) < 2, logo: l.width > 100 && l.top < 80, af };
  });
  ok(r.mbi >= 10 && r.mbi <= 22 && r.w >= 50 && r.mes, '1. rrethi i shtëpisë në mes, pak mbi shirit', r);
  // pronari (foto): te tabet e tjera rrethi dilte përgjysmë (faqja e plotë e mbulonte pjesën mbi shirit)
  const iPlote = () => p.evaluate(() => { const r = document.querySelector('#tabBallina .tab-ballina-rreth').getBoundingClientRect(); const e = document.elementFromPoint(r.left + r.width / 2, r.top + 4); return !!(e && e.closest('#tabBallina')); });
  ok(await iPlote(), '1. rrethi i plotë te Ballina');
  await p.click('#btnAfatet'); await p.waitForTimeout(400);
  ok(await iPlote(), '1. rrethi i plotë edhe te Afatet (jo përgjysmë)');
  await p.click('#btnOpsione'); await p.waitForTimeout(400);
  ok(await iPlote(), '1. ... dhe te Cilësimet');
  await p.click('#tabBallina'); await p.waitForTimeout(400);
  ok(r.logo && /Afatet Hape 1 Të skaduara 1 Skadojnë së shpejti 0 Pa datë/.test(r.af), '1. logoja lart te Ballina; numrat e afateve', r);
  await p.screenshot({ path: __dirname + '/v327-ballina.png' });

  // 3. Kërkimi kudo
  const kerko = async q => { await p.fill('#blKerko', q); await p.waitForTimeout(250); return p.evaluate(() => [...document.querySelectorAll('#blRezultatet .bl-grupi')].map(x => x.getAttribute('data-grupi') + ':' + [...x.querySelectorAll('.bl-rez b')].map(b => b.textContent).join('|'))); };
  let k1 = await kerko('vita');
  ok(k1.includes('Malli:Kos Vita 500g') && k1.includes('Afatet:Qumësht Vita 1L') && k1.includes('Furnizuesit:Vita') && await p.evaluate(() => document.getElementById('blPjeset').hidden), '3. "vita": malli, afatet, furnizuesit (pjesët fshihen)', k1);
  ok((await kerko('3800001')).join() === 'Malli:Ujë Rugove 1.5L', '3. barkodi gjen produktin', await kerko('3800001'));
  ok((await kerko('pije')).some(x => x === 'Folderat:Pije'), '3. folderi', await kerko('pije'));
  ok((await kerko('pamj')).some(x => /^Cilësimet:Pamja/.test(x)), '3. faqet e Cilësimeve', await kerko('pamj'));
  ok((await kerko('lengg')).length === 0 && /S'u gjet asgjë/.test(await p.textContent('#blRezultatet')), '3. pa rezultat: "S\'u gjet asgjë"');
  ok((await kerko('LENG')).some(x => x === 'Afatet:Lëng Frutti'), '3. pa dallim shkronjash dhe "ë"', await kerko('LENG'));
  await p.screenshot({ path: __dirname + '/v327-kerkimi.png' });
  await kerko('vita');
  await p.click('#blRezultatet [data-grupi="Afatet"] .bl-rez'); await p.waitForTimeout(500);
  s = await p.evaluate(() => ({ afatet: document.getElementById('dlgAfatet').classList.contains('hapur'), afat: document.getElementById('dlgAfat').classList.contains('hapur'), b: document.getElementById('afatBarkodi').value }));
  ok(s.afatet && s.afat && s.b === '3890001', '3. prekja e afatit e hap atë te Afatet', s);
  await p.click('#afatAnulo'); await p.waitForTimeout(300);
  await p.click('#tabBallina'); await p.waitForTimeout(300);
  await kerko('rugove');
  await p.click('#blRezultatet [data-grupi="Malli"] .bl-rez'); await p.waitForTimeout(600);
  s = await p.evaluate(() => ({ ballina: document.getElementById('dlgBallina').classList.contains('hapur'), prod: document.getElementById('dlgProdukt').classList.contains('hapur'), tit: document.getElementById('titulli').textContent }));
  ok(!s.ballina && s.prod && s.tit === 'Pije', '3. prekja e produktit e hap te Malli, në folderin e vet', s);
  await p.click('#dlgAnulo'); await p.waitForTimeout(300);

  // 1. Mbrapa: folderi → Malli → Ballina
  await p.goBack(); await p.waitForTimeout(400);
  s = await p.evaluate(() => ({ ballina: document.getElementById('dlgBallina').classList.contains('hapur'), tit: document.getElementById('titulli').textContent }));
  ok(!s.ballina && s.tit === 'Malli', '2. "Mbrapa" nga folderi: Malli me titullin "Malli"', s);
  await p.goBack(); await p.waitForTimeout(400);
  ok((await gj()).ballina, '1. "Mbrapa" nga Malli kthen te Ballina');
  await p.evaluate(() => { document.getElementById('blKerko').value = ''; document.getElementById('blKerko').dispatchEvent(new Event('input')); document.activeElement && document.activeElement.blur(); });
  await p.waitForTimeout(300);
  await p.click('#btnAfatet'); await p.waitForTimeout(400);
  await p.goBack(); await p.waitForTimeout(400);
  s = await gj();
  ok(s.ballina && !s.afatet, '1. "Mbrapa" nga Afatet kthen te Ballina', s);

  // 1. Përshtat faqen: fik "Grafiku", lëviz "Malli" lart
  await p.click('#blPershtat'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => document.querySelectorAll('#blpLista .blp-rresht').length) === 8, '1. "Përshtat faqen": pjesët e lejuara (pa Marketin pa markete)', await p.evaluate(() => [...document.querySelectorAll('#blpLista .blp-rresht')].map(x => x.getAttribute('data-id'))));
  await p.evaluate(() => document.querySelector('#blpLista [data-id="grafiku"] input').click());
  const kap = await p.$('#blpLista [data-id="malli"] .blp-kapja'), bb = await kap.boundingBox();
  await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.mouse.down();
  for (let i = 1; i <= 12; i++) { await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2 - i * 20); await p.waitForTimeout(16); }
  await p.mouse.up();
  await p.screenshot({ path: __dirname + '/v327-pershtat.png' });
  await p.click('#blpRuaj'); await p.waitForTimeout(300);
  s = await gj();
  ok(!s.pjeset.includes('grafiku') && s.pjeset.indexOf('malli') < s.pjeset.indexOf('afatet') && /grafiku:0/.test(await p.evaluate(() => localStorage.getItem('stoku:ballina:pjeset'))), '1. "Ruaj": pa grafikun, Malli më lart; ruhet', s.pjeset);
  await p.click('#blPershtat'); await p.click('#blpFillim'); await p.click('#blpRuaj'); await p.waitForTimeout(300);
  ok((await gj()).pjeset.join() === 'butonat,afatet,skadojne,grafiku,malli,furnizuesit,grupi', '1. "Si në fillim"');
  await p.click('#tabMalli'); await p.waitForTimeout(300);
  ok(!(await gj()).ballina && (await gj()).tab === 'tabMalli', '1. "Malli" e mbyll Ballinën (s\'rihapet vetë)');
  await p.click('#tabBallina'); await p.waitForTimeout(300);
  ok((await gj()).ballina, '1. shtëpia e hap Ballinën');
  ok(!gab.length, 'pa gabime JS', gab);
  await ctx.close();
  // PC pa Ballina
  {
    const c2 = await b.newContext({ viewport: { width: 1280, height: 860 }, serviceWorkers: 'block' });
    const p2 = await c2.newPage(); await p2.goto('http://127.0.0.1:' + PORTI + '/pc.html'); await p2.waitForTimeout(2000);
    ok(await p2.evaluate(() => !document.getElementById('dlgBallina') && !document.getElementById('tabBallina')), '1. PC: pa Ballina');
    await c2.close();
  }
  await b.close();
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();
