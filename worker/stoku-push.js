/*
 * stoku-push — Cloudflare Worker që dërgon njoftimet "push" të chat-it (edhe kur Stoku është i mbyllur).
 *
 * Vendoset NJË HERË te Cloudflare (Workers → Create → emri "stoku-push"), me këto "Secrets" (Settings → Variables):
 *   VAPID_PUBLIC   = çelësi publik (i njëjti me PUSH_VAPID te ekipa.js)
 *   VAPID_PRIVATE  = çelësi privat (s'shkruhet kurrë në repo)
 *   VAPID_SUBJECT  = mailto:adresa-jote@... (kërkohet nga Google/Apple/Mozilla, për kontakt)
 *
 * Si punon:
 *   POST /chat  { id }  + "Authorization: Bearer <tokeni i Firebase-it>"
 *     1. lexon mesazhin ekipa_chat/{id} ME TOKENIN E DËRGUESIT (Firestore REST) — rregullat e Firestore-it
 *        vendosin vetë a lejohet (anëtar i ekipës); emri dhe teksti merren nga mesazhi, jo nga kërkesa;
 *     2. mesazhi duhet të jetë i dërguesit dhe i freskët (< 3 min) — s'mund të ridërgohen mesazhe të vjetra;
 *     3. lexon ekipa_push (pajisjet e regjistruara) dhe i dërgon secilës (përveç dërguesit) një njoftim
 *        të enkriptuar (Web Push, RFC 8291 + VAPID RFC 8292). Pajisjet që s'ekzistojnë më (404/410) fshihen.
 *   POST /kerkese { id } → kërkesa "Hiqe nga rafti" (ose "u krye") te kolegët (v147).
 *
 * Njoftimi ditor për afatet (v149) — në orën që zgjedh secili përdorues, edhe me Stoku të mbyllur:
 *   POST /orari (Bearer token, i verifikuar) { aktiv, ora: "08:00", tz, platforma, pajisja: { endpoint, p256dh, auth } }
 *     → ruan/heq orarin e kësaj pajisjeje; { afatet: [{ e, b, d }] } → afatet e përdoruesit (kopja e fundit).
 *   Cron Trigger (Settings → Trigger Events → Cron: "* * * * *" = çdo minutë) → scheduled(): kur te pajisja është ora e zgjedhur,
 *     dërgon një njoftim me afatet e skaduara (dhe ato që skadojnë këtë javë). Ruhet te i njëjti KV ("FOTO").
 *
 * Fotot e profilit (v141) — ruhen te Cloudflare KV (binding "FOTO"), JO te Firebase:
 *   PUT    /foto        (Bearer token)  → ruan foton e vetë përdoruesit (JPEG/PNG/WebP, ≤ 150 KB)
 *   DELETE /foto        (Bearer token)  → heq foton e vet
 *   GET    /fotot       (Bearer token)  → { uid: koha } për krejt fotot (për t'i shfaqur me ?v=koha)
 *   GET    /foto/{uid}?v=koha           → vetë fotoja (publike, me cache të gjatë)
 *   Tokeni verifikohet me çelësat publikë të Google-it (nënshkrimi RS256), pa lexuar databazën e Firebase-it.
 *
 * Pa varësi të jashtme: vetëm WebCrypto e Cloudflare-it.
 */

const PROJEKTI = 'stoku-appi';
const FS = 'https://firestore.googleapis.com/v1/projects/' + PROJEKTI + '/databases/(default)/documents';
const ORIGJINAT = ['https://stoku.site', 'https://www.stoku.site', 'https://stoku26.github.io', 'http://127.0.0.1:8765', 'http://localhost:8765'];
const MESAZH_MAKS_MS = 3 * 60 * 1000;
const VERSIONI_WORKER = 155; // rritet kur ndryshon kodi; aplikacioni e krahason për të thënë "ngjite kodin e ri"


