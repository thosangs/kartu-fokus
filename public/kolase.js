// Gambar buku stiker: latar dicetak pucat, tokoh dan benda jadi stiker yang ditempel tiap jawaban.
// Semua bentuk dirakit dari bahan cerita (tanpa gambar hasil AI), jadi warna di gambar sama dengan cerita.
import { TEMPAT, URUTAN_POTONGAN, WARNA } from './bahan.js';

const TINTA = WARNA.hitam;
const PUTIH = '#FFFFFF';
const KAYU = '#B07446';
const KULIT = ['#B4774C', '#CF9265'];

// Latar sengaja lebih pucat dari stiker, supaya yang baru ditempel paling menonjol.
const L = {
  langit: '#D6EAFF',
  awan: '#FFFFFF',
  matahari: '#FFC93C',
  rumput: '#9ED98C',
  tunas: '#3E9A4E',
  pasir: '#F6DDAE',
  gunung: '#A9CBF2',
  air: '#7DC3F7',
  atap: '#FF907C',
  dinding: '#FFFFFF',
  kaca: '#FFE59A',
  kacaSekolah: '#BFE3FF',
  batu: '#D3D0E0',
  daun: '#6CC274',
  jambu: '#FF907C',
  jerami: '#F2C96B',
};

const f1 = (n) => +n.toFixed(1);

function matahari(cx, cy, r) {
  const sinar = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const t = (rr, da) => `${f1(cx + Math.cos(a + da) * rr)},${f1(cy + Math.sin(a + da) * rr)}`;
    sinar.push({ p: `${t(r + 3, -0.2)} ${t(r + 11, 0)} ${t(r + 3, 0.2)}`, f: L.matahari });
  }
  return [...sinar, { c: [cx, cy, r], f: L.matahari }];
}

// Awan beralas datar dengan tiga gundukan; (x, y) = ujung kiri alas.
function awan(x, y, s = 1) {
  const k = (n) => f1(n * s);
  return {
    d: `M${x},${y} a${k(9)},${k(9)} 0 0 1 ${k(6)},${k(-14)} a${k(13)},${k(13)} 0 0 1 ${k(24)},${k(-3)} a${k(10)},${k(10)} 0 0 1 ${k(14)},${k(9)} a${k(7)},${k(7)} 0 0 1 ${k(-2)},${k(8)}Z`,
    f: L.awan,
  };
}

// Tanah bergelombang pelan sampai ke bawah gambar.
function tanah(y, warna, gel = 6) {
  return { d: `M-6,${y} Q90,${y - gel} 180,${y} T366,${y} V246 H-6Z`, f: warna };
}

// Tepi bergerigi lembut untuk rimbun daun.
function rimbun(cx, cy, rx, ry, n = 9) {
  let d = '';
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const x = f1(cx + Math.cos(a) * rx);
    const y = f1(cy + Math.sin(a) * ry);
    if (i === 0) {
      d = `M${x},${y}`;
      continue;
    }
    const m = ((i - 0.5) / n) * Math.PI * 2;
    d += ` Q${f1(cx + Math.cos(m) * rx * 1.3)},${f1(cy + Math.sin(m) * ry * 1.3)} ${x},${y}`;
  }
  return d + 'Z';
}

function tunas(x0, x1, y) {
  const out = [];
  for (let x = x0; x <= x1; x += 13) {
    out.push({ l: [x, y, x - 3, y - 9], s: L.tunas, w: 2.2 }, { l: [x, y, x + 3, y - 10], s: L.tunas, w: 2.2 });
  }
  return out;
}

