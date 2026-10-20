// v163: fjalëkalimi i harruar (/fjalekalimi/kerko, /verifiko, /ndrysho): kodi 6-shifror te administratori (zilja + push),
// i ruajtur vetëm si hash, 30 min, 5 prova, një kërkesë aktive për llogari, ndryshimi me Firebase Auth (llogaria e shërbimit)
import worker from './worker.mjs';
import crypto from 'node:crypto';
let g = 0;
const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK  ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const b64u = b => Buffer.from(b).toString('base64url');
const { privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const SA = JSON.stringify({ client_email: 'sa@stoku-appi.iam.gserviceaccount.com', private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }), project_id: 'stoku-appi' });
const v = crypto.createECDH('prime256v1'); v.generateKeys();
const ua = crypto.createECDH('prime256v1'); ua.generateKeys(); const auth = crypto.randomBytes(16);
const env = { VAPID_PUBLIC: b64u(v.getPublicKey()), VAPID_PRIVATE: b64u(v.getPrivateKey()), VAPID_SUBJECT: 'mailto:t@stoku.site', FCM_SA: SA, FOTO: { async get() { return null; }, async put() {}, async delete() {} } };
const S = s => ({ stringValue: s }), I = n => ({ integerValue: String(n) });

// Firebase Auth (Identity Toolkit) i rremë
const llogarite = { 'agim@stoku-app.local': { localId: 'uA' }, 'mendurberisha@stoku-app.local': { localId: 'uM' },
  'fshire@stoku-app.local': { localId: 'uF' }, 'ndalur@stoku-app.local': { localId: 'uN', disabled: true } };
