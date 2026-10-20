// v238: u nxor nga 404.html (CSP pa 'unsafe-inline': faqet s'kanë më skripta të brendshme). Kur ndryshon, rrite ?v= te 404.html dhe sw.js.
  (function () {
    // Service worker-at e vjetër jashtë rrënjës (p.sh. Stoku Beta te /beta/, që u hoq) çregjistrohen: Stoku ka vetëm atë te "/"
    try {
      if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) {
        navigator.serviceWorker.getRegistrations().then(function (rr) {
          rr.forEach(function (r) { try { if (new URL(r.scope).pathname !== '/') r.unregister(); } catch (e) { /* ok */ } });
        }).catch(function () { /* ok */ });
      }
    } catch (e) { /* ok */ }
    // Faqja kryesore e zgjedh vetë versionin: telefoni (index.html) ose kompjuteri (pc.html)
    setTimeout(function () { location.replace('/'); }, 6000);
  })();
