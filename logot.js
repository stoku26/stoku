/* v313: logoja e Stoku-t (seti 60 "Lista e kontrollit") dhe 25 kombinimet e ngjyrave (Cilësimet → Pamja → Logoja).
 * Zgjedhja ruhet në këtë pajisje (stoku:logoja) dhe te llogaria (perdoruesit/{uid}.pamja.logo, ekipa.js), pra kthehet pas hyrjes.
 * Ngjyrat e logos në faqe vijnë nga css/stoku-logot.css sipas data-logo te <html> (e vendos edhe fillimi-*.js para vizatimit).
 * Të dhënat (midis LOGOT-FILLIMI dhe LOGOT-FUNDI) i shkruan VETËM teste/logot-gjenero.py: mos i ndrysho me dorë. */
(function (root) {
  'use strict';
  /* LOGOT-FILLIMI */
  var DATA = {
    // Shenja në rrjetën 64 (ikona: translate(6.4 6.4) scale(.8)); r: "f" ngjyra kryesore, "a" theksi; prerjet janë vrima të vërteta
    shenja: [
      { d: 'M15 13H20C21.66 13 23 14.34 23 16V21C23 22.66 21.66 24 20 24H15C13.34 24 12 22.66 12 21V16C12 14.34 13.34 13 15 13ZM15.59 17.74Q15.21 17.34 14.83 17.33Q14.44 17.32 14.04 17.71Q13.24 18.47 14.01 19.26L16.21 21.56Q16.97 22.36 17.76 21.59Q17.83 21.53 17.89 21.45L21.39 16.65Q21.71 16.2 21.65 15.82Q21.59 15.44 21.15 15.11Q20.26 14.46 19.61 15.35L16.89 19.09Z', r: 'a', o: 1 },
      { d: 'M30 16.5H50C51.1 16.5 52 17.4 52 18.5C52 19.6 51.1 20.5 50 20.5H30C28.9 20.5 28 19.6 28 18.5C28 17.4 28.9 16.5 30 16.5Z', r: 'f', o: 1 },
      { d: 'M15.5 26.8H19.5Q23.2 26.8 23.2 30.5V34.5Q23.2 38.2 19.5 38.2H15.5Q11.8 38.2 11.8 34.5L11.8 30.5Q11.8 26.8 15.5 26.8ZM15.5 29.2Q14.2 29.2 14.2 30.5L14.2 34.5Q14.2 35.8 15.5 35.8H19.5Q20.8 35.8 20.8 34.5V30.5Q20.8 29.2 19.5 29.2Z', r: 'f', o: 1 },
      { d: 'M30 30.5H46C47.1 30.5 48 31.4 48 32.5C48 33.6 47.1 34.5 46 34.5H30C28.9 34.5 28 33.6 28 32.5C28 31.4 28.9 30.5 30 30.5Z', r: 'f', o: 0.8 },
      { d: 'M15.5 40.8H19.5Q23.2 40.8 23.2 44.5V48.5Q23.2 52.2 19.5 52.2H15.5Q11.8 52.2 11.8 48.5L11.8 44.5Q11.8 40.8 15.5 40.8ZM15.5 43.2Q14.2 43.2 14.2 44.5L14.2 48.5Q14.2 49.8 15.5 49.8H19.5Q20.8 49.8 20.8 48.5V44.5Q20.8 43.2 19.5 43.2Z', r: 'f', o: 1 },
      { d: 'M30 44.5H42C43.1 44.5 44 45.4 44 46.5C44 47.6 43.1 48.5 42 48.5H30C28.9 48.5 28 47.6 28 46.5C28 45.4 28.9 44.5 30 44.5Z', r: 'f', o: 0.8 }
    ],
    mono: 'M15.5 26.8H19.5Q23.2 26.8 23.2 30.5V34.5Q23.2 38.2 19.5 38.2H15.5Q11.8 38.2 11.8 34.5L11.8 30.5Q11.8 26.8 15.5 26.8ZM15.5 40.8H19.5Q23.2 40.8 23.2 44.5V48.5Q23.2 52.2 19.5 52.2H15.5Q11.8 52.2 11.8 48.5L11.8 44.5Q11.8 40.8 15.5 40.8ZM15 13H20C21.66 13 23 14.34 23 16V21C23 22.66 21.66 24 20 24H15C13.34 24 12 22.66 12 21V16C12 14.34 13.34 13 15 13ZM30 16.5H50C51.1 16.5 52 17.4 52 18.5C52 19.6 51.1 20.5 50 20.5H30C28.9 20.5 28 19.6 28 18.5C28 17.4 28.9 16.5 30 16.5ZM30 30.5H46C47.1 30.5 48 31.4 48 32.5C48 33.6 47.1 34.5 46 34.5H30C28.9 34.5 28 33.6 28 32.5C28 31.4 28.9 30.5 30 30.5ZM30 44.5H42C43.1 44.5 44 45.4 44 46.5C44 47.6 43.1 48.5 42 48.5H30C28.9 48.5 28 47.6 28 46.5C28 45.4 28.9 44.5 30 44.5ZM15.5 43.2Q14.2 43.2 14.2 44.5L14.2 48.5Q14.2 49.8 15.5 49.8H19.5Q20.8 49.8 20.8 48.5V44.5Q20.8 43.2 19.5 43.2ZM15.5 29.2Q14.2 29.2 14.2 30.5L14.2 34.5Q14.2 35.8 15.5 35.8H19.5Q20.8 35.8 20.8 34.5V30.5Q20.8 29.2 19.5 29.2ZM15.59 17.74Q15.21 17.34 14.83 17.33Q14.44 17.32 14.04 17.71Q13.24 18.47 14.01 19.26L16.21 21.56Q16.97 22.36 17.76 21.59Q17.83 21.53 17.89 21.45L21.39 16.65Q21.71 16.2 21.65 15.82Q21.59 15.44 21.15 15.11Q20.26 14.46 19.61 15.35L16.89 19.09Z',
    kutia: [11.8, 13, 52, 52.2],
    // Logoja e plotë (shenja + "stoku" + pika), 158.53 x 43.2
    logo: {
      w: 158.53, h: 43.2,
      shenja: [
        { d: 'M5.2 2H10.2C11.86 2 13.2 3.34 13.2 5V10C13.2 11.66 11.86 13 10.2 13H5.2C3.54 13 2.2 11.66 2.2 10V5C2.2 3.34 3.54 2 5.2 2ZM5.79 6.74Q5.41 6.34 5.03 6.33Q4.64 6.32 4.24 6.71Q3.44 7.47 4.21 8.26L6.41 10.56Q7.17 11.36 7.96 10.59Q8.03 10.53 8.09 10.45L11.59 5.65Q11.91 5.2 11.85 4.82Q11.79 4.44 11.35 4.11Q10.46 3.46 9.81 4.35L7.09 8.09Z', r: 'a', o: 1 },
        { d: 'M20.2 5.5H40.2C41.3 5.5 42.2 6.4 42.2 7.5C42.2 8.6 41.3 9.5 40.2 9.5H20.2C19.1 9.5 18.2 8.6 18.2 7.5C18.2 6.4 19.1 5.5 20.2 5.5Z', r: 'f', o: 1 },
        { d: 'M5.7 15.8H9.7Q13.4 15.8 13.4 19.5V23.5Q13.4 27.2 9.7 27.2H5.7Q2 27.2 2 23.5L2 19.5Q2 15.8 5.7 15.8ZM5.7 18.2Q4.4 18.2 4.4 19.5L4.4 23.5Q4.4 24.8 5.7 24.8H9.7Q11 24.8 11 23.5V19.5Q11 18.2 9.7 18.2Z', r: 'f', o: 1 },
        { d: 'M20.2 19.5H36.2C37.3 19.5 38.2 20.4 38.2 21.5C38.2 22.6 37.3 23.5 36.2 23.5H20.2C19.1 23.5 18.2 22.6 18.2 21.5C18.2 20.4 19.1 19.5 20.2 19.5Z', r: 'f', o: 0.8 },
        { d: 'M5.7 29.8H9.7Q13.4 29.8 13.4 33.5V37.5Q13.4 41.2 9.7 41.2H5.7Q2 41.2 2 37.5L2 33.5Q2 29.8 5.7 29.8ZM5.7 32.2Q4.4 32.2 4.4 33.5L4.4 37.5Q4.4 38.8 5.7 38.8H9.7Q11 38.8 11 37.5V33.5Q11 32.2 9.7 32.2Z', r: 'f', o: 1 },
        { d: 'M20.2 33.5H32.2C33.3 33.5 34.2 34.4 34.2 35.5C34.2 36.6 33.3 37.5 32.2 37.5H20.2C19.1 37.5 18.2 36.6 18.2 35.5C18.2 34.4 19.1 33.5 20.2 33.5Z', r: 'f', o: 0.8 }
      ],
      fjala: 'M96.68 34.93Q93.73 34.93 91.45 33.75Q89.17 32.57 87.87 30.31Q86.56 28.05 86.56 24.88Q86.56 21.63 87.88 19.35Q89.21 17.07 91.48 15.85Q93.74 14.64 96.6 14.64Q99.52 14.64 101.76 15.88Q104.01 17.13 105.3 19.42Q106.6 21.72 106.6 24.96Q106.6 28.11 105.34 30.35Q104.09 32.6 101.86 33.76Q99.63 34.93 96.68 34.93ZM108.54 34.64V8.27H114.45V22.24H116.72L121.17 15.01H127.79L121.62 24.36L128.29 34.64H121.46L116.88 27.51H114.45V34.64ZM137.89 34.93Q133.47 34.93 131.07 32.69Q128.66 30.46 128.66 25.96V15.01H134.57V25.51Q134.57 26.67 134.89 27.59Q135.21 28.5 135.95 29.04Q136.68 29.57 137.89 29.57Q139.23 29.57 139.89 28.98Q140.56 28.39 140.77 27.44Q140.98 26.49 140.98 25.51V15.01H146.89V25.96Q146.89 30.7 144.48 32.81Q142.07 34.93 137.89 34.93ZM65.03 34.93Q63.6 34.93 62.13 34.61Q60.67 34.29 59.41 33.53Q58.14 32.78 57.27 31.48Q56.4 30.17 56.12 28.21H62.09Q62.29 28.8 62.77 29.22Q63.25 29.64 63.92 29.86Q64.6 30.08 65.33 30.08Q65.8 30.08 66.24 30Q66.68 29.93 67.04 29.74Q67.39 29.55 67.59 29.26Q67.79 28.97 67.79 28.56Q67.79 28.05 67.47 27.77Q67.15 27.5 66.59 27.33Q66.04 27.16 65.3 27.01Q64.6 26.84 63.85 26.7Q63.1 26.56 62.37 26.39Q60.94 26.05 59.63 25.43Q58.33 24.82 57.51 23.68Q56.68 22.54 56.68 20.65Q56.68 18.99 57.39 17.84Q58.11 16.69 59.3 15.98Q60.49 15.28 61.94 14.96Q63.39 14.64 64.83 14.64Q66.89 14.64 68.65 15.3Q70.4 15.96 71.57 17.38Q72.74 18.81 73.02 21.12H67.33Q67.22 20.37 66.47 19.93Q65.71 19.49 64.61 19.49Q64.19 19.49 63.79 19.57Q63.39 19.64 63.06 19.79Q62.73 19.94 62.54 20.2Q62.35 20.46 62.35 20.81Q62.35 21.1 62.52 21.37Q62.7 21.65 63.08 21.85Q63.46 22.05 64.02 22.19Q65.17 22.45 66.38 22.68Q67.58 22.92 68.66 23.18Q69.88 23.47 70.99 24.02Q72.11 24.57 72.83 25.62Q73.55 26.67 73.55 28.47Q73.55 30.34 72.78 31.59Q72.02 32.84 70.76 33.56Q69.5 34.29 68 34.61Q66.5 34.93 65.03 34.93ZM83.6 34.64Q81.07 34.64 79.42 34.06Q77.78 33.48 76.97 32.05Q76.16 30.62 76.16 28.01V20.28H73.35V15.01H76.16V9.93H82.07V15.01H86.01V20.28H82.07V27.14Q82.07 28.11 82.41 28.73Q82.75 29.35 84.12 29.35H85.81V34.64ZM96.59 29.48Q98.15 29.48 99.08 28.81Q100.01 28.14 100.41 27.08Q100.81 26.02 100.81 24.9Q100.81 23.79 100.41 22.68Q100.01 21.57 99.1 20.84Q98.18 20.11 96.59 20.11Q95.03 20.11 94.09 20.84Q93.15 21.57 92.75 22.67Q92.35 23.76 92.35 24.9Q92.35 26.05 92.76 27.11Q93.18 28.17 94.1 28.82Q95.03 29.48 96.59 29.48Z',
      pika: 'M153.04 35.21Q151.6 35.21 150.56 34.31Q149.53 33.41 149.53 31.69Q149.53 29.95 150.59 28.97Q151.66 28 153.07 28Q154.49 28 155.51 28.96Q156.53 29.92 156.53 31.66Q156.53 33.41 155.51 34.31Q154.49 35.21 153.04 35.21Z'
    },
    // v314: logoja vetëm me shkronja ("stoku." + pika), 100.42 x 26.94
    fjala: { w: 100.42, h: 26.94, t: 'M40.56 26.66Q37.62 26.66 35.34 25.47Q33.06 24.29 31.75 22.04Q30.44 19.78 30.44 16.6Q30.44 13.36 31.77 11.08Q33.09 8.79 35.36 7.58Q37.63 6.36 40.49 6.36Q43.4 6.36 45.65 7.61Q47.89 8.85 49.19 11.15Q50.48 13.45 50.48 16.69Q50.48 19.84 49.23 22.08Q47.98 24.32 45.74 25.49Q43.51 26.66 40.56 26.66ZM52.43 26.37V0H58.33V13.97H60.6L65.06 6.74H71.67L65.5 16.09L72.17 26.37H65.35L60.76 19.23H58.33V26.37ZM81.77 26.66Q77.35 26.66 74.95 24.42Q72.55 22.18 72.55 17.68V6.74H78.46V17.24Q78.46 18.4 78.78 19.32Q79.1 20.23 79.83 20.77Q80.56 21.3 81.77 21.3Q83.11 21.3 83.78 20.71Q84.44 20.11 84.65 19.17Q84.86 18.22 84.86 17.24V6.74H90.77V17.68Q90.77 22.42 88.36 24.54Q85.95 26.66 81.77 26.66ZM8.91 26.66Q7.48 26.66 6.02 26.34Q4.55 26.02 3.29 25.26Q2.03 24.51 1.16 23.21Q0.28 21.9 0 19.94H5.98Q6.17 20.53 6.65 20.95Q7.13 21.37 7.81 21.59Q8.48 21.8 9.21 21.8Q9.69 21.8 10.13 21.73Q10.57 21.66 10.92 21.47Q11.27 21.28 11.47 20.99Q11.67 20.69 11.67 20.28Q11.67 19.78 11.35 19.5Q11.03 19.23 10.48 19.06Q9.93 18.89 9.19 18.74Q8.49 18.56 7.74 18.43Q6.98 18.29 6.25 18.12Q4.82 17.77 3.52 17.16Q2.21 16.54 1.39 15.41Q0.57 14.27 0.57 12.38Q0.57 10.72 1.28 9.56Q1.99 8.41 3.18 7.71Q4.37 7 5.82 6.68Q7.27 6.36 8.72 6.36Q10.78 6.36 12.53 7.02Q14.29 7.68 15.46 9.11Q16.63 10.54 16.9 12.85H11.22Q11.1 12.09 10.35 11.65Q9.6 11.22 8.5 11.22Q8.08 11.22 7.68 11.29Q7.27 11.37 6.95 11.52Q6.62 11.67 6.42 11.93Q6.23 12.18 6.23 12.54Q6.23 12.82 6.41 13.1Q6.58 13.38 6.96 13.58Q7.34 13.78 7.9 13.91Q9.05 14.17 10.26 14.41Q11.47 14.64 12.54 14.91Q13.76 15.19 14.88 15.75Q15.99 16.3 16.71 17.35Q17.43 18.4 17.43 20.2Q17.43 22.07 16.67 23.32Q15.9 24.57 14.64 25.29Q13.38 26.02 11.88 26.34Q10.38 26.66 8.91 26.66ZM27.48 26.37Q24.95 26.37 23.31 25.79Q21.66 25.21 20.85 23.78Q20.05 22.35 20.05 19.74V12.01H17.23V6.74H20.05V1.66H25.96V6.74H29.9V12.01H25.96V18.87Q25.96 19.84 26.29 20.46Q26.63 21.07 28 21.07H29.7V26.37ZM40.47 21.21Q42.04 21.21 42.96 20.54Q43.89 19.87 44.29 18.81Q44.69 17.75 44.69 16.63Q44.69 15.52 44.29 14.41Q43.89 13.3 42.98 12.57Q42.07 11.84 40.47 11.84Q38.91 11.84 37.97 12.57Q37.03 13.3 36.63 14.39Q36.23 15.49 36.23 16.63Q36.23 17.78 36.65 18.84Q37.06 19.9 37.99 20.55Q38.91 21.21 40.47 21.21Z', p: 'M96.93 26.94Q95.48 26.94 94.45 26.04Q93.41 25.14 93.41 23.42Q93.41 21.68 94.48 20.7Q95.54 19.73 96.96 19.73Q98.37 19.73 99.4 20.69Q100.42 21.65 100.42 23.39Q100.42 25.14 99.4 26.04Q98.37 26.94 96.93 26.94Z' },
    variantet: [
      { id: '60', emri: 'Gjelbër', bg: '#2e7d4f', fg: '#ffffff', ac: '#d9f99d', br: '#2e7d4f', acL: '#65a30d', dk: '#86efac', acD: '#d9f99d' },
      { id: '60-1', emri: 'Blu', bg: '#1f5fc4', fg: '#ffffff', ac: '#f5b942', br: '#1f5fc4', acL: '#e0a020', dk: '#7aaaf2', acD: '#f5b942' },
      { id: '60-2', emri: 'Kobalt', bg: '#1e3a8a', fg: '#ffffff', ac: '#38bdf8', br: '#1e3a8a', acL: '#0284c7', dk: '#93c5fd', acD: '#38bdf8' },
      { id: '60-3', emri: 'Qielli', bg: '#0369a1', fg: '#ffffff', ac: '#fcd34d', br: '#0369a1', acL: '#d97706', dk: '#7dd3fc', acD: '#fcd34d' },
      { id: '60-4', emri: 'Natë', bg: '#0f172a', fg: '#67d0f8', ac: '#fbbf24', br: '#0f172a', acL: '#0284c7', dk: '#67d0f8', acD: '#fbbf24' },
      { id: '60-5', emri: 'Blu e thellë + limon', bg: '#172554', fg: '#ffffff', ac: '#a3e635', br: '#172554', acL: '#65a30d', dk: '#93c5fd', acD: '#a3e635' },
      { id: '60-6', emri: 'Gurkali', bg: '#0f766e', fg: '#ffffff', ac: '#fbbf24', br: '#0f766e', acL: '#d97706', dk: '#5eead4', acD: '#fbbf24' },
      { id: '60-7', emri: 'Pyll natë', bg: '#0b3d2e', fg: '#e7f6ee', ac: '#4ade80', br: '#0b3d2e', acL: '#16a34a', dk: '#86efac', acD: '#4ade80' },
      { id: '60-8', emri: 'Ulliri', bg: '#3f6212', fg: '#ecfccb', ac: '#facc15', br: '#3f6212', acL: '#a16207', dk: '#bef264', acD: '#facc15' },
      { id: '60-9', emri: 'Mente', bg: '#d1fae5', fg: '#065f46', ac: '#10b981', br: '#065f46', acL: '#059669', dk: '#6ee7b7', acD: '#34d399' },
      { id: '60-10', emri: 'Indigo', bg: '#4f46e5', fg: '#ffffff', ac: '#f9a8d4', br: '#4f46e5', acL: '#db2777', dk: '#a5b4fc', acD: '#f9a8d4' },
      { id: '60-11', emri: 'Vjollcë', bg: '#6d28d9', fg: '#ffffff', ac: '#fbbf24', br: '#6d28d9', acL: '#d97706', dk: '#c4b5fd', acD: '#fbbf24' },
      { id: '60-12', emri: 'Vjollcë + mente', bg: '#4c1d95', fg: '#ffffff', ac: '#6ee7b7', br: '#4c1d95', acL: '#059669', dk: '#c4b5fd', acD: '#6ee7b7' },
      { id: '60-13', emri: 'Rozë', bg: '#be185d', fg: '#ffffff', ac: '#fde68a', br: '#be185d', acL: '#d97706', dk: '#f9a8d4', acD: '#fde68a' },
      { id: '60-14', emri: 'E kuqe', bg: '#c23a33', fg: '#ffffff', ac: '#fde68a', br: '#c23a33', acL: '#ca8a04', dk: '#fca5a5', acD: '#fde68a' },
      { id: '60-15', emri: 'Portokalli', bg: '#ea580c', fg: '#ffffff', ac: '#fde68a', br: '#ea580c', acL: '#ca8a04', dk: '#fdba74', acD: '#fde68a' },
      { id: '60-16', emri: 'Bakër', bg: '#9a3412', fg: '#ffedd5', ac: '#fbbf24', br: '#9a3412', acL: '#d97706', dk: '#fdba74', acD: '#fbbf24' },
      { id: '60-17', emri: 'Qelibar', bg: '#f5b942', fg: '#14161b', ac: '#1f5fc4', br: '#b7791f', acL: '#1f5fc4', dk: '#f5b942', acD: '#7aaaf2' },
      { id: '60-18', emri: 'Grafit', bg: '#14161b', fg: '#ffffff', ac: '#f5b942', br: '#14161b', acL: '#d99a1e', dk: '#ffffff', acD: '#f5b942' },
      { id: '60-19', emri: 'Grafit + portokalli', bg: '#1c1917', fg: '#fafaf9', ac: '#fb923c', br: '#1c1917', acL: '#ea580c', dk: '#ffffff', acD: '#fb923c' },
      { id: '60-20', emri: 'E zezë', bg: '#000000', fg: '#f5f5f7', ac: '#22c55e', br: '#000000', acL: '#16a34a', dk: '#ffffff', acD: '#22c55e' },
      { id: '60-21', emri: 'Shkëmb', bg: '#334155', fg: '#f1f5f9', ac: '#f59e0b', br: '#334155', acL: '#d97706', dk: '#e2e8f0', acD: '#f59e0b' },
      { id: '60-22', emri: 'E bardhë', bg: '#ffffff', fg: '#14161b', ac: '#1f5fc4', br: '#14161b', acL: '#1f5fc4', dk: '#ffffff', acD: '#7aaaf2' },
      { id: '60-23', emri: 'E bardhë + jeshile', bg: '#ffffff', fg: '#1f2937', ac: '#22c55e', br: '#1f2937', acL: '#16a34a', dk: '#ffffff', acD: '#4ade80' },
      { id: '60-24', emri: 'Krem', bg: '#f6f1e7', fg: '#3b2f22', ac: '#c2410c', br: '#3b2f22', acL: '#c2410c', dk: '#f6f1e7', acD: '#fb923c' }
    ]
  };
  /* LOGOT-FUNDI */
  var KEY = 'stoku:logoja';
  var PARAZGJEDHJA = DATA.variantet[0].id;

  function varianti(id) {
    for (var i = 0; i < DATA.variantet.length; i++) if (DATA.variantet[i].id === id) return DATA.variantet[i];
    return null;
  }
  function lexo() {
    var id = null;
    try { id = localStorage.getItem(KEY); } catch (e) { /* ok */ }
    return varianti(id) ? id : PARAZGJEDHJA;
  }
  function ruaj(id) {
    if (!varianti(id)) id = PARAZGJEDHJA;
    try { if (id === PARAZGJEDHJA) localStorage.removeItem(KEY); else localStorage.setItem(KEY, id); } catch (e) { /* ok */ }
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  function ngj(r, k) { return r === 'a' ? k.a : k.f; }
  function shtresat(l, k) {
    return l.map(function (s) {
      return '<path fill="' + ngj(s.r, k) + '" d="' + s.d + '"' + (s.o < 0.999 ? ' opacity="' + s.o + '"' : '') + '></path>';
    }).join('');
  }
  var SQUIRCLE = 'M15 0h34a15 15 0 0 1 15 15v34a15 15 0 0 1-15 15H15A15 15 0 0 1 0 49V15A15 15 0 0 1 15 0z';
  // Ikona e aplikacionit (si ikona e telefonit) me ngjyrat e variantit
  function svgIkona(v, madhesia, klasa) {
    v = v || varianti(lexo());
    var kufi = ndricimi(v.bg) > 0.6 ? ' stroke="#d9d7d2" stroke-width="1.5"' : '';
    return '<svg' + (klasa ? ' class="' + klasa + '"' : '') + ' xmlns="http://www.w3.org/2000/svg" width="' + (madhesia || 64) + '" height="' + (madhesia || 64) +
      '" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path fill="' + v.bg + '" d="' + SQUIRCLE + '"' + kufi + '></path>' +
      '<g transform="translate(6.4 6.4) scale(0.8)">' + shtresat(DATA.shenja, { f: v.fg, a: v.ac }) + '</g></svg>';
  }
  // Logoja e plotë brenda faqes: ngjyrat nga CSS (data-logo + data-tema), shkronjat me ngjyrën e tekstit (currentColor)
  // v314 (pronari): logoja vetëm me shkronja "stoku." (pa shenjën)
  function svgLogo(klasa) {
    var F = DATA.fjala;
    return '<svg class="stk-logo' + (klasa ? ' ' + klasa : '') + '" viewBox="0 0 ' + F.w + ' ' + F.h + '" aria-hidden="true" focusable="false">' +
      '<path class="lg-t" d="' + F.t + '"></path><path class="lg-a" d="' + F.p + '"></path></svg>';
  }
  function ndricimi(hex) {
    var h = String(hex || '#000').replace('#', '');
    if (h.length === 3) h = h.replace(/./g, '$&$&');
    var v = [0, 2, 4].map(function (i) { var c = parseInt(h.substr(i, 2), 16) / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  }
  // Skeda e shfletuesit (favicon): ikona e variantit të zgjedhur; "60" mbetet me skedarët e zakonshëm
  function rifreskoFavicon(v) {
    var linkat = document.querySelectorAll('link[rel="icon"]');
    Array.prototype.forEach.call(linkat, function (l) {
      if (!l.hasAttribute('data-burimi')) l.setAttribute('data-burimi', l.getAttribute('href') || '');
      if (v.id === PARAZGJEDHJA) { l.setAttribute('href', l.getAttribute('data-burimi')); return; }
      l.setAttribute('href', 'data:image/svg+xml,' + encodeURIComponent(svgIkona(v, 64)));
      l.setAttribute('type', 'image/svg+xml');
      l.removeAttribute('sizes');
    });
  }
  function zbato() {
    var id = lexo(), r = document.documentElement;
    if (id === PARAZGJEDHJA) r.removeAttribute('data-logo'); else r.setAttribute('data-logo', id);
    try { rifreskoFavicon(varianti(id)); } catch (e) { /* ok */ }
    return id;
  }

  // Vizatimi në canvas (PDF, fotoja e afateve). o: { erret, tekst (ngjyra e shkronjave), varianti }
  function vizatoLogon(c, x, y, h, o) {
    o = o || {};
    var v = o.varianti || varianti(lexo()), F = DATA.fjala, k = h / F.h;
    if (!window.Path2D) return 0;
    c.save(); c.translate(x, y); c.scale(k, k);
    c.fillStyle = o.tekst || (o.erret ? '#f5f5f7' : '#14161b'); c.fill(new Path2D(F.t));
    c.fillStyle = o.erret ? v.acD : v.acL; c.fill(new Path2D(F.p));
    c.restore();
    return F.w * k;
  }
  function vizatoIkonen(c, x, y, s, v) {
    v = v || varianti(lexo());
    if (!window.Path2D) return;
    var k = s / 64;
    c.save(); c.translate(x, y); c.scale(k, k);
    c.fillStyle = v.bg; c.fill(new Path2D(SQUIRCLE));
    c.translate(6.4, 6.4); c.scale(0.8, 0.8);
    DATA.shenja.forEach(function (sh) { c.globalAlpha = sh.o; c.fillStyle = sh.r === 'a' ? v.ac : v.fg; c.fill(new Path2D(sh.d)); });
    c.restore();
  }

  // Cilësimet → Pamja → Logoja: grup i mbyllur (si "Ngjyrat"); hapet me prekje, 25 kartat me ikonën dhe numrin
  var SHIGJETA = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"></path></svg>';
  var hapur = false; // vetëm sa është faqja e hapur
  function el(tag, klasa) { var x = document.createElement(tag); if (klasa) x.className = klasa; return x; }
  function emri(id) { var v = varianti(id || lexo()) || DATA.variantet[0]; return v.id + ' · ' + v.emri; }
  function vizato(vendi, kurNdryshon) {
    if (!vendi) return;
    var aktivi = lexo();
    vendi.innerHTML = '';
    var g = el('div', 'tm-grupi lg-grupi');
    var krye = el('button', 'tm-krye'); krye.type = 'button'; krye.id = vendi.id ? vendi.id + 'Krye' : '';
    krye.setAttribute('aria-expanded', hapur ? 'true' : 'false');
    var ik = el('span', 'lg-ik lg-ik--krye'); ik.innerHTML = svgIkona(varianti(aktivi), 36); krye.appendChild(ik);
    var tk = el('span', 'tm-krye-tekst'), b = el('b'), s = el('span');
    b.textContent = 'Logoja'; s.textContent = emri(aktivi);
    tk.appendChild(b); tk.appendChild(s); krye.appendChild(tk);
    var sh = el('span', 'tm-shigjeta'); sh.innerHTML = SHIGJETA; krye.appendChild(sh);
    var rr = el('div', 'tm-rrjeta lg-rrjeta'); rr.hidden = !hapur;
    krye.addEventListener('click', function () {
      hapur = !hapur;
      rr.hidden = !hapur;
      krye.setAttribute('aria-expanded', hapur ? 'true' : 'false');
    });
    DATA.variantet.forEach(function (v) {
      var kb = el('button', 'tm-karta lg-karta'); kb.type = 'button';
      kb.setAttribute('aria-pressed', v.id === aktivi ? 'true' : 'false');
      kb.setAttribute('aria-label', 'Logoja ' + v.id + ', ' + v.emri);
      kb.setAttribute('data-id', v.id);
      var i = el('span', 'lg-ik'); i.innerHTML = svgIkona(v, 44); kb.appendChild(i);
      var e = el('span', 'tm-emri'); e.textContent = v.id; kb.appendChild(e);
      kb.addEventListener('click', function () {
        if (lexo() === v.id) return;
        ruaj(v.id); zbato();
        vizato(vendi, kurNdryshon);
        if (kurNdryshon) kurNdryshon(v.id);
      });
      rr.appendChild(kb);
    });
    g.appendChild(krye); g.appendChild(rr);
    vendi.appendChild(g);
  }

  root.StokuLogot = {
    KEY: KEY, PARAZGJEDHJA: PARAZGJEDHJA, variantet: DATA.variantet, logoW: DATA.fjala.w, logoH: DATA.fjala.h,
    lexo: lexo, ruaj: ruaj, varianti: varianti, zbato: zbato, emri: emri,
    svgLogo: svgLogo, svgIkona: svgIkona, vizatoLogon: vizatoLogon, vizatoIkonen: vizatoIkonen, vizato: vizato
  };
  // Skeda e shfletuesit me ikonën e zgjedhur sapo ngarkohet faqja (data-logo e vendos edhe fillimi-*.js)
  if (typeof document !== 'undefined') { try { zbato(); } catch (e) { /* ok */ } }
})(typeof window !== 'undefined' ? window : this);