const ndryshimet = [];
// Firestore i rremë (në memorie): rruga → fields
const FSB = 'https://firestore.googleapis.com/v1/projects/stoku-appi/databases/(default)/documents/';
const db = new Map();
const ver = new Map(); let verN = 0; // updateTime i rremë për çdo dokument (shkrimet me kusht)
db.set('ekipa_fshire/uF', { emri: S('fshire') });
db.set('perdoruesit/uM', { emri: S('mendurberisha'), grupi: S('gM') });
db.set('grupet/gM/push/m1', { uid: S('uM'), fcm: S('fcmTokenIAdministratorit_123456'), platforma: S('tel'), koha: I(1) });
db.set('grupet/gM/push/m2', { uid: S('uM'), endpoint: S('https://push.test/pc-admini'), p256dh: S(b64u(ua.getPublicKey())), auth: S(b64u(auth)), platforma: S('pc'), koha: I(2) });
db.set('grupet/gM/push/k1', { uid: S('uK'), endpoint: S('https://push.test/kolegu'), p256dh: S(b64u(ua.getPublicKey())), auth: S(b64u(auth)), platforma: S('tel'), koha: I(3) });
let fcm = [], webpush = [], oauth = [], pa = null;
globalThis.fetch = async (url, opt = {}) => {
  url = String(url);
  const m = opt.method || 'GET';
  if (url === 'https://oauth2.googleapis.com/token') { oauth.push(decodeURIComponent(String(opt.body)).match(/assertion=([^&]+)/)[1].split('.')[1]); return new Response(JSON.stringify({ access_token: 'AT', expires_in: 3600 })); }
  if (url.startsWith('https://identitytoolkit.googleapis.com/v1/projects/stoku-appi/accounts:')) {
    if ((opt.headers || {}).Authorization !== 'Bearer AT') return new Response('{}', { status: 401 });
    const b = JSON.parse(opt.body);
    if (url.endsWith(':lookup')) { const u = llogarite[b.email[0]]; return new Response(JSON.stringify(u ? { users: [u] } : {})); }
    if (url.endsWith(':update')) {
      if (b.password === 'dobet1') return new Response(JSON.stringify({ error: { message: 'WEAK_PASSWORD : Password should be at least 6 characters' } }), { status: 400 });
      ndryshimet.push(b); return new Response(JSON.stringify({ localId: b.localId }));
    }
  }
  if (url.startsWith(FSB)) {
    const rr = decodeURIComponent(url.slice(FSB.length).split('?')[0]);
    if (m === 'GET' && rr.split('/').length % 2 === 1) { // koleksion
      const docs = [...db.keys()].filter(k => k.startsWith(rr + '/') && k.slice(rr.length + 1).indexOf('/') === -1).map(k => ({ name: 'x/' + k, fields: db.get(k) }));
      return new Response(JSON.stringify({ documents: docs }));
    }
    if (m === 'GET') { await new Promise(z => setTimeout(z, 2)); return db.has(rr) ? new Response(JSON.stringify({ fields: db.get(rr), createTime: new Date().toISOString(), updateTime: ver.get(rr) || 't0' })) : new Response('{}', { status: 404 }); }
    if (m === 'PATCH') {
      await new Promise(z => setTimeout(z, 2));
      const kushti = new URL(url).searchParams.get('currentDocument.updateTime');
      if (kushti !== null && (ver.get(rr) || 't0') !== kushti) return new Response(JSON.stringify({ error: { status: 'FAILED_PRECONDITION' } }), { status: 400 });
      db.set(rr, JSON.parse(opt.body).fields); ver.set(rr, 't' + (++verN)); return new Response(JSON.stringify({ updateTime: ver.get(rr) }));
    }
    if (m === 'DELETE') { db.delete(rr); return new Response('{}'); }
  }
  if (url.startsWith('https://fcm.googleapis.com/')) { fcm.push(JSON.parse(opt.body).message); return new Response('{}'); }
  if (url.startsWith('https://push.test/')) { webpush.push(url.split('/').pop()); return new Response('', { status: 201 }); }
  return new Response('?', { status: 500 });
};
const thirr = async (rruga, trup, e = env, metoda = 'POST') => {
  const r = await worker.fetch(new Request('https://w.test' + rruga, { method: metoda, headers: { Origin: 'https://stoku.site', 'Content-Type': 'application/json' }, body: metoda === 'POST' ? JSON.stringify(trup) : undefined }), e, {});
  let j = null; try { j = await r.json(); } catch (x) { /* bosh */ }
  return [r.status, j, r.headers.get('Access-Control-Allow-Origin')];
};
const njoftimet = () => [...db.keys()].filter(k => k.startsWith('perdoruesit/uM/njoftimet/')).map(k => ({ k, tekst: db.get(k).tekst.stringValue, lloji: db.get(k).lloji.stringValue, lexuar: db.get(k).lexuar.booleanValue }));
const kodiNga = t => (t.match(/Kodi: (\d{6})/) || [])[1];

// 0. shëndeti + CORS
let r0 = await worker.fetch(new Request('https://w.test/', { headers: { Origin: 'https://stoku.site' } }), env, {});
let j0 = await r0.json();
ok(j0.versioni >= 163 && j0.fjalekalimi === true, '0. versioni 163+ (tani ' + j0.versioni + '), fjalekalimi: true', [j0.versioni, j0.fjalekalimi]);
r0 = await worker.fetch(new Request('https://w.test/fjalekalimi/kerko', { method: 'OPTIONS', headers: { Origin: 'https://stoku.site' } }), env, {});
ok(r0.status === 204 && r0.headers.get('Access-Control-Allow-Origin') === 'https://stoku.site', '0b. OPTIONS (preflight) me CORS', r0.status);
let [st, j, cors] = await thirr('/fjalekalimi/kerko', {}, env, 'GET');
ok(st === 405, '0c. GET → 405', st);
[st, j] = await thirr('/fjalekalimi/kerko', { emri: 'agim' }, Object.assign({}, env, { FCM_SA: undefined }));
ok(st === 503 && j.arsye === 'pa-sherbim', '0d. pa FCM_SA → pa-sherbim', [st, j]);