// Tiap tempat = beberapa lapisan, digambar dari belakang ke depan. Sisi kanan dibiarkan kosong
// untuk tokoh dan benda (lihat SLOT).
const LATAR = {
  rumah_nenek: () => [
    [awan(26, 44), awan(214, 34, 0.75), ...matahari(150, 38, 14)],
    [tanah(160, L.rumput)],
    [
      { r: [169, 118, 10, 54], f: KAYU },
      { d: rimbun(174, 98, 26, 21), f: L.daun },
      { c: [162, 94, 3.6], f: L.jambu },
      { c: [184, 90, 3.6], f: L.jambu },
      { c: [176, 110, 3.6], f: L.jambu },
      { c: [191, 104, 3.6], f: L.jambu },
    ],
    [
      { r: [28, 112, 100, 62], f: L.dinding },
      { p: '16,116 78,62 140,116', f: L.atap },
      { r: [64, 136, 20, 38], f: KAYU },
      { r: [96, 128, 20, 18], f: L.kaca },
      { l: [106, 128, 106, 146], s: TINTA, w: 1.3, kecil: true },
      { l: [96, 137, 116, 137], s: TINTA, w: 1.3, kecil: true },
    ],
  ],
  pasar: () => [
    [awan(20, 40, 0.85), awan(222, 32, 0.75), ...matahari(190, 40, 13)],
    [tanah(162, L.pasir, 4)],
    [
      { r: [20, 100, 6, 72], f: KAYU },
      { r: [146, 100, 6, 72], f: KAYU },
      { r: [10, 138, 154, 10], f: KAYU },
    ],
    Array.from({ length: 7 }, (_, i) => ({ r: [f1(8 + i * 22.6), 84, 22.6, 20], f: i % 2 ? PUTIH : L.atap })),
    [
      { c: [32, 131, 7], f: L.matahari },
      { c: [46, 131, 7], f: L.matahari },
      { c: [39, 122, 7], f: L.matahari },
      { c: [72, 131, 7], f: L.jambu },
      { c: [86, 131, 7], f: L.jambu },
      { c: [79, 122, 7], f: L.jambu },
      { p: '104,138 111,117 120,127 128,114 136,138', f: L.daun },
    ],
  ],
  sawah: () => [
    [awan(24, 38, 0.8), awan(236, 30, 0.7), ...matahari(150, 98, 13)],
    [
      { p: '-10,152 72,62 158,152', f: L.gunung },
      { p: '128,152 232,56 344,152', f: L.gunung },
    ],
    [tanah(150, L.rumput)],
    [
      { r: [38, 130, 5, 40], f: KAYU },
      { r: [100, 128, 5, 42], f: KAYU },
      { r: [30, 140, 84, 7], f: KAYU },
      { p: '20,134 70,98 122,132', f: L.jerami },
    ],
    [...tunas(14, 150, 190), ...tunas(8, 352, 234)],
  ],
  sungai: () => [
    [awan(20, 42, 0.85), awan(214, 32, 0.75), ...matahari(150, 40, 13)],
    [tanah(150, L.rumput)],
    [{ d: 'M-6,166 Q60,152 112,170 Q142,198 166,246 H-6Z', f: L.air }],
    [
      { l: [18, 190, 40, 190], s: PUTIH, w: 2, kecil: true },
      { l: [62, 184, 84, 184], s: PUTIH, w: 2, kecil: true },
      { l: [96, 222, 116, 222], s: PUTIH, w: 2, kecil: true },
      { e: [44, 208, 10, 5.5], f: L.batu },
      { e: [80, 228, 8, 4.5], f: L.batu },
      { e: [22, 232, 7, 4], f: L.batu },
    ],
    [
      { l: [124, 176, 119, 146], s: L.tunas, w: 2.2 },
      { l: [130, 180, 132, 142], s: L.tunas, w: 2.2 },
      { l: [137, 186, 144, 152], s: L.tunas, w: 2.2 },
      { l: [12, 164, 8, 138], s: L.tunas, w: 2.2 },
      { l: [20, 163, 24, 134], s: L.tunas, w: 2.2 },
    ],
  ],
  sekolah: () => [
    [awan(18, 42, 0.8), awan(222, 30, 0.75), ...matahari(122, 36, 13)],
    [tanah(162, L.rumput)],
    [
      { r: [12, 108, 140, 64], f: L.dinding },
      { p: '2,112 82,72 162,112', f: L.atap },
      { r: [22, 124, 18, 18], f: L.kacaSekolah },
      { r: [52, 124, 18, 18], f: L.kacaSekolah },
      { r: [118, 124, 18, 18], f: L.kacaSekolah },
      { r: [84, 134, 20, 38], f: KAYU },
    ],
    [
      { l: [176, 34, 176, 172], s: TINTA, w: 2.6 },
      { r: [177, 36, 30, 10], f: WARNA.merah },
      { r: [177, 46, 30, 10], f: PUTIH },
    ],
  ],
};

