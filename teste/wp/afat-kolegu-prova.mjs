// v169 (aplikacioni v297): "Afat për një koleg". /njoftim e regjistron afatin te KV ('afat-kolegu'); Cron-i, pas 10 ditëve pa
// vendim, e shënon 'skadoi' te kolegu, i shkruan dërguesit 'afat-kthyer' (id "k"+id, vetëm krijim) dhe i dërgon push.
import worker, { ktheAfatetEKolegeve, tekstiINjoftimit } from './worker.mjs';
import ece from 'http_ece';
import crypto from 'node:crypto';
let g = 0;
const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK  ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const b64u = b => Buffer.from(b).toString('base64url');
const { privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const SA = JSON.stringify({ client_email: 'sa@stoku-appi.iam.gserviceaccount.com', private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }), project_id: 'stoku-appi' });
const ua = crypto.createECDH('prime256v1'); ua.generateKeys(); const auth = crypto.randomBytes(16);
const v = crypto.createECDH('prime256v1'); v.generateKeys();
const kv = new Map(); let kvShkrime = 0;
const env = { VAPID_PUBLIC: b64u(v.getPublicKey()), VAPID_PRIVATE: b64u(v.getPrivateKey()), VAPID_SUBJECT: 'mailto:t@stoku.site', FCM_SA: SA,
  FOTO: { async get(k, t) { const x = kv.get(k); return x == null ? null : t === 'json' ? JSON.parse(x) : x; }, async put(k, x) { kvShkrime++; kv.set(k, x); }, async delete(k) { kv.delete(k); } } };
const S = s => ({ stringValue: s }), I = n => ({ integerValue: String(n) }), B = b => ({ booleanValue: b });
const M = o => ({ mapValue: { fields: o } });
const D = 864e5, tani = Date.now();
const FSB = 'https://firestore.googleapis.com/v1/projects/stoku-appi/databases/(default)/documents/';
const db = new Map();
const afat = M({ barkodi: S('383'), emri: S('Ujë Radenska'), data: S('2026-11-30'), sasia: I(6) });
db.set('perdoruesit/uB/njoftimet/d1abcdef', { lloji: S('afat-dergim'), afat, uid: S('uA'), emri: S('agim'), grupi: S('g1'), koha: I(tani), lexuar: B(false) });
db.set('grupet/g1/anetaret/uB', { emri: S('blerta'), roli: S('anetar') });
const pajisja = (u, k, pc) => ({ uid: S(u), endpoint: S('https://push.test/' + u + k), p256dh: S(b64u(ua.getPublicKey())), auth: S(b64u(auth)), platforma: S(pc ? 'pc' : 'tel') });
db.set('grupet/g1/push/uA_1', pajisja('uA', '1')); db.set('grupet/g1/push/uA_2', pajisja('uA', '2', true)); db.set('grupet/g1/push/uB_1', pajisja('uB', '1'));
['uA', 'uB'].forEach(u => db.set('grupet/g1/anetaret/' + u, Object.assign({ roli: S('anetar') }, db.get('grupet/g1/anetaret/' + u) || {})));
let kapur = [], patch = [];
const v2 = f => { const o = {}; for (const k in f) { const x = f[k]; o[k] = 'stringValue' in x ? x.stringValue : 'integerValue' in x ? Number(x.integerValue) : 'booleanValue' in x ? x.booleanValue : 'mapValue' in x ? v2(x.mapValue.fields || {}) : null; } return o; };
globalThis.fetch = async (url, opt = {}) => {
  url = String(url); const m = opt.method || 'GET';
  if (url === 'https://oauth2.googleapis.com/token') return new Response(JSON.stringify({ access_token: 'AT', expires_in: 3600 }));
  if (url.startsWith('https://push.test/')) { kapur.push({ ku: url.split('/').pop(), ng: JSON.parse(ece.decrypt(Buffer.from(opt.body), { version: 'aes128gcm', privateKey: ua, authSecret: auth }).toString()) }); return new Response('', { status: 201 }); }
  if (url.startsWith(FSB)) {
    const u = new URL(url), rr = decodeURIComponent(u.pathname.slice(new URL(FSB).pathname.length));
    const tok = (opt.headers || {}).Authorization;
    if (m === 'GET' && rr.split('/').length % 2 === 1) {
      const docs = [...db.keys()].filter(k => k.startsWith(rr + '/') && k.slice(rr.length + 1).indexOf('/') === -1).map(k => ({ name: 'x/' + k, fields: db.get(k) }));
      return new Response(JSON.stringify({ documents: docs }));
    }
    if (m === 'GET') {
      const d = db.get(rr);
      if (tok !== 'Bearer AT' && (!d || !d.uid || d.uid.stringValue !== 'uA')) return new Response('{}', { status: 403 }); // rregullat: vetëm dërguesi
      return d ? new Response(JSON.stringify({ fields: d, createTime: new Date(tani).toISOString() })) : new Response('{}', { status: 404 });
    }
    if (m === 'PATCH') {
      if (tok !== 'Bearer AT') return new Response('{}', { status: 403 });
      if (u.searchParams.get('currentDocument.exists') === 'true' && !db.has(rr)) return new Response('{}', { status: 404 });
      const f = JSON.parse(opt.body).fields, maska = u.searchParams.getAll('updateMask.fieldPaths');
      patch.push({ rr, maska, f: v2(f) });
      db.set(rr, maska.length ? Object.assign({}, db.get(rr), f) : f); return new Response('{}');
    }
    if (m === 'POST') { // krijim me documentId
      const id = u.searchParams.get('documentId'), k = rr + '/' + id;
      if (db.has(k)) return new Response('{}', { status: 409 });
      db.set(k, JSON.parse(opt.body).fields); return new Response('{}');
    }
    if (m === 'DELETE') { db.delete(rr); return new Response('{}'); }
  }
  return new Response('?', { status: 500 });
};
const tok = 'x.' + b64u(JSON.stringify({ user_id: 'uA', sub: 'uA' })) + '.y';
const njoftim = async (id, per) => { kapur = []; const r = await worker.fetch(new Request('https://w.test/njoftim', { method: 'POST', headers: { Authorization: 'Bearer ' + tok }, body: JSON.stringify({ id, per, grupi: 'g1' }) }), env); return [r.status, await r.json()]; };

