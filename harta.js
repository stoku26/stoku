/*
 * Harta e marketeve (v244): pikat e marketeve (emri + vendndodhja) mbi një hartë që tregon vetëm emrat e vendbanimeve
 * (qytete, qyteza, fshatra, lagje). E përbashkët për telefonin dhe PC-në (Cilësimet → Harta).
 *
 * - MapLibre GL JS 5.24.0 nga jsDelivr me SRI (si libraritë e tjera); ngarkohet vetëm kur hapet harta. Stili i kontrolleve
 *   te css/maplibre-gl.css (kopje e paketës, licenca BSD-3, MapLibre contributors).
 * - Pllakat vektoriale: OpenFreeMap (tiles.openfreemap.org, skema OpenMapTiles, falas, pa çelës). CSP: connect-src
 *   https://tiles.openfreemap.org (te 5 faqet dhe te Cloudflare). Atribuimi (OpenFreeMap, OpenMapTiles, OpenStreetMap)
 *   del vetë në qoshe të hartës (i detyrueshëm nga licenca).
 * - STILI ËSHTË YNI, jo i OpenFreeMap-it: sfondi, uji, rrugët PA EMRA, kufiri i shtetit dhe nga shtresa `place` vetëm
 *   klasat e VENDBANIMEVE. Asnjë shtresë tjetër me emra (dyqane, rrugë, ujëra, male, shtete) s'shtohet: kështu në hartë
 *   s'del asgjë tjetër përveç vendbanimeve dhe pikave tona.
 * - Pikat: { id, emri, lat, lng, uid, perdoruesi, tjeter }. Administratori i sheh pikat e përbashkëta të Stoku-t (v246:
 *   pikat/{id}, marketet.js) dhe ua ndryshon emrin për krejt Stoku-n; merchandiseri (v247) i sheh të gjitha, të vetat me
 *   ngjyrën kryesore dhe të tjerat (`tjeter`) më të zbehta.
 * - v247: SATELITI (butoni "Satelit" / "Hartë" në hartë): Esri World Imagery përmes ArcGIS Location Platform
 *   (ibasemaps-api.arcgis.com, me çelës API). Çelësi (ESRI_CELESI) është publik, si ai i Firebase-it: e sheh kushdo në
 *   faqe, prandaj te llogaria ArcGIS e pronarit kufizohet vetëm për stoku.site (referrer). Pa çelës butoni s'del. Pllakat
 *   satelitore merren VETËM kur zgjidhet "Satelit" (shtresa e fshehur s'kërkon pllaka). Mbi satelitin mbeten vetëm emrat
 *   e vendbanimeve (të bardhë) dhe pikat; "Powered by Esri" del gjithmonë në qoshe kur sheh satelitin (e kërkon Esri).
 *   CSP: connect-src https://ibasemaps-api.arcgis.com (te 5 faqet dhe te Cloudflare). Zgjedhja mbahet në pajisje.
 */
