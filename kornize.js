// v238: u nxor nga index.html (CSP pa 'unsafe-inline': faqet s'kanë më skripta të brendshme). Kur ndryshon, rrite ?v= te index.html dhe sw.js.
  if (window.self === window.top) { var paKornize = document.getElementById('paKornize'); paKornize.parentNode.removeChild(paKornize); }
  else { try { window.top.location = window.self.location.href; } catch (e) { /* mbetet e fshehur */ } }