// 0. tekstet (të njëjta me ekipa.js)
ok(tekstiINjoftimit({ lloji: 'afat-dergim', emri: 'agim', afat: { emri: 'Ujë Radenska', data: '2026-11-30', sasia: 6 } }) === 'agim të dërgoi një afat: Ujë Radenska · 30.11.2026 · 6 copë', '0. teksti "të dërgoi"');
ok(tekstiINjoftimit({ lloji: 'afat-kthyer', emri: 'blerta', arsye: 'skadoi', afat: { barkodi: '77', sasia: 12 } }) === 'blerta s\'e pranoi brenda 10 ditëve afatin: 77 · 12 copë. E ke te lista jote.', '0. teksti "brenda 10 ditëve"');
ok(tekstiINjoftimit({ lloji: 'afat-kthyer', emri: 'blerta', arsye: 'refuzoi', afat: { emri: 'Kos' } }) === 'blerta s\'e pranoi afatin: Kos. E ke te lista jote.', '0. teksti "s\'e pranoi"');
ok(tekstiINjoftimit({ lloji: 'afat-pranuar', emri: 'blerta', afat: { emri: 'Kos', data: '2026-01-02' } }) === 'blerta e pranoi afatin që i dërgove: Kos · 02.01.2026', '0. teksti "e pranoi"');
// 1. /njoftim: push te Blerta + regjistrimi
let [st, j] = await njoftim('d1abcdef', 'uB');
ok(st === 200 && kapur.length === 1 && kapur[0].ku === 'uB1' && kapur[0].ng.teksti === 'agim të dërgoi një afat: Ujë Radenska · 30.11.2026 · 6 copë', '1. push te Blerta', [st, j, kapur.map(x => x.ng.teksti)]);
let ind = JSON.parse(kv.get('afat-kolegu') || '{}');
ok(ind.d1abcdef && ind.d1abcdef.per === 'uB' && ind.d1abcdef.uid === 'uA' && ind.d1abcdef.g === 'g1' && ind.d1abcdef.afat.sasia === 6 && Math.abs(ind.d1abcdef.koha - tani) < 5000, '1. u regjistrua te KV', ind);
const sh0 = kvShkrime; await njoftim('d1abcdef', 'uB');
ok(kvShkrime === sh0, '1. regjistrimi i dytë s\'shkruan sërish te KV');
// 2. Cron para 10 ditëve: asgjë
kapur = [];
ok(await ktheAfatetEKolegeve(env, tani + 9 * D) === 0 && !kapur.length && JSON.parse(kv.get('afat-kolegu')).d1abcdef, '2. para 10 ditëve: asgjë');
// 3. pas 10 ditëve, pa vendim: kthehet te Agimi
const t10 = tani + 10 * D + 60000;
ok(await ktheAfatetEKolegeve(env, t10) === 1, '3. pas 10 ditëve: 1 i kthyer');
const nB = v2(db.get('perdoruesit/uB/njoftimet/d1abcdef'));
ok(nB.vendim === 'skadoi' && nB.lexuar === true && nB.lloji === 'afat-dergim' && nB.afat && nB.afat.emri === 'Ujë Radenska', '3. te Blerta: "skadoi" (vetëm këto fusha, pjesa tjetër mbetet)', nB);
ok(patch.length === 1 && patch[0].maska.sort().join() === 'lexuar,vendim,vendosurSe', '3. PATCH me updateMask', patch);
const kA = db.get('perdoruesit/uA/njoftimet/kd1abcdef') && v2(db.get('perdoruesit/uA/njoftimet/kd1abcdef'));
ok(kA && kA.lloji === 'afat-kthyer' && kA.arsye === 'skadoi' && kA.dergimId === 'd1abcdef' && kA.uid === 'uB' && kA.emri === 'blerta' && kA.grupi === 'g1' && kA.afat.sasia === 6 && kA.lexuar === false, '3. te Agimi: "afat-kthyer" me afatin', kA);
ok(kapur.map(x => x.ku).sort().join() === 'uA1,uA2' && kapur[0].ng.teksti === 'blerta s\'e pranoi brenda 10 ditëve afatin: Ujë Radenska · 30.11.2026 · 6 copë. E ke te lista jote.' && kapur[0].ng.tag === 'ek-nj-kd1abcdef', '3. push te dy pajisjet e Agimit', kapur.map(x => [x.ku, x.ng.teksti, x.ng.tag]));
ok(!JSON.parse(kv.get('afat-kolegu')).d1abcdef, '3. u hoq nga KV');
// 4. i pranuar / i refuzuar / i fshirë
db.set('perdoruesit/uB/njoftimet/d2abcdef', { lloji: S('afat-dergim'), afat, uid: S('uA'), emri: S('agim'), grupi: S('g1'), koha: I(tani), vendim: S('pranuar'), lexuar: B(true) });
db.set('perdoruesit/uB/njoftimet/d3abcdef', { lloji: S('afat-dergim'), afat, uid: S('uA'), emri: S('agim'), grupi: S('g1'), koha: I(tani), vendim: S('refuzuar'), lexuar: B(true) });
db.set('perdoruesit/uA/njoftimet/pd4abcdef', { lloji: S('afat-pranuar'), uid: S('uB'), grupi: S('g1') }); // d4 u pranua dhe u fshi
const r = (id) => ({ per: 'uB', uid: 'uA', g: 'g1', koha: tani, afat: { emri: 'x' + id } });
kv.set('afat-kolegu', JSON.stringify({ d2abcdef: r(2), d3abcdef: r(3), d4abcdef: r(4), d5abcdef: r(5) })); // d5: u fshi pa vendim
kapur = []; patch = [];
const n4 = await ktheAfatetEKolegeve(env, t10);
ok(n4 === 1 && !db.has('perdoruesit/uA/njoftimet/kd2abcdef') && !db.has('perdoruesit/uA/njoftimet/kd3abcdef') && !db.has('perdoruesit/uA/njoftimet/kd4abcdef') && db.has('perdoruesit/uA/njoftimet/kd5abcdef'),
  '4. i pranuar / i refuzuar / i pranuar-e-fshirë: s\'kthehen; i fshirë pa vendim: kthehet', n4);