// ── Sosok ─────────────────────────────────────────────────────
// Koordinat lokal: kaki di (0,0), kepala ke atas (y negatif). Tinggi anak ±66.
function sosok({ kulit, baju, bawah, warnaBawah, rambut, warnaRambut = TINTA, warnaKerudung }) {
  const S = [];
  if (bawah === 'celana') {
    S.push({ r: [-7, -15, 5, 15], f: kulit }, { r: [2, -15, 5, 15], f: kulit });
    S.push({ p: '-10,-29 10,-29 9,-14 -9,-14', f: warnaBawah });
  } else if (bawah === 'rok') {
    S.push({ r: [-6, -13, 4, 13], f: kulit }, { r: [2, -13, 4, 13], f: kulit });
    S.push({ p: '-10,-30 10,-30 14,-11 -14,-11', f: warnaBawah });
  } else {
    S.push({ p: '-11,-30 11,-30 13,0 -13,0', f: warnaBawah });
  }
  S.push({ p: '-10,-47 -15,-45 -18,-29 -14,-27', f: kulit });
  S.push({ p: '10,-47 15,-45 18,-29 14,-27', f: kulit });
  S.push({ p: '-11,-48 11,-48 16,-43 13,-39 11,-28 -11,-28 -13,-39 -16,-43', f: baju });
  let yMata = -56;
  if (rambut === 'kerudung') {
    S.push({ p: '-11,-52 -10,-61 -5,-66 5,-66 10,-61 11,-52 15,-40 -15,-40', f: warnaKerudung });
    S.push({ c: [0, -55, 6.5], f: kulit });
    yMata = -56;
  } else {
    S.push({ c: [0, -56, 8.5], f: kulit });
    if (rambut === 'peci') S.push({ p: '-8,-61 8,-61 7,-69 -7,-69', f: TINTA });
    else S.push({ p: '-9,-56 -9,-62 -4,-66 4,-66 9,-62 9,-56 5,-61 -5,-61', f: warnaRambut });
    if (rambut === 'kuncir') S.push({ p: '8,-61 16,-58 14,-49 9,-55', f: warnaRambut });
    if (rambut === 'sanggul') S.push({ c: [6, -65, 4.5], f: warnaRambut });
  }
  S.push({ c: [-3, yMata, 1.3], f: TINTA, kecil: true }, { c: [3, yMata, 1.3], f: TINTA, kecil: true });
  S.push({ d: `M-2.6,${yMata + 3.2} Q0,${yMata + 5.4} 2.6,${yMata + 3.2}`, s: TINTA, w: 1, kecil: true });
  return S;
}

function kulitDari(nama) {
  let h = 0;
  for (const c of nama) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return KULIT[h % KULIT.length];
}

function visualAnak(a) {
  const baju = WARNA[a.baju];
  let kerudung = WARNA[a.kerudung];
  if (kerudung === baju) kerudung = PUTIH;
  return sosok({
    kulit: kulitDari(a.nama),
    baju,
    bawah: a.jenis === 'pr' ? 'rok' : 'celana',
    warnaBawah: a.baju === 'biru' ? TINTA : WARNA.biru,
    rambut: a.rambut,
    warnaKerudung: kerudung,
  });
}

function visualKedua(k) {
  const kulit = kulitDari(k.sebutan + k.id);
  const baju = WARNA[k.baju];
  switch (k.id) {
    case 'nenek':
      return sosok({ kulit, baju, bawah: 'panjang', warnaBawah: KAYU, rambut: 'sanggul', warnaRambut: '#E4E0EA' });
    case 'kakek':
      return sosok({ kulit, baju: PUTIH, bawah: 'panjang', warnaBawah: baju, rambut: 'peci' });
    case 'ibu':
      return sosok({ kulit, baju, bawah: 'panjang', warnaBawah: baju, rambut: 'kerudung', warnaKerudung: k.baju === 'kuning' ? WARNA.biru : PUTIH });
    case 'ayah':
      return sosok({ kulit, baju, bawah: 'panjang', warnaBawah: TINTA, rambut: 'pendek' });
    default:
      return visualAnak({ nama: k.sebutan, jenis: k.jenis, baju: k.baju === 'hijau' ? 'kuning' : k.baju, rambut: k.rambut, kerudung: k.kerudung });
  }
}

