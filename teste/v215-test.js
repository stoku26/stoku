// v215 (kontrolli i plotë i projektit):
//  A) telefoni: ruajtja e një afati ekzistues (p.sh. vetëm sasia) s'e kthen "të ri" furnizuesin që administratori e fshiu
//     (më parë krahasohej me id-në e afatit, jo me afatin); një furnizues i ri te afati pret ende kontrollin;
//  B) telefoni: datat e shpejta "1 muaj"/"3 muaj" nga 31 janari → fundi i shkurtit/prillit (jo 3 mars / 1 maj);
//  C) kompjuteri: barkodi me shkronja nga skaneri USB ("…N…M…") s'hap shkurtoret, por produktin me barkodin e plotë;
//  D) kompjuteri + telefoni: një gabim i papritur gjatë sinkronizimit s'e ngec statusin te "Duke sinkronizuar…";
//  E) telefoni + kompjuteri: dy pyetje konfirmimi njëra pas tjetrës: e para s'mbetet pa përgjigje.
const { chromium } = require('./pw.js');
const PORTI = process.env.PORTI || '8765';
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const t = Date.now(), d = n => new Date(t + n * 864e5).toISOString().slice(0, 10);

function cloudMock(emri, opt) {
  return [emri, opt || {}];
}
async function faqe(b, pc, emri, af, kujtesa, opt) {
  const ctx = await b.newContext(pc ? { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140', viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' }
    : { userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
  if (opt && opt.koha) await ctx.clock.setSystemTime(opt.koha);
  await ctx.addInitScript(([emri, af, kujtesa, hedhNjeHere, t]) => {
    var nr = 0;
    window.__nrSink = 0;
    window.__stokuCloud = { authGati: true, perdoruesiAktual: () => ({ uid: 'u1', email: emri + '@stoku-app.local' }), token: async () => 't',
      merr: async () => ({ ok: true, gjendja: null }),
      bashkoDheRuaj: async fn => { window.__nrSink++; if (hedhNjeHere && nr++ === 0) throw new Error('gabim-i-papritur'); return { ok: true, gjendja: fn(null) }; },
      degjo: () => () => {}, degjoFletet: () => () => {}, dil: async () => {} };
    localStorage.setItem('stoku:pronari-uid', 'u1'); localStorage.setItem('stoku:porta:hyrja', JSON.stringify({ uid: 'u1', emri: emri }));
    localStorage.setItem('stoku:te-rejat:pare', '999'); localStorage.setItem('stoku:njoftimet:jo-tani', String(Date.now()));
    localStorage.setItem('stoku:foldera:v1', JSON.stringify([{ id: 'f1', emri: 'Ushqimore' }, { id: 'f2', emri: 'Pije' }]));
    localStorage.setItem('stoku:produktet:v2', JSON.stringify({ 'f1::111': { barkodi: '111', emri: 'Bukë', sasia: 4, kategoriaId: 'f1', prekurSe: t } }));
    localStorage.setItem('stoku:afatet:v1', JSON.stringify(af || []));
    if (kujtesa) localStorage.setItem('stoku:kujtesa:v1', JSON.stringify(kujtesa));
  }, [emri, af, kujtesa, !!(opt && opt.hedh), t]);
  const p = await ctx.newPage();
  p.on('pageerror', e => { if (!(opt && opt.injoroGabimin && /gabim-i-papritur/.test(e.message))) { g++; console.log('pageerror', e.message); } else p.__gabimi = e.message; });
  await p.goto('http://127.0.0.1:' + PORTI + '/' + (pc ? 'pc.html' : 'index.html') + ((opt && opt.hash) || ''));
  await p.waitForTimeout(2200);
  return { p, ctx };
}
const kujtesaE = p => p.evaluate(() => JSON.parse(localStorage.getItem('stoku:kujtesa:v1') || '{}'));

(async () => {
  const b = await chromium.launch();

  // ---------- A) telefoni: afati ekzistues me furnizues të fshirë ----------
  {
    const af = [{ id: 'a1', emri: 'Kos pa barkod', data: d(20), sasia: 3, furnizuesi: 'Frutex', statusi: 'aktiv', krijuarSe: t - 9e6, ndryshuarSe: t - 9e6 }];
    const kuj = { 'furnizuesi Frutex': { x: 1, k: t - 5000, s: 1 } }; // administratori e fshiu "Frutex"
    const { p, ctx } = await faqe(b, false, 'agim', af, kuj);
    await p.click('#btnAfatet'); await p.waitForTimeout(400);
    await p.click('#afLista .af-karta[data-id="a1"]'); await p.waitForTimeout(300);
    ok(await p.isVisible('#dlgAfat'), 'A: afati hapet');
    await p.fill('#afatSasia', '5');
    await p.click('#afatRuaj'); await p.waitForTimeout(500);
    const ruajtur = await p.evaluate(() => JSON.parse(localStorage.getItem('stoku:afatet:v1'))[0]);
    ok(ruajtur.sasia === 5 && ruajtur.furnizuesi === 'Frutex', 'A: afati u ruajt (sasia 5)', ruajtur.sasia);
    let K = await kujtesaE(p);
    ok(K['furnizuesi Frutex'] && K['furnizuesi Frutex'].x === 1, 'A: furnizuesi i fshirë mbetet i fshirë (s\'kthehet si "i ri")', K['furnizuesi Frutex']);
    // Një furnizues i ri te i njëjti afat: pret kontrollin (si më parë)
    await p.click('#afLista .af-karta[data-id="a1"]'); await p.waitForTimeout(300);
    await p.fill('#afatFurnizuesi', 'Furn i Ri');
    await p.click('#afatRuaj'); await p.waitForTimeout(500);
    K = await kujtesaE(p);
    ok(K['furnizuesi Furn i Ri'] && !K['furnizuesi Furn i Ri'].x && K['furnizuesi Furn i Ri'].n === 'agim', 'A: furnizuesi i ri te afati pret kontrollin (nga agim)', K['furnizuesi Furn i Ri']);
    // Afat i ri me furnizues ekzistues të fshirë (dikush e shkruan sërish): del në pritje (sjellja e v214)
    await p.click('#afShto'); await p.waitForTimeout(300);
    await p.fill('#afatEmri', 'Lëng'); await p.fill('#afatData', '01-12-30'); await p.fill('#afatFurnizuesi', 'Frutex');
    await p.click('#afatRuaj'); await p.waitForTimeout(500);
    K = await kujtesaE(p);
    ok(K['furnizuesi Frutex'] && !K['furnizuesi Frutex'].x, 'A: afat i ri me "Frutex" e kthen në pritje (dikush e shkroi sërish)', K['furnizuesi Frutex']);
    await ctx.close();
  }

  // ---------- B) telefoni: datat e shpejta nga 31 janari ----------
  {
    const { p, ctx } = await faqe(b, false, 'agim', [], null, { koha: new Date(2027, 0, 31, 10, 0, 0) });
    await p.click('#btnAfatet'); await p.waitForTimeout(300);
    await p.click('#afShto'); await p.waitForTimeout(300);
    const datat = await p.$$eval('#afatDatat .sb-date', x => x.map(e => [e.querySelector('.sb-date__sa').textContent, e.getAttribute('data-iso')]));
    const m = Object.fromEntries(datat);
    ok(m['1 javë'] === '2027-02-07' && m['2 javë'] === '2027-02-14', 'B: 1 javë / 2 javë', m);
    ok(m['1 muaj'] === '2027-02-28', 'B: "1 muaj" nga 31.01 = 28.02 (jo 03.03)', m['1 muaj']);
    ok(m['3 muaj'] === '2027-04-30', 'B: "3 muaj" nga 31.01 = 30.04 (jo 01.05)', m['3 muaj']);
    await p.click('#afatDatat .sb-date:has-text("1 muaj")'); await p.waitForTimeout(100);
    ok(await p.inputValue('#afatData') === '28-02-27', 'B: fusha merr 28-02-27', await p.inputValue('#afatData'));
    await ctx.close();
  }
  {
    const { p, ctx } = await faqe(b, false, 'agim', [], null, { koha: new Date(2027, 4, 15, 10, 0, 0) });
    await p.click('#btnAfatet'); await p.waitForTimeout(300);
    await p.click('#afShto'); await p.waitForTimeout(300);
    const m = Object.fromEntries(await p.$$eval('#afatDatat .sb-date', x => x.map(e => [e.querySelector('.sb-date__sa').textContent, e.getAttribute('data-iso')])));
    ok(m['1 muaj'] === '2027-06-15' && m['3 muaj'] === '2027-08-15', 'B: nga 15.05: 15.06 dhe 15.08 (si më parë)', m);
    await ctx.close();
  }

  // ---------- C) kompjuteri: skaneri USB me shkronja ----------
  {
    const { p, ctx } = await faqe(b, true, 'agim', [], null, { hash: '#/f/f1' });
    await p.evaluate(() => { location.hash = '#/f/f1'; }); await p.waitForTimeout(500);
    await p.evaluate(() => { if (document.activeElement) document.activeElement.blur(); });
    await p.keyboard.type('AB12NM34'); await p.keyboard.press('Enter'); await p.waitForTimeout(400);
    const gj = await p.evaluate(() => ({ produkt: document.getElementById('dlgProdukt').classList.contains('hapur'), barkodi: document.getElementById('prBarkodi').value,
      zhvendos: document.getElementById('dlgZhvendos') ? document.getElementById('dlgZhvendos').classList.contains('hapur') : false }));
    ok(gj.produkt && gj.barkodi === 'AB12NM34' && !gj.zhvendos, 'C: skanimi "AB12NM34" hap produktin e ri me barkodin e plotë (pa shkurtore)', gj);
    await p.keyboard.press('Escape'); await p.waitForTimeout(200);
    // Shkurtorja "N" me dorë punon ende
    await p.evaluate(() => { if (document.activeElement) document.activeElement.blur(); });
    await p.waitForTimeout(150);
    await p.keyboard.press('n'); await p.waitForTimeout(300);
    ok(await p.evaluate(() => document.getElementById('dlgProdukt').classList.contains('hapur') && document.getElementById('prBarkodi').value === ''), 'C: "N" e shtypur vetëm hap "Produkt i ri" (shkurtorja punon)');
    await ctx.close();
  }

  // ---------- D) gabim i papritur gjatë sinkronizimit ----------
  for (const pc of [true, false]) {
    const emer = pc ? 'D (PC)' : 'D (tel)';
    const { p, ctx } = await faqe(b, pc, 'agim', [{ id: 'a1', emri: 'Kos', data: d(20), statusi: 'aktiv', ndryshuarSe: t }], null, { hedh: true, injoroGabimin: true });
    await p.waitForTimeout(800);
    ok(!p.__gabimi, emer + ': gabimi s\'del si gabim i pakapur i faqes', p.__gabimi);
    if (pc) {
      ok(/Pa lidhje/.test(await p.textContent('#sinkTekst')), emer + ': statusi tregon gabimin (jo "Duke sinkronizuar…")', await p.textContent('#sinkTekst'));
      await p.click('#sinkStatus'); await p.waitForTimeout(600);
      ok(/Sinkronizuar/.test(await p.textContent('#sinkTekst')), emer + ': sinkronizimi i radhës punon', await p.textContent('#sinkTekst'));
    } else {
      const s = await p.evaluate(() => document.getElementById('afSinkStatus').className);
      ok(/gabim/.test(s), emer + ': ikona e cloud-it tregon gabimin', s);
      const n0 = await p.evaluate(() => window.__nrSink);
      await p.evaluate(() => window.dispatchEvent(new Event('online'))); await p.waitForTimeout(600);
      const s2 = await p.evaluate(() => document.getElementById('afSinkStatus').className);
      ok(/\bok\b/.test(s2) && await p.evaluate(() => window.__nrSink) > n0, emer + ': sinkronizimi i radhës punon (s\'ngec)', s2);
    }
    await ctx.close();
  }

  // ---------- E) dy pyetje konfirmimi njëra pas tjetrës ----------
  {
    const { p, ctx } = await faqe(b, false, 'agim', [{ id: 'a1', emri: 'Kos', data: d(-3), statusi: 'aktiv', ndryshuarSe: t }]);
    // Pyetja e parë: "Dil" (s'përgjigjet); e dyta: fshirja e folderit "Pije" → Anulo. E para merr "jo" dhe s'del.
    await p.click('#btnOpsione'); await p.waitForTimeout(300);
    await p.evaluate(() => document.getElementById('cloudDilBtn').click()); await p.waitForTimeout(300);
    ok(await p.isVisible('#dlgKonfirmo'), 'E: pyetja e parë (Dil) del');
    await p.evaluate(() => { document.getElementById('dlgOpsione').classList.remove('hapur'); });
    await p.evaluate(() => document.querySelector('.folder-karta[data-id="f2"] .folder-fshij').click()); await p.waitForTimeout(300);
    ok(/Të fshihet folderi/.test(await p.textContent('#konfTitulli')), 'E: pyetja e dytë zëvendëson të parën');
    await p.click('#konfJo'); await p.waitForTimeout(300);
    ok(!(await p.isVisible('#dlgKonfirmo')), 'E: pas "Anulo" s\'mbetet asnjë pyetje e hapur');
    ok(await p.evaluate(() => JSON.parse(localStorage.getItem('stoku:foldera:v1')).length) === 2, 'E: folderi s\'u fshi');
    await ctx.close();
  }

  await b.close();
  console.log(g ? '\n✖ ' + g + ' GABIME' : '\n✔ Krejt në rregull');
  process.exit(g ? 1 : 0);
})();
