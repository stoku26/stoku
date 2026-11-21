// v351 (Google Play, pronari 21.11.2026): përdoruesi e fshin VETË llogarinë te Cilësimet → Llogaria → "Fshi llogarinë"
// (web tel + PC; Android te CilesimetEkrani.kt / Llogaria.fshiLlogarineTime). Administratori s'e ka këtë. Rregullat: teste/emu/fshirja-v351.mjs.
const { chromium } = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
const fs = require('fs');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const RR = __dirname + '/../', lx = f => fs.readFileSync(RR + f, 'utf8');
const K = 'vendas/app/src/main/java/site/stoku/vendas/';
const B = 'http://127.0.0.1:8765';
const prit = async (f, ms = 8000) => { const t = Date.now(); while (Date.now() - t < ms) { try { if (await f()) return true; } catch (e) { /* ok */ } await new Promise(r => setTimeout(r, 150)); } return false; };
(async () => {
  // ===== 0. Kodi =====
  const ll = lx(K + 'Llogaria.kt'), ce = lx(K + 'ui/CilesimetEkrani.kt'), ek = lx('ekipa.js'), w = lx('worker/stoku-push.js');
  ok(/suspend fun fshiLlogarineTime\(fjalekalimi: String\)/.test(ll) && /"fshireNga" to "vete"/.test(ll) && /Lejet\.eshteAdmin\(u\)\) return "admin"/.test(ll) && /FshirjaELlogarise\(\)/.test(ce) && /!Llogaria\.eshteAdmin\(\)/.test(ce), '0. Android: Fshi llogarinë (jo administratori)');
  ok(/fshijLlogarineTime: async function/.test(ek) && /fshireNga: 'vete'/.test(ek) && /fshiLlogarineTime\(fjalekalimi\)/.test(lx('firebase-tel.js')) && /fshiLlogarineTime\(fjalekalimi\)/.test(lx('firebase-pc.js')), '0. web: ekipa.js + firebase-tel/pc');
  ok(/kush !== ADMIN_UID && kush !== u/.test(w) && /VERSIONI_WORKER = 176/.test(w), '0. Worker 176: /admin/fshi edhe për veten');
  const rr = require('./emu/rregullat.js').rregullat();
  ok(/fshireNga == 'vete'/.test(rr) && /allow delete: if request\.auth != null && \(eshteAdmin\(\) \|\| request\.auth\.uid == uid\); \/\/ v351/.test(rr), '0. rregullat v351');

  const F = krijoFirestore({ rregullat: 'reja' });
  const S = F.S.docs;
  const mbush = () => {
    S.set('grupet/g1', { emri: 'Market 1', pronarUid: 'uA', pronarEmri: 'mendurberisha', krijuarSe: 1 });
    S.set('grupet/g1/anetaret/uA', { emri: 'mendurberisha', roli: 'pronar', hyriSe: 1 });
    S.set('grupet/g1/anetaret/uB', { emri: 'besa', roli: 'anetar', hyriSe: 2 });
    S.set('perdoruesit/uA', { perdoruesi: 'mendurberisha', grupi: 'g1', kycurSe: Date.now() });
    S.set('perdoruesit/uB', { perdoruesi: 'besa', grupi: 'g1', kycurSe: Date.now() });
    S.set('lejet/uB', { lejet: { grupi: true }, emri: 'besa' });
    S.set('kujtesa_pritje/uB', { p: {}, emri: 'besa' });
    S.set('grupet/g1/afatet/uB', { l: [] });
    S.set('perdoruesit/uC', { perdoruesi: 'cima', kycurSe: Date.now() });
  };
  mbush();
  const b = await chromium.launch();
  const faqe = async (uid, email, pc) => {
    const ctx = await b.newContext({ viewport: pc ? { width: 1440, height: 900 } : { width: 390, height: 844 }, serviceWorkers: 'block', userAgent: pc ? undefined : 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile' });
    await ctx.route(u => !u.href.startsWith(B), r => r.abort());
    await F.lidh(ctx, uid, email, pc ? 'pc' : 'tel');
    await ctx.addInitScript(() => { try { localStorage.setItem('stoku:njoftimet:jo-tani', String(Date.now())); } catch (e) {} });
    const p = await ctx.newPage(); p.__gab = []; p.on('pageerror', e => p.__gab.push(e.message));
    await p.goto(B + (pc ? '/pc.html' : '/index.html')); await p.waitForTimeout(2500);
    await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(x => { if (!x.classList.contains('faqe-e-plote')) x.classList.remove('hapur'); }));
    return p;
  };
  const hapLlogarine = async (p, pc) => {
    if (pc) { await p.click('#btnOpsione'); await p.waitForTimeout(300); await p.click('#opsSkeda button[data-faqe="llogaria"]'); await p.waitForTimeout(400); return; }
    await p.click('#btnOpsione').catch(() => {}); await p.waitForTimeout(300);
    await p.evaluate(() => { const x = document.getElementById('tabLlogaria') || document.getElementById('opsProfil'); if (x) x.click(); }); await p.waitForTimeout(500);
  };
  const fshi = async (p, fj, pc) => {
    const T = pc ? 'kfTitulli' : 'konfTitulli', PO = pc ? '#kfPo' : '#konfPo';
    await p.evaluate(() => document.getElementById('llFshiKarta').scrollIntoView({ block: 'center' }));
    await p.fill('#llFshiFjalekalimi', fj);
    await p.evaluate(() => document.getElementById('llFshiBtn').click()); await p.waitForTimeout(300);
    const dlg = await p.evaluate(([T, PO]) => ({ hapur: document.getElementById('dlgKonfirmo').classList.contains('hapur'), t: document.getElementById(T).textContent, po: document.querySelector(PO).disabled }), [T, PO]);
    await p.waitForTimeout(5300);
    await p.click(PO);
    return dlg;
  };
  // 1. Administratori s'e sheh
  {
    const p = await faqe('uA', 'mendurberisha@stoku-app.local', false);
    await hapLlogarine(p, false);
    ok(await p.evaluate(() => document.getElementById('llFshiKarta').hidden && document.getElementById('llFshiTitulli').hidden), '1. administratori s\'e ka "Fshi llogarinë"');
    await p.context().close();
  }
  // 2. Telefoni: anëtari besa; një pajisje tjetër e saj e hapur
  {
    const tjetra = await faqe('uB', 'besa@stoku-app.local', true);
    const p = await faqe('uB', 'besa@stoku-app.local', false);
    await hapLlogarine(p, false);
    ok(await p.evaluate(() => !document.getElementById('llFshiKarta').hidden && /s'kthehet mbrapa/.test(document.getElementById('llFshiKarta').textContent)), '2. karta "Fshi llogarinë" duket');
    await p.evaluate(() => document.getElementById('llFshiBtn').click()); await p.waitForTimeout(200);
    ok(await p.evaluate(() => /Shkruaj fjalëkalimin/.test(document.getElementById('llFshiGabim').textContent) && !document.getElementById('dlgKonfirmo').classList.contains('hapur')), '2. pa fjalëkalim: kërkon fjalëkalimin');
    const d1 = await fshi(p, 'gabim');
    ok(d1.hapur && d1.t === 'Të fshihet llogaria?' && d1.po, '2. pyet para (butoni pret 5 sekonda)', d1);
    ok(await prit(() => p.evaluate(() => /Fjalëkalimi s'është i saktë/.test(document.getElementById('llFshiGabim').textContent))) && S.has('perdoruesit/uB') && !S.has('ekipa_fshire/uB'), '2. fjalëkalim i gabuar: s\'fshihet asgjë');
    await fshi(p, 'sakte1');
    ok(await prit(() => S.has('ekipa_fshire/uB')), '2. shënimi ekipa_fshire');
    const f = S.get('ekipa_fshire/uB');
    ok(f && f.fshireNga === 'vete' && f.emri === 'besa', '2. shënimi: vete, besa', f);
    ok(await prit(() => !S.has('perdoruesit/uB') && !S.has('lejet/uB') && !S.has('grupet/g1/anetaret/uB') && !S.has('kujtesa_pritje/uB') && !S.has('grupet/g1/afatet/uB')), '2. profili, lejet, anëtarësia, afatet u fshinë',
      ['perdoruesit/uB', 'lejet/uB', 'grupet/g1/anetaret/uB', 'kujtesa_pritje/uB', 'grupet/g1/afatet/uB'].filter(x => S.has(x)));
    ok(await prit(() => ![...S.keys()].some(k => k.indexOf('dyqane/uB') === 0)), '2. dyqani (me pjesët) u fshi', [[...S.keys()].filter(k => k.indexOf('dyqane/uB') === 0), F.S.shkrime.filter(x => /dyqane\/uB/.test(x.path)), F.S.refuzime.filter(x => /dyqane\/uB/.test(x.path))]);
    ok(S.has('grupet/g1/anetaret/uA') && S.has('grupet/g1') && S.has('perdoruesit/uA'), '2. grupi dhe administratori s\'preken');
    ok(await prit(() => p.evaluate(() => window.__fshiraVeten === undefined && /Llogaria jote u fshi/.test(document.body.innerText))), '2. faqja rinis te hyrja: "Llogaria jote u fshi."');
    ok(await p.evaluate(() => localStorage.getItem('stoku:pronari-uid') !== 'uB' && !/uB/.test(localStorage.getItem('stoku:porta:hyrja') || '')), '2. të dhënat lokale të llogarisë u hoqën');
    ok(await prit(() => tjetra.evaluate(() => /Llogaria jote u fshi/.test(document.body.innerText))), '2. pajisja tjetër (PC) del vetë me "Llogaria jote u fshi."');
    ok(!p.__gab.length && !tjetra.__gab.length, '2. pa gabime JS', p.__gab.concat(tjetra.__gab));
    await p.context().close(); await tjetra.context().close();
  }
  // 3. PC: cima (pa grup)
  {
    const p = await faqe('uC', 'cima@stoku-app.local', true);
    await hapLlogarine(p, true);
    ok(await p.evaluate(() => !document.getElementById('llFshiKarta').hidden), '3. PC: karta duket');
    await fshi(p, 'sakte1', true);
    ok(await prit(() => S.has('ekipa_fshire/uC') && !S.has('perdoruesit/uC')), '3. PC: llogaria u fshi');
    ok(await prit(() => p.evaluate(() => /Llogaria jote u fshi/.test(document.body.innerText))), '3. PC: hyrja me mesazhin');
    ok(!p.__gab.length, '3. PC: pa gabime JS', p.__gab);
    await p.context().close();
  }
  await b.close();
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();
