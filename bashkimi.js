/*
 * Bashkimi i të dhënave mes pajisjeve (telefon, PDA, kompjuter) — i përbashkët për index.html dhe pc.html.
 *
 * Rregullat:
 *  - Produkti që ekziston në të dyja anët: fiton ai që është prekur më së fundi (prekurSe).
 *    Barazim → fiton ana lokale (si më parë).
 *  - Fshirjet ruhen si "shënime fshirjeje" (koha e fshirjes) edhe në cloud, që një pajisje tjetër që
 *    ende e ka produktin e vjetër të mos e "ringjallë" më. Produkti fshihet vetëm nëse fshirja është
 *    më e re se ndryshimi i fundit i tij — kështu, nëse dikush e skanon sërish më vonë, ai mbetet.
 *  - Folderat: njësoj, me ndryshuarSe. Një folder i fshirë mbetet i fshirë, përveç nëse dikush ka
 *    shtuar produkt në të PAS fshirjes.
 *  - Asgjë që thjesht "mungon" në njërën anë (pa u fshirë qëllimisht) nuk fshihet.
 *  - Renditja e folderave: fiton ana që e ka ndryshuar renditjen më së fundi (rendiKoha).
 *  - Shënimet e fshirjeve më të vjetra se 120 ditë hiqen, që dokumenti të mos rritet pafundësisht.
 *  - Afatet (datat e skadimit): njësoj — fiton ndryshimi më i ri (ndryshuarSe), fshirjet ruhen me id.
 *  - Afatet e vjetra hiqen vetë (njësoj në çdo pajisje, pa shënime fshirjeje): ato të hequra nga rafti
 *    para më shumë se 60 ditësh dhe ato që kanë skaduar para më shumë se 60 ditësh. Pa këtë, historiku
 *    rritej pa fund dhe dokumenti i dyqanit në Firebase (kufiri 1 MB) mbushej pas pak muajsh — atëherë
 *    ndalej krejt sinkronizimi, edhe për produktet.
 */
