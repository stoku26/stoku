import worker from './worker.mjs';
import ece from 'http_ece';
import crypto from 'node:crypto';
const b64u = b => Buffer.from(b).toString('base64url');
const ua = crypto.createECDH('prime256v1'); ua.generateKeys(); const auth = crypto.randomBytes(16);
const v = crypto.createECDH('prime256v1'); v.generateKeys();
const env = { VAPID_PUBLIC: b64u(v.getPublicKey()), VAPID_PRIVATE: b64u(v.getPrivateKey()), VAPID_SUBJECT: 'mailto:t@stoku.site' };
const tani = Date.now(); let kapur = [];
const S = s => ({ stringValue: s }), I = n => ({ integerValue: String(n) });
const feed = {
  k1abcdef: { lloji: S('kerkese-heqje'), uid: S('uA'), emri: S('agim'), koha: I(tani), produkti: S('Kos Vita'), barkodi: S('390028'), shenim: S('i dëmtuar'), perUid: S('uB'), perEmri: S('blerta') },
  k2abcdef: { lloji: S('kerkese-heqje'), uid: S('uA'), emri: S('agim'), koha: I(tani), produkti: S(''), barkodi: S('12345678'), shenim: S(''), perUid: S('') },
  k3abcdef: { lloji: S('kerkese-kryer'), uid: S('uA'), emri: S('agim'), koha: I(tani), produkti: S('Ujë'), barkodi: S(''), kerkuesUid: S('uC') },
  k4abcdef: { lloji: S('kerkese-heqje'), uid: S('uX'), emri: S('tjetri'), koha: I(tani), produkti: S('x') },
  k5abcdef: { lloji: S('kerkese-heqje'), uid: S('uA'), emri: S('agim'), koha: I(tani - 3600e3), produkti: S('x') },
  k7abcdef: { lloji: S('kerkese-heqje'), uid: S('uA'), emri: S('agim'), koha: I(tani), produkti: S('Djathë'), barkodi: S('444'), perUid: S('uB'), shenim: S(''),
    produktet: { arrayValue: { values: ['Djathë|444', 'Kos Vita|390028', 'Ujë|', 'Bukë|'].map(x => ({ mapValue: { fields: { produkti: S(x.split('|')[0]), barkodi: S(x.split('|')[1]) } } })) } } },
  k6abcdef: { lloji: S('lajmerim'), uid: S('uA'), emri: S('agim'), koha: I(tani), tekst: S('x') }
};
const pajisje = ['uA', 'uB', 'uC'].map(u => ({ name: 'x/ekipa_push/' + u + '_1', fields: { uid: S(u), endpoint: S('https://push.test/' + u), p256dh: S(b64u(ua.getPublicKey())), auth: S(b64u(auth)), platforma: S(u === 'uC' ? 'pc' : 'tel') } }));
globalThis.fetch = async (url, opt = {}) => {
  url = String(url);
  const m = url.match(/\/ekipa_feed\/([A-Za-z0-9]+)/);
  if (m) return feed[m[1]] ? new Response(JSON.stringify({ fields: feed[m[1]] })) : new Response('{}', { status: 404 });
  if (url.includes('/ekipa_push?')) return new Response(JSON.stringify({ documents: pajisje }));
  if (url.startsWith('https://push.test')) { kapur.push({ ku: url.split('/').pop(), ng: JSON.parse(ece.decrypt(Buffer.from(opt.body), { version: 'aes128gcm', privateKey: ua, authSecret: auth }).toString()) }); return new Response('', { status: 201 }); }
  return new Response('?', { status: 500 });
};
const tok = 'x.' + b64u(JSON.stringify({ user_id: 'uA', sub: 'uA' })) + '.y';
const thirr = async id => { kapur = []; const r = await worker.fetch(new Request('https://w.test/kerkese', { method: 'POST', headers: { Authorization: 'Bearer ' + tok }, body: JSON.stringify({ id }) }), env); return [r.status, await r.json()]; };
const ok = (k, m, x) => console.log((k ? 'OK  ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : ''));
let [st] = await thirr('k1abcdef');
ok(st === 200 && kapur.length === 1 && kapur[0].ku === 'uB', 'për një koleg: vetëm Blerta', kapur.map(x => x.ku));
ok(kapur[0] && kapur[0].ng.teksti === 'agim të kërkon ta heqësh nga rafti: Kos Vita (390028) · i dëmtuar' && kapur[0].ng.url === './index.html#ekipa-njoftimet' && kapur[0].ng.titulli === 'Stoku · Hiqe nga rafti', 'teksti + url', kapur[0] && kapur[0].ng);
[st] = await thirr('k2abcdef');
ok(st === 200 && kapur.map(x => x.ku).sort().join() === 'uB,uC', 'krejt ekipa: të gjithë përveç dërguesit', kapur.map(x => x.ku));
ok(kapur.find(x => x.ku === 'uC').ng.url === './pc.html#/ekipa/njoftimet' && /i kërkon grupit ta heqë nga rafti: 12345678$/.test(kapur[0].ng.teksti), 'PC url + teksti krejt', kapur.find(x => x.ku === 'uC').ng);
[st] = await thirr('k3abcdef');
ok(st === 200 && kapur.length === 1 && kapur[0].ku === 'uC' && /agim e hoqi nga rafti: Ujë \(kërkesa jote\)/.test(kapur[0].ng.teksti), 'u krye: vetëm te ai që e kërkoi', kapur.map(x => [x.ku, x.ng.teksti]));
[st] = await thirr('k4abcdef'); ok(st === 403 && !kapur.length, 'ngjarja e dikujt tjetër → 403', st);
[st] = await thirr('k5abcdef'); ok(st === 409 && !kapur.length, 'e vjetër → 409', st);
[st] = await thirr('k6abcdef'); ok(st === 400 && !kapur.length, 'lloj tjetër → 400', st);
[st] = await thirr('k7abcdef');
ok(st === 200 && kapur.length === 1 && kapur[0].ng.teksti === 'agim të kërkon ta heqësh nga rafti: 4 produkte (Djathë, Kos Vita, Ujë e 1 tjetër)', 'disa produkte (lista)', kapur[0] && kapur[0].ng.teksti);
[st] = await thirr('nukka99'); ok(st === 404, 's\'ekziston → 404', st);
[st] = await thirr('../x'); ok(st === 400, 'id e keqe → 400', st);