// ── Benda ─────────────────────────────────────────────────────
const BENDA_GAMBAR = {
  telur: (b) => {
    const n = Math.min(b.jumlah ?? 4, 5);
    const telur = Array.from({ length: n }, (_, i) => ({
      e: [f1(-12 + (i * 24) / Math.max(n - 1, 1)), -15 - (i % 2) * 2, 4.5, 5.5],
      f: PUTIH,
    }));
    return [
      { d: 'M-15,-14 Q0,-36 15,-14', s: KAYU, w: 2.4 },
      ...telur,
      { p: '-19,-14 19,-15 14,0 -13,0', f: '#E3A866' },
      { l: [-16, -8, 16, -9], s: KAYU, w: 1.2, kecil: true },
    ];
  },
  layang: (b) => [
    { d: 'M0,26 q-7,9 0,17 q7,9 0,17', s: TINTA, w: 1.4 },
    { p: '-5,43 0,40 0,46', f: WARNA.merah, kecil: true },
    { p: '5,43 0,40 0,46', f: WARNA.merah, kecil: true },
    { p: '0,-24 17,0 0,26 -17,0', f: WARNA[b.warna] },
    { l: [0, -24, 0, 26], s: TINTA, w: 1.2, kecil: true },
    { l: [-17, 0, 17, 0], s: TINTA, w: 1.2, kecil: true },
  ],
  payung: (b) => [
    { l: [0, -34, 0, -4], s: TINTA, w: 2.2 },
    { d: 'M0,-4 q0,5 -5,5 q-4,0 -4,-4', s: TINTA, w: 2.2 },
    { d: 'M-25,-34 Q-24,-59 0,-61 Q24,-59 25,-34 Q19,-39 12.5,-34 Q6,-39 0,-34 Q-6,-39 -12.5,-34 Q-19,-39 -25,-34 Z', f: WARNA[b.warna] },
    { l: [0, -61, 0, -66], s: TINTA, w: 2, kecil: true },
  ],
  bola: (b) => [
    { c: [0, -12, 12], f: WARNA[b.warna] },
    { d: 'M-11,-14 Q0,-6 11,-14', s: PUTIH, w: 2.6, kecil: true },
  ],
  ember: (b) => [
    { d: 'M-13,-25 Q0,-43 13,-25', s: TINTA, w: 1.8 },
    { p: '-14,-26 14,-26 11,0 -11,0', f: WARNA[b.warna] },
    { p: '-15,-28 15,-28 15,-24 -15,-24', f: PUTIH },
  ],
  buku: (b) => [
    { p: '-21,-12 0,-8 21,-12 21,-2 0,2 -21,-2', f: WARNA[b.warna] },
    { p: '-18,-12 0,-8 0,-1 -18,-4', f: PUTIH },
    { p: '0,-8 18,-12 18,-4 0,-1', f: PUTIH },
    { l: [-14, -9, -4, -7], s: TINTA, w: 0.8, kecil: true },
    { l: [4, -7, 14, -9], s: TINTA, w: 0.8, kecil: true },
  ],
  sepeda: (b) => [
    { c: [-15, -10, 10], s: TINTA, w: 2.6 },
    { c: [15, -10, 10], s: TINTA, w: 2.6 },
    { d: 'M-15,-10 L-3,-10 L7,-25 L-9,-25 Z M7,-25 L15,-10 M-9,-25 L-9,-29', s: WARNA[b.warna], w: 3 },
    { p: '-14,-31 -4,-31 -5,-28 -13,-28', f: TINTA },
    { d: 'M7,-25 L9,-32 L14,-32', s: TINTA, w: 2.2 },
  ],
  caping: () => [
    { p: '-25,-5 0,-21 25,-5 0,-1', f: L.jerami },
    { d: 'M-12,-13 L0,-3 M12,-13 L0,-3 M0,-21 L0,-1', s: KAYU, w: 0.9, kecil: true },
  ],
  tangga: () => {
    const anak = [];
    for (let y = -8; y > -56; y -= 9) anak.push({ l: [-8, y, 8, y], s: KAYU, w: 2.4 });
    return [{ l: [-9, 0, -7, -58], s: KAYU, w: 3.2 }, { l: [9, 0, 7, -58], s: KAYU, w: 3.2 }, ...anak];
  },
  kucing: (b) => {
    const w = WARNA[b.warna];
    const mata = b.warna === 'hitam' ? WARNA.kuning : TINTA;
    return [
      { d: 'M-11,-6 Q-23,-10 -18,-25', s: w, w: 3.4 },
      { e: [0, -10, 12, 10], f: w },
      { p: '3,-27 5,-36 10,-30', f: w },
      { p: '10,-30 15,-36 16,-27', f: w },
      { c: [9, -23, 7.5], f: w },
      { c: [6.5, -24, 1.3], f: mata, kecil: true },
      { c: [11.5, -24, 1.3], f: mata, kecil: true },
    ];
  },
  ayam: (b) => {
    const w = WARNA[b.warna];
    return [
      { l: [-2, 0, -2, -5], s: WARNA.oranye, w: 1.6 },
      { l: [3, 0, 3, -5], s: WARNA.oranye, w: 1.6 },
      { e: [0, -11, 10, 8], f: w },
      { c: [7, -20, 5.5], f: w },
      { p: '12,-21 18,-19 12,-17', f: WARNA.oranye },
      { p: '4,-25 6,-29 8,-25.5 10,-28.5 11,-24.5', f: WARNA.merah },
      { c: [8, -21, 1.1], f: b.warna === 'hitam' ? PUTIH : TINTA, kecil: true },
    ];
  },
};

