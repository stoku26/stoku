// v345: kufijtë e madhësisë te aktiviteti (feed), njoftimet dhe pajisjet e push-it, kundër emulatorit të vërtetë (bash teste/emu/nis.sh)
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';
import { createRequire } from 'node:module';
const req = createRequire(import.meta.url);
const { rregullat } = req('./rregullat.js');
const env = await initializeTestEnvironment({ projectId: 'stoku-k345-' + Date.now(), firestore: { host: '127.0.0.1', port: 8089, rules: rregullat() } });
let gab = 0; const ok = (k, m) => { if (!k) gab++; console.log((k ? 'OK    ' : 'GABIM ') + m); };
const db = (u, em) => env.authenticatedContext(u, { email: em + '@stoku-app.local' }).firestore();
const D = db('u1', 'drini'), B = db('u2', 'besa');
const leje = p => p.then(() => true, () => false);
await env.withSecurityRulesDisabled(async c => {
  const f = c.firestore();
  await setDoc(doc(f, 'grupet/g1'), { emri: 'Grupi', pronarUid: 'u1', pronarEmri: 'drini', krijuarSe: 1 });
  await setDoc(doc(f, 'grupet/g1/anetaret/u1'), { emri: 'drini', roli: 'pronar' });
  await setDoc(doc(f, 'grupet/g1/anetaret/u2'), { emri: 'besa', roli: 'anetar' });
});
const t = Date.now();
const produktet = n => Array.from({ length: n }, (_, i) => ({ produkti: 'Produkt ' + i, barkodi: '3900' + i, data: '2026-12-01' }));
// Si aplikacioni (kerkoHeqjen): 30 produkte, shënim 300 shkronja
const kerkese = o => Object.assign({ lloji: 'kerkese-heqje', uid: 'u1', emri: 'drini', koha: t, produkti: 'Produkt 0', barkodi: '39000', produktet: produktet(30), shenim: 'x'.repeat(300), perUid: 'u2', perEmri: 'besa' }, o || {});
ok(await leje(addDoc(collection(D, 'grupet/g1/feed'), kerkese())), 'aktiviteti: kërkesa si në aplikacion (30 produkte, shënim 300) lejohet');
ok(!(await leje(addDoc(collection(D, 'grupet/g1/feed'), kerkese({ produktet: produktet(101) })))), 'aktiviteti: 101 produkte ndalohen');
ok(!(await leje(addDoc(collection(D, 'grupet/g1/feed'), kerkese({ shenim: 'x'.repeat(1001) })))), 'aktiviteti: shënim mbi 1000 shkronja ndalohet');
const shume = {}; for (let i = 0; i < 70; i++) shume['f' + i] = i;
ok(!(await leje(addDoc(collection(D, 'grupet/g1/feed'), kerkese(shume)))), 'aktiviteti: mbi 60 fusha ndalohen');
// Njoftimi personal te kolegu (si aplikacioni)
const nj = o => Object.assign({ lloji: 'kerkese-heqje', produktet: produktet(30), shenim: 'y'.repeat(300), perKrejt: false, grupi: 'g1', uid: 'u1', emri: 'drini', koha: t, lexuar: false }, o || {});
ok(await leje(addDoc(collection(D, 'perdoruesit/u2/njoftimet'), nj())), 'njoftimi: si në aplikacion lejohet');
ok(!(await leje(addDoc(collection(D, 'perdoruesit/u2/njoftimet'), nj({ produktet: produktet(150) })))), 'njoftimi: 150 produkte ndalohen');
// Pajisjet e push-it
const pj = o => Object.assign({ uid: 'u2', emri: 'besa', platforma: 'tel', koha: t, endpoint: 'https://fcm.googleapis.com/fcm/send/' + 'a'.repeat(160), p256dh: 'p', auth: 'a' }, o || {});
ok(await leje(setDoc(doc(B, 'grupet/g1/push/u2_abc123'), pj())), 'push: pajisja si në aplikacion lejohet');
ok(!(await leje(setDoc(doc(B, 'grupet/g1/push/u2_abc124'), pj({ endpoint: 'https://x.test/' + 'a'.repeat(1100) })))), 'push: endpoint mbi 1000 shkronja ndalohet');
ok(!(await leje(setDoc(doc(B, 'grupet/g1/push/u2_abc125'), pj(shume)))), 'push: mbi 30 fusha ndalohen');
await env.cleanup();
console.log(gab ? 'GABIME: ' + gab : 'KREJT OK');
process.exit(gab ? 1 : 0);
