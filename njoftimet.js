/*
 * Njoftimet për afatet (telefon) — e përbashkët për faqen (index.html) dhe service worker-in (sw.js).
 *
 *  - Kur një produkt hyn në 30 ditët e fundit:  "Kraco çaj limon" · "Skadon edhe 30 ditë (27.10.2026)."
 *  - Kur një produkt skadon:                    "Kraco çaj limon" · "Ka skaduar — hiqe këtë produkt nga rafti/pozita."
 *
 * Çdo njoftim jepet VETËM NJË HERË për të njëjtin produkt dhe të njëjtën datë (nëse data ndryshohet, njoftohet sërish).
 * Produktet e hequra nga rafti nuk njoftohen.
 *
 * Faqja e kopjon listën e afateve në IndexedDB (localStorage s'lexohet dot nga service worker-i), që kontrolli
 * të bëhet edhe kur aplikacioni është mbyllur (Periodic Background Sync — Chrome në Android, app e instaluar).
 */
(function (root) {
  'use strict';

  var DB_EMRI = 'stoku-njoftimet';
  var MAKS_VECMAS = 4;               // mbi këtë numër, njoftimet e reja bashkohen në një të vetëm
  var URL_AFATET = './index.html#afatet';

  function hapDb() {
    return new Promise(function (zgjidh, refuzo) {
      if (!root.indexedDB) { refuzo(new Error('pa-indexeddb')); return; }
      var k = root.indexedDB.open(DB_EMRI, 1);
      k.onupgradeneeded = function () { k.result.createObjectStore('kv'); };
      k.onsuccess = function () { zgjidh(k.result); };
      k.onerror = function () { refuzo(k.error); };
    });
  }
  function merr(celesi) {
    return hapDb().then(function (db) {
      return new Promise(function (zgjidh) {
        var r = db.transaction('kv', 'readonly').objectStore('kv').get(celesi);
        r.onsuccess = function () { zgjidh(r.result); };
        r.onerror = function () { zgjidh(undefined); };
      });
    });
  }
  function vendos(celesi, vlera) {
    return hapDb().then(function (db) {
      return new Promise(function (zgjidh) {
        var tx = db.transaction('kv', 'readwrite');
        tx.objectStore('kv').put(vlera, celesi);
        tx.oncomplete = function () { zgjidh(true); };
        tx.onerror = function () { zgjidh(false); };
      });
    });
  }

  // Vetëm fushat që duhen për njoftimet (lista mbahet e vogël)
  function ruajAfatet(afatet) {
    var te = (afatet || []).map(function (a) {
      return { id: a.id, emri: a.emri || '', barkodi: a.barkodi || '', data: a.data || '', statusi: a.statusi || 'aktiv' };
    });
    return vendos('afatet', te).catch(function () { return false; });
  }

  // Kthen njoftimet e reja që duhen dhënë (pa i shënuar ende si të dhëna)
  function teReja(afatet, njoftuar, tani) {
    var AF = root.StokuAfatet;
    var dalja = [];
    (afatet || []).forEach(function (a) {
      if (!a || !a.id || a.statusi === 'hequr') return;
      var st = AF.statusi(a, tani);
      if (st !== 'afer' && st !== 'skaduar') return;
      var celesi = a.id + '|' + a.data + '|' + st;
      if (njoftuar[celesi]) return;
      var emri = a.emri || a.barkodi || 'Produkt pa emër';
      var n = AF.ditetDeri(a.data, tani);
      var teksti = st === 'skaduar'
        ? 'Ka skaduar — hiqe këtë produkt nga rafti/pozita.'
        : (n === 0 ? 'Skadon sot' : 'Skadon edhe ' + AF.ditetTekst(n)) + ' (' + AF.formato(a.data) + ').';
      dalja.push({ celesi: celesi, id: a.id, lloji: st, emri: emri, teksti: teksti, n: n });
    });
    // Të skaduarat së pari, pastaj ato që skadojnë më shpejt
    dalja.sort(function (x, y) { return (x.lloji === y.lloji ? 0 : x.lloji === 'skaduar' ? -1 : 1) || (x.n - y.n); });
    return dalja;
  }

  function opsionet(teksti, tag) {
    return {
      body: teksti, tag: tag, icon: 'icon-192.png', lang: 'sq',
      data: { url: URL_AFATET }, renotify: false
    };
  }

  // Shfaq njoftimet e reja; reg = ServiceWorkerRegistration. Kthen numrin e njoftimeve të dhëna.
  function kontrollo(reg) {
    if (!reg || !reg.showNotification) return Promise.resolve(0);
    if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') return Promise.resolve(0);
    return Promise.all([merr('afatet'), merr('njoftuar')]).then(function (v) {
      var afatet = v[0] || [];
      var njoftuar = v[1] || {};
      var reja = teReja(afatet, njoftuar, Date.now());
      if (!reja.length) return 0;
      var premtimet = [];
      ['skaduar', 'afer'].forEach(function (lloji) {
        var grupi = reja.filter(function (x) { return x.lloji === lloji; });
        if (!grupi.length) return;
        if (grupi.length > MAKS_VECMAS) {
          var emrat = grupi.slice(0, 6).map(function (x) { return x.emri; }).join(', ') + (grupi.length > 6 ? '…' : '');
          premtimet.push(reg.showNotification(
            lloji === 'skaduar' ? grupi.length + ' produkte kanë skaduar' : grupi.length + ' produkte skadojnë brenda 30 ditëve',
            opsionet((lloji === 'skaduar' ? 'Hiqi nga rafti/pozita: ' : '') + emrat + '.', 'stoku-grup-' + lloji)));
        } else {
          grupi.forEach(function (x) { premtimet.push(reg.showNotification(x.emri, opsionet(x.teksti, 'stoku-' + x.id + '-' + x.lloji))); });
        }
      });
      return Promise.all(premtimet).then(function () {
        reja.forEach(function (x) { njoftuar[x.celesi] = Date.now(); });
        // Pastro shënimet e afateve që s'ekzistojnë më
        var ids = {};
        afatet.forEach(function (a) { ids[a.id] = true; });
        Object.keys(njoftuar).forEach(function (k) { if (!ids[k.split('|')[0]]) delete njoftuar[k]; });
        return vendos('njoftuar', njoftuar).then(function () { return reja.length; });
      });
    }).catch(function () { return 0; });
  }

  root.StokuNjoftimet = { ruajAfatet: ruajAfatet, kontrollo: kontrollo, teReja: teReja, URL_AFATET: URL_AFATET };
})(typeof self !== 'undefined' ? self : this);
