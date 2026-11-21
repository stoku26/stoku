// v351 (Google Play): përdoruesi e fshin VETË llogarinë (ekipa.js fshijLlogarineTime) kundër emulatorit të vërtetë me rregullat
// nga SHENIME.md (bash teste/emu/nis.sh). Anëtar, admin i grupit me kolegë, i vetmi në grup, administratori, të huajt.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, getDocs, setDoc, addDoc, deleteDoc, collection, query, where, orderBy, limit, onSnapshot, writeBatch } from 'firebase/firestore';
import { createRequire } from 'node:module';
const req = createRequire(import.meta.url);
globalThis.localStorage = { _m: {}, getItem(k) { return k in this._m ? this._m[k] : null; }, setItem(k, v) { this._m[k] = String(v); }, removeItem(k) { delete this._m[k]; } };
const EK = req('../../ekipa.js');
const { rregullat } = req('./rregullat.js');
const env = await initializeTestEnvironment({ projectId: 'stoku-f351-' + Date.now(), firestore: { host: '127.0.0.1', port: 8089, rules: rregullat() } });
// fetch-i i Worker-it zëvendësohet PAS ngarkimit të rregullave (emulatori i merr me fetch)
const fetchV = globalThis.fetch, thirrjet = [];
globalThis.fetch = async (u, o) => { if (!String(u).includes('workers.dev') && !String(u).includes('stoku')) return fetchV(u, o); thirrjet.push([u, o && o.body]); return { ok: true, status: 200, json: async () => ({ ok: true }) }; };
const FS = { doc, getDoc, getDocs, setDoc, addDoc, deleteDoc, collection, query, where, orderBy, limit, onSnapshot, writeBatch };
let gab = 0; const ok = (k, m, x) => { if (!k) gab++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const dbU = (u, em) => env.authenticatedContext(u, { email: em + '@stoku-app.local' }).firestore();
const cloud = (u, em) => EK.krijoCloud(FS, dbU(u, em), { currentUser: { uid: u, email: em + '@stoku-app.local', getIdToken: async () => 't' } }, 'tel');
const lexo = async p => { let r; await env.withSecurityRulesDisabled(async c => { const s = await getDoc(doc(c.firestore(), p)); r = s.exists() ? s.data() : null; }); return r; };
const sa = async p => { let n; await env.withSecurityRulesDisabled(async c => { n = (await getDocs(collection(c.firestore(), p))).size; }); return n; };
const lejohet = p => p.then(() => true, () => false);
const ADM = EK.ADMIN_UID;
await env.withSecurityRulesDisabled(async c => {
  const d = c.firestore(), s = (p, v) => setDoc(doc(d, p), v);
  // g1: u1 admin, u2 anëtar, u3 anëtar
  await s('grupet/g1', { emri: 'Market 1', pronarUid: 'u1', pronarEmri: 'arta', krijuarSe: 1 });
  await s('grupet_publike/g1', { emri: 'Market 1', pronarEmri: 'arta', ndryshuarSe: 1 });
  await s('grupet/g1/anetaret/u1', { emri: 'arta', roli: 'pronar', hyriSe: 1 });
  await s('grupet/g1/anetaret/u2', { emri: 'besa', roli: 'anetar', hyriSe: 2 });
  await s('grupet/g1/anetaret/u3', { emri: 'cima', roli: 'anetar', hyriSe: 3 });
  for (const [u, em] of [['u1', 'arta'], ['u2', 'besa'], ['u3', 'cima']]) {
    await s('perdoruesit/' + u, { perdoruesi: em, kycurSe: 1, grupi: 'g1' });
    await s('emrat/' + em, { uid: u, ndryshuarSe: 1 });
  }
  await s('dyqane/u2', { pronari: 'u2', v: 1 }); await s('dyqane/u2/pjeset/p0', { x: 1 }); await s('dyqane/u2/fletet/f1', { x: 1 });
  await s('dyqane/u2/skedaret/s1', { emri: 'a.xlsx' }); await s('dyqane/u2/skedaret/s1/pjeset/0', { i: 0 });
  await s('perdoruesit/u2/njoftimet/n1', { uid: 'u1', emri: 'arta' }); await s('perdoruesit/u2/pajisjet/d1', { emri: 'Telefoni' });
  await s('lejet/u2', { lejet: { grupi: true }, emri: 'besa' }); await s('kujtesa_pritje/u2', { p: {}, emri: 'besa' });
  await s('grupet/g1/afatet/u2', { l: [] }); await s('grupet/g1/malli/u2', { uid: 'u2', p: [] });
  await s('grupet/g1/feed/e1', { uid: 'u2', emri: 'besa', koha: 1 }); await s('grupet/g1/feed/e2', { uid: 'u1', emri: 'arta', koha: 2 });
  await s('grupet/g1/push/u2_abc', { uid: 'u2' }); await s('grupet/g1/push/u1_abc', { uid: 'u1' });
  await s('ftesat/g9_u2', { gid: 'g9', uid: 'u2', perdoruesi: 'besa' }); await s('kerkesat_grupi/g9_u2', { gid: 'g9', uid: 'u2', emri: 'besa' });
  // g4: u4 i vetëm
  await s('grupet/g4', { emri: 'Vetëm', pronarUid: 'u4', pronarEmri: 'dita', krijuarSe: 1 });
  await s('grupet_publike/g4', { emri: 'Vetëm', pronarEmri: 'dita', ndryshuarSe: 1 });
  await s('grupet/g4/anetaret/u4', { emri: 'dita', roli: 'pronar', hyriSe: 1 });
  await s('grupet/g4/feed/e1', { uid: 'u4', emri: 'dita' }); await s('grupet/g4/kujtesa/p0', { p: {} });
  await s('ftesat/g4_u9', { gid: 'g4', uid: 'u9', perdoruesi: 'zana' }); await s('kerkesat_grupi/g4_u8', { gid: 'g4', uid: 'u8', emri: 'tana' });
  await s('perdoruesit/u4', { perdoruesi: 'dita', grupi: 'g4' }); await s('dyqane/u4', { v: 1 });
  await s('perdoruesit/' + ADM, { perdoruesi: 'duli96' });
});
// 0. Të huajt s'mund
ok(!(await lejohet(setDoc(doc(dbU('u3', 'cima'), 'ekipa_fshire/u2'), { emri: 'besa', fshireSe: 1, fshireNga: 'vete' }))), '0. tjetri s\'e shënon llogarinë time si të fshirë');
ok(!(await lejohet(setDoc(doc(dbU('u2', 'besa'), 'ekipa_fshire/u2'), { emri: 'tjeter', fshireSe: 1, fshireNga: 'vete' }))), '0. shënimi vetëm me emrin tim');
ok(!(await lejohet(setDoc(doc(dbU('u2', 'besa'), 'ekipa_fshire/u2'), { emri: 'besa', fshireSe: 1, fshireNga: 'duli96' }))), '0. shënimi vetëm "vete"');
ok(!(await lejohet(deleteDoc(doc(dbU('u3', 'cima'), 'perdoruesit/u2')))) && !(await lejohet(deleteDoc(doc(dbU('u3', 'cima'), 'lejet/u2')))), '0. tjetri s\'e fshin profilin a lejet e mia');
// 1. Administratori s'mund ta fshijë veten
const rA = await cloud(ADM, 'duli96').fshijLlogarineTime();
ok(!rA.ok && !(await lexo('ekipa_fshire/' + ADM)) && !!(await lexo('perdoruesit/' + ADM)), '1. administratori s\'e fshin veten', rA);
// 2. Anëtari u2 fshin veten
const r2 = await cloud('u2', 'besa').fshijLlogarineTime();
ok(r2.ok && r2.mbetur === 0, '2. anëtari: fshirja ok, pa mbetje', r2);
const f = await lexo('ekipa_fshire/u2');
ok(f && f.fshireNga === 'vete' && f.emri === 'besa', '2. shënimi ekipa_fshire (vete)', f);
const ikur = ['dyqane/u2', 'dyqane/u2/pjeset/p0', 'dyqane/u2/fletet/f1', 'dyqane/u2/skedaret/s1', 'dyqane/u2/skedaret/s1/pjeset/0', 'perdoruesit/u2', 'perdoruesit/u2/njoftimet/n1',
  'perdoruesit/u2/pajisjet/d1', 'lejet/u2', 'kujtesa_pritje/u2', 'grupet/g1/anetaret/u2', 'grupet/g1/afatet/u2', 'grupet/g1/malli/u2', 'grupet/g1/feed/e1', 'grupet/g1/push/u2_abc', 'ftesat/g9_u2', 'kerkesat_grupi/g9_u2'];
const mbet = []; for (const p of ikur) if (await lexo(p)) mbet.push(p);
ok(!mbet.length, '2. krejt të dhënat e tij u fshinë', mbet);
ok(!!(await lexo('grupet/g1/feed/e2')) && !!(await lexo('grupet/g1/push/u1_abc')) && (await lexo('grupet/g1/anetaret/u1')).roli === 'pronar' && !!(await lexo('grupet/g1')), '2. grupi dhe kolegët s\'preken');
ok((await lexo('emrat/besa')).uid === 'u2', '2. emri mbetet i rezervuar (emrat/)');
ok(!(await lejohet(setDoc(doc(dbU('u2', 'besa'), 'dyqane/u2'), { v: 2 }))), '2. pas fshirjes s\'shkruan më (edhe nga pajisjet e tjera)');
ok(thirrjet.some(x => /\/admin\/fshi$/.test(x[0]) && JSON.parse(x[1]).uid === 'u2'), '2. Worker: /admin/fshi për veten');
// 3. Admini i grupit me kolegë: admin bëhet më i vjetri (u3)
const r1 = await cloud('u1', 'arta').fshijLlogarineTime();
ok(r1.ok && !(await lexo('grupet/g1/anetaret/u1')) && (await lexo('grupet/g1/anetaret/u3')).roli === 'pronar' && !!(await lexo('grupet/g1')), '3. admini u largua, cima u bë admin, grupi mbetet', r1);
// 4. I vetmi në grup: grupi fshihet krejt
const r4 = await cloud('u4', 'dita').fshijLlogarineTime();
const g4 = []; for (const p of ['grupet/g4', 'grupet_publike/g4', 'grupet/g4/anetaret/u4', 'grupet/g4/feed/e1', 'grupet/g4/kujtesa/p0', 'ftesat/g4_u9', 'kerkesat_grupi/g4_u8', 'dyqane/u4', 'perdoruesit/u4']) if (await lexo(p)) g4.push(p);
ok(r4.ok && !g4.length, '4. i vetmi: grupi dhe krejt të dhënat u fshinë', [r4, g4]);
await env.cleanup();
console.log(gab ? '\n' + gab + ' GABIME' : '\nKREJT OK');
process.exit(gab ? 1 : 0);
