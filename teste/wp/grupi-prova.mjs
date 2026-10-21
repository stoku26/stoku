// Worker 159: grupet. /kerkese me `grupi` (vetëm anëtarët e tanishëm marrin push), /ora/* sipas treguesit. v221: pa /chat.
import worker from './worker.mjs';
import ece from 'http_ece';
import crypto from 'node:crypto';
const ok = (c, m, x) => console.log((c ? 'OK  ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : ''));
const b64u = b => Buffer.from(b).toString('base64url');
const ua = crypto.createECDH('prime256v1'); ua.generateKeys(); const auth = crypto.randomBytes(16);
const v = crypto.createECDH('prime256v1'); v.generateKeys();
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = publicKey.export({ format: 'jwk' }); jwk.kid = 'k1'; jwk.alg = 'RS256';
const tS = Math.floor(Date.now() / 1000);
const bileta = (uid = 'uA', email = 'agim@stoku-app.local') => { const h = b64u(JSON.stringify({ alg: 'RS256', kid: 'k1', typ: 'JWT' })); const p = b64u(JSON.stringify({ iss: 'https://securetoken.google.com/stoku-appi', aud: 'stoku-appi', sub: uid, user_id: uid, email, iat: tS - 10, exp: tS + 3600 })); return h + '.' + p + '.' + b64u(crypto.sign('sha256', Buffer.from(h + '.' + p), privateKey)); };
const tani = Date.now();
const fsv = x => 'stringValue' in x ? x.stringValue : 'integerValue' in x ? Number(x.integerValue) : 'booleanValue' in x ? x.booleanValue : 'arrayValue' in x ? (x.arrayValue.values || []).map(fsv) : 'mapValue' in x ? Object.fromEntries(Object.entries(x.mapValue.fields || {}).map(([k, y]) => [k, fsv(y)])) : null;
const fsf = o => Object.fromEntries(Object.entries(o).map(([k, x]) => [k, typeof x === 'number' ? { integerValue: String(x) } : typeof x === 'boolean' ? { booleanValue: x } : { stringValue: String(x) }]));

// Firestore i rremë: grupi g1 me anëtarët uA, uB; uC ishte anëtar (pajisja i ka mbetur te push), por u hoq
const FSD = new Map();
const vendos = (k, o) => FSD.set(k, o);
vendos('grupet/g1/anetaret/uA', { emri: 'agim', roli: 'pronar' });
vendos('grupet/g1/anetaret/uB', { emri: 'besa', roli: 'anetar' });
vendos('grupet/g1/chat/m1abcdef', { uid: 'uA', emri: 'agim', tekst: 'Mirëdita grup', koha: tani }); // mesazh i vjetër: s'lexohet më (v221)
vendos('grupet/g1/feed/k1abcdef', { lloji: 'kerkese-heqje', uid: 'uA', emri: 'agim', koha: tani, produkti: 'Kos', barkodi: '1', perUid: '' });
['uA', 'uB', 'uC'].forEach(u => vendos('grupet/g1/push/' + u + '_1', { uid: u, endpoint: 'https://push.test/' + u, p256dh: b64u(ua.getPublicKey()), auth: b64u(auth), platforma: 'tel' }));
// pajisje e vjetër te ekipa e vjetër (s'duhet prekur nga mesazhet e grupit)
vendos('ekipa_push/uD_1', { uid: 'uD', endpoint: 'https://push.test/uD', p256dh: b64u(ua.getPublicKey()), auth: b64u(auth), platforma: 'tel' });
let kapur = [], fshirjet = [], leximet = [];
let rtValid = 'RT-1-xxxxxxxxxxxxxxxxxxxxxxx', uidIOres = 'uA';
let uB403 = false; // lista e anëtarëve refuzohet (s'është më anëtar)
globalThis.fetch = async (url, opt = {}) => {
  url = String(url);
  if (url.includes('securetoken@system')) return new Response(JSON.stringify({ keys: [jwk] }), { headers: { 'Cache-Control': 'public, max-age=20000' } });
  if (url.startsWith('https://securetoken.googleapis.com/v1/token')) { const rt = new URLSearchParams(opt.body).get('refresh_token'); if (rt !== rtValid) return new Response('{}', { status: 400 }); return new Response(JSON.stringify({ id_token: bileta(uidIOres), refresh_token: rtValid, user_id: uidIOres })); }
  if (url.startsWith('https://push.test')) { kapur.push({ ku: url.split('/').pop(), ng: JSON.parse(ece.decrypt(Buffer.from(opt.body), { version: 'aes128gcm', privateKey: ua, authSecret: auth }).toString()) }); return new Response('', { status: 201 }); }
  const m = url.match(/documents\/(.*)$/); if (!m) return new Response('?', { status: 500 });
  const [rr, q] = m[1].split('?'), par = new URLSearchParams(q || ''), metoda = opt.method || 'GET';
  leximet.push(metoda + ' ' + rr);
  if (metoda === 'DELETE') { fshirjet.push(rr); FSD.delete(rr); return new Response('{}'); }
  if (metoda === 'POST') { const id = par.get('documentId'); FSD.set(rr + '/' + id, Object.fromEntries(Object.entries(JSON.parse(opt.body).fields).map(([k, x]) => [k, fsv(x)]))); return new Response('{}'); }
  if (FSD.has(rr)) return new Response(JSON.stringify({ fields: fsf(Object.fromEntries(Object.entries(FSD.get(rr)).filter(([, x]) => typeof x !== 'object'))) }));
  // koleksion: dokumentet direkt nën rrugë
  const nen = [...FSD.keys()].filter(k => k.startsWith(rr + '/') && k.split('/').length === rr.split('/').length + 1);
  if (nen.length || /\/(anetaret|push)$|^ekipa_push$/.test(rr)) {
    if (uB403 && /anetaret$/.test(rr)) return new Response('{}', { status: 403 });
    return new Response(JSON.stringify({ documents: nen.map(k => ({ name: 'projects/p/databases/(default)/documents/' + k, fields: fsf(Object.fromEntries(Object.entries(FSD.get(k)).filter(([, x]) => typeof x !== 'object'))) })) }));
  }
  return new Response('{}', { status: 404 });
};
const kv = new Map();
const FOTO = { async get(k, t) { const x = kv.get(k); if (x == null) return null; return t === 'json' ? JSON.parse(x) : x; }, async put(k, x) { kv.set(k, x); }, async delete(k) { kv.delete(k); } };
const env = { VAPID_PUBLIC: b64u(v.getPublicKey()), VAPID_PRIVATE: b64u(v.getPrivateKey()), VAPID_SUBJECT: 'mailto:t@stoku.site', FOTO };
const th = async (rr, { m = 'POST', b, tok, ora } = {}) => { const h = { Origin: 'https://stoku.site' }; if (tok) h.Authorization = 'Bearer ' + tok; if (ora) h['X-Stoku-Ora'] = ora;
  const r = await worker.fetch(new Request('https://w.test' + rr, { method: m, headers: h, body: b ? JSON.stringify(b) : undefined }), env, {}); return [r.status, await r.json()]; };

// 1. Kërkesa e grupit: vetëm besa (uC s'është më anëtar → s'merr, pajisja e tij fshihet)
let [s, j] = await th('/kerkese', { b: { id: 'k1abcdef', grupi: 'g1' }, tok: bileta('uA') });
ok(s === 200 && kapur.map(x => x.ku).join() === 'uB', '1. kërkesa e grupit: vetëm anëtarët e tanishëm (besa)', [s, j, kapur.map(x => x.ku)]);
ok(fshirjet.includes('grupet/g1/push/uC_1') && !FSD.has('grupet/g1/push/uC_1'), '1. pajisja e të hequrit fshihet', fshirjet);
ok(kapur[0] && kapur[0].ng.teksti === 'agim i kërkon grupit ta heqë nga rafti: Kos (1)' && kapur[0].ng.titulli === 'Stoku · Hiqe nga rafti', '1. përmbajtja', kapur[0] && kapur[0].ng);
ok(!leximet.some(x => /ekipa_/.test(x)), '1. s\'preket ekipa e vjetër', leximet.filter(x => /ekipa_/.test(x)));
// 1b. v221: /chat s'ekziston më (404), pa lexuar mesazhin e vjetër dhe pa dërguar asgjë
kapur = []; leximet = [];
[s, j] = await th('/chat', { b: { id: 'm1abcdef', grupi: 'g1' }, tok: bileta('uA') });
ok(s === 404 && j.arsye === 'rruga' && !kapur.length && !leximet.length, '1b. /chat u hoq', [s, j, leximet]);
// 2. Kërkesa në grup (krejt grupi → besa)
kapur = []; fshirjet = [];
[s, j] = await th('/kerkese', { b: { id: 'k1abcdef', grupi: 'g1' }, tok: bileta('uA') });
ok(s === 200 && kapur.map(x => x.ku).join() === 'uB', '2. kërkesë në grup → besa', [s, j, kapur.map(x => x.ku)]);
// 3. Grup i panjohur / emër i keq i grupit → s'ka leje / s'gjendet
kapur = [];
[s, j] = await th('/kerkese', { b: { id: 'k1abcdef', grupi: '../ekipa_feed' }, tok: bileta('uA') });
ok(s === 404 && !kapur.length, '3. grupi me karaktere të ndaluara injorohet (s\'del jashtë rrugës)', [s, j]);
// 4. Pa grupi (aplikacioni i vjetër) → ekipa_push
kapur = []; vendos('ekipa_feed/k2abcdef', { lloji: 'kerkese-heqje', uid: 'uA', emri: 'agim', koha: tani, produkti: 'Ujë', barkodi: '2', perUid: '' });
[s, j] = await th('/kerkese', { b: { id: 'k2abcdef' }, tok: bileta('uA') });
ok(s === 200 && kapur.map(x => x.ku).join() === 'uD', '4. pa grup → ekipa e vjetër si më parë', [s, j, kapur.map(x => x.ku)]);

// 5. Sahati: lidhja
const sekret = crypto.randomBytes(32).toString('hex');
await th('/ora/kodi', { b: { kodi: '482913', sekret } });
[s, j] = await th('/ora/lidh', { b: { kodi: '482913', emri: 'agim', rt: rtValid }, tok: bileta('uA') });
ok(s === 200, '5. sahati u lidh', j);
// 5a. treguesi te grupi g1
vendos('perdoruesit/uA', { perdoruesi: 'agim', grupi: 'g1' });
[s, j] = await th('/ora/koleget', { m: 'GET', ora: sekret });
ok(s === 200 && j.koleget.map(x => x.emri).join() === 'besa', '5a. kolegët e grupit (pa veten)', j);
leximet = [];
[s, j] = await th('/ora/kerkese', { b: { produktet: [{ produkti: 'Ujë' }] }, ora: sekret });
const fd = [...FSD.entries()].filter(([k]) => k.startsWith('grupet/g1/feed/') && k !== 'grupet/g1/feed/k1abcdef');
const nj = [...FSD.entries()].filter(([k]) => k.startsWith('perdoruesit/uB/njoftimet/'));
ok(s === 200 && j.n === 1 && fd.length === 1 && fd[0][1].emri === 'agim', '5a. kërkesa nga sahati te feed-i i grupit', [s, j, fd.map(x => x[0])]);
ok(nj.length === 1 && nj[0][1].grupi === 'g1', '5a. njoftimi te besa me grupin', nj[0]);
ok(!leximet.some(x => /ekipa_/.test(x)), '5a. s\'preket ekipa e vjetër', leximet.filter(x => /ekipa_/.test(x)));
// 5b. treguesi bosh (s'është në grup) → s'ka kolegë; kërkesa refuzohet
vendos('perdoruesit/uA', { perdoruesi: 'agim', grupi: '' });
[s, j] = await th('/ora/koleget', { m: 'GET', ora: sekret });
ok(s === 200 && j.ok && j.koleget.length === 0, '5b. pa grup → lista bosh (jo ekipa e vjetër)', j);
[s, j] = await th('/ora/kerkese', { b: { produktet: [{ produkti: 'Ujë' }] }, ora: sekret });
ok(s === 400 && j.arsye === 'pa-grup', '5b. pa grup → kërkesa s\'dërgohet', [s, j]);
// 5c. treguesi i vjetër (pronari e hoqi) → 403 nga Firestore → lista bosh, jo "rilidh"
vendos('perdoruesit/uA', { perdoruesi: 'agim', grupi: 'g1' }); uB403 = true;
[s, j] = await th('/ora/koleget', { m: 'GET', ora: sekret });
ok(s === 200 && j.ok && j.koleget.length === 0, '5c. i hequr nga grupi → lista bosh', [s, j]);
uB403 = false;
console.log('FUND');
