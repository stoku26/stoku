// v243 kundër emulatorit të vërtetë të Firestore (bash teste/emu/nis.sh), me ekipa.js dhe rregullat nga SHENIME.md:
// rregulla e re "allow list" te grupet (vetëm pronari, vetëm grupet e veta), grupi i vjetër pa listë publike, treguesit e
// humbur (pronari rikthehet vetë, anëtari me "Kërko të hysh"), rifreskimet e dyfishta.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, getDocs, setDoc, addDoc, deleteDoc, collection, query, where, orderBy, limit, onSnapshot, writeBatch } from 'firebase/firestore';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const req = createRequire(import.meta.url);
globalThis.localStorage = { _m: {}, getItem(k) { return k in this._m ? this._m[k] : null; }, setItem(k, v) { this._m[k] = String(v); }, removeItem(k) { delete this._m[k]; } };
const EK = req('../../ekipa.js');
const { rregullat } = req('./rregullat.js');
const env = await initializeTestEnvironment({ projectId: 'stoku-g243-' + Date.now(), firestore: { host: '127.0.0.1', port: 8089, rules: process.env.RREGULLAT ? fs.readFileSync(process.env.RREGULLAT, 'utf8') : rregullat() } });
const FS = { doc, getDoc, getDocs, setDoc, addDoc, deleteDoc, collection, query, where, orderBy, limit, onSnapshot, writeBatch };
const prit = ms => new Promise(r => setTimeout(r, ms));
let gab = 0; const ok = (k, m, x) => { if (!k) gab++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
function cloud(uid, emri) {
  const db = env.authenticatedContext(uid, { email: emri + '@stoku-app.local' }).firestore();
  return EK.krijoCloud(FS, db, { currentUser: { uid, email: emri + '@stoku-app.local' } }, 'tel');
}
const lexo = async p => { let r; await env.withSecurityRulesDisabled(async c => { const s = await getDoc(doc(c.firestore(), p)); r = s.exists() ? s.data() : null; }); return r; };
// 0. Rregulla e re: pronari i liston vetëm grupet e veta; askush tjetër
await env.withSecurityRulesDisabled(async c => {
  const d = c.firestore();
  await setDoc(doc(d, 'grupet/gZ'), { emri: 'Tjetri', pronarUid: 'u9', pronarEmri: 'zana', krijuarSe: 1 });
  await setDoc(doc(d, 'grupet/gZ/anetaret/u9'), { emri: 'zana', roli: 'pronar' });
});
const dbU = (u, em) => env.authenticatedContext(u, { email: em + '@stoku-app.local' }).firestore();
const lejohet = p => p.then(() => true, () => false);
ok(await lejohet(getDocs(query(collection(dbU('u9', 'zana'), 'grupet'), where('pronarUid', '==', 'u9')))), '0. pronari: grupet where pronarUid == uid lejohet');
ok(!(await lejohet(getDocs(query(collection(dbU('u2', 'testmorina'), 'grupet'), where('pronarUid', '==', 'u9'))))), '0. tjetri: grupet e pronarit tjetër ndalohen');
ok(!(await lejohet(getDocs(collection(dbU('u9', 'zana'), 'grupet')))), '0. lista pa filtër ndalohet (edhe për pronarin)');
ok(!(await lejohet(getDoc(doc(dbU('u2', 'testmorina'), 'grupet/gZ')))), '0. tjetri s\'e lexon grupin');
// Gjendja pas gabimit të vjetër: grupi "Albi Market 34" (pa grupet_publike), pronari dhe anëtari me treguesin ''
await env.withSecurityRulesDisabled(async c => {
  const d = c.firestore();
  await setDoc(doc(d, 'perdoruesit/u1'), { perdoruesi: 'albi', kycurSe: 1, grupi: '' });
  await setDoc(doc(d, 'perdoruesit/u2'), { perdoruesi: 'testmorina', kycurSe: 1, grupi: '' });
  await setDoc(doc(d, 'grupet/gA'), { emri: 'Albi Market 34', pronarUid: 'u1', pronarEmri: 'albi', krijuarSe: 1 });
  await setDoc(doc(d, 'grupet/gA/anetaret/u1'), { emri: 'albi', roli: 'pronar', uid: 'u1', hyriSe: 1 });
  await setDoc(doc(d, 'grupet/gA/anetaret/u2'), { emri: 'testmorina', roli: 'anetar', uid: 'u2', hyriSe: 2 });
});
// 1. Anëtari kërkon para se pronari ta hapë aplikacionin: grupi s'është te lista
const e2 = cloud('u2', 'testmorina');
let l = await e2.listaEGrupeve();
ok(l.ok && !l.lista.some(x => x.id === 'gA'), '1. para pronarit: grupi s\'është te lista publike (arsyeja e "S\'u gjet")', l);
// 2. Pronari hap aplikacionin (v243): rikthehet nga pronarUid
const e1 = cloud('u1', 'albi');
const gj1 = [];
const ndal1 = e1.degjoGrupin(r => gj1.push(r.gjendja + ':' + (r.grupi || '')));
await setDoc(doc(env.authenticatedContext('u1', { email: 'albi@stoku-app.local' }).firestore(), 'perdoruesit/u1'), { perdoruesi: 'albi', kycurSe: 2 }, { merge: true }).catch(() => {});
await prit(3000);
ok((await lexo('perdoruesit/u1')).grupi === 'gA' && gj1[gj1.length - 1] === 'anetar:gA', '2. pronari rikthehet te "Albi Market 34"', [await lexo('perdoruesit/u1'), gj1]);
// pronari publikon grupin (siguroGrupinPublik e bën kontrolluesi; këtu direkt)
const pb = await e1.publikoGrupin('gA', 'Albi Market 34');
ok(pb.ok && !!(await lexo('grupet_publike/gA')), '3. grupi del te lista publike', pb);
// 4. Anëtari: tash e gjen dhe "Kërko të hysh" e kthen menjëherë
l = await e2.listaEGrupeve();
ok(l.ok && l.lista.some(x => x.id === 'gA'), '4. anëtari e gjen grupin', l.lista);
const gj2 = [];
const ndal2 = e2.degjoGrupin(r => gj2.push(r.gjendja + ':' + (r.grupi || '')));
await prit(2000);
const r = await e2.dergoKerkesen({ id: 'gA', emri: 'Albi Market 34' });
await prit(2000);
ok(r.ok && r.rikthyer && (await lexo('perdoruesit/u2')).grupi === 'gA' && gj2[gj2.length - 1] === 'anetar:gA', '5. anëtari kthehet menjëherë (pa kërkesë)', [r, gj2]);
ok(!(await lexo('kerkesat_grupi/gA_u2')), '5. asnjë kërkesë e shkruar');
// 6. Rifreskim i dyfishtë: mbeten në grup
ndal1(); ndal2();
for (const [u, em] of [['u1', 'albi'], ['u2', 'testmorina']]) for (let i = 0; i < 2; i++) {
  const e = cloud(u, em); const gj = [];
  const nd = e.degjoGrupin(x => gj.push(x.gjendja + ':' + (x.grupi || '')));
  await setDoc(doc(env.authenticatedContext(u, { email: em + '@stoku-app.local' }).firestore(), 'perdoruesit/' + u), { perdoruesi: em, kycurSe: Date.now() }, { merge: true });
  await prit(2000);
  ok((await lexo('perdoruesit/' + u)).grupi === 'gA' && !gj.includes('pa-grup:'), '6. ' + em + ' rifreskimi ' + (i + 1) + ': mbetet në grup', gj);
  nd();
}
await env.cleanup();
console.log(gab ? 'GABIME: ' + gab : 'Krejt në rregull');
process.exit(gab ? 1 : 0);
