// v238: a e njeh shfletuesi sintaksën ES2020 (Firebase v12 e kërkon)? Në një shfletues të vjetër ky skedar s'lexohet fare
// (gabim sintakse) dhe shenja mbetet e papërcaktuar. Zëvendëson `new Function(...)` te porta.js, që CSP-ja (pa 'unsafe-eval') e ndalon.
window.__stokuES2020 = (null)?.a ?? true;