export default {
  async fetch(req, env, ctx) {
    const origin = req.headers.get('Origin') || '';
    const cors = {
      'Access-Control-Allow-Origin': ORIGJINAT.includes(origin) ? origin : ORIGJINAT[0],
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin'
    };
    const pergjigju = (o, status) => new Response(JSON.stringify(o), { status: status || 200, headers: Object.assign({ 'Content-Type': 'application/json' }, cors) });
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    const rrugaF = new URL(req.url).pathname.replace(/\/+$/, '');
    if (rrugaF === '/foto' || rrugaF === '/fotot' || rrugaF.indexOf('/foto/') === 0) return trajtoFotot(req, env, rrugaF, cors, pergjigju);
    if (rrugaF === '/orari' && req.method === 'POST') return trajtoOrarin(req, env, pergjigju);
    if (req.method !== 'POST') {
      // Kontrolli i shëndetit: a janë çelësat, KV-ja, versioni i kodit dhe kur punoi Cron-i së fundi (njoftimi ditor)
      const c = env.FOTO ? await lexoCronin(env) : {};
      let cronGabim = null, kv;
      if (env.FOTO) { try { cronGabim = await env.FOTO.get('orari-cron-gabim', 'json'); } catch (e) { /* ok */ } }
      // "?kv=1": provë a pranon KV-ja shkrime (limiti falas: 1000 shkrime në ditë). Më së shumti një herë në 10 min.
      if (env.FOTO && new URL(req.url).searchParams.get('kv') === '1') kv = await provoShkrimin(env);
      return pergjigju({ ok: true, sherbimi: 'stoku-push', versioni: VERSIONI_WORKER, celesat: !!(env.VAPID_PUBLIC && env.VAPID_PRIVATE), fotot: !!env.FOTO, cron: c.koha || null, cronShprehja: c.shprehja || null, cronGabim, kv, tani: Date.now() });
    }
    if (!env.VAPID_PUBLIC || !env.VAPID_PRIVATE) return pergjigju({ ok: false, arsye: 'mungojne-celesat' }, 500);

    const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    const uid = uidNgaTokeni(token);
    if (!uid) return pergjigju({ ok: false, arsye: 'pa-hyrje' }, 401);
    const rruga = new URL(req.url).pathname.replace(/\/+$/, '');
    let trupi = {};
    try { trupi = await req.json(); } catch (e) { /* bosh */ }

    try {
      let ngarkesa, perKe;
      if (rruga === '/chat') {
        const id = String(trupi.id || '');
        if (!/^[A-Za-z0-9_-]{6,80}$/.test(id)) return pergjigju({ ok: false, arsye: 'id' }, 400);
        const m = await lexoDoc('ekipa_chat/' + id, token);
        if (!m) return pergjigju({ ok: false, arsye: 's-u-gjet' }, 404);
        if (m.uid !== uid) return pergjigju({ ok: false, arsye: 'jo-i-yti' }, 403);
        if (!(Math.abs(Date.now() - Number(m.koha || 0)) < MESAZH_MAKS_MS)) return pergjigju({ ok: false, arsye: 'i-vjeter' }, 409);
        const tekst = String(m.tekst || '');
        ngarkesa = { lloji: 'chat', titulli: (m.emri || 'Ekipa') + ' · Chat', teksti: tekst.length > 180 ? tekst.slice(0, 177) + '…' : tekst, tag: 'ek-chat-' + id, url: './index.html#ekipa/chat', koha: Number(m.koha) || Date.now() };
        perKe = a => a.uid !== uid;
      } else if (rruga === '/kerkese') {
        // Kërkesë për heqje nga rafti (ose "u krye"): ngjarja te ekipa_feed, e lexuar me tokenin e dërguesit
        const id = String(trupi.id || '');
        if (!/^[A-Za-z0-9_-]{6,80}$/.test(id)) return pergjigju({ ok: false, arsye: 'id' }, 400);
        const k = await lexoDoc('ekipa_feed/' + id, token);
        if (!k) return pergjigju({ ok: false, arsye: 's-u-gjet' }, 404);
        if (k.uid !== uid) return pergjigju({ ok: false, arsye: 'jo-i-yti' }, 403);
        if (k.lloji !== 'kerkese-heqje' && k.lloji !== 'kerkese-kryer') return pergjigju({ ok: false, arsye: 'lloji' }, 400);
        if (!(Math.abs(Date.now() - Number(k.koha || 0)) < MESAZH_MAKS_MS)) return pergjigju({ ok: false, arsye: 'i-vjeter' }, 409);
        // Një produkt: "Kos Vita (3900…)"; disa (lista `produktet`): "3 produkte (Kos Vita, Ujë, Bukë)"
        const lista = (Array.isArray(k.produktet) && k.produktet.length ? k.produktet : [{ produkti: k.produkti, barkodi: k.barkodi }])
          .filter(x => x && (x.produkti || x.barkodi));
        const emri1 = x => { const p = String(x.produkti || '').trim(), b = String(x.barkodi || '').trim(); return p && b && p !== b ? p + ' (' + b + ')' : (p || b || 'produkt'); };
        const produkti = lista.length <= 1 ? emri1(lista[0] || {}) : lista.length + ' produkte (' +
          lista.slice(0, 3).map(x => x.produkti || x.barkodi).join(', ') + (lista.length > 3 ? ' e ' + (lista.length - 3) + (lista.length - 3 === 1 ? ' tjetër' : ' të tjera') : '') + ')';
        const kush = k.emri || 'Një koleg';
        let tekst;
        if (k.lloji === 'kerkese-heqje') {
          tekst = (k.perUid ? kush + ' të kërkon ta heqësh nga rafti: ' : kush + ' i kërkon ekipës ta heqë nga rafti: ') + produkti + (k.shenim ? ' · ' + String(k.shenim) : '');
          perKe = a => a.uid !== uid && (!k.perUid || a.uid === k.perUid);
        } else {
          tekst = kush + ' e hoqi nga rafti: ' + produkti + ' (kërkesa jote)';
          perKe = a => a.uid !== uid && a.uid === k.kerkuesUid;
        }
        ngarkesa = { lloji: 'kerkese', titulli: 'Stoku · Hiqe nga rafti', teksti: tekst.length > 180 ? tekst.slice(0, 177) + '…' : tekst, tag: 'ek-kerkese-' + id, koha: Number(k.koha) || Date.now(), pamja: 'njoftimet' };
      } else {
        return pergjigju({ ok: false, arsye: 'rruga' }, 404);
      }

      const teGjitha = await listoPajisjet(token);
      // Një pajisje (endpoint) merr vetëm një njoftim; dhe kurrë njoftimin e mesazhit që e dërgoi vetë
      // (p.sh. një regjistrim i vjetër i një llogarie tjetër në të njëjtin telefon)
      const teMiat = new Set(teGjitha.filter(a => a.uid === uid).map(a => a.endpoint));
      const pare = new Set();
      const pajisjet = teGjitha.filter(perKe).filter(a => {
        if (teMiat.has(a.endpoint)) return false;
        if (pare.has(a.endpoint)) return false;
        pare.add(a.endpoint); return true;
      });
      const vapid = await pergatitVapid(env);
      let derguar = 0, fshire = 0;
      const dergoKrejt = () => Promise.all(pajisjet.map(async a => {
        try {
          // prekja e njoftimit hap të njëjtin lloj dritareje: kompjuteri → pc.html, telefoni → index.html
          const nen = ngarkesa.pamja === 'njoftimet' ? 'njoftimet' : 'chat';
          const ng = Object.assign({}, ngarkesa, { url: a.platforma === 'pc' ? './pc.html#/ekipa/' + nen : './index.html#ekipa-' + nen });
          const st = await dergoPush(a, ng, vapid);
          if (st >= 200 && st < 300) derguar++;
          else if (st === 404 || st === 410) { fshire++; await fshiDoc('ekipa_push/' + a.id, token); }
        } catch (e) { /* një pajisje e prishur s'i ndal të tjerat */ }
      }));
      await dergoKrejt();
      return pergjigju({ ok: true, pajisje: pajisjet.length, derguar, fshire });
    } catch (e) {
      return pergjigju({ ok: false, arsye: String(e && e.message || e) }, e && e.status === 403 ? 403 : 500);
    }
  },
  // Cron Trigger (çdo minutë): njoftimi ditor për afatet
  async scheduled(event, env, ctx) {
    if (!env.FOTO || !env.VAPID_PUBLIC || !env.VAPID_PRIVATE) return;
    const tani = event && event.scheduledTime ? Number(event.scheduledTime) : Date.now(), shprehja = (event && event.cron) || null;
    // Shenja që Cron-i u nis, SË PARI, që të shihet edhe nëse diçka më poshtë dështon (edhe te Logs i Cloudflare)
    console.log('stoku-push cron:', shprehja, new Date(tani).toISOString());
    await shenoCronin(env, tani, shprehja);
    try { await dergoNjoftimetDitore(env, tani, shprehja); }
    catch (e) { await shenoGabimin(env, tani, String(e && e.stack || e)); }
  }
};

