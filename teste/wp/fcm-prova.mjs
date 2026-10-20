// Worker 160: aplikacioni Android (Firebase Cloud Messaging) — kërkesa e grupit, pajisje e vdekur, njoftimi ditor (v221: pa chat)
import worker, { dergoNjoftimetDitore } from './worker.mjs';
import crypto from 'node:crypto';
const ok = (c, m, x) => console.log((c ? 'OK  ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : ''));
const b64u = b => Buffer.from(b).toString('base64url');
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = publicKey.export({ format: 'jwk' }); jwk.kid = 'k1'; jwk.alg = 'RS256';
const tS = Math.floor(Date.now() / 1000);
const bileta = (uid = 'uA') => { const h = b64u(JSON.stringify({ alg: 'RS256', kid: 'k1', typ: 'JWT' })); const p = b64u(JSON.stringify({ iss: 'https://securetoken.google.com/stoku-appi', aud: 'stoku-appi', sub: uid, user_id: uid, email: 'agim@stoku-app.local', iat: tS - 10, exp: tS + 3600 })); return h + '.' + p + '.' + b64u(crypto.sign('sha256', Buffer.from(h + '.' + p), privateKey)); };
// Service account i rremë (çelësi RSA i vërtetë, që nënshkrimi të provohet)
const sa = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const SA = JSON.stringify({ type: 'service_account', project_id: 'stoku-appi', client_email: 'fcm@stoku-appi.iam.gserviceaccount.com', private_key: sa.privateKey.export({ type: 'pkcs8', format: 'pem' }) });
const v = crypto.createECDH('prime256v1'); v.generateKeys();
const tani = Date.now();
const TOK_B = 'fcmTokenBesa_' + 'x'.repeat(40), TOK_C = 'fcmTokenDrini:' + 'y'.repeat(40);
const fsf = o => Object.fromEntries(Object.entries(o).map(([k, x]) => [k, typeof x === 'number' ? { integerValue: String(x) } : { stringValue: String(x) }]));
const FSD = new Map([
  ['grupet/g1/anetaret/uA', { emri: 'agim' }], ['grupet/g1/anetaret/uB', { emri: 'besa' }], ['grupet/g1/anetaret/uC', { emri: 'drini' }],
  ['grupet/g1/feed/k1abcdef', { lloji: 'kerkese-heqje', uid: 'uA', emri: 'agim', koha: tani, produkti: 'Kos', barkodi: '1', perUid: '' }],
  ['grupet/g1/push/uB_1', { uid: 'uB', fcm: TOK_B, endpoint: 'fcm:' + TOK_B, platforma: 'tel' }],
  ['grupet/g1/push/uC_1', { uid: 'uC', fcm: TOK_C, endpoint: 'fcm:' + TOK_C, platforma: 'tel' }]
]);
let fcm = [], oauth = 0, fshirje = [], jwtOk = null;
globalThis.fetch = async (url, opt = {}) => {
  url = String(url);
  if (url.includes('securetoken@system')) return new Response(JSON.stringify({ keys: [jwk] }), { headers: { 'Cache-Control': 'public, max-age=20000' } });
  if (url === 'https://oauth2.googleapis.com/token') {
    oauth++;
    const a = new URLSearchParams(opt.body).get('assertion').split('.');
    jwtOk = crypto.verify('sha256', Buffer.from(a[0] + '.' + a[1]), sa.publicKey, Buffer.from(a[2], 'base64url')) && JSON.parse(Buffer.from(a[1], 'base64url')).scope === 'https://www.googleapis.com/auth/firebase.messaging';
    return new Response(JSON.stringify({ access_token: 'AT-1', expires_in: 3600 }));
  }
  if (url.startsWith('https://fcm.googleapis.com/v1/projects/stoku-appi/messages:send')) {
    const m = JSON.parse(opt.body).message; fcm.push({ auth: opt.headers.Authorization, m });
    if (m.token === TOK_C) return new Response(JSON.stringify({ error: { status: 'NOT_FOUND', details: [{ errorCode: 'UNREGISTERED' }] } }), { status: 404 });
    return new Response(JSON.stringify({ name: 'projects/stoku-appi/messages/1' }));
  }
  const m = url.match(/documents\/(.*)$/); if (!m) return new Response('?', { status: 500 });
  const [rr] = m[1].split('?'), metoda = opt.method || 'GET';
  if (metoda === 'DELETE') { fshirje.push(rr); FSD.delete(rr); return new Response('{}'); }
  if (FSD.has(rr)) return new Response(JSON.stringify({ fields: fsf(FSD.get(rr)) }));
  const nen = [...FSD.keys()].filter(k => k.startsWith(rr + '/') && k.split('/').length === rr.split('/').length + 1);
  return new Response(JSON.stringify({ documents: nen.map(k => ({ name: 'p/d/' + k, fields: fsf(FSD.get(k)) })) }));
};
const kv = new Map();
const FOTO = { async get(k, t) { const x = kv.get(k); if (x == null) return null; return t === 'json' ? JSON.parse(x) : x; }, async put(k, x) { kv.set(k, x); }, async delete(k) { kv.delete(k); } };
const env = { VAPID_PUBLIC: b64u(v.getPublicKey()), VAPID_PRIVATE: b64u(v.getPrivateKey()), FOTO, FCM_SA: SA };
const th = async (rr, b, tok, e) => { const r = await worker.fetch(new Request('https://w.test' + rr, { method: b ? 'POST' : 'GET', headers: { Origin: 'https://stoku.site', ...(tok ? { Authorization: 'Bearer ' + tok } : {}) }, body: b ? JSON.stringify(b) : undefined }), e || env, {}); return [r.status, await r.json()]; };

// 0. health: fcm
let [s, j] = await th('/'); ok(j.fcm === true && j.versioni >= 161, '0. health: versioni 161 + fcm', j);
// 1. Kërkesa e grupit te telefonat Android
[s, j] = await th('/kerkese', { id: 'k1abcdef', grupi: 'g1' }, bileta('uA'));
const mB = fcm.find(x => x.m.token === TOK_B);
ok(s === 200 && j.derguar === 1 && mB && mB.auth === 'Bearer AT-1' && mB.m.data.titulli === 'Stoku · Hiqe nga rafti' && mB.m.data.teksti === 'agim i kërkon grupit ta heqë nga rafti: Kos (1)' && mB.m.data.url === './index.html#ekipa-njoftimet' && mB.m.data.lloji === 'kerkese' && mB.m.android.priority === 'HIGH', '1. FCM te besa (data + prioritet i lartë)', [s, j, mB && mB.m]);
ok(jwtOk === true && oauth === 1, '1. tokeni OAuth me service account (RS256, scope FCM)', { jwtOk, oauth });
ok(fshirje.includes('grupet/g1/push/uC_1'), '2. pajisja e çinstaluar (UNREGISTERED) fshihet', fshirje);
fcm = [];
[s, j] = await th('/kerkese', { id: 'k1abcdef', grupi: 'g1' }, bileta('uA'));
ok(oauth === 1 && fcm.length === 1, '3. tokeni OAuth ripërdoret (s\'kërkohet sërish)', { oauth, n: fcm.length });
// 4. Pa FCM_SA: s'rrëzohet, thjesht s'dërgon
fcm = [];
[s, j] = await th('/kerkese', { id: 'k1abcdef', grupi: 'g1' }, bileta('uA'), Object.assign({}, env, { FCM_SA: undefined }));
ok(s === 200 && j.derguar === 0 && fcm.length === 0, '4. pa sekretin FCM_SA: s\'dërgohet, pa gabim', [s, j]);
// 5. Njoftimi ditor me tokenin e Android-it
const sot = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Belgrade' });
const ora = new Date(Date.now() - 60000).toLocaleTimeString('en-GB', { timeZone: 'Europe/Belgrade', hour: '2-digit', minute: '2-digit', hour12: false });
[s, j] = await th('/orari', { afatet: [{ i: 'a1', e: 'Kos', d: sot }] }, bileta('uA'));
[s, j] = await th('/orari', { aktiv: true, ora: '06:00', tz: 'Europe/Belgrade', platforma: 'tel', pajisja: { fcm: TOK_B } }, bileta('uA'));
ok(s === 200 && j.aktiv, '5. orari me pajisje Android pranohet', [s, j]);
[s, j] = await th('/orari', { statusi: true, pajisja: { fcm: TOK_B } }, bileta('uA'));
ok(j.ekziston === true, '5. statusi i orarit për pajisjen Android', j);
[s, j] = await th('/orari', { aktiv: true, ora: '06:00', pajisja: { fcm: 'shkurt' } }, bileta('uA'));
ok(s === 400, '5. token i keq → 400', [s, j]);
// ora e orarit = tani, që Cron-i ta dërgojë
const ind = JSON.parse(kv.get('orari-indeksi')); const k = Object.keys(ind)[0]; ind[k].ora = ora; ind[k].dita = ''; kv.set('orari-indeksi', JSON.stringify(ind));
const rek = JSON.parse(kv.get(k)); rek.ora = ora; kv.set(k, JSON.stringify(rek));
fcm = [];
const n = await dergoNjoftimetDitore(env, Date.now(), '* * * * *');
const d = fcm[0] && fcm[0].m;
ok(n === 1 && d && d.token === TOK_B && /Kos/.test(d.data.teksti) && d.data.url === './index.html#afatet', '6. njoftimi ditor te telefoni Android', [n, d && d.data]);
console.log('FUND');
