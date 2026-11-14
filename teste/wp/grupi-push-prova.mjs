// v171 (web v303): /grupi { lloji: 'ftese' | 'kerkese', id } → push te i ftuari (pajisjet e grupit të tij) ose te pronarët
// e grupit; dokumenti lexohet me tokenin e dërguesit (rregullat), pajisjet me tokenin e administratorit (FCM_SA).
// + teksti i njoftimit "admin-i-ri" (ishte bosh → s'dilte si push).
import worker, { tekstiINjoftimit } from './worker.mjs';
import ece from 'http_ece';
import crypto from 'node:crypto';
let g = 0;
const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK  ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const b64u = b => Buffer.from(b).toString('base64url');
const { privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const SA = JSON.stringify({ client_email: 'sa@stoku-appi.iam.gserviceaccount.com', private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }), project_id: 'stoku-appi' });
const ua = crypto.createECDH('prime256v1'); ua.generateKeys(); const auth = crypto.randomBytes(16);
const v = crypto.createECDH('prime256v1'); v.generateKeys();
const env = { VAPID_PUBLIC: b64u(v.getPublicKey()), VAPID_PRIVATE: b64u(v.getPrivateKey()), VAPID_SUBJECT: 'mailto:t@stoku.site', FCM_SA: SA };
const S = s => ({ stringValue: s }), I = n => ({ integerValue: String(n) });
const tani = Date.now();
const FSB = 'https://firestore.googleapis.com/v1/projects/stoku-appi/databases/(default)/documents/';
const db = new Map();
// g1: grupi i agimit (pronar uA) ku fton; g2: grupi ku është besa (uB) tani
db.set('grupet/g1/anetaret/uA', { emri: S('agim'), roli: S('pronar') });
db.set('grupet/g1/anetaret/uV', { emri: S('vjosa'), roli: S('anetar') });
db.set('grupet/g2/anetaret/uB', { emri: S('besa'), roli: S('pronar') });
db.set('perdoruesit/uB', { perdoruesi: S('besa'), grupi: S('g2') });
db.set('perdoruesit/uZ', { perdoruesi: S('zana'), grupi: S('') });
const pajisja = (u, k, pc) => ({ uid: S(u), endpoint: S('https://push.test/' + u + k), p256dh: S(b64u(ua.getPublicKey())), auth: S(b64u(auth)), platforma: S(pc ? 'pc' : 'tel') });
db.set('grupet/g2/push/uB_1', pajisja('uB', '1')); db.set('grupet/g2/push/uB_2', pajisja('uB', '2', true));
db.set('grupet/g1/push/uA_1', pajisja('uA', '1')); db.set('grupet/g1/push/uV_1', pajisja('uV', '1'));
db.set('ftesat/g1_uB', { gid: S('g1'), grupiEmri: S('Market Agimi'), perdoruesi: S('besa'), uid: S('uB'), ngaUid: S('uA'), ngaEmri: S('agim'), koha: I(tani) });
db.set('ftesat/g1_uZ', { gid: S('g1'), grupiEmri: S('Market Agimi'), perdoruesi: S('zana'), uid: S('uZ'), ngaUid: S('uA'), ngaEmri: S('agim'), koha: I(tani) });
db.set('ftesat/g1_vjeter', { gid: S('g1'), grupiEmri: S('Market Agimi'), perdoruesi: S('besa'), ngaUid: S('uA'), ngaEmri: S('agim'), koha: I(tani) });
db.set('ftesat/g1_uX', { gid: S('g1'), grupiEmri: S('Market Agimi'), perdoruesi: S('x'), uid: S('uX'), ngaUid: S('uA'), ngaEmri: S('agim'), koha: I(tani - 3600e3) });
db.set('kerkesat_grupi/g1_uK', { gid: S('g1'), grupiEmri: S('Market Agimi'), uid: S('uK'), emri: S('kerim'), koha: I(tani) });
let kapur = [];
const anetarI = (u, gid) => db.has('grupet/' + gid + '/anetaret/' + u);
globalThis.fetch = async (url, opt = {}) => {
  url = String(url); const m = opt.method || 'GET';
  if (url === 'https://oauth2.googleapis.com/token') return new Response(JSON.stringify({ access_token: 'AT', expires_in: 3600 }));
  if (url.startsWith('https://push.test/')) { kapur.push({ ku: url.split('/').pop(), ng: JSON.parse(ece.decrypt(Buffer.from(opt.body), { version: 'aes128gcm', privateKey: ua, authSecret: auth }).toString()) }); return new Response('', { status: 201 }); }
  if (url.startsWith(FSB)) {
    const u = new URL(url), rr = decodeURIComponent(u.pathname.slice(new URL(FSB).pathname.length));
    const tok = String((opt.headers || {}).Authorization || '').replace('Bearer ', '');
    const admin = tok === 'AT', uid = admin ? null : JSON.parse(Buffer.from(tok.split('.')[1], 'base64url').toString()).user_id;
    if (m === 'GET' && rr.split('/').length % 2 === 1) {
      if (!admin) return new Response('{}', { status: 403 });
      const docs = [...db.keys()].filter(k => k.startsWith(rr + '/') && k.slice(rr.length + 1).indexOf('/') === -1).map(k => ({ name: 'x/' + k, fields: db.get(k) }));
      return new Response(JSON.stringify({ documents: docs }));
    }
    if (m === 'GET') {
      const d = db.get(rr);
      if (!admin) { // rregullat: ftesën e lexon anëtari i grupit ose i ftuari; kërkesën kërkuesi
        const lejo = d && (rr.startsWith('ftesat/') ? (anetarI(uid, d.gid.stringValue) || (d.uid && d.uid.stringValue === uid)) : rr.startsWith('kerkesat_grupi/') ? d.uid.stringValue === uid : false);
        if (!lejo) return new Response('{}', { status: d ? 403 : 404 });
      }
      return d ? new Response(JSON.stringify({ fields: d })) : new Response('{}', { status: 404 });
    }
    if (m === 'DELETE') return new Response('{}');
  }
  return new Response('?', { status: 500 });
};
const tok = u => 'x.' + b64u(JSON.stringify({ user_id: u, sub: u })) + '.y';
const thirr = async (u, trup, e = env) => { kapur = []; const r = await worker.fetch(new Request('https://w.test/grupi', { method: 'POST', headers: { Authorization: 'Bearer ' + tok(u) }, body: JSON.stringify(trup) }), e); return [r.status, await r.json()]; };