(function (root) {
  'use strict';

  var MBAJ_FSHIRJET_MS = 120 * 24 * 60 * 60 * 1000;
  var MBAJ_AFATET_E_VJETRA_MS = 60 * 24 * 60 * 60 * 1000;

  function afatiIVjeteruar(a, tani) {
    var kufiri = tani - MBAJ_AFATET_E_VJETRA_MS;
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(a.data || ''));
    if (m && new Date(+m[1], +m[2] - 1, +m[3]).getTime() < kufiri) return true;
    if (a.statusi === 'hequr' && (Number(a.hequrSe) || Number(a.ndryshuarSe) || 0) < kufiri) return true;
    return false;
  }

  function celesi(kategoriaId, barkodi) { return kategoriaId + '::' + barkodi; }

  function produktIVlefshem(p) {
    return !!p && typeof p.barkodi === 'string' && p.barkodi !== '' && typeof p.kategoriaId === 'string';
  }

  function kohaProd(p) { return (p && typeof p.prekurSe === 'number') ? p.prekurSe : 0; }
  function kohaFold(f) { return (f && typeof f.ndryshuarSe === 'number') ? f.ndryshuarSe : 0; }

  function bashkoFshirjet(a, b, tani) {
    var kufiri = tani - MBAJ_FSHIRJET_MS;
    var rez = { produktet: {}, foldera: {}, afatet: {} };
    ['produktet', 'foldera', 'afatet'].forEach(function (lloji) {
      [a, b].forEach(function (burimi) {
        var m = burimi && burimi[lloji];
        if (!m || typeof m !== 'object') return;
        Object.keys(m).forEach(function (k) {
          var t = Number(m[k]) || 0;
          if (t < kufiri) return;
          if (!rez[lloji][k] || t > rez[lloji][k]) rez[lloji][k] = t;
        });
      });
    });
    return rez;
  }

  function lista(x) { return Array.isArray(x) ? x : []; }

  /**
   * cloud, lokal: { foldera: [...], produktet: [...], rendiKoha, fshira: { produktet: {}, foldera: {} } }
   * cloud mund të jetë null (s'ka ende asgjë në cloud).
   * Kthen gjendjen e bashkuar, gati për t'u ruajtur në cloud dhe për t'u zbatuar lokalisht.
   */
  function bashko(cloud, lokal, tani) {
    tani = tani || Date.now();
    cloud = cloud || {};
    lokal = lokal || {};
    var fshira = bashkoFshirjet(cloud.fshira, lokal.fshira, tani);

    // ---- Produktet ----
    var pm = {};
    lista(cloud.produktet).forEach(function (p) {
      if (produktIVlefshem(p)) pm[celesi(p.kategoriaId, p.barkodi)] = p;
    });
    lista(lokal.produktet).forEach(function (p) {
      if (!produktIVlefshem(p)) return;
      var k = celesi(p.kategoriaId, p.barkodi);
      if (!pm[k] || kohaProd(p) >= kohaProd(pm[k])) pm[k] = p;
    });
    Object.keys(pm).forEach(function (k) {
      var t = fshira.produktet[k];
      if (t === undefined) return;
      if (t >= kohaProd(pm[k])) delete pm[k];
      else delete fshira.produktet[k]; // u shtua sërish pas fshirjes: shënimi s'vlen më
    });

    // ---- Folderat ----
    var fm = {};
    lista(cloud.foldera).forEach(function (f) { if (f && f.id) fm[f.id] = f; });
    lista(lokal.foldera).forEach(function (f) {
      if (!f || !f.id) return;
      if (!fm[f.id] || kohaFold(f) >= kohaFold(fm[f.id])) fm[f.id] = f;
    });
    var meIRiPerFolder = {};
    Object.keys(pm).forEach(function (k) {
      var p = pm[k];
      var t = kohaProd(p);
      if (!meIRiPerFolder[p.kategoriaId] || t > meIRiPerFolder[p.kategoriaId]) meIRiPerFolder[p.kategoriaId] = t;
    });
    Object.keys(fshira.foldera).forEach(function (id) {
      var t = fshira.foldera[id];
      var jeta = Math.max(kohaFold(fm[id]), meIRiPerFolder[id] || 0);
      if (t >= jeta) {
        delete fm[id];
      } else if (fm[id]) {
        delete fshira.foldera[id]; // dikush e përdori folderin pas fshirjes: mbetet
      }
    });
    // Produktet e mbetura brenda një folderi që u fshi (dhe s'ekziston më) hiqen bashkë me të.
    Object.keys(pm).forEach(function (k) {
      var kid = pm[k].kategoriaId;
      if (!fm[kid] && fshira.foldera[kid] !== undefined) delete pm[k];
    });

    // ---- Afatet (datat e skadimit) ----
    var am = {};
    lista(cloud.afatet).forEach(function (a) { if (a && a.id) am[a.id] = a; });
    lista(lokal.afatet).forEach(function (a) {
      if (!a || !a.id) return;
      if (!am[a.id] || kohaFold(a) >= kohaFold(am[a.id])) am[a.id] = a;
    });
    Object.keys(am).forEach(function (id) {
      var t = fshira.afatet[id];
      if (t === undefined) return;
      if (t >= kohaFold(am[id])) delete am[id];
      else delete fshira.afatet[id];
    });
    var afatet = Object.keys(am).map(function (id) { return am[id]; })
      .filter(function (a) { return !afatiIVjeteruar(a, tani); })
      .sort(function (a, b) { return String(a.data || '').localeCompare(String(b.data || '')) || String(a.id).localeCompare(String(b.id)); });

    // ---- Renditja ----
    var kohaCloud = Number(cloud.rendiKoha) || 0, kohaLokale = Number(lokal.rendiKoha) || 0;
    var burimi = kohaCloud > kohaLokale ? cloud.foldera : lokal.foldera;
    var tjetri = kohaCloud > kohaLokale ? lokal.foldera : cloud.foldera;
    var renditur = [], vendosur = {};
    [burimi, tjetri].forEach(function (l) {
      lista(l).forEach(function (f) {
        if (f && f.id && fm[f.id] && !vendosur[f.id]) { vendosur[f.id] = true; renditur.push(fm[f.id]); }
      });
    });

    return {
      app: 'stoku', version: 3, koha: new Date(tani).toISOString(),
      rendiKoha: Math.max(kohaCloud, kohaLokale),
      foldera: renditur,
      produktet: Object.keys(pm).map(function (k) { return pm[k]; }),
      afatet: afatet,
      fshira: fshira
    };
  }

  // Heq shënimet lokale të fshirjeve më të vjetra se afati (thirret pas sinkronizimit të suksesshëm).
  function pastroFshirjetEVjetra(fshira, tani) {
    var kufiri = (tani || Date.now()) - MBAJ_FSHIRJET_MS;
    ['produktet', 'foldera', 'afatet'].forEach(function (l) {
      var m = fshira && fshira[l];
      if (!m) return;
      Object.keys(m).forEach(function (k) { if ((Number(m[k]) || 0) < kufiri) delete m[k]; });
    });
    return fshira;
  }

  // A kanë dy gjendje të njëjtat foldera dhe produkte? (për të mos rivizatuar kot)
  function eNjejte(a, b) {
    function nenshkrim(g) {
      var f = lista(g.foldera).map(function (x) { return x.id + '\u0001' + x.emri; }).join('\u0002');
      var p = lista(g.produktet).map(function (x) {
        return celesi(x.kategoriaId, x.barkodi) + '\u0001' + (x.emri || '') + '\u0001' + x.sasia + '\u0001' + kohaProd(x);
      }).sort().join('\u0002');
      var a = lista(g.afatet).map(function (x) {
        return x.id + '\u0001' + kohaFold(x) + '\u0001' + (x.statusi || '') + '\u0001' + (x.data || '') + '\u0001' + (x.sasia === undefined ? '' : x.sasia);
      }).sort().join('\u0002');
      return f + '\u0003' + p + '\u0003' + a;
    }
    return nenshkrim(a) === nenshkrim(b);
  }

  var api = {
    bashko: bashko, celesi: celesi, pastroFshirjetEVjetra: pastroFshirjetEVjetra,
    eNjejte: eNjejte, MBAJ_FSHIRJET_MS: MBAJ_FSHIRJET_MS, afatiIVjeteruar: afatiIVjeteruar
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.StokuBashkimi = api;
})(typeof self !== 'undefined' ? self : this);