// 1. emra të gabuar / llogari që s'ekzistojnë
[st, j] = await thirr('/fjalekalimi/kerko', { emri: 'a b' });
ok(st === 400 && j.arsye === 'emri', '1. emër i pavlefshëm → 400', [st, j]);
[st, j] = await thirr('/fjalekalimi/kerko', { emri: 'nukka' });
ok(st === 404 && j.arsye === 's-ekziston', '1b. llogari që s\'ekziston', [st, j]);
[st, j] = await thirr('/fjalekalimi/kerko', { emri: 'fshire' });
ok(st === 404 && j.arsye === 's-ekziston', '1c. llogari e fshirë nga administratori', [st, j]);
[st, j] = await thirr('/fjalekalimi/kerko', { emri: 'ndalur' });
ok(st === 404 && j.arsye === 's-ekziston', '1d. llogari e çaktivizuar', [st, j]);
ok(njoftimet().length === 0 && fcm.length === 0 && webpush.length === 0, '1e. asnjë njoftim për këto');

// 2. kërkesa e vërtetë (me shkronja të mëdha)
[st, j, cors] = await thirr('/fjalekalimi/kerko', { emri: '  Agim ' });
ok(st === 200 && j.ok && j.skadon > Date.now() + 29 * 60000 && cors === 'https://stoku.site', '2. kërkesa pranohet (30 min), me CORS', [st, j]);
const doc = db.get('rivendosjet/agim');
let nj = njoftimet(), kodi = nj[0] && kodiNga(nj[0].tekst);
ok(nj.length === 1 && nj[0].lloji === 'fjalekalimi' && !nj[0].lexuar && /^\d{6}$/.test(kodi || '') && /"agim"/.test(nj[0].tekst), '2b. administratorit i vjen njoftimi me kodin 6-shifror', nj);
ok(nj[0] && nj[0].tekst === '"agim" e ka harruar fjalëkalimin. Kodi: ' + kodi + ' (vlen 30 minuta).' && fcm[0] && fcm[0].data.teksti === nj[0].tekst && !/njoh/.test(nj[0].tekst), '2b2. teksti pa "Jepja vetëm pasi ta njohësh personin" (v221)', nj[0] && nj[0].tekst);
ok(doc && doc.uid.stringValue === 'uA' && doc.hash.stringValue.length === 64 && !JSON.stringify(doc).includes(kodi), '2c. kodi ruhet vetëm si hash', Object.keys(doc || {}));
ok(fcm.length === 1 && fcm[0].token === 'fcmTokenIAdministratorit_123456' && fcm[0].data.teksti.includes(kodi) && fcm[0].data.titulli === 'Stoku · Fjalëkalimi', '2d. push te telefoni Android i administratorit', fcm.map(x => x.token));
ok(webpush.length === 1 && webpush[0] === 'pc-admini', '2e. push te kompjuteri i administratorit, jo te kolegët', webpush);
const scope = JSON.parse(Buffer.from(oauth[0], 'base64url').toString()).scope;
ok(scope === 'https://www.googleapis.com/auth/cloud-platform', '2f. tokeni i administrimit (cloud-platform)', scope);

// 3. kërkesa sërish: s'del kod i ri, as njoftim i ri
fcm = []; webpush = [];
[st, j] = await thirr('/fjalekalimi/kerko', { emri: 'agim' });
ok(st === 200 && j.ekziston === true && njoftimet().length === 1 && fcm.length === 0 && webpush.length === 0, '3. kërkesa e dytë: "ekziston", pa njoftim të ri', [st, j]);