const SLOT = {
  langit: { x: 302, y: 70, s: 1.15 },
  kedua: { x: 264, y: 202, s: 1.15 },
  anak: { x: 205, y: 202, s: 1.15 },
  benda2: { x: 320, y: 214, s: 1.15 },
  benda: { x: 236, y: 219, s: 1.15 },
};
const URUTAN_GAMBAR = ['kedua', 'anak', 'benda2', 'benda'];

function potongan(bahan) {
  const p = {
    anak: { bentuk: visualAnak(bahan.anak), slot: SLOT.anak },
    kedua: { bentuk: visualKedua(bahan.kedua), slot: { ...SLOT.kedua, s: SLOT.kedua.s * (bahan.kedua.id === 'teman' ? 1 : 1.3) } },
    benda: { bentuk: BENDA_GAMBAR[bahan.benda.id](bahan.benda), slot: SLOT.benda },
    benda2: { bentuk: BENDA_GAMBAR[bahan.benda2.id](bahan.benda2), slot: SLOT.benda2 },
  };
  for (const k of ['benda', 'benda2']) if (bahan[k].id === 'layang') p[k].slot = SLOT.langit;
  return p;
}

export function namaPotongan(bahan, kunci) {
  return { benda: bahan.benda.nama, kedua: bahan.kedua.sebutan, benda2: bahan.benda2.nama, anak: bahan.anak.nama }[kunci];
}

// ── Render ────────────────────────────────────────────────────
function elemen(s, attr) {
  if (s.p) return `<polygon points="${s.p}" ${attr}/>`;
  if (s.c) return `<circle cx="${s.c[0]}" cy="${s.c[1]}" r="${s.c[2]}" ${attr}/>`;
  if (s.e) return `<ellipse cx="${s.e[0]}" cy="${s.e[1]}" rx="${s.e[2]}" ry="${s.e[3]}" ${attr}/>`;
  if (s.r) return `<rect x="${s.r[0]}" y="${s.r[1]}" width="${s.r[2]}" height="${s.r[3]}" ${attr}/>`;
  if (s.d) return `<path d="${s.d}" ${attr}/>`;
  if (s.l) return `<line x1="${s.l[0]}" y1="${s.l[1]}" x2="${s.l[2]}" y2="${s.l[3]}" ${attr}/>`;
  return '';
}

