// v319 kundër emulatorit të vërtetë (bash teste/emu/nis.sh): rregulli i ri perdoruesit/{uid}/pajisjet/{p} nga SHENIME.md
// + pajisjet.js me SDK-në e vërtetë (shkruan veten, lista, shkëputja nga një pajisje tjetër e nxjerr tjetrën).
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, getDocs, setDoc, deleteDoc, collection, onSnapshot } from 'firebase/firestore';
import { createRequire } from 'node:module';
const req = createRequire(import.meta.url);
globalThis.localStorage = { _m: {}, getItem(k) { return k in this._m ? this._m[k] : null; }, setItem(k, v) { this._m[k] = String(v); }, removeItem(k) { delete this._m[k]; } };
const P = req('../../pajisjet.js');
const { rregullat } = req('./rregullat.js');
const env = await initializeTestEnvironment({ projectId: 'stoku-p319-' + Date.now(), firestore: { host: '127.0.0.1', port: 8089, rules: rregullat() } });
const prit = ms => new Promise(r => setTimeout(r, ms));
let gab = 0; const ok = (k, m, x) => { if (!k) gab++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const db = u => env.authenticatedContext(u, { email: u + '@stoku-app.local' }).firestore();
const lejohet = p => p.then(() => true, () => false);
await env.withSecurityRulesDisabled(async c => { await setDoc(doc(c.firestore(), 'perdoruesit/uA'), { perdoruesi: 'agim', kycurSe: 1 }); await setDoc(doc(c.firestore(), 'perdoruesit/uB'), { perdoruesi: 'besa', kycurSe: 1 }); });
const d1 = { emri: 'Chrome në Android', lloji: 'tel', krijuarSe: 1, paraSe: 1, v: '1.65.0' };
ok(await lejohet(setDoc(doc(db('uA'), 'perdoruesit/uA/pajisjet/p1'), d1)), '1. vetë llogaria e shkruan pajisjen e vet');
ok(await lejohet(getDocs(collection(db('uA'), 'perdoruesit/uA/pajisjet'))), '1. vetë llogaria e lexon listën');
ok(!(await lejohet(getDocs(collection(db('uB'), 'perdoruesit/uA/pajisjet')))), '2. tjetri s\'e lexon listën');
ok(!(await lejohet(setDoc(doc(db('uB'), 'perdoruesit/uA/pajisjet/p9'), d1))), '2. tjetri s\'shkruan');
ok(!(await lejohet(deleteDoc(doc(db('uB'), 'perdoruesit/uA/pajisjet/p1')))), '2. tjetri s\'fshin');
ok(!(await lejohet(setDoc(doc(db('uA'), 'perdoruesit/uA/pajisjet/p2'), { ...d1, x: 1 }))), '3. fushë e panjohur ndalohet');
ok(!(await lejohet(setDoc(doc(db('uA'), 'perdoruesit/uA/pajisjet/p2'), { ...d1, emri: 'x'.repeat(81) }))), '3. emër > 80 ndalohet');
ok(!(await lejohet(getDoc(doc(env.unauthenticatedContext().firestore(), 'perdoruesit/uA/pajisjet/p1')))), '3. pa hyrje: asgjë');
// pajisjet.js: dy pajisje të së njëjtës llogari
const fsx = { doc, collection, setDoc, deleteDoc, onSnapshot };
localStorage._m = {}; const a = P.krijo(fsx, db('uA'), () => 'uA', 'tel', '1.65.0');
localStorage._m = {}; const b = P.krijo(fsx, db('uA'), () => 'uA', 'pc', '1.65.0');
let dalur = false; b.kurShkeputet(() => { dalur = true; });
a.nis(); b.nis(); await prit(1500);
let lista = []; const ndal = a.degjoListen(l => { lista = l; }); await prit(1000);
ok(lista.length === 3 && lista[0].kjo, '4. lista: 3 pajisje (p1 + dy të rejat), kjo e para', lista.map(x => x.lloji));
const r = await a.shkeput(b.id); await prit(1500);
ok(r.ok && dalur, '4. "Shkëput" nga pajisja tjetër: ajo del vetë', { r, dalur });
await a.fshiVeten(); await prit(800);
ok(lista.length === 1, '4. "Dil" e heq veten nga lista', lista.length);
ndal(); b.ndal();
await env.cleanup();
console.log(gab ? '\nGABIME: ' + gab : '\nKREJT OK'); process.exit(gab ? 1 : 0);