// 4. kodet e gabuara: 5 prova
const tjeter = kodi === '000000' ? '111111' : '000000';
[st, j] = await thirr('/fjalekalimi/verifiko', { emri: 'agim', kodi: '12a' });
ok(st === 400 && j.arsye === 'kodi', '4. kod jo 6-shifror → 400 (pa provë)', [st, j]);
let mbetur = [];
for (let i = 0; i < 4; i++) { [st, j] = await thirr('/fjalekalimi/verifiko', { emri: 'agim', kodi: tjeter }); mbetur.push(j.mbetur); }
ok(st === 400 && j.arsye === 'kodi' && mbetur.join() === '4,3,2,1', '4b. kod i gabuar: mbeten 4, 3, 2, 1', mbetur);
[st, j] = await thirr('/fjalekalimi/verifiko', { emri: 'agim', kodi: tjeter });
ok(st === 429 && j.arsye === 'shume-prova' && j.mbetur === 0, '4c. prova e 5-të → shumë prova', [st, j]);
[st, j] = await thirr('/fjalekalimi/verifiko', { emri: 'agim', kodi });
ok(st === 429 && j.arsye === 'shume-prova', '4d. pas 5 provave as kodi i saktë s\'pranohet', [st, j]);
[st, j] = await thirr('/fjalekalimi/kerko', { emri: 'agim' });
ok(st === 429 && j.arsye === 'shume-prova' && njoftimet().length === 1, '4e. kod i ri vetëm pasi të skadojë ky (s\'gjendet dot duke kërkuar pa fund)', [st, j]);

// 5. pasi skadon: kod i ri
const d = db.get('rivendosjet/agim'); d.skadon = I(Date.now() - 1000); db.set('rivendosjet/agim', d);
[st, j] = await thirr('/fjalekalimi/verifiko', { emri: 'agim', kodi });
ok(st === 410 && j.arsye === 'skadoi', '5. kodi i skaduar → skadoi', [st, j]);
fcm = []; webpush = [];
[st, j] = await thirr('/fjalekalimi/kerko', { emri: 'agim' });
nj = njoftimet();
const kodi2 = kodiNga(nj.map(x => x.tekst).find(t => kodiNga(t) && t !== nj[0].tekst) || '');
ok(st === 200 && !j.ekziston && nj.length === 2 && /^\d{6}$/.test(kodi2 || '') && fcm.length === 1, '5b. pas skadimit: kod i ri dhe njoftim i ri', [st, j, nj.length]);
[st, j] = await thirr('/fjalekalimi/verifiko', { emri: 'agim', kodi: kodi2 });
ok(st === 200 && j.ok, '5c. kodi i saktë pranohet', [st, j]);
[st, j] = await thirr('/fjalekalimi/verifiko', { emri: 'agim', kodi: kodi2 });
ok(st === 200 && j.ok, '5d. verifikimi s\'e harxhon kodin', [st, j]);