(function (root) {
  'use strict';

  var MAPLIBRE_JS = 'https://cdn.jsdelivr.net/npm/maplibre-gl@5.24.0/dist/maplibre-gl.js';
  var MAPLIBRE_SRI = 'sha384-5+cfbwT0iiub6VsQAdn6yz16nr6sDiQoHx6tm4O8OVYXHYOxcffFmCJBL0dgdvGp';
  var MAPLIBRE_CSS = 'css/maplibre-gl.css?v=5.24.0';
  var PLLAKAT = 'https://tiles.openfreemap.org/planet';
  var SHKRONJAT = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf';
  var VENDBANIMET = ['city', 'town', 'village', 'hamlet', 'borough', 'suburb', 'quarter', 'neighbourhood'];
  // v245: lagjet. Pllakat e OpenFreeMap-it (Planetiler, skema OpenMapTiles) i kanë `suburb` dhe `hamlet` nga zmadhimi 11,
  // kurse `quarter` dhe `neighbourhood` (shumica e lagjeve) VETËM nga zmadhimi 14; nën të s'ka të dhëna për to. Prandaj
  // nën ZOOM_LAGJET del butoni "Zmadho për emrat e lagjeve". Vetëm pikat (nyjet) `place=*` të OSM-së; lagjet e vizatuara
  // vetëm si sipërfaqe pa pikë s'dalin te pllakat.
  var LAGJET = ['borough', 'suburb', 'quarter', 'neighbourhood'];
  var ZOOM_LAGJET = 14;
  var KOSOVA = { qendra: [20.9, 42.58], zoom: 7.2 };
  var EMRI_MAKS = 60;
  // v247: sateliti (Esri). Çelësi i API-së i ArcGIS Location Platform (privilegji "Basemaps"), i kufizuar te stoku.site.
  // v249: "API key 1" i kredencialeve "stoku" (llogaria e pronarit, 22.10.2026), skadon rreth 21.10.2027; "API key 2" është
  // rezervë për ndërrimin. Është publik si ai i Firebase-it (shihet në faqe): vetëm hartat bazë, asnjë shërbim tjetër.
  var ESRI_CELESI = 'AAPTaOZD6Mj8BN-EAoFrTPLuKQw..HTvVLV3FuQ53XA1Sz6SsxAjRfNAffV3zMJLLqbgP09PHF_OFV134L0YweamGSqSnKitfob0WLVumW2BnAXkDl0d8G0i6Cxvq6EyznpdaOhtSEL1e9IrlvuIJ9bIamV3jrxDFnRwAPF9Cdf4_kapVR1dZf7nACO1oDBgjjQrsyWqF9I9CJqjq8O775kLDHVt7gLDVMvydUYILykbQy9tuGs4MvaFJeHb0-RAJ_cHkOpPjIgI0uk9cdTdVZXUsig..AT1_ScUbQzdT';
  var SATELITI = 'https://ibasemaps-api.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
  var SATELITI_BURIMI = 'Powered by <a href="https://www.esri.com/" target="_blank" rel="noopener">Esri</a> | Esri, Vantor, Earthstar Geographics, and the GIS User Community';
  var KEY_PAMJA = 'stoku:harta:pamja'; // 'satelit' | 'harta' (kjo pajisje)

  var NGJYRAT = {
    light: { sfondi: '#f4f2ee', uji: '#c4dcef', rruga: '#ffffff', rrugaKufi: '#d9d4ca', rrugaVogel: '#ffffff', kufiri: '#9a8fb0',
      teksti: '#2f3337', tekstiLagje: '#5b6470', halo: '#ffffff', pika: '#1f6feb', pikaZgjedhur: '#e8590c', pikaKufi: '#ffffff', pikaTjeter: '#7a8699' },
    dark: { sfondi: '#1b1e22', uji: '#22394d', rruga: '#3b4048', rrugaKufi: '#2a2e34', rrugaVogel: '#30343a', kufiri: '#7d7396',
      teksti: '#e7e9ec', tekstiLagje: '#aab2bd', halo: '#1b1e22', pika: '#4c9bff', pikaZgjedhur: '#ff8a3d', pikaKufi: '#1b1e22', pikaTjeter: '#8d99ab' },
    // mbi satelit (njëjtë në të dy temat): emrat e bardhë me kufi të errët, pikat me kufi të bardhë
    satelit: { teksti: '#ffffff', tekstiLagje: '#e6e9ee', halo: 'rgba(0,0,0,0.85)', kufiri: '#ffffff', pika: '#4c9bff', pikaZgjedhur: '#ff8a3d',
      pikaKufi: '#ffffff', pikaTjeter: '#c3ccd8', tekstiPika: '#ffffff' }
  };

  // Tekstet e kontrolleve të MapLibre-s (përndryshe dalin anglisht)
  var TEKSTET = {
    'AttributionControl.ToggleAttribution': 'Burimet e hartës', 'AttributionControl.MapFeedback': 'Raporto një gabim në hartë',
    'Map.Title': 'Harta', 'NavigationControl.ZoomIn': 'Zmadho', 'NavigationControl.ZoomOut': 'Zvogëlo',
    'NavigationControl.ResetBearing': 'Kthe veriun lart', 'LogoControl.Title': 'MapLibre',
    'CooperativeGesturesHandler.WindowsHelpText': 'Përdor Ctrl + rrotën për ta zmadhuar hartën',
    'CooperativeGesturesHandler.MacHelpText': 'Përdor ⌘ + rrotën për ta zmadhuar hartën',
    'CooperativeGesturesHandler.MobileHelpText': 'Përdor dy gishta për ta lëvizur hartën'
  };

  function numer(x) { return typeof x === 'number' && isFinite(x); }
  function kaVend(p) { return !!p && numer(p.lat) && numer(p.lng) && Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180; }
  function celesi(p) { return String(p.uid || '') + '|' + String(p.id || ''); }
  function kaSatelit() { return !!ESRI_CELESI; }
  function lexoPamjen() { try { return localStorage.getItem(KEY_PAMJA) === 'satelit'; } catch (e) { return false; } }
  function ruajPamjen(sat) { try { localStorage.setItem(KEY_PAMJA, sat ? 'satelit' : 'harta'); } catch (e) { /* ok */ } }

  // o: { tema, pikat, zgjedhur, satelit } (satelit vlen vetëm me çelës)
  function stili(o) {
    o = o || {};
    var sat = !!o.satelit && kaSatelit();
    var n = NGJYRAT[o.tema === 'dark' ? 'dark' : 'light'], ns = sat ? NGJYRAT.satelit : n;
    var rruget = ['in', ['get', 'class'], ['literal', ['motorway', 'trunk', 'primary', 'secondary', 'tertiary']]];
    var zgjedhur = ['==', ['get', 'k'], o.zgjedhur || ''];
    var hartaVetem = { visibility: sat ? 'none' : 'visible' }; // mbi satelit s'vizatohen uji dhe rrugët
    var burimet = { omt: { type: 'vector', url: PLLAKAT }, pikat: { type: 'geojson', data: pikatGeoJson(o.pikat) } };
    if (kaSatelit()) burimet.satelit = { type: 'raster', tiles: [SATELITI + '?token=' + encodeURIComponent(ESRI_CELESI)], tileSize: 256, maxzoom: 19, attribution: SATELITI_BURIMI };
    var shtresat = [{ id: 'sfondi', type: 'background', paint: { 'background-color': n.sfondi } }];
    if (kaSatelit()) shtresat.push({ id: 'satelit', type: 'raster', source: 'satelit', layout: { visibility: sat ? 'visible' : 'none' } });
    return {
      version: 8,
      glyphs: SHKRONJAT,
      sources: burimet,
      layers: shtresat.concat([
        { id: 'uji', type: 'fill', source: 'omt', 'source-layer': 'water', layout: hartaVetem, paint: { 'fill-color': n.uji } },
        { id: 'lumenjte', type: 'line', source: 'omt', 'source-layer': 'waterway', minzoom: 9, layout: hartaVetem, paint: { 'line-color': n.uji, 'line-width': 1.2 } },
        { id: 'rruget-vogla', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 13, layout: hartaVetem,
          filter: ['in', ['get', 'class'], ['literal', ['minor', 'service']]],
          paint: { 'line-color': n.rrugaVogel, 'line-width': ['interpolate', ['linear'], ['zoom'], 13, 1, 17, 6] } },
        { id: 'rruget-kufi', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 6, filter: rruget,
          layout: { 'line-cap': 'round', 'line-join': 'round', visibility: hartaVetem.visibility },
          paint: { 'line-color': n.rrugaKufi, 'line-width': ['interpolate', ['linear'], ['zoom'], 6, 1.5, 12, 4, 17, 14] } },
        { id: 'rruget', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 6, filter: rruget,
          layout: { 'line-cap': 'round', 'line-join': 'round', visibility: hartaVetem.visibility },
          paint: { 'line-color': n.rruga, 'line-width': ['interpolate', ['linear'], ['zoom'], 6, 0.6, 12, 2.5, 17, 11] } },
        { id: 'kufiri', type: 'line', source: 'omt', 'source-layer': 'boundary',
          filter: ['all', ['<=', ['get', 'admin_level'], 2], ['!=', ['get', 'maritime'], 1]],
          paint: { 'line-color': ns.kufiri, 'line-width': 1.2, 'line-dasharray': [3, 2] } },
        // Emrat: VETËM vendbanimet (qytet, qytezë, fshat, lagje); asnjë shtresë tjetër me emra
        { id: 'vendbanimet', type: 'symbol', source: 'omt', 'source-layer': 'place',
          filter: ['in', ['get', 'class'], ['literal', VENDBANIMET]],
          layout: { 'text-field': ['coalesce', ['get', 'name:sq'], ['get', 'name']], 'text-font': ['Noto Sans Regular'], 'text-max-width': 8,
            'text-size': ['match', ['get', 'class'], 'city', 16, 'town', 14, 'village', 12.5, LAGJET, 11, 11.5],
            // lagjet me shkronja të mëdha e të ndara (si në hartat e zakonshme), që të dallohen nga fshatrat
            'text-transform': ['match', ['get', 'class'], LAGJET, 'uppercase', 'none'],
            'text-letter-spacing': ['match', ['get', 'class'], LAGJET, 0.08, 0],
            'symbol-sort-key': ['coalesce', ['get', 'rank'], 99] },
          paint: { 'text-color': ['match', ['get', 'class'], LAGJET, ns.tekstiLagje, ns.teksti], 'text-halo-color': ns.halo, 'text-halo-width': sat ? 1.8 : 1.5 } },
        { id: 'pikat', type: 'circle', source: 'pikat',
          paint: { 'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, ['case', zgjedhur, 7, 5], 14, ['case', zgjedhur, 12, 9]],
            'circle-color': ngjyraEPikes(ns, zgjedhur), 'circle-stroke-color': ns.pikaKufi, 'circle-stroke-width': 2.5 } },
        { id: 'pikat-emri', type: 'symbol', source: 'pikat',
          layout: { 'text-field': ['get', 'emri'], 'text-font': ['Noto Sans Bold'], 'text-size': 13, 'text-anchor': 'top',
            'text-offset': [0, 0.9], 'text-max-width': 10, 'symbol-sort-key': ['case', zgjedhur, 0, ['==', ['get', 'tjeter'], true], 2, 1] },
          paint: { 'text-color': sat ? ns.tekstiPika : ngjyraEPikes(ns, zgjedhur), 'text-halo-color': ns.halo, 'text-halo-width': 1.8 } }
      ])
    };
  }
  // E zgjedhura portokalli; pikat e të tjerëve (merchandiseri) më të zbehta
  function ngjyraEPikes(n, zgjedhur) { return ['case', zgjedhur, n.pikaZgjedhur, ['==', ['get', 'tjeter'], true], n.pikaTjeter, n.pika]; }

  function pikatGeoJson(pikat) {
    return { type: 'FeatureCollection', features: (pikat || []).filter(kaVend).map(function (p) {
      return { type: 'Feature', geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
        properties: { k: celesi(p), emri: String(p.emri || 'Market'), perdoruesi: String(p.perdoruesi || ''), tjeter: !!p.tjeter } };
    }) };
  }

  function emriIPastruar(e) { return String(e || '').trim().replace(/\s+/g, ' ').slice(0, EMRI_MAKS); }

  var ngarkimi = null;
  function ngarko() {
    if (root.maplibregl) return Promise.resolve(root.maplibregl);
    if (ngarkimi) return ngarkimi;
    ngarkimi = new Promise(function (ok, gabim) {
      if (!document.querySelector('link[data-maplibre]')) {
        var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = MAPLIBRE_CSS; l.setAttribute('data-maplibre', '1');
        document.head.appendChild(l);
      }
      var s = document.createElement('script');
      s.src = MAPLIBRE_JS; s.integrity = MAPLIBRE_SRI; s.crossOrigin = 'anonymous'; s.async = true;
      s.onload = function () { if (root.maplibregl) ok(root.maplibregl); else { ngarkimi = null; gabim(new Error('ngarkimi')); } };
      s.onerror = function () { ngarkimi = null; if (s.parentNode) s.parentNode.removeChild(s); gabim(new Error('ngarkimi')); };
      document.head.appendChild(s);
    });
    return ngarkimi;
  }

  // Harta brenda `el`. o: { tema, pikat, kurKlikon(celesi), kurSkaPllaka(), kurSkaSatelit() }. Kthen premtim me
  // { map, vendos, zgjidh, pershtat, tema, satelit, eshteSatelit, madhesia, hiq }
  // kurSkaPllaka: pllakat/shkronjat e OpenFreeMap-it s'u morën (pa internet, ose CSP pa tiles.openfreemap.org), një herë
  // kurSkaSatelit: pllakat e Esri-t s'u morën (pa internet, çelës i pavlefshëm, CSP); harta kthehet vetë te "Hartë"
  function krijo(el, o) {
    o = o || {};
    return ngarko().then(function (ml) {
      var pikat = o.pikat || [], tema = o.tema, zgjedhur = '', sat = kaSatelit() && lexoPamjen();
      var map;
      try {
        map = new ml.Map({ container: el, style: stili({ tema: tema, pikat: pikat, satelit: sat }), center: KOSOVA.qendra, zoom: KOSOVA.zoom,
          maxZoom: 18, attributionControl: { compact: true }, dragRotate: false, pitchWithRotate: false, touchPitch: false, locale: TEKSTET });
      } catch (e) { throw new Error('webgl'); }
      map.touchZoomRotate.disableRotation();
      // v246: atribuimi (OpenFreeMap, OpenMapTiles, OpenStreetMap) është i detyrueshëm nga licenca dhe s'hiqet; sipas
      // udhëzimeve të OSMF-së del kur hapet harta dhe palohet në butonin (i) pas 5 sekondash ose kur prek hartën
      function palosBurimet() {
        var c = el.querySelector('.maplibregl-ctrl-attrib.maplibregl-compact-show');
        if (c) c.classList.remove('maplibregl-compact-show');
      }
      map.once('load', function () { setTimeout(palosBurimet, 5000); });
      map.on('movestart', function (ev) { if (ev && ev.originalEvent) palosBurimet(); });
      map.on('click', palosBurimet);
      map.addControl(new ml.NavigationControl({ showCompass: false }), 'top-right');
      map.on('click', 'pikat', function (ev) {
        var f = ev.features && ev.features[0];
        if (f && o.kurKlikon) o.kurKlikon(f.properties.k);
      });
      // Pikat që erdhën para se stili të ngarkohej (burimi s'ekzistonte ende) vendosen kur ngarkohet
      map.on('load', function () { var s = map.getSource('pikat'); if (s) s.setData(pikatGeoJson(pikat)); });
      var njoftuar = false, gabimeSatelit = 0;
      map.on('error', function (ev) {
        var m = String((ev && ev.error && ev.error.message) || '');
        if (ev && ev.sourceId === 'satelit') {
          // disa pllaka mund të mungojnë (p.sh. det); kur dështojnë shumë, ose çelësi refuzohet, kthehet te harta
          gabimeSatelit++;
          if (sat && (gabimeSatelit >= 4 || /40[13]|Unauthorized|Forbidden/i.test(m))) { vendosSatelitin(false, true); if (o.kurSkaSatelit) o.kurSkaSatelit(); }
          return;
        }
        if (njoftuar || !o.kurSkaPllaka || (ev && ev.sourceId && ev.sourceId !== 'omt') || !/fetch|load|network|NetworkError|Failed|AJAXError/i.test(m)) return;
        njoftuar = true; o.kurSkaPllaka();
      });
      // v247: butoni "Satelit" / "Hartë" (nën zmadhimin) + "Powered by Esri" që s'palohet kur sheh satelitin
      var btnSat = null, esri = null;
      if (kaSatelit()) {
        var grupi = document.createElement('div'); grupi.className = 'maplibregl-ctrl maplibregl-ctrl-group ht-pamja';
        btnSat = document.createElement('button'); btnSat.type = 'button'; btnSat.className = 'ht-pamja-btn';
        btnSat.addEventListener('click', function () { vendosSatelitin(!sat); });
        grupi.appendChild(btnSat);
        map.addControl({ onAdd: function () { return grupi; }, onRemove: function () { if (grupi.parentNode) grupi.parentNode.removeChild(grupi); } }, 'top-right');
        esri = document.createElement('div'); esri.className = 'ht-esri'; esri.textContent = 'Powered by Esri';
        el.appendChild(esri);
      }
      function rifreskoButonin() {
        if (!btnSat) return;
        btnSat.textContent = sat ? 'Hartë' : 'Satelit';
        btnSat.title = sat ? 'Shfaq hartën' : 'Shfaq pamjen satelitore';
        btnSat.setAttribute('aria-pressed', sat ? 'true' : 'false');
        esri.hidden = !sat;
        el.classList.toggle('ht-satelit', sat);
      }
      function vendosSatelitin(v, paRuajtur) {
        v = !!v && kaSatelit();
        if (v === sat) return;
        sat = v; gabimeSatelit = 0;
        if (!paRuajtur) ruajPamjen(sat);
        rivizato(); rifreskoButonin();
      }
      // Nën zmadhimin 14 pllakat s'i kanë lagjet: butoni të çon aty (në qendër të asaj që po shikon)
      var udh = document.createElement('button');
      udh.type = 'button'; udh.className = 'ht-udhezim'; udh.textContent = 'Zmadho për emrat e lagjeve';
      udh.addEventListener('click', function () { map.easeTo({ zoom: ZOOM_LAGJET, duration: 500 }); });
      el.appendChild(udh);
      function rifreskoUdhezimin() { udh.hidden = map.getZoom() >= ZOOM_LAGJET - 0.05; }
      map.on('zoomend', rifreskoUdhezimin);
      map.on('mouseenter', 'pikat', function () { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'pikat', function () { map.getCanvas().style.cursor = ''; });
      function pershtat(l) {
        var v = (l || pikat).filter(kaVend);
        if (!v.length) { map.jumpTo({ center: KOSOVA.qendra, zoom: KOSOVA.zoom }); return; }
        if (v.length === 1) { map.jumpTo({ center: [v[0].lng, v[0].lat], zoom: 14 }); return; }
        var b = new ml.LngLatBounds([v[0].lng, v[0].lat], [v[0].lng, v[0].lat]);
        v.forEach(function (p) { b.extend([p.lng, p.lat]); });
        map.fitBounds(b, { padding: 48, maxZoom: 15, duration: 0 });
      }
      function rivizato() { map.setStyle(stili({ tema: tema, pikat: pikat, zgjedhur: zgjedhur, satelit: sat })); }
      var inst = {
        map: map,
        vendos: function (l) {
          pikat = l || [];
          var s = map.getSource('pikat');
          if (s) s.setData(pikatGeoJson(pikat));
        },
        zgjidh: function (k, fluturo) {
          zgjedhur = k || '';
          if (map.getLayer('pikat')) {
            var z = ['==', ['get', 'k'], zgjedhur], n = sat ? NGJYRAT.satelit : NGJYRAT[tema === 'dark' ? 'dark' : 'light'];
            map.setPaintProperty('pikat', 'circle-color', ngjyraEPikes(n, z));
            map.setPaintProperty('pikat', 'circle-radius', ['interpolate', ['linear'], ['zoom'], 6, ['case', z, 7, 5], 14, ['case', z, 12, 9]]);
            if (!sat) map.setPaintProperty('pikat-emri', 'text-color', ngjyraEPikes(n, z));
            map.setLayoutProperty('pikat-emri', 'symbol-sort-key', ['case', z, 0, ['==', ['get', 'tjeter'], true], 2, 1]);
          }
          var p = pikat.filter(function (x) { return celesi(x) === zgjedhur; })[0];
          if (fluturo && kaVend(p)) map.flyTo({ center: [p.lng, p.lat], zoom: Math.max(map.getZoom(), 15), duration: 600 });
        },
        pershtat: pershtat,
        tema: function (t) { if (t !== tema) { tema = t; rivizato(); } },
        satelit: function (v) { vendosSatelitin(v); },
        eshteSatelit: function () { return sat; },
        madhesia: function () { map.resize(); },
        hiq: function () { try { map.remove(); } catch (e) { /* ok */ } }
      };
      pershtat(pikat);
      rifreskoUdhezimin();
      rifreskoButonin();
      api.eFundit = inst; // për testet dhe kontrollin nga konsola
      return inst;
    });
  }

  var api = {
    MAPLIBRE_JS: MAPLIBRE_JS, MAPLIBRE_SRI: MAPLIBRE_SRI, MAPLIBRE_CSS: MAPLIBRE_CSS, PLLAKAT: PLLAKAT, SHKRONJAT: SHKRONJAT,
    VENDBANIMET: VENDBANIMET, LAGJET: LAGJET, ZOOM_LAGJET: ZOOM_LAGJET, KOSOVA: KOSOVA, SATELITI: SATELITI, KEY_PAMJA: KEY_PAMJA,
    kaSatelit: kaSatelit, kaVend: kaVend, celesi: celesi, stili: stili, pikatGeoJson: pikatGeoJson, emriIPastruar: emriIPastruar, ngarko: ngarko, krijo: krijo
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.StokuHarta = api;
})(typeof self !== 'undefined' ? self : this);
