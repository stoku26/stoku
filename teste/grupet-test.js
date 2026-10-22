// v164: grupet — migrimi i ekipës së vjetër, grup i ri, ftesa, ndarja mes grupeve, pronari, largimi, siguria
const { chromium } = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
const SC = __dirname + '/';
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const PUSH = 'https://stoku-push.mendurb.workers.dev';
(async () => {
  const F = krijoFirestore({ rregullat: 'reja' });
  const t = Date.now();
  // Ekipa e vjetër: admini + agimi (i pranuar), historiku i aktivitetit (+ një mesazh i vjetër chat-i: v221 s'e kopjon më)
  F.S.docs.set('perdoruesit/uA', { perdoruesi: 'mendurberisha', emri: 'mendurberisha', kycurSe: t });
  F.S.docs.set('perdoruesit/u1', { perdoruesi: 'agim', kycurSe: t });
  F.S.docs.set('perdoruesit/u2', { perdoruesi: 'besa', kycurSe: t });
  F.S.docs.set('perdoruesit/u3', { perdoruesi: 'drini', kycurSe: t });
  F.S.docs.set('ekipa_anetaret/u1', { emri: 'agim', pranuarSe: t - 864e5 });
  F.S.docs.set('ekipa_chat/c1', { uid: 'u1', emri: 'agim', tekst: 'Mirëmëngjes ekipë', koha: t - 3600e3 });
  F.S.docs.set('ekipa_feed/e1', { lloji: 'afate-te-reja', n: 3, uid: 'u1', emri: 'agim', koha: t - 3500e3 });
  F.S.docs.set('ekipa_afatet/u1', { uid: 'u1', emri: 'agim', afatet: [{ id: 'x1', emri: 'Kos', data: '2026-10-08', statusi: 'aktiv' }], ndryshuarSe: t });
  F.S.docs.set('dyqane/u2', { app: 'stoku', version: 3, foldera: [], produktet: [], afatet: [{ id: 'b1', emri: 'Bukë', barkodi: '1', data: new Date(t - 2 * 864e5).toISOString().slice(0, 10), statusi: 'aktiv', ndryshuarSe: t }], fshira: {} });
  const b = await chromium.launch();
  const pushet = [];
  async function faqe(uid, emri, pc) {
    const ctx = await b.newContext(pc ? { viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' }
      : { userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
    await F.lidh(ctx, uid, emri + '@stoku-app.local', pc ? 'pc' : 'tel');
    await ctx.route(u => u.href.startsWith(PUSH), async r => { const q = r.request(); if (q.method() === 'POST') pushet.push(uid + ' ' + new URL(q.url()).pathname + ' ' + (q.postData() || '')); r.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true, fotot: {} }) }); });
    const p = await ctx.newPage();
    p.on('pageerror', e => { g++; console.log('[' + emri + '] pageerror:', e.message); });
    p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) { g++; console.log('[' + emri + '] console:', m.text()); } });
    await p.goto((process.env.STOKU_B || 'http://127.0.0.1:8765') + '/' + (pc ? 'pc.html#/ekipa' : 'index.html'));
    await p.waitForTimeout(2500);
    return p;
  }
  const doc = k => F.S.docs.get(k);
  const keys = pre => [...F.S.docs.keys()].filter(k => k.startsWith(pre));

  // 1. Admini (PC) hap versionin e ri → ekipa e vjetër bëhet grupi "ekipa"
  const admin = await faqe('uA', 'mendurberisha', true);
  await admin.waitForTimeout(1500);
  ok(doc('grupet/ekipa') && doc('grupet/ekipa').emri === 'Ekipa' && doc('grupet/ekipa').pronarUid === 'uA', '1. grupi "ekipa" u krijua nga admini', doc('grupet/ekipa'));
  ok(doc('grupet/ekipa/anetaret/uA').roli === 'pronar' && doc('grupet/ekipa/anetaret/u1').roli === 'anetar', '1. anëtarët: admini pronar, agimi anëtar', keys('grupet/ekipa/anetaret/'));
  ok(!doc('grupet/ekipa/chat/c1') && doc('grupet/ekipa/feed/e1') && doc('grupet/ekipa/afatet/u1'), '1. historiku u kopjua (aktiviteti, afatet; chat-i jo, v221)');
  ok(doc('perdoruesit/uA').grupi === 'ekipa' && doc('perdoruesit/uA').grupetMigruarSe, '1. treguesi + shenja e migrimit');
  const gI1 = await admin.evaluate(() => window.__stokuEkipaK.grupiInfo());
  ok(!(await admin.isVisible('#ekPaGrup')) && gI1 && gI1.id === 'ekipa' && gI1.emri === 'Ekipa', '1. PC: Ekipa e hapur me grupin', gI1);
  await admin.click('#ekMenu [data-n="anetaret"]').catch(() => {}); await admin.waitForTimeout(800);
  ok(await admin.textContent('#ekGrupiTitulli') === 'Ekipa' && /admin i grupit/.test(await admin.textContent('#ekGrupiNen')) && await admin.isVisible('#ekFtoKarta'), '1. PC: karta e grupit + "Fto" për pronarin', await admin.textContent('#ekGrupiNen'));
  await admin.screenshot({ path: SC + 'gr-pc-admin.png' });

  // 2. Agimi (tel) — anëtari i vjetër e sheh grupin dhe historikun
  const agim = await faqe('u1', 'agim', false);
  await agim.click('#btnEkipi'); await agim.waitForTimeout(1500);
  ok(await agim.textContent('#ekipiTitulli') === 'Ekipa' && !(await agim.isVisible('#ekGrupiKrijo')), '2. tel: agimi e sheh grupin "Ekipa"', await agim.textContent('#ekipiTitulli'));
  ok(doc('perdoruesit/u1').grupi === 'ekipa', '2. treguesi i agimit');
  ok(!(await agim.$('#ekChatBtn')) && !(await agim.$('#ekChatFund')), '2. chat-i s\'ekziston më (v221)');

  // 3. Besa (e re, PC) — pa grup: s'sheh askënd; krijon grupin e vet dhe fton drinin
  const besa = await faqe('u2', 'besa', true);
  ok(await besa.isVisible('#ekPaGrup') && await besa.textContent('#ekEmriIm') === 'besa', '3. PC: besa pa grup → "Krijo grupin tënd"');
  ok(!F.S.refuzime.some(x => x.uid === 'u2' && /ekipa/.test(x.path) && x.op !== 'get'), '3. besa s\'shkroi gjë te ekipa');
  await besa.screenshot({ path: SC + 'gr-pc-pagrup.png' });
  await besa.fill('#ekGrupiEmri', 'Market Besa'); await besa.click('#ekGrupiKrijo'); await besa.waitForTimeout(1500);
  const gB = doc('perdoruesit/u2').grupi;
  ok(gB && gB !== 'ekipa' && doc('grupet/' + gB).emri === 'Market Besa' && doc('grupet/' + gB + '/anetaret/u2').roli === 'pronar', '3. grupi i besës + ajo pronare', gB);
  ok(await besa.textContent('#ekGrupiTitulli') === 'Market Besa', '3. PC: karta e grupit të ri', await besa.textContent('#ekGrupiTitulli'));
  await besa.fill('#ekFtoEmri', 'besa'); await besa.click('#ekFtoBtn'); await besa.waitForTimeout(400);
  ok(!doc('ftesat/' + gB + '_besa'), '3. s\'fton veten');
  await besa.fill('#ekFtoEmri', 'Drini'); await besa.click('#ekFtoBtn'); await besa.waitForTimeout(1200);
  ok(doc('ftesat/' + gB + '_drini') && doc('ftesat/' + gB + '_drini').ngaEmri === 'besa', '3. ftesa për drinin (emri me shkronja të vogla)', keys('ftesat/'));
  ok(await besa.isVisible('#ekTabFtesat') && /drini/.test(await besa.textContent('#ekFtesatTrup')), '3. PC: ftesa në pritje');

  // 4. Drini (tel) — e sheh ftesën dhe e pranon
  const drini = await faqe('u3', 'drini', false);
  await drini.click('#btnEkipi'); await drini.waitForTimeout(1500);
  ok(/Market Besa/.test(await drini.textContent('#ekipiLista')) && await drini.isVisible('#ekGrupiKrijo'), '4. tel: drini e sheh ftesën + formën e grupit');
  await drini.screenshot({ path: SC + 'gr-tel-ftesa.png' });
  await drini.click('.ek-ftesa .btn:has-text("Prano")'); await drini.waitForTimeout(2000);
  ok(doc('grupet/' + gB + '/anetaret/u3') && doc('grupet/' + gB + '/anetaret/u3').roli === 'anetar' && !doc('ftesat/' + gB + '_drini') && doc('perdoruesit/u3').grupi === gB, '4. drini u bashkua (ftesa u fshi)');
  ok(await drini.textContent('#ekipiTitulli') === 'Kolegët' && /Market Besa/.test(await drini.textContent('#ekipiLista')), '4. tel: Kolegët e grupit të ri', await drini.textContent('#ekipiTitulli'));
  const emratD = await drini.$$eval('#ekipiLista .artikull .emri', l => l.map(e => e.childNodes[0].textContent));
  ok(emratD.includes('besa') && emratD.includes('drini') && !emratD.includes('agim') && !emratD.includes('mendurberisha'), '4. drini sheh vetëm besën (jo agimin/adminin)', emratD);
  await drini.screenshot({ path: SC + 'gr-tel-anetaret.png' });
  F.S.docs.set('grupet/' + gB + '/push/u3_abc', { uid: 'u3', endpoint: 'https://push.test/u3', p256dh: 'x', auth: 'y', platforma: 'tel', koha: t });

  // 5. v221: chat-i s'ekziston më: as API, as qasje te grupet/{g}/chat (as për anëtarët e grupit)
  ok(await drini.evaluate(() => typeof window.__stokuCloud.ekipa.dergoMesazh) === 'undefined', '5. pa API të chat-it');
  const sigChat = await drini.evaluate(async (gB) => {
    const fs = window.__fsTest, r = {};
    const prov = async (k, f) => { try { await f(); r[k] = 'lejohet'; } catch (e) { r[k] = e.code || e.message; } };
    await prov('lexo', () => fs.getDocs(fs.query(fs.collection(null, 'grupet', gB, 'chat'))));
    await prov('shkruaj', () => fs.setDoc(fs.doc(null, 'grupet', gB, 'chat', 'm1'), { uid: 'u3', emri: 'drini', tekst: 'Tung', koha: 1 }));
    return r;
  }, gB);
  ok(sigChat.lexo === 'permission-denied' && sigChat.shkruaj === 'permission-denied' && !keys('grupet/' + gB + '/chat/').length, '5. rregullat v221: grupet/{g}/chat i mbyllur edhe për anëtarin', sigChat);

  // 6. Siguria (rregullat): drini s'lexon/shkruan te grupi "ekipa"
  const sig = await drini.evaluate(async (gB) => {
    const fs = window.__fsTest, r = {};
    const prov = async (k, f) => { try { await f(); r[k] = 'lejohet'; } catch (e) { r[k] = e.code || e.message; } };
    await prov('lexo chat ekipa', () => fs.getDocs(fs.query(fs.collection(null, 'grupet', 'ekipa', 'chat'))));
    await prov('anëtarët e ekipës', () => fs.getDocs(fs.collection(null, 'grupet', 'ekipa', 'anetaret')));
    await prov('hyj te ekipa pa ftesë', () => fs.setDoc(fs.doc(null, 'grupet', 'ekipa', 'anetaret', 'u3'), { emri: 'drini', roli: 'anetar' }));
    await prov('bëhem pronar vetë', () => fs.setDoc(fs.doc(null, 'grupet', gB, 'anetaret', 'u3'), { roli: 'pronar' }, { merge: true }));
    await prov('fto si anëtar', () => fs.setDoc(fs.doc(null, 'ftesat', gB + '_zana'), { gid: gB, perdoruesi: 'zana', ngaUid: 'u3', ngaEmri: 'drini', koha: 1 }));
    await prov('lista e krejt përdoruesve', () => fs.getDocs(fs.collection(null, 'perdoruesit')));
    await prov('njoftim te agimi (grup tjetër)', () => fs.setDoc(fs.doc(null, 'perdoruesit', 'u1', 'njoftimet', 'zz1'), { lloji: 'lajmerim', tekst: 'x', grupi: gB, uid: 'u3', emri: 'drini', koha: 1, lexuar: false }));
    await prov('grupi "ekipa" i rremë', () => fs.setDoc(fs.doc(null, 'grupet', 'ekipa2'), { emri: 'Ekipa', pronarUid: 'u3' }));
    return r;
  }, gB);
  ok(sig['lexo chat ekipa'] === 'permission-denied' && sig['anëtarët e ekipës'] === 'permission-denied' && sig['hyj te ekipa pa ftesë'] === 'permission-denied'
    && sig['bëhem pronar vetë'] === 'permission-denied' && sig['fto si anëtar'] === 'permission-denied' && sig['lista e krejt përdoruesve'] === 'permission-denied'
    && sig['njoftim te agimi (grup tjetër)'] === 'permission-denied', '6. rregullat: krejt qasjet jashtë grupit refuzohen', sig);

  // 7. Kërkesë për heqje brenda grupit (njoftimi me `grupi`)
  const rk = await drini.evaluate(() => window.__stokuCloud.ekipa.kerkoHeqjen({ produktet: [{ produkti: 'Bukë', barkodi: '1' }] }, ['u2']));
  await drini.waitForTimeout(1000);
  const njB = keys('perdoruesit/u2/njoftimet/').map(k => doc(k));
  ok(rk.ok && njB.some(n => n.lloji === 'kerkese-heqje' && n.grupi === gB), '7. kërkesa te besa (me grupin)', njB);
  ok(pushet.some(x => x.startsWith('u3 /kerkese') && x.includes('"grupi":"' + gB + '"')), '7. push /kerkese me grupin');

  // 8. Pronari: bën drinin pronar, pastaj e heq nga grupi
  await besa.click('#ekMenu [data-n="anetaret"]').catch(() => {}); await besa.waitForTimeout(1000);
  await besa.click('#ekAnetaretTrup tr:has-text("drini") button:has-text("Bëje admin")'); await besa.waitForTimeout(1000);
  ok(doc('grupet/' + gB + '/anetaret/u3').roli === 'pronar', '8. drini u bë pronar');
  await besa.click('#ekAnetaretTrup tr:has-text("drini") button:has-text("Hiqe si admin")'); await besa.waitForTimeout(1000);
  ok(doc('grupet/' + gB + '/anetaret/u3').roli === 'anetar', '8. drini anëtar sërish');
  await besa.click('#ekAnetaretTrup tr:has-text("drini") button:has-text("Hiq nga grupi")'); await besa.waitForTimeout(300);
  await besa.click('#kfPo'); await besa.waitForTimeout(1500);
  ok(!doc('grupet/' + gB + '/anetaret/u3'), '8. drini u hoq nga grupi');
  await drini.waitForTimeout(1500);
  ok(await drini.isVisible('#ekGrupiKrijo'), '8. tel: drini kthehet te "Krijo grupin tënd"');
  ok(doc('perdoruesit/u3').grupi === '', '8. treguesi i drinit u pastrua (nga aplikacioni i tij)', doc('perdoruesit/u3'));
  ok(!doc('grupet/' + gB + '/push/u3_abc'), '8. pajisja e tij për push u fshi');
  const rihyrja = await drini.evaluate(async (gB) => {
    const fs = window.__fsTest, r = {};
    const prov = async (k, f) => { try { await f(); r[k] = 'lejohet'; } catch (e) { r[k] = e.code || e.message; } };
    await prov('anëtar pa ftesë', () => fs.setDoc(fs.doc(null, 'grupet', gB, 'anetaret', 'u3'), { emri: 'drini', roli: 'anetar', hyriSe: 1 }));
    await prov('pronar te grup ekzistues', () => fs.setDoc(fs.doc(null, 'grupet', gB, 'anetaret', 'u3'), { emri: 'drini', roli: 'pronar', hyriSe: 1 }));
    await prov('rrahja e zemrës pas heqjes', () => fs.setDoc(fs.doc(null, 'grupet', gB, 'anetaret', 'u3'), { emri: 'drini', aktivSe: 1, online: true }, { merge: true }));
    return r;
  }, gB);
  ok(Object.values(rihyrja).every(x => x === 'permission-denied') && !doc('grupet/' + gB + '/anetaret/u3'), '8. i hequri s\'rihyn vetë (as si pronar)', rihyrja);

  // 8b. Ftesa që u anulua ndërkohë: drini mbetet te grupi i vet
  await drini.fill('#ekGrupiEmri', 'Drini Shop'); await drini.click('#ekGrupiKrijo'); await drini.waitForTimeout(1500);
  const gD = doc('perdoruesit/u3').grupi;
  ok(gD && gD !== gB && doc('grupet/' + gD + '/anetaret/u3').roli === 'pronar', '8b. drini krijoi grupin e vet', gD);
  await besa.fill('#ekFtoEmri', 'drini'); await besa.click('#ekFtoBtn'); await besa.waitForTimeout(1000);
  const ftesaD = Object.assign({ id: gB + '_drini' }, doc('ftesat/' + gB + '_drini'));
  await besa.click('#ekFtesatTrup tr:has-text("drini") button:has-text("Anulo")'); await besa.waitForTimeout(1000);
  ok(!doc('ftesat/' + gB + '_drini'), '8b. besa e anuloi ftesën');
  const rS = await drini.evaluate(f => window.__stokuCloud.ekipa.pranoFtesen(f, false), ftesaD);
  await drini.waitForTimeout(800);
  ok(rS.ok === false && rS.arsye === 'ftesa-skadoi' && doc('perdoruesit/u3').grupi === gD && doc('grupet/' + gD + '/anetaret/u3') && !doc('grupet/' + gB + '/anetaret/u3'),
    '8b. ftesa e anuluar: "s\'vlen më", drini mbetet te grupi i vet', rS);
  // Ftesë e re: drini (i vetëm te "Drini Shop") e pranon → grupi i tij fshihet krejt
  await drini.evaluate(() => window.__stokuCloud.ekipa.shtoNgjarje({ lloji: 'afate-te-reja', n: 2 })); await drini.waitForTimeout(800);
  ok(keys('grupet/' + gD + '/feed/').length >= 1, '8b. drini ka aktivitet te grupi i vet', keys('grupet/' + gD + '/feed/'));
  await besa.fill('#ekFtoEmri', 'drini'); await besa.click('#ekFtoBtn'); await besa.waitForTimeout(1200);
  await drini.click('#ekMenu [data-n="anetaret"]').catch(() => {}); await drini.waitForTimeout(1200);
  await drini.click('.ek-ftesa .btn:has-text("Prano")'); await drini.waitForTimeout(400);
  const pyetja = await drini.textContent('#dlgKonfirmo');
  ok(/Drini Shop/.test(pyetja) && /fshi/i.test(pyetja), '8b. paralajmërimi: grupi yt do të fshihet', pyetja.replace(/\s+/g, ' ').slice(0, 200));
  await drini.click('#konfPo'); await drini.waitForTimeout(2500);
  ok(!doc('grupet/' + gD) && !keys('grupet/' + gD + '/').filter(k => !/\/kujtesa\//.test(k)).length && doc('grupet/' + gB + '/anetaret/u3') && doc('perdoruesit/u3').grupi === gB, '8b. kaloi te besa; "Drini Shop" u fshi (kujtesa e produkteve mbetet, v198)', keys('grupet/' + gD));
  await drini.click('#ekMenu [data-n="anetaret"]').catch(() => {}); await drini.waitForTimeout(1000);
  await drini.click('#ekLargohu'); await drini.waitForTimeout(300); await drini.click('#konfPo'); await drini.waitForTimeout(1500);
  ok(!doc('grupet/' + gB + '/anetaret/u3') && doc('perdoruesit/u3').grupi === '' && doc('grupet/' + gB), '8b. drini u largua nga grupi i besës (grupi mbetet)');

  // 9. Besa riemërton grupin
  await besa.click('#ekRiemerto'); await besa.fill('#ekGrupiEmriRi', 'Market Besa 2'); await besa.click('#ekRiemertoRuaj'); await besa.waitForTimeout(1000);
  ok(doc('grupet/' + gB).emri === 'Market Besa 2', '9. emri i grupit u ndryshua');

  // 10. Agimi (anëtar i ekipës) merr ftesë nga besa dhe kalon te grupi i saj
  await besa.fill('#ekFtoEmri', 'agim'); await besa.click('#ekFtoBtn'); await besa.waitForTimeout(1200);
  await agim.click('#ekMenu [data-n="anetaret"]').catch(() => {}); await agim.waitForTimeout(1200);
  ok(/Market Besa 2/.test(await agim.textContent('#ekipiLista')), '10. tel: agimi e sheh ftesën te Kolegët');
  await agim.click('.ek-ftesa .btn:has-text("Prano")'); await agim.waitForTimeout(400);
  ok(await agim.isVisible('#dlgKonfirmo.hapur, .mbulese.hapur #konfPo'), '10. pyetet a do të kalojë (largohet nga "Ekipa")');
  await agim.click('#konfPo'); await agim.waitForTimeout(2000);
  ok(!doc('grupet/ekipa/anetaret/u1') && doc('grupet/' + gB + '/anetaret/u1') && doc('perdoruesit/u1').grupi === gB, '10. agimi kaloi te grupi i besës');
  ok(!doc('ekipa_anetaret/u1'), '10. anëtarësia e vjetër (ekipa_anetaret) u fshi');
  const rE = await agim.evaluate(async () => { try { await window.__fsTest.setDoc(window.__fsTest.doc(null, 'grupet', 'ekipa', 'anetaret', 'u1'), { emri: 'agim', roli: 'anetar', hyriSe: 1 }); return 'lejohet'; } catch (e) { return e.code; } });
  ok(rE === 'permission-denied', '10. agimi s\'rihyn vetë te "Ekipa"', rE);

  // 11. Admini: llogaritë e tjera; largimi i pronarit të vetëm me anëtarë s'lejohet
  await admin.click('#ekMenu [data-n="anetaret"]').catch(() => {}); await admin.waitForTimeout(1200);
  const tjera = await admin.textContent('#ekLlogariteTrup');
  ok(/besa/.test(tjera) && /drini/.test(tjera) && /agim/.test(tjera), '11. admini: llogaritë e tjera (jashtë grupit)', tjera.slice(0, 160));
  // v246: admini i vetëm mund të largohet (adminin e merr kolegu); këtu besa e anulon
  await besa.click('#ekLargohu'); await besa.waitForTimeout(500);
  const pyetjaB = await besa.textContent('#kfTekst');
  ok(/admin bëhet agim/.test(pyetjaB), '11. besa (admine e vetme me agimin): "admin bëhet agim"', pyetjaB);
  await besa.click('#kfJo'); await besa.waitForTimeout(300);
  ok(doc('grupet/' + gB + '/anetaret/u2') && doc('grupet/' + gB + '/anetaret/u2').roli === 'pronar' && doc('grupet/' + gB + '/anetaret/u1').roli !== 'pronar', '11. e anuloi: asgjë s\'ndryshon');

  // 12. Agimi largohet; pastaj besa (e fundit) → grupi fshihet
  await agim.click('#ekLargohu'); await agim.waitForTimeout(300); await agim.click('#konfPo'); await agim.waitForTimeout(1500);
  ok(!doc('grupet/' + gB + '/anetaret/u1') && doc('perdoruesit/u1').grupi === '', '12. agimi u largua (pa grup)');
  await besa.waitForTimeout(1200);
  await besa.click('#ekLargohu'); await besa.waitForTimeout(300); await besa.click('#kfPo'); await besa.waitForTimeout(2000);
  ok(!doc('grupet/' + gB) && !keys('grupet/' + gB + '/').filter(k => !/\/kujtesa\//.test(k)).length && !keys('ftesat/' + gB).length, '12. besa e fundit → grupi u fshi (kujtesa e produkteve mbetet, v198)', keys('grupet/' + gB));
  ok(F.S.refuzime.filter(x => !['get', 'query'].includes(x.op)).length <= 14, '13. refuzimet janë vetëm provat e sigurisë', F.S.refuzime.filter(x => !/zz1|zana|ekipa2|u3$|u1$/.test(x.path)).slice(0, 8));

  // 14. Besa krijon "Test", agimi hyn e bëhet pronar dhe e heq besën: besa s'e rimerr dot grupin
  const rT = await besa.evaluate(() => window.__stokuCloud.ekipa.krijoGrupin('Test'));
  const gT = rT.grupi; await besa.waitForTimeout(800);
  await besa.evaluate(() => window.__stokuCloud.ekipa.ftoNeGrup('agim', 'Test')); await agim.waitForTimeout(1200);
  const rA = await agim.evaluate(f => window.__stokuCloud.ekipa.pranoFtesen(f, false), Object.assign({ id: gT + '_agim' }, doc('ftesat/' + gT + '_agim')));
  await agim.waitForTimeout(800);
  await besa.evaluate(() => window.__stokuCloud.ekipa.ndryshoRolin('u1', 'pronar')); await besa.waitForTimeout(500);
  const rH = await agim.evaluate(() => window.__stokuCloud.ekipa.hiqNgaGrupi('u2')); await besa.waitForTimeout(1500);
  ok(rT.ok && rA.ok && rH.ok && doc('grupet/' + gT + '/anetaret/u1').roli === 'pronar' && !doc('grupet/' + gT + '/anetaret/u2') && doc('perdoruesit/u2').grupi === '', '14. agimi pronar, besa u hoq', [rT, rA, rH]);
  const rB = await besa.evaluate(async (gT) => {
    const fs = window.__fsTest, r = {};
    const prov = async (k, f) => { try { await f(); r[k] = 'lejohet'; } catch (e) { r[k] = e.code || e.message; } };
    await prov('pronar (themeluese)', () => fs.setDoc(fs.doc(null, 'grupet', gT, 'anetaret', 'u2'), { emri: 'besa', roli: 'pronar', hyriSe: 1 }));
    await prov('grupi + pronari (batch)', () => { const b = fs.writeBatch(null); b.set(fs.doc(null, 'grupet', gT), { emri: 'Test', pronarUid: 'u2', pronarEmri: 'besa', krijuarSe: 1 }); b.set(fs.doc(null, 'grupet', gT, 'anetaret', 'u2'), { emri: 'besa', roli: 'pronar', hyriSe: 1 }); return b.commit(); });
    await prov('pronar me sasiaShpejte', () => { const b = fs.writeBatch(null); b.set(fs.doc(null, 'grupet', 'gRi123456'), { emri: 'Ri', pronarUid: 'u2', pronarEmri: 'besa' }); b.set(fs.doc(null, 'grupet', 'gRi123456', 'anetaret', 'u2'), { emri: 'besa', roli: 'pronar', sasiaShpejte: true }); return b.commit(); });
    return r;
  }, gT);
  ok(Object.values(rB).every(x => x === 'permission-denied') && !doc('grupet/' + gT + '/anetaret/u2'), '14. themeluesja e hequr s\'e rimerr grupin', rB);

  // 15. Admini fshin llogarinë e agimit: edhe anëtarësia, afatet dhe pajisjet e tij në grup
  F.S.docs.set('grupet/' + gT + '/push/u1_abc', { uid: 'u1', endpoint: 'https://push.test/u1', p256dh: 'x', auth: 'y', platforma: 'tel', koha: t });
  const rF = await admin.evaluate(() => window.__stokuCloud.ekipa.fshijLlogarine('u1', 'agim'));
  ok(rF.ok && !doc('grupet/' + gT + '/anetaret/u1') && !doc('grupet/' + gT + '/push/u1_abc') && !doc('perdoruesit/u1') && doc('ekipa_fshire/u1'), '15. admini: llogaria + anëtarësia + pajisjet u fshinë', rF);
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  await b.close();
})();