// ---------------- Njoftimi ditor për afatet (Cloudflare KV + Cron) ----------------
// Çdo minutë e ditës (v152). Që njoftimi të vijë saktë në minutë, Cron-i duhet "* * * * *" (çdo minutë);
// me Cron më të rrallë vjen në ekzekutimin e parë pas orës së zgjedhur (brenda 60 min).
const ORA_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
// Shenja që Cron-i punon: { koha, shprehja }. Shkruhet vetëm kur ndryshon shprehja ose çdo 10 min (me Cron çdo
// minutë, 1440 shkrime në ditë do ta kalonin kufirin falas të KV-së).
async function lexoCronin(env) {
  try {
    const v = await env.FOTO.get('orari-cron');
    if (!v) return {};
    if (/^\d+$/.test(v)) return { koha: Number(v) };
    const o = JSON.parse(v); return { koha: Number(o.koha) || null, shprehja: o.shprehja || null };
  } catch (e) { return {}; }
}
const DATA_RE = /^\d{4}-\d{2}-\d{2}$/;
const AFATET_MAKS = 1500;
function tzIVlefshem(tz) { try { new Intl.DateTimeFormat('en', { timeZone: tz }); return true; } catch (e) { return false; } }
// Data dhe minutat e ditës në zonën kohore të pajisjes
function kohaLokale(tani, tz) {
  const pj = {};
  new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .formatToParts(new Date(tani)).forEach(x => { pj[x.type] = x.value; });
  return { dita: pj.year + '-' + pj.month + '-' + pj.day, minuta: Number(pj.hour) * 60 + Number(pj.minute) };
}
// Teksti i njoftimit ditor; null kur s'ka çka të thuhet
// Vetëm produktet që skadojnë SOT; pa to s'dërgohet asgjë
function njoftimiDitor(afatet, sot) {
  const sotL = (afatet || []).filter(a => a && DATA_RE.test(a.d || '') && a.d === sot);
  if (!sotL.length) return null;
  const emri = a => a.e || a.b || 'produkt';
  const teksti = sotL.length === 1 ? emri(sotL[0]) + ' skadon sot. Hiqe nga rafti.'
    : sotL.length + ' produkte skadojnë sot: ' + sotL.slice(0, 5).map(emri).join(', ') + (sotL.length > 5 ? '…' : '') + '.';
  return { titulli: 'Stoku · Skadon sot', teksti: teksti.length > 220 ? teksti.slice(0, 217) + '…' : teksti, sot: sotL.length };
}
async function hashEndpoint(endpoint) {
  const h = new Uint8Array(await crypto.subtle.digest('SHA-256', tekst(endpoint)));
  return Array.from(h.slice(0, 10)).map(b => b.toString(16).padStart(2, '0')).join('');
}
async function lexoIndeksinEOrareve(env) { try { return (await env.FOTO.get('orari-indeksi', 'json')) || {}; } catch (e) { return {}; } }
async function trajtoOrarin(req, env, pergjigju) {
  if (!env.FOTO) return pergjigju({ ok: false, arsye: 'mungon-kv' }, 500);
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  const uid = await verifikoTokenin(token);
  if (!uid) return pergjigju({ ok: false, arsye: 'pa-hyrje' }, 401);
  let t = {};
  try { t = await req.json(); } catch (e) { return pergjigju({ ok: false, arsye: 'json' }, 400); }
  // Afatet e përdoruesit (të përbashkëta për krejt pajisjet e tij)
  if (Array.isArray(t.afatet)) {
    const af = t.afatet.slice(0, AFATET_MAKS).filter(a => a && DATA_RE.test(a.d || '')).map(a => ({ e: String(a.e || '').slice(0, 120), b: String(a.b || '').slice(0, 40), d: a.d }));
    await env.FOTO.put('orari-afatet:' + uid, JSON.stringify(af));
  }
  const pj = t.pajisja || {};
  if (t.aktiv === undefined && !t.statusi) return pergjigju({ ok: true });
  if (typeof pj.endpoint !== 'string' || !/^https:\/\//.test(pj.endpoint) || pj.endpoint.length > 1000) return pergjigju({ ok: false, arsye: 'pajisja' }, 400);
  const celesi = 'orari:' + uid + ':' + await hashEndpoint(pj.endpoint);
  const ind = await lexoIndeksinEOrareve(env);
  // Gjendja e orarit të kësaj pajisjeje (për Cilësimet → Njoftimet): a ekziston, kur u dërgua së fundi dhe si
  if (t.statusi) {
    const x = ind[celesi] || null;
    const cron = (await lexoCronin(env)).koha || null;
    const af = await env.FOTO.get('orari-afatet:' + uid, 'json');
    return pergjigju({ ok: true, ekziston: !!x, ora: x && x.ora, dita: x && x.dita, rez: x && x.rez, kohaRez: x && x.kohaRez, cron, afatet: af ? af.length : null });
  }
  if (!t.aktiv) {
    await env.FOTO.delete(celesi);
    if (ind[celesi]) { delete ind[celesi]; await env.FOTO.put('orari-indeksi', JSON.stringify(ind)); }
    return pergjigju({ ok: true, aktiv: false });
  }
  if (!ORA_RE.test(t.ora || '')) return pergjigju({ ok: false, arsye: 'ora' }, 400);
  const tz = String(t.tz || 'Europe/Belgrade');
  if (!tzIVlefshem(tz)) return pergjigju({ ok: false, arsye: 'tz' }, 400);
  if (!/^[A-Za-z0-9_-]{20,200}$/.test(pj.p256dh || '') || !/^[A-Za-z0-9_-]{10,100}$/.test(pj.auth || '')) return pergjigju({ ok: false, arsye: 'pajisja' }, 400);
  const rek = { uid, ora: t.ora, tz, platforma: t.platforma === 'pc' ? 'pc' : 'tel', pajisja: { endpoint: pj.endpoint, p256dh: pj.p256dh, auth: pj.auth } };
  await env.FOTO.put(celesi, JSON.stringify(rek));
  // E njëjta orë → s'ndryshon asgjë (s'ridërgohet sot). Orë e re: nëse është ende përpara sot, njoftimi vjen sot në
  // orën e re (edhe nëse sot është dërguar një herë në orën e vjetër); nëse ka kaluar, nga nesër.
  const para = ind[celesi];
  if (para && para.ora === t.ora && para.tz === tz) {
    await env.FOTO.put('orari-indeksi', JSON.stringify(ind));
    return pergjigju({ ok: true, aktiv: true, ora: t.ora });
  }
  const lok = kohaLokale(Date.now(), tz), [hh, mm] = t.ora.split(':').map(Number);
  const dita = lok.minuta >= hh * 60 + mm ? lok.dita : '';
  ind[celesi] = Object.assign({}, para || {}, { ora: t.ora, tz, dita });
  await env.FOTO.put('orari-indeksi', JSON.stringify(ind));
  return pergjigju({ ok: true, aktiv: true, ora: t.ora });
}
async function dergoNjoftimetDitore(env, tani, shprehja) {
  const ind = await lexoIndeksinEOrareve(env);
  let ndryshoi = false, derguar = 0;
  const afatetPerUid = {};
  let vapid = null;
  for (const celesi of Object.keys(ind)) {
    const x = ind[celesi];
    if (!x || !ORA_RE.test(x.ora || '') || !tzIVlefshem(x.tz)) { delete ind[celesi]; ndryshoi = true; continue; }
    const lok = kohaLokale(tani, x.tz), [hh, mm] = x.ora.split(':').map(Number), synimi = hh * 60 + mm;
    // Brenda orës pas kohës së zgjedhur (Cron mund të vonohet pak) dhe vetëm një herë në ditë
    if (x.dita === lok.dita || lok.minuta < synimi || lok.minuta >= synimi + 60) continue;
    x.dita = lok.dita; x.kohaRez = tani; ndryshoi = true;
    try {
      const rek = await env.FOTO.get(celesi, 'json');
      if (!rek) { delete ind[celesi]; continue; }
      if (!(rek.uid in afatetPerUid)) afatetPerUid[rek.uid] = (await env.FOTO.get('orari-afatet:' + rek.uid, 'json')) || [];
      const nj = njoftimiDitor(afatetPerUid[rek.uid], lok.dita);
      if (!nj) { x.rez = 'asgje'; continue; }
      if (!vapid) vapid = await pergatitVapid(env);
      const ng = { lloji: 'afatet', titulli: nj.titulli, teksti: nj.teksti, tag: 'stoku-ditor', koha: tani,
        url: rek.platforma === 'pc' ? './pc.html#/afatet' : './index.html#afatet' };
      const st = await dergoPush(rek.pajisja, ng, vapid);
      x.rez = st >= 200 && st < 300 ? 'derguar' : 'gabim-' + st;
      if (st >= 200 && st < 300) derguar++;
      else if (st === 404 || st === 410) { await env.FOTO.delete(celesi); delete ind[celesi]; }
    } catch (e) { x.rez = 'gabim'; /* një pajisje e prishur s'i ndal të tjerat */ }
  }
  if (ndryshoi) await env.FOTO.put('orari-indeksi', JSON.stringify(ind));
  return derguar;
}
// Shenja që Cron-i punon (e sheh aplikacioni te Cilësimet → Njoftimet). Gabimi i shkrimit ruhet te 'orari-cron-gabim'.
async function shenoCronin(env, tani, shprehja) {
  try {
    const para = await lexoCronin(env);
    if (!para.koha || tani - para.koha >= 10 * 60000 || (shprehja || null) !== (para.shprehja || null))
      await env.FOTO.put('orari-cron', JSON.stringify({ koha: tani, shprehja: shprehja || null }));
  } catch (e) { await shenoGabimin(env, tani, 'shenja: ' + String(e && e.message || e)); }
}
// Gabimi i Cron-it: del te Logs i Cloudflare dhe te health ("cronGabim"). I njëjti gabim rishkruhet më së shumti
// një herë në 10 min, që të mos harxhohen shkrimet e KV-së kur Cron-i punon çdo minutë.
async function shenoGabimin(env, tani, mesazh) {
  mesazh = mesazh.slice(0, 300);
  console.error('stoku-push cron:', mesazh);
  try {
    const para = await env.FOTO.get('orari-cron-gabim', 'json');
    if (para && para.mesazh === mesazh && tani - para.koha < 10 * 60000) return;
    await env.FOTO.put('orari-cron-gabim', JSON.stringify({ koha: tani, mesazh }));
  } catch (x) { console.error('stoku-push cron: gabimi s\'u ruajt:', String(x && x.message || x)); }
}
async function provoShkrimin(env) {
  try {
    const para = await env.FOTO.get('kv-prove', 'json');
    if (para && Date.now() - para.koha < 10 * 60000) return { ok: para.ok, koha: para.koha, mesazh: para.mesazh || null };
    const o = { ok: true, koha: Date.now() };
    await env.FOTO.put('kv-prove', JSON.stringify(o));
    return o;
  } catch (e) { return { ok: false, koha: Date.now(), mesazh: String(e && e.message || e).slice(0, 200) }; }
}
export { njoftimiDitor, kohaLokale, dergoNjoftimetDitore };

// ---------------- Fotot e profilit (Cloudflare KV) ----------------
const FOTO_MAKS = 150 * 1024;
const PROJEKTI_ISS = 'https://securetoken.google.com/' + PROJEKTI;
const JWK_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
let jwkCache = { celesat: null, skadon: 0 };
async function celesatEGoogle() {
  if (jwkCache.celesat && Date.now() < jwkCache.skadon) return jwkCache.celesat;
  const r = await fetch(JWK_URL);
  if (!r.ok) throw new Error('jwk-' + r.status);
  const j = await r.json();
  const m = /max-age=(\d+)/.exec(r.headers.get('Cache-Control') || '');
  jwkCache = { celesat: j.keys || [], skadon: Date.now() + (m ? Number(m[1]) * 1000 : 3600e3) };
  return jwkCache.celesat;
}
// Verifikon tokenin e Firebase Auth (RS256, iss/aud/exp) dhe kthen uid-in — ose null
export async function verifikoTokenin(token, celesat) {
  try {
    const p = String(token || '').split('.');
    if (p.length !== 3) return null;
    const krye = JSON.parse(new TextDecoder().decode(b64uDekodo(p[0])));
    const trup = JSON.parse(new TextDecoder().decode(b64uDekodo(p[1])));
    if (krye.alg !== 'RS256' || !krye.kid) return null;
    const tani = Math.floor(Date.now() / 1000);
    if (trup.iss !== PROJEKTI_ISS || trup.aud !== PROJEKTI || !trup.sub || typeof trup.sub !== 'string' || trup.sub.length > 128) return null;
    if (!(trup.exp > tani) || !(trup.iat <= tani + 300)) return null;
    const jwk = (celesat || await celesatEGoogle()).find(k => k.kid === krye.kid);
    if (!jwk) return null;
    const celesi = await crypto.subtle.importKey('jwk', { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true }, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', celesi, b64uDekodo(p[2]), tekst(p[0] + '.' + p[1]));
    return ok ? trup.sub : null;
  } catch (e) { return null; }
}
function llojiIFotos(b) {
  if (b.length > 3 && b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) return 'image/jpeg';
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47) return 'image/png';
  if (b.length > 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'image/webp';
  return null;
}
async function lexoIndeksin(env) { try { return (await env.FOTO.get('indeksi', 'json')) || {}; } catch (e) { return {}; } }
async function trajtoFotot(req, env, rruga, cors, pergjigju) {
  if (!env.FOTO) return pergjigju({ ok: false, arsye: 'mungon-kv' }, 500);
  // Vetë fotoja: publike (uid-i s'merret me mend), me cache të gjatë kur ka ?v=
  if (req.method === 'GET' && rruga.indexOf('/foto/') === 0) {
    const uid = decodeURIComponent(rruga.slice(6));
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(uid)) return new Response('', { status: 400, headers: cors });
    const r = await env.FOTO.getWithMetadata('foto:' + uid, 'arrayBuffer');
    if (!r || !r.value) return new Response('', { status: 404, headers: Object.assign({ 'Cache-Control': 'public, max-age=60' }, cors) });
    const meV = new URL(req.url).searchParams.has('v');
    return new Response(r.value, { headers: Object.assign({ 'Content-Type': (r.metadata && r.metadata.lloji) || 'image/jpeg', 'Cache-Control': meV ? 'public, max-age=31536000, immutable' : 'public, max-age=300' }, cors) });
  }
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  const uid = await verifikoTokenin(token);
  if (!uid) return pergjigju({ ok: false, arsye: 'pa-hyrje' }, 401);
  if (req.method === 'GET' && rruga === '/fotot') return pergjigju({ ok: true, fotot: await lexoIndeksin(env) });
  if (rruga !== '/foto') return pergjigju({ ok: false, arsye: 'rruga' }, 404);
  if (req.method === 'PUT') {
    const b = new Uint8Array(await req.arrayBuffer());
    if (!b.length || b.length > FOTO_MAKS) return pergjigju({ ok: false, arsye: 'madhesia' }, 413);
    const lloji = llojiIFotos(b);
    if (!lloji) return pergjigju({ ok: false, arsye: 'jo-foto' }, 415);
    const koha = Date.now();
    await env.FOTO.put('foto:' + uid, b, { metadata: { koha, lloji } });
    const ind = await lexoIndeksin(env); ind[uid] = koha;
    await env.FOTO.put('indeksi', JSON.stringify(ind));
    return pergjigju({ ok: true, koha });
  }
  if (req.method === 'DELETE') {
    await env.FOTO.delete('foto:' + uid);
    const ind = await lexoIndeksin(env); delete ind[uid];
    await env.FOTO.put('indeksi', JSON.stringify(ind));
    return pergjigju({ ok: true });
  }
  return pergjigju({ ok: false, arsye: 'metoda' }, 405);
}

// ---------------- Firestore REST (me tokenin e përdoruesit: rregullat vlejnë si në aplikacion) ----------------
function uidNgaTokeni(t) {
  const p = t.split('.');
  if (p.length !== 3) return null;
  try { const o = JSON.parse(new TextDecoder().decode(b64uDekodo(p[1]))); return typeof o.user_id === 'string' ? o.user_id : (o.sub || null); } catch (e) { return null; }
}
function vleraNga(v) {
  if (!v) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('mapValue' in v) return objektNga(v.mapValue.fields || {});
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(vleraNga);
  if ('nullValue' in v) return null;
  return null;
}
function objektNga(fields) { const o = {}; for (const k in fields) o[k] = vleraNga(fields[k]); return o; }
async function lexoDoc(rruga, token) {
  const r = await fetch(FS + '/' + rruga, { headers: { Authorization: 'Bearer ' + token } });
  if (r.status === 404) return null;
  if (!r.ok) { const e = new Error('firestore-' + r.status); e.status = r.status; throw e; }
  const j = await r.json();
  return objektNga(j.fields || {});
}
async function listoPajisjet(token) {
  const lista = [];
  let faqja = '';
  for (let i = 0; i < 5; i++) {
    const r = await fetch(FS + '/ekipa_push?pageSize=300' + (faqja ? '&pageToken=' + encodeURIComponent(faqja) : ''), { headers: { Authorization: 'Bearer ' + token } });
    if (!r.ok) { const e = new Error('firestore-' + r.status); e.status = r.status; throw e; }
    const j = await r.json();
    (j.documents || []).forEach(d => {
      const o = objektNga(d.fields || {});
      o.id = d.name.split('/').pop();
      if (o.endpoint && o.p256dh && o.auth && /^https:\/\//.test(o.endpoint)) lista.push(o);
    });
    if (!j.nextPageToken) break;
    faqja = j.nextPageToken;
  }
  return lista;
}
async function fshiDoc(rruga, token) {
  try { await fetch(FS + '/' + rruga, { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } }); } catch (e) { /* ok */ }
}

// ---------------- Web Push: VAPID (RFC 8292) + enkriptimi aes128gcm (RFC 8291) ----------------
function b64uDekodo(s) {
  s = String(s).replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const b = atob(s), u = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
  return u;
}
function b64uKodo(u) {
  u = new Uint8Array(u);
  let s = '';
  for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function bashko(...pjeset) {
  const n = pjeset.reduce((a, p) => a + p.length, 0), r = new Uint8Array(n);
  let o = 0;
  pjeset.forEach(p => { r.set(p, o); o += p.length; });
  return r;
}
const tekst = s => new TextEncoder().encode(s);

async function pergatitVapid(env) {
  const pub = b64uDekodo(env.VAPID_PUBLIC);
  const jwk = { kty: 'EC', crv: 'P-256', d: env.VAPID_PRIVATE, x: b64uKodo(pub.slice(1, 33)), y: b64uKodo(pub.slice(33, 65)), ext: true };
  const celesi = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  return { celesi, publik: env.VAPID_PUBLIC, subjekti: env.VAPID_SUBJECT || 'mailto:stoku@stoku.site', jwt: {} };
}
async function jwtVapid(vapid, aud) {
  const tani = Math.floor(Date.now() / 1000);
  const ruajtur = vapid.jwt[aud];
  if (ruajtur && ruajtur.skadon - tani > 600) return ruajtur.t;
  const krye = b64uKodo(tekst(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  // 1 orë: Apple (web.push.apple.com) i refuzon tokenat me afat të gjatë; Google/Mozilla e pranojnë po ashtu
  const skadon = tani + 3600;
  const trup = b64uKodo(tekst(JSON.stringify({ aud, exp: skadon, sub: vapid.subjekti })));
  const nenshkrimi = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, vapid.celesi, tekst(krye + '.' + trup));
  const t = krye + '.' + trup + '.' + b64uKodo(nenshkrimi);
  vapid.jwt[aud] = { t, skadon };
  return t;
}
async function hkdf(salt, ikm, info, gjatesia) {
  const k = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, k, gjatesia * 8));
}
// Enkripton ngarkesën për një pajisje (aes128gcm). `prova` lejon salt/çelës të caktuar (vetëm për testet).
export async function enkripto(p256dh, authSekret, teDhenat, prova) {
  const uaPub = b64uDekodo(p256dh), auth = b64uDekodo(authSekret);
  const lokal = (prova && prova.lokal) || await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const asPub = new Uint8Array(await crypto.subtle.exportKey('raw', lokal.publicKey));
  const uaKey = await crypto.subtle.importKey('raw', uaPub, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const ecdh = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, lokal.privateKey, 256));
  const salt = (prova && prova.salt) || crypto.getRandomValues(new Uint8Array(16));
  const ikm = await hkdf(auth, ecdh, bashko(tekst('WebPush: info\0'), uaPub, asPub), 32);
  const cek = await hkdf(salt, ikm, tekst('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, tekst('Content-Encoding: nonce\0'), 12);
  const k = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const rekordi = bashko(teDhenat, new Uint8Array([2])); // 0x02 = rekordi i fundit
  const shifruar = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, k, rekordi));
  const rs = new Uint8Array([0, 0, 16, 0]); // 4096
  return bashko(salt, rs, new Uint8Array([asPub.length]), asPub, shifruar);
}
async function dergoPush(a, ngarkesa, vapid) {
  const url = new URL(a.endpoint);
  const jwt = await jwtVapid(vapid, url.origin);
  const trupi = await enkripto(a.p256dh, a.auth, tekst(JSON.stringify(ngarkesa)));
  const r = await fetch(a.endpoint, {
    method: 'POST',
    headers: {
      'Authorization': 'vapid t=' + jwt + ', k=' + vapid.publik,
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      'TTL': '86400',
      'Urgency': 'high'
    },
    body: trupi
  });
  return r.status;
}