ok(!patch.length && Object.keys(JSON.parse(kv.get('afat-kolegu'))).length === 0, '4. pa PATCH; KV bosh', patch);
// 5. refuzimi ndërkohë (k+id ekziston): s'dyfishohet, pa push
db.set('perdoruesit/uB/njoftimet/d6abcdef', { lloji: S('afat-dergim'), afat, uid: S('uA'), emri: S('agim'), grupi: S('g1'), koha: I(tani), lexuar: B(false) });
db.set('perdoruesit/uA/njoftimet/kd6abcdef', { lloji: S('afat-kthyer'), arsye: S('refuzoi'), uid: S('uB') });
kv.set('afat-kolegu', JSON.stringify({ d6abcdef: r(6) })); kapur = [];
ok(await ktheAfatetEKolegeve(env, t10) === 0 && !kapur.length && v2(db.get('perdoruesit/uA/njoftimet/kd6abcdef')).arsye === 'refuzoi', '5. "k"+id ekziston: s\'mbishkruhet, pa push');
// 6. pa FCM_SA: s'bën asgjë
kv.set('afat-kolegu', JSON.stringify({ d7abcdef: r(7) }));
ok(await ktheAfatetEKolegeve(Object.assign({}, env, { FCM_SA: undefined }), t10) === 0 && JSON.parse(kv.get('afat-kolegu')).d7abcdef, '6. pa FCM_SA: mbetet te KV');
// 7. scheduled() e thërret
const sh = kvShkrime;
await worker.scheduled({ scheduledTime: t10, cron: '* * * * *' }, env, {});
ok(!JSON.parse(kv.get('afat-kolegu')).d7abcdef && kvShkrime > sh, '7. Cron-i (scheduled) e kthen');
// 8. versioni
const r0 = await worker.fetch(new Request('https://w.test/', { headers: { Origin: 'https://stoku.site' } }), env, {});
ok((await r0.json()).versioni >= 169, '8. versioni 169+');
console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
process.exit(g ? 1 : 0);
