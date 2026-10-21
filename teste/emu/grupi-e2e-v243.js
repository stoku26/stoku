// v243 me faqet e vërteta + SDK-në e vërtetë + emulatorët (bash teste/emu/nis.sh; serveri i testeve në 8765):
// A. grupi i ri mbetet pas rifreskimeve (gabimi që e "fshinte"); B/B2. treguesi i humbur rikthehet (lista publike, pronarUid);
// C. merchandiseri i ri; D. kërkimi + kërkesa + pranimi; F. anëtari pa tregues kthehet me "Kërko të hysh"; E. PC.
const E = require('./e2e.js');
const FS_URL = E.FS_URL;
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const prit = (fn, ms = 15000) => new Promise(async z => { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { if (await fn()) return z(true); } catch (e) {} await new Promise(r => setTimeout(r, 300)); } z(false); });
const mbyllDialoget = p => p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => { if (!d.classList.contains('faqe-e-plote')) d.classList.remove('hapur'); }));
async function grupiTel(p) { await mbyllDialoget(p); if (!(await p.evaluate(() => document.getElementById('dlgEkipi').classList.contains('hapur')))) await p.click('#btnEkipi'); await p.waitForTimeout(1500); }
async function patch(path, fusha, vlera) {
  await fetch(FS_URL + '/' + path + '?updateMask.fieldPaths=' + fusha, { method: 'PATCH', headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: { [fusha]: { stringValue: vlera } } }) });
}
(async () => {
  await E.vendosRregullat(); await E.pastro();
  const b = await E.nisChromium();
  // A. Krijo grupin, rifresko
  const { p: a } = await E.faqe(b, false, 'albi');
  await E.regjistrohu(a, 'albi34', false);
  await grupiTel(a);
  await a.fill('#ekGrupiEmri', 'Albi Market 34'); await a.click('#ekGrupiKrijo');
  ok(await prit(async () => (await E.lista('grupet')).length === 1), 'A. grupi u krijua');
  const gid = (await E.lista('grupet'))[0].id;
  const uA = (await E.lista('perdoruesit'))[0].id;
  for (let i = 0; i < 2; i++) {
    await a.reload(); await a.waitForTimeout(5000); await grupiTel(a);
    ok(!(await a.isVisible('#ekGrupiKrijo')) && (await E.lexo('perdoruesit/' + uA)).grupi === gid, 'A. rifreskimi ' + (i + 1) + ': grupi mbetet (tel)', await a.textContent('#ekipiTitulli'));
  }
  // B. Llogari e prekur nga gabimi i vjetër: treguesi '' dhe pajisja pa kujtesë → rikthehet vetë
  await patch('perdoruesit/' + uA, 'grupi', '');
  await a.evaluate(() => Object.keys(localStorage).filter(k => /stoku:ekipa|stoku:grupi/.test(k)).forEach(k => localStorage.removeItem(k)));
  await a.reload(); await a.waitForTimeout(6000); await grupiTel(a);
  ok(await prit(async () => (await E.lexo('perdoruesit/' + uA)).grupi === gid), 'B. treguesi i humbur rikthehet vetë (admini i grupit, nga lista publike)');
  ok(await prit(async () => !(await a.isVisible('#ekGrupiKrijo'))), 'B. pamja e grupit');
  // B2. Grupi i krijuar para v242 (s'është te lista publike): rikthehet nga pronarUid (rregulla "allow list" e v243)
  await fetch(FS_URL + '/grupet_publike/' + gid, { method: 'DELETE', headers: { Authorization: 'Bearer owner' } });
  await patch('perdoruesit/' + uA, 'grupi', '');
  await a.evaluate(() => Object.keys(localStorage).filter(k => /stoku:ekipa|stoku:grupi/.test(k)).forEach(k => localStorage.removeItem(k)));
  await a.reload(); await a.waitForTimeout(6000); await grupiTel(a);
  ok(await prit(async () => (await E.lexo('perdoruesit/' + uA)).grupi === gid), 'B2. grupi pa listë publike: rikthehet nga pronarUid');
  ok(await prit(async () => !!(await E.lexo('grupet_publike/' + gid))), 'B2. grupi del sërish te lista publike');
  // C. Merchandiseri i ri (tel)
  const { p: t } = await E.faqe(b, false, 'testmorina');
  await E.regjistrohu(t, 'testmorina', false, true);
  const uT = (await E.lista('perdoruesit')).find(x => x.f.perdoruesi === 'testmorina').id;
  ok((await E.lexo('perdoruesit/' + uT)).merchandiser === true, 'C. perdoruesit.merchandiser = true', await E.lexo('perdoruesit/' + uT));
  await mbyllDialoget(t);
  ok(await prit(async () => /Shto marketin/.test(await t.textContent('.sb-home-krye').catch(() => ''))), 'C. kryefaqja: "Shto marketin ku punon"');
  ok(await t.evaluate(() => !document.getElementById('tabMarketet').classList.contains('leja-ndaluar')), 'C. Cilësimet → Marketet');
  await t.evaluate(() => document.getElementById('btnAfatet').click());
  ok(await prit(async () => await t.evaluate(() => document.getElementById('dlgMarketiRi').classList.contains('hapur')), 5000), 'C. Afatet: "Në cilin market je?"');
  await t.screenshot({ path: __dirname + '/e2e-merch.png' });
  await mbyllDialoget(t); await t.evaluate(() => document.getElementById('afPrapa') && document.getElementById('afPrapa').click()); await t.waitForTimeout(500);
  // D. Kërkimi + kërkesa + pranimi, rifreskimi i anëtarit
  await grupiTel(t);
  await t.fill('#ekGrupiKerko', 'albi market 34');
  ok(await prit(async () => /Albi Market 34/.test(await t.textContent('#ekGrupiRezultatet'))), 'D. kërkimi e gjen grupin');
  await t.click('#ekGrupiRezultatet .ek-ftesa .btn');
  ok(await prit(async () => (await E.lista('kerkesat_grupi')).length === 1), 'D. kërkesa u dërgua');
  await grupiTel(a);
  await a.click('#ekMenu [data-n="anetaret"]'); await a.waitForTimeout(1500);
  ok(await prit(async () => /testmorina/.test(await a.textContent('#ekipiLista'))), 'D. admini i grupit e sheh kërkesën');
  await a.evaluate(() => [...document.querySelectorAll('#ekipiLista .ek-kerkesa-grupi')][0].querySelector('.btn:not(.tekst)').click());
  ok(await prit(async () => (await E.lexo('grupet/' + gid + '/anetaret/' + uT)) !== null, 20000), 'D. testmorina hyn vetë në grup');
  await t.reload(); await t.waitForTimeout(6000); await grupiTel(t);
  ok((await E.lexo('perdoruesit/' + uT)).grupi === gid && !(await t.isVisible('#ekGrupiKerko')), 'D. pas rifreskimit testmorina mbetet në grup', await t.textContent('#ekipiTitulli'));
  // F. Anëtari me treguesin e humbur (pajisja pa kujtesë): "Kërko të hysh" e kthen menjëherë
  await patch('perdoruesit/' + uT, 'grupi', '');
  await t.evaluate(() => Object.keys(localStorage).filter(k => /stoku:ekipa|stoku:grupi/.test(k)).forEach(k => localStorage.removeItem(k)));
  await t.reload(); await t.waitForTimeout(6000); await grupiTel(t);
  ok(await prit(async () => await t.isVisible('#ekGrupiKerko')), 'F. anëtari pa tregues: pa grup');
  await t.fill('#ekGrupiKerko', 'ALBI market-34');
  ok(await prit(async () => /Albi Market 34/.test(await t.textContent('#ekGrupiRezultatet'))), 'F. kërkimi e gjen grupin');
  const nK = (await E.lista('kerkesat_grupi')).length;
  await t.click('#ekGrupiRezultatet .ek-ftesa .btn');
  ok(await prit(async () => (await E.lexo('perdoruesit/' + uT)).grupi === gid && !(await t.isVisible('#ekGrupiKerko'))), 'F. u kthye menjëherë në grup', await t.textContent('#ekipiTitulli'));
  ok((await E.lista('kerkesat_grupi')).length === nK, 'F. pa kërkesë të re');
  await t.screenshot({ path: __dirname + '/e2e-rikthyer.png' });
  // E. PC: krijo grupin, rifresko
  const { p: d } = await E.faqe(b, true, 'drini');
  await E.regjistrohu(d, 'drini7', true);
  await d.goto(E.BAZA + '/pc.html#/ekipa'); await d.waitForTimeout(4000);
  await d.fill('#ekGrupiEmri', 'Viva 7'); await d.click('#ekGrupiKrijo');
  ok(await prit(async () => (await E.lista('grupet')).some(x => x.f.emri === 'Viva 7')), 'E. PC: grupi u krijua');
  const uD = (await E.lista('perdoruesit')).find(x => x.f.perdoruesi === 'drini7').id;
  await d.reload(); await d.waitForTimeout(6000);
  ok(!(await d.isVisible('#ekPaGrup')) && /Viva 7/.test((await E.lexo('perdoruesit/' + uD)).grupi ? 'Viva 7' : ''), 'E. PC: pas rifreskimit grupi mbetet');
  console.log('gabime JS:', a.__gab, t.__gab, d.__gab);
  await b.close();
  console.log(g ? 'GABIME: ' + g : 'Krejt në rregull');
  process.exit(g ? 1 : 0);
})();