// 1. ftesa → pajisjet e besës (te grupi i saj g2), me tekstin dhe url-në e Grupit
let [st, j] = await thirr('uA', { lloji: 'ftese', id: 'g1_uB' });
ok(st === 200 && j.ok && kapur.map(x => x.ku).sort().join() === 'uB1,uB2', '1. ftesa: te dy pajisjet e besës', [st, j, kapur.map(x => x.ku)]);
const t1 = kapur.find(x => x.ku === 'uB1'), p1 = kapur.find(x => x.ku === 'uB2');
ok(t1 && t1.ng.teksti === 'agim të fton në grupin "Market Agimi". Hape Grupin për ta pranuar.' && t1.ng.titulli === 'Stoku · Ftesë në grup' && t1.ng.tag === 'ek-ft-g1_uB' && t1.ng.url === './index.html#ekipa-anetaret', '1. teksti, titulli, tag-u (si njoftimi i aplikacionit), url tel', t1 && t1.ng);
ok(p1 && p1.ng.url === './pc.html#/ekipa/anetaret', '1. url PC: Grupi', p1 && p1.ng.url);
// 2. i ftuari pa grup: s'ka pajisje të regjistruara
[st, j] = await thirr('uA', { lloji: 'ftese', id: 'g1_uZ' });
ok(st === 200 && j.derguar === 0 && !kapur.length, '2. i ftuari pa grup: asnjë push', j);
// 3. ftesa e dikujt tjetër (vjosa s'e dërgoi) → 403
[st, j] = await thirr('uV', { lloji: 'ftese', id: 'g1_uB' });
ok(st === 403 && !kapur.length, '3. ftesa e pronarit, e thirrur nga vjosa → 403', [st, j]);
// 4. ftesa e vjetër sipas emrit (pa uid) → 403; e vjetër në kohë → 409; s'ekziston → 404
[st] = await thirr('uA', { lloji: 'ftese', id: 'g1_vjeter' }); ok(st === 403 && !kapur.length, '4. ftesa pa uid → 403', st);
[st] = await thirr('uA', { lloji: 'ftese', id: 'g1_uX' }); ok(st === 409 && !kapur.length, '4. ftesa e vjetër (1 orë) → 409', st);
[st] = await thirr('uA', { lloji: 'ftese', id: 'g1_uQ' }); ok(st === 404, '4. s\'ekziston → 404', st);
// 5. kërkesa për grupin → vetëm pronari (agimi), jo vjosa
[st, j] = await thirr('uK', { lloji: 'kerkese', id: 'g1_uK' });
ok(st === 200 && kapur.map(x => x.ku).join() === 'uA1' && kapur[0].ng.teksti === 'kerim kërkon të hyjë në grupin tënd. Hape Grupin për ta pranuar.' && kapur[0].ng.tag === 'ek-kr-g1_uK' && kapur[0].ng.titulli === 'Stoku · Kërkesë për grupin', '5. kërkesa: te pronari', kapur.map(x => [x.ku, x.ng.teksti]));
[st] = await thirr('uZ', { lloji: 'kerkese', id: 'g1_uK' }); ok(st === 403 && !kapur.length, '5. kërkesa e dikujt tjetër → 403 (rregullat)', st);
// 6. lloji/id i gabuar; pa FCM_SA
[st] = await thirr('uA', { lloji: 'tjeter', id: 'g1_uB' }); ok(st === 400, '6. lloji i panjohur → 400', st);
[st, j] = await thirr('uA', { lloji: 'ftese', id: 'g1_uB' }, Object.assign({}, env, { FCM_SA: undefined })); ok(st === 500 && j.arsye === 'pa-fcm-sa' && !kapur.length, '6. pa FCM_SA → 500', j);
// 7. "admin-i-ri" ka tekst (më parë bosh → s'dilte push)
ok(tekstiINjoftimit({ lloji: 'admin-i-ri', emri: 'agim' }) === 'agim u largua nga grupi dhe tani ti je admini i grupit.', '7. teksti "admin-i-ri"');
console.log(g ? g + ' GABIME' : 'KREJT OK');
process.exit(g ? 1 : 0);