// 6. fjalëkalimi i ri
[st, j] = await thirr('/fjalekalimi/ndrysho', { emri: 'agim', kodi: kodi2, fjalekalimi: '123' });
ok(st === 400 && j.arsye === 'i-dobet' && ndryshimet.length === 0, '6. më pak se 6 shenja → i-dobet', [st, j]);
[st, j] = await thirr('/fjalekalimi/ndrysho', { emri: 'agim', kodi: kodi2, fjalekalimi: 'dobet1' });
ok(st === 400 && j.arsye === 'i-dobet' && ndryshimet.length === 0, '6b. Firebase: WEAK_PASSWORD → i-dobet', [st, j]);
[st, j] = await thirr('/fjalekalimi/ndrysho', { emri: 'agim', kodi: tjeter, fjalekalimi: 'sekretIRi9' });
ok(st === 400 && j.arsye === 'kodi' && ndryshimet.length === 0, '6c. kod i gabuar te ndryshimi → s\'ndryshon', [st, j]);
fcm = []; webpush = [];
[st, j] = await thirr('/fjalekalimi/ndrysho', { emri: 'agim', kodi: kodi2, fjalekalimi: 'sekretIRi9' });
ok(st === 200 && j.ok && ndryshimet.length === 1 && ndryshimet[0].localId === 'uA' && ndryshimet[0].password === 'sekretIRi9', '6d. fjalëkalimi ndryshohet te Firebase Auth', [st, j, ndryshimet]);
ok(!db.has('rivendosjet/agim'), '6e. kodi fshihet pas përdorimit');
nj = njoftimet();
ok(nj.length === 3 && nj.some(x => /"agim" e vendosi fjalëkalimin e ri/.test(x.tekst)) && fcm.length === 0 && webpush.length === 0, '6f. administratori e sheh që u përdor (te zilja, pa push)', nj.map(x => x.tekst));
[st, j] = await thirr('/fjalekalimi/ndrysho', { emri: 'agim', kodi: kodi2, fjalekalimi: 'tjeter123' });
ok(st === 410 && j.arsye === 'skadoi' && ndryshimet.length === 1, '6g. i njëjti kod s\'vlen dy herë', [st, j]);
// 6h. njoftimi te administratori dështon: kodi s'mbetet (prova e radhës dërgon kod të ri, jo "ekziston")
const fsVjeter = globalThis.fetch;
globalThis.fetch = async (url, opt = {}) => (String(url).includes('/perdoruesit/uM/njoftimet/') ? new Response('{}', { status: 503 }) : fsVjeter(url, opt));
[st, j] = await thirr('/fjalekalimi/kerko', { emri: 'agim' });
ok(st === 500 && !db.has('rivendosjet/agim'), '6h. njoftimi dështoi → 500, kodi hiqet', [st, db.has('rivendosjet/agim')]);
globalThis.fetch = fsVjeter;
[st, j] = await thirr('/fjalekalimi/kerko', { emri: 'agim' });
ok(st === 200 && !j.ekziston, '6i. prova e radhës: kod i ri (jo "ekziston")', [st, j]);
// 8. v165: shumë prova njëkohësisht s'e kalojnë kufirin e 5 provave (para v165: secila e krahasonte kodin)
const dR = db.get('rivendosjet/agim'); dR.skadon = I(Date.now() - 1000); db.set('rivendosjet/agim', dR);
await thirr('/fjalekalimi/kerko', { emri: 'agim' });
const kodi3 = kodiNga(njoftimet().map(x => x.tekst).filter(kodiNga).pop());
const gabimet = Array.from({ length: 60 }, (_, i) => String((Number(kodi3) + 1 + i) % 1000000).padStart(6, '0'));
const pergj = await Promise.all(gabimet.concat([kodi3]).map(k => thirr('/fjalekalimi/verifiko', { emri: 'agim', kodi: k })));
const krahasuar = pergj.slice(0, 60).filter(([s2, j2]) => j2 && (j2.arsye === 'kodi' || (j2.arsye === 'shume-prova' && j2.mbetur === 0))).length;
ok(krahasuar <= 5, '8. 60 prova njëkohësisht: krahasohen më së shumti 5 (' + krahasuar + ')', pergj.map(x => x[1] && x[1].arsye).join(','));
ok(Number(db.get('rivendosjet/agim').provat.integerValue) <= 5, '8b. numri i provave s\'kalon 5', db.get('rivendosjet/agim').provat);
const dR2 = db.get('rivendosjet/agim'); dR2.provat = I(0); db.set('rivendosjet/agim', dR2);
[st, j] = await thirr('/fjalekalimi/verifiko', { emri: 'agim', kodi: kodi3 });
ok(st === 200 && j.ok && db.get('rivendosjet/agim').provat.integerValue === '0', '8c. kodi i saktë s\'e harxhon provën', [st, j, db.get('rivendosjet/agim').provat]);
[st, j] = await thirr('/fjalekalimi/tjeter', { emri: 'agim', kodi: kodi2 });
ok(st === 404 && j.arsye === 'rruga', '7. rrugë e panjohur → 404', [st, j]);
console.log(g ? '\n✖ ' + g + ' GABIME' : '\n✔ Krejt në rregull');
