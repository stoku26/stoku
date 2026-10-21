import worker from './worker.mjs';
import ece from 'http_ece';
import crypto from 'node:crypto';
const b64u = b => Buffer.from(b).toString('base64url');
const ua = crypto.createECDH('prime256v1'); ua.generateKeys(); const auth = crypto.randomBytes(16);
const v = crypto.createECDH('prime256v1'); v.generateKeys();
const env = { VAPID_PUBLIC: b64u(v.getPublicKey()), VAPID_PRIVATE: b64u(v.getPrivateKey()), VAPID_SUBJECT: 'mailto:t@stoku.site' };
const tani = Date.now(); let kapur = [], fshire = [];
const S = s => ({ stringValue: s }), I = n => ({ integerValue: String(n) });
// perdoruesit/{per}/njoftimet/{id}
const nj = {
  'uB/n1abcdef': { lloji: S('hequr'), uid: S('uA'), emri: S('agim'), grupi: S('g1'), koha: I(tani), produkti: S('Kos Vita'), barkodi: S('390028'), data: S('2026-10-05'), afatId: S('a1'), lexuar: { booleanValue: false } },
  'uB/n2abcdef': { lloji: S('heqje-pranuar'), uid: S('uA'), emri: S('agim'), grupi: S('g1'), koha: I(tani), produkti: S(''), barkodi: S('12345678') },
  'uC/n3abcdef': { lloji: S('heqje-refuzuar'), uid: S('uA'), emri: S('agim'), grupi: S('g1'), koha: I(tani), produkti: S('Ujë') },
  'uB/n4abcdef': { lloji: S('lajmerim'), uid: S('uA'), emri: S('agim'), grupi: S('g1'), koha: I(tani), tekst: S('Nesër inventar në ora 8.') },
  'uB/n5abcdef': { lloji: S('admin-afat'), uid: S('uA'), emri: S('mendurberisha'), grupi: S('g1'), koha: I(tani), veprimi: S('kthe'), produkti: S('Djathë') },
  'uB/n6abcdef': { lloji: S('hequr'), uid: S('uX'), emri: S('tjetri'), grupi: S('g1'), koha: I(tani), produkti: S('x') },
  'uB/n7abcdef': { lloji: S('hequr'), uid: S('uA'), emri: S('agim'), grupi: S('g1'), koha: I(tani - 3600e3), produkti: S('x') },
  'uB/n8abcdef': { lloji: S('kerkese-heqje'), uid: S('uA'), emri: S('agim'), grupi: S('g1'), koha: I(tani), produkti: S('x') },
  'uB/n9abcdef': { lloji: S('hequr'), uid: S('uA'), emri: S('agim'), grupi: S('g2'), koha: I(tani), produkti: S('x') },
  'uA/naabcdef': { lloji: S('hequr'), uid: S('uA'), emri: S('agim'), grupi: S('g1'), koha: I(tani), produkti: S('x') },
  'uD/nbabcdef': { lloji: S('hequr'), uid: S('uA'), emri: S('agim'), grupi: S('g1'), koha: I(tani), produkti: S('x') }
};
const pajisja = (u, k, pc) => ({ name: 'x/grupet/g1/push/' + u + '_' + k, fields: { uid: S(u), endpoint: S('https://push.test/' + u + k), p256dh: S(b64u(ua.getPublicKey())), auth: S(b64u(auth)), platforma: S(pc ? 'pc' : 'tel') } });
const pajisjet = [pajisja('uA', '1'), pajisja('uB', '1'), pajisja('uB', '2', true), pajisja('uC', '1', true), pajisja('uD', '1')];
const anetaret = ['uA', 'uB', 'uC'].map(u => ({ name: 'x/grupet/g1/anetaret/' + u, fields: {} })); // uD s'është më në grup
globalThis.fetch = async (url, opt = {}) => {
  url = String(url);
  const m = url.match(/\/perdoruesit\/([A-Za-z0-9]+)\/njoftimet\/([A-Za-z0-9]+)$/);
  if (m) {
    const d = nj[m[1] + '/' + m[2]];
    // rregulli i ri: vetëm dërguesi (uid i tokenit = uA) e lexon; dokument që s'ekziston → 403 (si Firestore me resource == null)
    if (!d || d.uid.stringValue !== 'uA') return new Response('{}', { status: 403 });
    return new Response(JSON.stringify({ fields: d }));
  }
  if (url.includes('/grupet/g1/push?')) return new Response(JSON.stringify({ documents: pajisjet }));
  if (url.includes('/grupet/g1/anetaret?')) return new Response(JSON.stringify({ documents: anetaret }));
  if (opt.method === 'DELETE') { fshire.push(url.split('/').pop()); return new Response('{}'); }
  if (url.startsWith('https://push.test')) { kapur.push({ ku: url.split('/').pop(), ng: JSON.parse(ece.decrypt(Buffer.from(opt.body), { version: 'aes128gcm', privateKey: ua, authSecret: auth }).toString()) }); return new Response('', { status: 201 }); }
  return new Response('?', { status: 500 });
};
const tok = 'x.' + b64u(JSON.stringify({ user_id: 'uA', sub: 'uA' })) + '.y';
const thirr = async (id, per, grupi = 'g1') => { kapur = []; fshire = []; const r = await worker.fetch(new Request('https://w.test/njoftim', { method: 'POST', headers: { Authorization: 'Bearer ' + tok }, body: JSON.stringify({ id, per, grupi }) }), env); return [r.status, await r.json()]; };
const ok = (k, m, x) => console.log((k ? 'OK  ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : ''));
let [st, j] = await thirr('n1abcdef', 'uB');
ok(st === 200 && kapur.map(x => x.ku).sort().join() === 'uB1,uB2', 'heqja që pret miratimin: vetëm te dy pajisjet e marrësit', kapur.map(x => x.ku));
const tel = kapur.find(x => x.ku === 'uB1'), pc = kapur.find(x => x.ku === 'uB2');
ok(tel && tel.ng.teksti === 'agim e hoqi nga rafti: Kos Vita (skadoi më 05.10.2026)' && tel.ng.titulli === 'Stoku · Grupi' && tel.ng.tag === 'ek-nj-n1abcdef' && tel.ng.url === './index.html#ekipa-njoftimet' && tel.ng.lloji === 'njoftim', 'teksti, titulli, tag-u (si te aplikacioni), url tel', tel && tel.ng);
ok(pc && pc.ng.url === './pc.html#/ekipa/njoftimet', 'url PC', pc && pc.ng.url);
[st] = await thirr('n2abcdef', 'uB'); ok(st === 200 && kapur.length === 2 && kapur[0].ng.teksti === 'agim e pranoi heqjen nga rafti: 12345678', 'pranuar', kapur[0] && kapur[0].ng.teksti);
[st] = await thirr('n3abcdef', 'uC'); ok(st === 200 && kapur.length === 1 && kapur[0].ku === 'uC1' && kapur[0].ng.teksti === 'agim e refuzoi heqjen nga rafti: Ujë (mbetet në raft)', 'refuzuar → uC', kapur.map(x => [x.ku, x.ng.teksti]));
[st] = await thirr('n4abcdef', 'uB'); ok(st === 200 && kapur[0] && kapur[0].ng.teksti === 'agim: Nesër inventar në ora 8.', 'njoftimi për krejt grupin', kapur[0] && kapur[0].ng.teksti);
[st] = await thirr('n5abcdef', 'uB'); ok(st === 200 && kapur[0] && kapur[0].ng.teksti === 'mendurberisha e ktheu në raft: Djathë', 'administratori', kapur[0] && kapur[0].ng.teksti);
[st, j] = await thirr('n6abcdef', 'uB'); ok(st === 403 && j.arsye === 'rregullat' && !kapur.length, 'njoftimi i dikujt tjetër → 403 (rregullat s\'e lejojnë leximin)', [st, j]);
[st] = await thirr('n7abcdef', 'uB'); ok(st === 409 && !kapur.length, 'i vjetër → 409', st);
[st] = await thirr('n8abcdef', 'uB'); ok(st === 400 && !kapur.length, 'kërkesat (kerkese-*) i dërgon /kerkese → 400', st);
[st] = await thirr('n9abcdef', 'uB'); ok(st === 403 && !kapur.length, 'grup tjetër nga ai i njoftimit → 403', st);
[st] = await thirr('n1abcdef', 'uB', 'g2'); ok(st === 403 && !kapur.length, 'grupi i kërkesës ≠ grupi i njoftimit → 403', st);
[st] = await thirr('naabcdef', 'uA'); ok(st === 403 && !kapur.length, 'vetes → 403', st);
[st, j] = await thirr('nbabcdef', 'uD'); ok(st === 200 && !kapur.length && fshire.includes('uD_1'), 'marrësi s\'është më në grup: s\'merr asgjë, pajisja fshihet', [st, j, fshire]);
[st] = await thirr('n1abcdef', 'uB', ''); ok(st === 400, 'pa grup → 400', st);
[st] = await thirr('../x', 'uB'); ok(st === 400, 'id e keqe → 400', st);
[st] = await thirr('n1abcdef', '../uB'); ok(st === 400, 'marrës i keq → 400', st);