const BULAT = 'stroke-linecap="round" stroke-linejoin="round"';

// mode: latar (cetakan pucat), warna (isi stiker), garisLuar (tepi tinta untuk garis berwarna),
// batas (pinggiran putih stiker), bayang (bayangan stiker), sketsa (tempat stiker yang belum ditempel).
function svgBentuk(s, mode) {
  const isi = s.f ?? null;
  const garis = s.s ?? null;
  const w = s.w ?? 0;
  switch (mode) {
    case 'latar':
    case 'warna':
      if (isi) return elemen(s, `fill="${isi}"${s.kecil ? '' : ` stroke="${TINTA}" stroke-width="${mode === 'latar' ? 1.4 : 1.6}" stroke-linejoin="round"`}`);
      return elemen(s, `fill="none" stroke="${garis}" stroke-width="${w}" ${BULAT}`);
    case 'garisLuar':
      if (isi || s.kecil || garis === TINTA) return '';
      return elemen(s, `fill="none" stroke="${TINTA}" stroke-width="${f1(w + 2.6)}" ${BULAT}`);
    case 'batas':
    case 'bayang': {
      if (s.kecil) return '';
      const c = mode === 'batas' ? PUTIH : TINTA;
      return elemen(s, `fill="${isi ? c : 'none'}" stroke="${c}" stroke-width="${f1(w + 8)}" ${BULAT}`);
    }
    case 'sketsa':
      if (s.kecil) return '';
      return elemen(s, `fill="none" stroke="${TINTA}" stroke-opacity=".5" stroke-width="1.3" stroke-dasharray="3.5 3" ${BULAT}`);
  }
  return '';
}

function stiker(bentuk) {
  const lapis = (mode) => bentuk.map((s) => svgBentuk(s, mode)).join('');
  return `<g transform="translate(2,2.4)" opacity=".3">${lapis('bayang')}</g>${lapis('batas')}${lapis('garisLuar')}${lapis('warna')}`;
}

/**
 * @param bahan bahan kartu
 * @param opsi.tampil kunci stiker yang sudah ditempel
 * @param opsi.sketsa tampilkan garis putus-putus untuk stiker yang belum ditempel
 * @param opsi.baru kunci stiker yang baru ditempel (dianimasikan)
 * @param opsi.hias false untuk versi mini di album (tanpa role/label)
 */
export function kolaseSVG(bahan, { tampil = [], sketsa = false, baru = null, hias = true } = {}) {
  const pot = potongan(bahan);
  let isi = `<rect width="360" height="240" fill="${L.langit}"/>`;
  isi += LATAR[bahan.tempat]()
    .map((lapisan) => lapisan.map((s) => svgBentuk(s, 'latar')).join(''))
    .join('');

  const urut = [
    ...URUTAN_GAMBAR.filter((k) => pot[k].slot === SLOT.langit),
    ...URUTAN_GAMBAR.filter((k) => pot[k].slot !== SLOT.langit),
  ];
  for (const k of urut) {
    const { bentuk, slot } = pot[k];
    const posisi = `translate(${slot.x},${slot.y}) scale(${f1(slot.s)})`;
    if (tampil.includes(k)) {
      isi += `<g transform="${posisi}"><g${k === baru ? ' class="stiker-baru"' : ''}>${stiker(bentuk)}</g></g>`;
    } else if (sketsa) {
      isi += `<g transform="${posisi}">${bentuk.map((s) => svgBentuk(s, 'sketsa')).join('')}</g>`;
    }
  }

  const sudah = URUTAN_POTONGAN.filter((k) => tampil.includes(k)).map((k) => namaPotongan(bahan, k));
  const belum = 4 - sudah.length;
  let label = `Gambar ${TEMPAT[bahan.tempat].nama}`;
  if (sudah.length) label += `. Stiker yang sudah ditempel: ${sudah.join(', ')}`;
  if (sketsa && belum) label += `. ${belum} stiker belum ditempel`;
  const aria = hias ? `role="img" aria-label="${label}."` : 'aria-hidden="true" focusable="false"';
  return `<svg viewBox="0 0 360 240" ${aria}>${isi}</svg>`;
}
