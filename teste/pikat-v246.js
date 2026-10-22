// v246: merchandiseri dhe pikat e përbashkëta të Stoku-t (pikat/{id}). Kontrollon:
// 1. merchandiseri pa markete hap Stoku-n te një pikë që e ka shtuar dikush tjetër: kërkohet vendndodhja, "Je te: Albi Mall",
//    marketi shtohet vetë (i lidhur me pikën)
// 2. merchandiseri larg çdo pike (v250: marketet e Stoku-t i ka te lista): del vetë "Ku je?"; "+ Market i ri" → pikë e Stoku-t
// 3. merchandiseri me një market pa vendndodhje, 500 m nga një pikë: del "Ku je?" me "Afër teje"; zgjedhja e bën aktiv
// 4. marketi i vjetër me vendndodhje (pa pikë) bëhet pikë vetë
// 5. administratori e riemërton pikën (Harta): emri i ri te merchandiserët; v250: merchandiseri s'e ndërron emrin as të vetës
// 6. pa leje për vendndodhjen: mesazh; llogaria jo-merchandiser: pa GPS
const { chromium } = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const BAZA = process.env.STOKU_B || 'http://127.0.0.1:8765';
const UA = 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36';
const prit = (fn, ms = 10000) => new Promise(async z => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn().catch(() => false)) return z(true); await new Promise(r => setTimeout(r, 150)); } z(false); });
const ALBI = { latitude: 42.6476, longitude: 21.1491, accuracy: 20 };
const AFER = { latitude: 42.6476, longitude: 21.1552, accuracy: 20 }; // ~500 m në lindje të Albit
const LARG = { latitude: 42.3800, longitude: 20.4300, accuracy: 20 }; // Pejë
(async () => {
  const F = krijoFirestore();
  const t = Date.now();
  F.S.docs.set('perdoruesit/u1', { perdoruesi: 'drini', kycurSe: t, merchandiser: true });
  F.S.docs.set('perdoruesit/u2', { perdoruesi: 'besa', kycurSe: t, merchandiser: true });
  F.S.docs.set('perdoruesit/u3', { perdoruesi: 'vesa', kycurSe: t, merchandiser: true });
  F.S.docs.set('perdoruesit/u4', { perdoruesi: 'teuta', kycurSe: t, merchandiser: true });
  F.S.docs.set('perdoruesit/u5', { perdoruesi: 'arta', kycurSe: t, merchandiser: true });
  F.S.docs.set('perdoruesit/u6', { perdoruesi: 'agim', kycurSe: t });
  F.S.docs.set('perdoruesit/uA', { perdoruesi: 'mendurberisha', kycurSe: t });
  F.S.docs.set('pikat/pA', { emri: 'Albi Mall', lat: 42.6476, lng: 21.1491, krijuarNga: 'u2', krijuarNgaEmri: 'besa', krijuarSe: t, ndryshuarSe: t });
  const b = await chromium.launch();
  async function faqe(uid, emri, geo, marketet, paLeje) {
    const o = { userAgent: UA, viewport: { width: 390, height: 844 }, serviceWorkers: 'block', hasTouch: true, permissions: paLeje ? [] : ['geolocation'] };
    if (geo) o.geolocation = geo;
    const ctx = await b.newContext(o);
    await ctx.route(u => !u.href.startsWith(BAZA), r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: '{"ok":true}' }));
    await F.lidh(ctx, uid, emri + '@stoku-app.local', 'tel', { afatet: [] });
    if (marketet) await ctx.addInitScript(m => { if (!localStorage.getItem('stoku:marketet:v1')) localStorage.setItem('stoku:marketet:v1', JSON.stringify(m)); }, marketet);
    await ctx.addInitScript(() => {
      window.__gpsThirrje = 0;
      const g0 = navigator.geolocation && navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
      if (g0) navigator.geolocation.getCurrentPosition = function () { window.__gpsThirrje++; return g0.apply(null, arguments); };
    });
    const p = await ctx.newPage(); p.__gab = []; p.on('pageerror', e => p.__gab.push(e.message));
    await p.goto(BAZA + '/index.html'); await p.waitForTimeout(2500);
    return { p, ctx };
  }
  const lsM = p => p.evaluate(() => JSON.parse(localStorage.getItem('stoku:marketet:v1') || '[]'));
  const hapur = (p, id) => p.evaluate(x => document.getElementById(x).classList.contains('hapur'), id);
  const toast = p => p.evaluate(() => document.getElementById('toast').textContent);
  const cipi = p => p.evaluate(() => { const c = document.querySelector('.sb-home-krye .mk-chip'); return c ? c.textContent.replace(/\s+/g, ' ').trim() : ''; });

  // 1. Te një pikë e njohur (e shtoi besa)
  const { p: d } = await faqe('u1', 'drini', ALBI);
  ok(await prit(async () => (await d.evaluate(() => window.__gpsThirrje)) >= 1), '1. drini: vendndodhja kërkohet vetë kur hapet Stoku (pa asnjë market)');
  ok(await prit(async () => (await lsM(d)).some(m => m.p === 'pA' && m.emri === 'Albi Mall' && typeof m.lat === 'number')), '1. marketi "Albi Mall" u shtua vetë, i lidhur me pikën', await lsM(d));
  ok(await prit(async () => /Je te: Albi Mall/.test(await toast(d)) && /Albi Mall/.test(await cipi(d))), '1. "Je te: Albi Mall" (çipi dhe njoftimi)', [await toast(d), await cipi(d)]);
  ok(!(await hapur(d, 'dlgMarketi')) && !(await hapur(d, 'dlgMarketiRi')), '1. pa dritare pyetjeje (vendi u njoh)');
  ok(await prit(async () => ((F.S.docs.get('dyqane/u1') || {}).marketet || []).some(m => m.p === 'pA')), '1. marketi shkon te dyqani (sinkronizimi)');

  // 2. Larg çdo pike: "Ku je?" (v250: "Albi Mall" i Stoku-t është tashmë te lista) → "+ Market i ri" → pikë e re
  const { p: v } = await faqe('u3', 'vesa', LARG);
  ok(await prit(async () => (await lsM(v)).some(m => m.p === 'pA')), '2. vesa: "Albi Mall" i Stoku-t te lista e saj (pa e vizituar)', await lsM(v));
  ok(await prit(async () => await hapur(v, 'dlgMarketi')), '2. vesa: del vetë "Ku je?"', await v.textContent('#mkdNen'));
  await v.click('#mkdIRi');
  ok(await prit(async () => await hapur(v, 'dlgMarketiRi')), '2. "+ Market i ri" → "Në cilin market je?"');
  await v.fill('#mkrEmri', 'Viva Fresh Pejë'); await v.click('#mkrRuaj');
  ok(await prit(async () => (await lsM(v)).some(m => m.emri === 'Viva Fresh Pejë' && typeof m.lat === 'number' && m.p)), '2. marketi me vendndodhje, i lidhur me një pikë', await lsM(v));
  const pV = (await lsM(v)).find(m => m.emri === 'Viva Fresh Pejë');
  const pikaV = pV && F.S.docs.get('pikat/' + pV.p);
  ok(!!pikaV && pikaV.krijuarNga === 'u3' && pikaV.krijuarNgaEmri === 'vesa' && pikaV.emri === 'Viva Fresh Pejë' && Math.abs(pikaV.lat - 42.38) < 0.001, '2. pika e re e Stoku-t (pikat/…)', pikaV);

  // 3. 500 m nga Albi, me një market pa vendndodhje: "Ku je?" me "Afër teje"
  const { p: te } = await faqe('u4', 'teuta', AFER, [{ id: 'mk1', emri: 'Kos', ndryshuarSe: t - 9000 }]);
  ok(await prit(async () => await hapur(te, 'dlgMarketi')), '3. teuta: del vetë "Ku je?"');
  const lista = await te.evaluate(() => [...document.querySelectorAll('#mkdLista > *')].map(x => x.textContent.replace(/\s+/g, ' ').trim()));
  ok(lista[0] === 'Afër teje' && /^Albi Mall\s*\d+ m/.test(lista[1]) && lista.includes('Marketet e tjera') && lista.some(x => /^Kos/.test(x)), '3. "Afër teje: Albi Mall (… m)" dhe marketet e tjera', lista);
  ok(/S'je te asnjë market i njohur/.test(await te.textContent('#mkdNen')), '3. teksti "S\'je te asnjë market i njohur…"');
  await te.evaluate(() => document.querySelector('#mkdLista .mk-afer').click());
  ok(await prit(async () => (await lsM(te)).some(m => m.p === 'pA' && m.emri === 'Albi Mall') && /Albi Mall/.test(await cipi(te))), '3. zgjedhja e bën "Albi Mall" aktiv', [await lsM(te), await cipi(te)]);

  // 4. Marketi i vjetër me vendndodhje (pa pikë) bëhet pikë
  const { p: ar } = await faqe('u5', 'arta', LARG, [{ id: 'ma1', emri: 'Super Viva', lat: 42.6629, lng: 21.1655, ndryshuarSe: t - 9000 }]);
  ok(await prit(async () => (await lsM(ar)).some(m => m.id === 'ma1' && m.p && F.S.docs.get('pikat/' + m.p) && F.S.docs.get('pikat/' + m.p).krijuarNga === 'u5')), '4. "Super Viva" u bë pikë e Stoku-t dhe u lidh', await lsM(ar));
  const nPika = [...F.S.docs.keys()].filter(k => /^pikat\/[^/]+$/.test(k)).length;
  await ar.reload(); await ar.waitForTimeout(3000);
  ok([...F.S.docs.keys()].filter(k => /^pikat\/[^/]+$/.test(k)).length === nPika, '4. pas rifreskimit: s\'krijohet pikë e dyfishtë');

  // 5. Administratori e riemërton pikën; merchandiseri e merr emrin; s'e ndërron më vetë
  const { p: ad } = await faqe('uA', 'mendurberisha', ALBI);
  ok(await ad.evaluate(() => window.__gpsThirrje) === 0, '5. administratori (jo merchandiser): pa GPS');
  await ad.click('#btnOpsione'); await ad.waitForTimeout(400);
  await ad.click('#tabHarta'); await ad.waitForTimeout(800);
  const rr = async () => ad.evaluate(() => [...document.querySelectorAll('#htLista .ops-furn-rresht:not(.ops-furn-edit)')].map(x => x.querySelector('.ops-furn-emri').textContent + ' | ' + x.querySelector('.hint').textContent));
  ok(await prit(async () => (await rr()).length >= 3), '5. Harta e adminit: pikat e Stoku-t', await rr());
  ok((await rr()).some(x => /^Albi Mall \| E shtoi besa/.test(x)) && (await rr()).some(x => /^Viva Fresh Pejë \| E shtoi vesa/.test(x)), '5. kush e shtoi secilën pikë', await rr());
  await ad.evaluate(() => [...document.querySelectorAll('#htLista .ops-furn-rresht')].find(x => /Albi Mall/.test(x.textContent)).click()); await ad.waitForTimeout(300);
  await ad.fill('#htLista .ops-furn-edit input', 'Albi Mall Prishtinë');
  await ad.evaluate(() => [...document.querySelectorAll('#htLista .ops-furn-edit button')].find(x => x.textContent === 'Ruaj').click());
  ok(await prit(async () => (F.S.docs.get('pikat/pA') || {}).emri === 'Albi Mall Prishtinë' && F.S.docs.get('pikat/pA').emriNgaAdmini === true), '5. pikat/pA: emri i ri, "emriNgaAdmini"', F.S.docs.get('pikat/pA'));
  ok(await prit(async () => (await lsM(d)).some(m => m.p === 'pA' && m.emri === 'Albi Mall Prishtinë') && (await lsM(te)).some(m => m.p === 'pA' && m.emri === 'Albi Mall Prishtinë')), '5. drini dhe teuta e marrin emrin e ri vetë', [await lsM(d), await lsM(te)]);
  ok(await prit(async () => /Albi Mall Prishtinë/.test(await cipi(d))), '5. çipi i drinit: "Albi Mall Prishtinë"', await cipi(d));
  await d.click('#btnOpsione'); await d.waitForTimeout(300);
  await d.click('#tabMarketet'); await d.waitForTimeout(400);
  await d.evaluate(() => { const x = [...document.querySelectorAll('#mkLista .ops-furn-rresht')].find(x => /Albi Mall/.test(x.textContent)); if (x) x.click(); }); await d.waitForTimeout(200);
  ok(await d.evaluate(() => !document.querySelector('#mkLista input, #mkLista .ops-furn-edit')), '5. v250: drini s\'ka ku ta ndërrojë emrin (Cilësimet → Marketet vetëm për t\'u parë)');
  // v250: as krijuesi s'e ndërron më pikën e vet (rregullat): vesa provon direkt
  const rV = await v.evaluate(id => window.__stokuCloud.ekipa.ndryshoPiken(id, { emri: 'Viva Pejë Qendër' }, false), pV.p);
  ok(!(rV && rV.ok) && (F.S.docs.get('pikat/' + pV.p) || {}).emri === 'Viva Fresh Pejë', '5. v250: vesa s\'e riemërton as pikën e vet', rV);
  // Administratori fshin pikën e Pejës
  await ad.evaluate(() => [...document.querySelectorAll('#htLista .ops-furn-rresht')].find(x => /Viva Fresh Pejë/.test(x.textContent)).click()); await ad.waitForTimeout(300);
  await ad.evaluate(() => [...document.querySelectorAll('#htLista .ops-furn-edit button')].find(x => x.textContent === 'Fshije pikën').click()); await ad.waitForTimeout(300);
  await ad.click('#konfPo');
  ok(await prit(async () => !F.S.docs.has('pikat/' + pV.p) && !(await rr()).some(x => /Viva Fresh Pejë/.test(x))), '5. administratori e fshin pikën');
  ok((await lsM(v)).some(m => m.emri === 'Viva Fresh Pejë'), '5. marketi i vesës mbetet (i krijuar para pak minutash: s\'hiqet menjëherë)');

  // 6. Pa leje për vendndodhjen; llogari jo-merchandiser
  const { p: pl } = await faqe('u2', 'besa', null, null, true);
  ok(await prit(async () => /s'ka leje për vendndodhjen/.test(await toast(pl))), '6. besa pa leje: "Stoku s\'ka leje për vendndodhjen…"', await toast(pl));
  const { p: ag } = await faqe('u6', 'agim', ALBI);
  await ag.waitForTimeout(1500);
  ok(await ag.evaluate(() => window.__gpsThirrje) === 0 && !(await hapur(ag, 'dlgMarketi')) && !(await hapur(ag, 'dlgMarketiRi')), '6. agim (jo merchandiser): pa GPS, pa pyetje');
  for (const [n, p] of [['drini', d], ['vesa', v], ['teuta', te], ['arta', ar], ['admin', ad], ['besa', pl], ['agim', ag]]) ok(!p.__gab.length, '6. ' + n + ': pa gabime JS', p.__gab);
  await b.close();
  console.log(g ? 'GABIME: ' + g : 'Krejt në rregull');
  process.exit(g ? 1 : 0);
})();
