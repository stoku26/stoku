// v246: dalja nga grupi me faqet e vërteta + SDK-në e vërtetë + emulatorët (bash teste/emu/nis.sh; serveri në 8765).
// A. i vetmi anëtar (pronari) del → grupi fshihet komplet, mbetet pa grup edhe pas rifreskimit
// B. anëtari del → s'kthehet në grup (as menjëherë, as pas rifreskimit), pronari e sheh pa të
// C. pronari del kur ka të tjerë → del (admin bëhet kolegu më i vjetër, që merr njoftim), s'kthehet pas rifreskimit
// D. i fundit (admini i ri) del → grupi fshihet komplet
const E = require('./e2e.js');
const FS_URL = E.FS_URL;
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const prit = (fn, ms = 15000) => new Promise(async z => { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { if (await fn()) return z(true); } catch (e) {} await new Promise(r => setTimeout(r, 300)); } z(false); });
const mbyllDialoget = p => p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => { if (!d.classList.contains('faqe-e-plote')) d.classList.remove('hapur'); }));
async function grupiTel(p) { await mbyllDialoget(p); if (!(await p.evaluate(() => document.getElementById('dlgEkipi').classList.contains('hapur')))) await p.click('#btnEkipi'); await p.waitForTimeout(1500); }
async function kolegetTel(p) { await grupiTel(p); await p.click('#ekMenu [data-n="anetaret"]').catch(() => {}); await p.waitForTimeout(1200); }
async function largohu(p) {
  await kolegetTel(p);
  if (!(await p.isVisible('#ekLargohu'))) return 'pa-buton';
  await p.click('#ekLargohu'); await p.waitForTimeout(400);
  const t = await p.evaluate(() => document.getElementById('dlgKonfirmo') && document.getElementById('dlgKonfirmo').classList.contains('hapur') ? document.getElementById('konfTekst').textContent : '');
  if (t) { await p.click('#konfPo'); }
  await p.waitForTimeout(3000);
  return t || ('toast: ' + await p.textContent('#toast'));
}
const paGrup = p => p.isVisible('#ekGrupiKrijo');
(async () => {
  await E.vendosRregullat(); await E.pastro();
  const b = await E.nisChromium();
  const { p: a } = await E.faqe(b, false, 'albi');
  await E.regjistrohu(a, 'albi34', false);
  const uA = (await E.lista('perdoruesit'))[0].id;
  // ---------- A ----------
  await grupiTel(a);
  await a.fill('#ekGrupiEmri', 'Dalja A'); await a.click('#ekGrupiKrijo');
  ok(await prit(async () => (await E.lista('grupet')).length === 1), 'A. grupi u krijua');
  const gA = (await E.lista('grupet'))[0].id;
  await a.reload(); await a.waitForTimeout(5000);
  const tA = await largohu(a);
  ok(/fshihet komplet/.test(tA), 'A. konfirmimi: "je i fundit, grupi fshihet komplet"', tA);
  ok(await prit(async () => !(await E.lexo('grupet/' + gA)) && !(await E.lexo('grupet_publike/' + gA)) && !(await E.lexo('grupet/' + gA + '/anetaret/' + uA))), 'A. grupi, lista publike dhe anëtarësia u fshinë');
  ok(await prit(async () => (await E.lexo('perdoruesit/' + uA)).grupi === '' && await paGrup(a)), 'A. pa grup menjëherë');
  await a.waitForTimeout(3000);
  ok((await E.lexo('perdoruesit/' + uA)).grupi === '' && await paGrup(a), 'A. s\'kthehet në grup (3 s më vonë)', (await E.lexo('perdoruesit/' + uA)));
  await a.reload(); await a.waitForTimeout(6000); await grupiTel(a);
  ok((await E.lexo('perdoruesit/' + uA)).grupi === '' && await paGrup(a), 'A. pas rifreskimit: pa grup');
  // ---------- B ----------
  await a.fill('#ekGrupiEmri', 'Dalja B'); await a.click('#ekGrupiKrijo');
  ok(await prit(async () => (await E.lista('grupet')).length === 1), 'B. grupi i ri');
  const gB = (await E.lista('grupet'))[0].id;
  const { p: t } = await E.faqe(b, false, 'besa');
  await E.regjistrohu(t, 'besa77', false);
  const uT = (await E.lista('perdoruesit')).find(x => x.f.perdoruesi === 'besa77').id;
  await grupiTel(t);
  await t.fill('#ekGrupiKerko', 'dalja b');
  ok(await prit(async () => /Dalja B/.test(await t.textContent('#ekGrupiRezultatet'))), 'B. besa e gjen grupin');
  await t.click('#ekGrupiRezultatet .ek-ftesa .btn');
  await kolegetTel(a);
  ok(await prit(async () => /besa77/.test(await a.textContent('#ekipiLista'))), 'B. albi e sheh kërkesën');
  await a.evaluate(() => [...document.querySelectorAll('#ekipiLista .ek-kerkesa-grupi')][0].querySelector('.btn:not(.tekst)').click());
  ok(await prit(async () => !!(await E.lexo('grupet/' + gB + '/anetaret/' + uT)) && (await E.lexo('perdoruesit/' + uT)).grupi === gB, 20000), 'B. besa hyri në grup');
  await t.reload(); await t.waitForTimeout(5000);
  const tB = await largohu(t);
  ok(/S'do t'i shohësh më kolegët/.test(tB), 'B. besa: konfirmimi i largimit', tB);
  ok(await prit(async () => !(await E.lexo('grupet/' + gB + '/anetaret/' + uT)) && (await E.lexo('perdoruesit/' + uT)).grupi === ''), 'B. besa: anëtarësia u hoq, treguesi bosh');
  await t.waitForTimeout(4000);
  ok((await E.lexo('perdoruesit/' + uT)).grupi === '' && !(await E.lexo('grupet/' + gB + '/anetaret/' + uT)) && await paGrup(t), 'B. besa s\'kthehet në grup (4 s më vonë)', [await E.lexo('perdoruesit/' + uT), await t.textContent('#toast')]);
  await t.reload(); await t.waitForTimeout(6000); await grupiTel(t);
  ok((await E.lexo('perdoruesit/' + uT)).grupi === '' && await paGrup(t), 'B. besa pas rifreskimit: pa grup', await E.lexo('perdoruesit/' + uT));
  ok(!!(await E.lexo('grupet/' + gB)), 'B. grupi mbetet (albi është ende aty)');
  // ---------- C: pronari del kur ka edhe një anëtar ----------
  await grupiTel(t);
  await t.fill('#ekGrupiKerko', 'dalja b'); await t.waitForTimeout(1500);
  await t.click('#ekGrupiRezultatet .ek-ftesa .btn');
  await kolegetTel(a);
  ok(await prit(async () => /besa77/.test(await a.textContent('#ekipiLista'))), 'C. kërkesa e re e besës');
  await a.evaluate(() => [...document.querySelectorAll('#ekipiLista .ek-kerkesa-grupi')][0].querySelector('.btn:not(.tekst)').click());
  ok(await prit(async () => (await E.lexo('perdoruesit/' + uT)).grupi === gB, 20000), 'C. besa sërish në grup');
  await a.reload(); await a.waitForTimeout(5000);
  const tC = await largohu(a);
  console.log('      C. albi largohet (pronar, me besën në grup):', tC);
  ok(await prit(async () => (await E.lexo('perdoruesit/' + uA)).grupi === '' && !(await E.lexo('grupet/' + gB + '/anetaret/' + uA))), 'C. albi doli', [await E.lexo('perdoruesit/' + uA), await a.textContent('#toast')]);
  await a.waitForTimeout(4000);
  ok((await E.lexo('perdoruesit/' + uA)).grupi === '' && await paGrup(a), 'C. albi s\'kthehet (4 s më vonë)');
  await a.reload(); await a.waitForTimeout(6000); await grupiTel(a);
  ok((await E.lexo('perdoruesit/' + uA)).grupi === '' && await paGrup(a), 'C. albi pas rifreskimit: pa grup', await E.lexo('perdoruesit/' + uA));
  const mb = await E.lexo('grupet/' + gB + '/anetaret/' + uT);
  ok(!!mb && mb.roli === 'pronar', 'C. besa u bë admin e grupit', mb);
  const nj = await E.lista('perdoruesit/' + uT + '/njoftimet');
  ok(nj.some(x => x.f.lloji === 'admin-i-ri' && x.f.emri === 'albi34'), 'C. besa mori njoftimin "tash ti je admini i grupit"', nj.map(x => x.f.lloji));
  await kolegetTel(t);
  ok(await prit(async () => await t.evaluate(() => !!window.ekK || true) && /Albi|albi34/i.test(await t.textContent('#ekipiLista')) === false), 'C. besa: albi s\'është më te kolegët');
  // ---------- D: besa (tash admin dhe e fundit) del → grupi fshihet komplet ----------
  await t.reload(); await t.waitForTimeout(5000);
  const tD = await largohu(t);
  ok(/fshihet komplet/.test(tD), 'D. besa (e fundit): "grupi fshihet komplet"', tD);
  ok(await prit(async () => !(await E.lexo('grupet/' + gB)) && !(await E.lexo('grupet_publike/' + gB)) && (await E.lista('grupet/' + gB + '/anetaret')).length === 0), 'D. grupi, lista publike dhe anëtarët u fshinë');
  await t.reload(); await t.waitForTimeout(6000); await grupiTel(t);
  ok((await E.lexo('perdoruesit/' + uT)).grupi === '' && await paGrup(t), 'D. besa pas rifreskimit: pa grup');
  console.log('gabime JS:', a.__gab, t.__gab);
  await b.close();
  console.log(g ? 'GABIME: ' + g : 'Krejt në rregull');
  process.exit(g ? 1 : 0);
})();
