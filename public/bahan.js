// Bank bahan Kartu Fokus. Dipakai dua sisi:
// - Worker memilih bahan dari kode kartu lalu menyusun prompt untuk Gemini.
// - Browser merakit kolase dari bahan yang sama, jadi gambar selalu cocok dengan cerita.
// Pemilihan bahan deterministik: kode yang sama selalu menghasilkan bahan yang sama.

export const USIA = {
  '4-5': { label: '4–5 tahun', kata: [70, 100], paragraf: 3, detail: 1 },
  '6-7': { label: '6–7 tahun', kata: [110, 150], paragraf: 4, detail: 2 },
  '8-9': { label: '8–9 tahun', kata: [160, 210], paragraf: 5, detail: 3 },
};

// Nama warna yang boleh muncul di cerita, dipetakan ke warna stiker. Sengaja cerah dan jelas
// namanya (merah benar-benar merah), supaya anak bisa mencocokkan warna di gambar dengan cerita.
export const WARNA = {
  merah: '#EF4B3F',
  biru: '#3B8CF0',
  kuning: '#FFC93C',
  hijau: '#4DBA5E',
  oranye: '#FF9234',
  hitam: '#2B2A3A',
  putih: '#FFFFFF',
};

export const TEMPAT = {
  rumah_nenek: { nama: 'rumah Nenek', deskripsi: 'rumah kayu Nenek di kampung, halamannya luas dan ada pohon jambu' },
  pasar: { nama: 'pasar pagi', deskripsi: 'pasar pagi yang ramai, penuh lapak sayur, buah, dan kue' },
  sawah: { nama: 'sawah', deskripsi: 'pematang sawah yang hijau dengan gubuk kecil untuk berteduh, dan dua gunung di kejauhan' },
  sungai: { nama: 'pinggir sungai', deskripsi: 'pinggir sungai kecil yang airnya jernih dan berbatu, banyak rumput tinggi di tepinya' },
  sekolah: { nama: 'halaman sekolah', deskripsi: 'halaman sekolah yang berumput, ada tiang bendera merah putih' },
};

export const ANAK = [
  { nama: 'Dika', jenis: 'lk' }, { nama: 'Raka', jenis: 'lk' }, { nama: 'Bima', jenis: 'lk' },
  { nama: 'Fajar', jenis: 'lk' }, { nama: 'Tegar', jenis: 'lk' }, { nama: 'Arif', jenis: 'lk' },
  { nama: 'Sari', jenis: 'pr' }, { nama: 'Nisa', jenis: 'pr' }, { nama: 'Ayu', jenis: 'pr' },
  { nama: 'Laras', jenis: 'pr' }, { nama: 'Wulan', jenis: 'pr' }, { nama: 'Putri', jenis: 'pr' },
];

export const KEDUA = {
  nenek: { sebutan: 'Nenek', deskripsi: 'nenek dari tokoh utama, sabar dan suka bercerita' },
  kakek: { sebutan: 'Kakek', deskripsi: 'kakek dari tokoh utama, pendiam tapi teliti' },
  ibu: { sebutan: 'Ibu', deskripsi: 'ibu dari tokoh utama' },
  ayah: { sebutan: 'Ayah', deskripsi: 'ayah dari tokoh utama' },
  teman: { sebutan: null, deskripsi: 'teman sebaya tokoh utama' },
};

// sifat: peran yang bisa dimainkan benda di kerangka alur.
export const BENDA = {
  telur: { nama: 'keranjang telur', sifat: ['rusak'], jumlah: [3, 8], satuan: 'butir telur' },
  layang: { nama: 'layang-layang', sifat: ['rusak', 'hilang'], warna: ['merah', 'biru', 'kuning'], langit: true },
  payung: { nama: 'payung', sifat: ['hujan', 'hilang', 'dipinjam', 'alat'], warna: ['merah', 'biru', 'kuning', 'hijau'] },
  bola: { nama: 'bola plastik', sifat: ['hilang', 'dipinjam'], warna: ['merah', 'biru', 'kuning'] },
  ember: { nama: 'ember', sifat: ['rusak', 'dipinjam', 'alat'], warna: ['merah', 'biru', 'kuning'] },
  buku: { nama: 'buku cerita', sifat: ['hilang', 'dipinjam'], warna: ['merah', 'biru', 'kuning', 'hijau'], kataWarna: 'sampulnya' },
  sepeda: { nama: 'sepeda', sifat: ['rusak', 'dipinjam'], warna: ['merah', 'biru', 'kuning', 'hijau'] },
  caping: { nama: 'caping bambu', sifat: ['hujan', 'hilang'] },
  tangga: { nama: 'tangga bambu', sifat: ['alat'] },
  kucing: { nama: 'anak kucing', sifat: ['hewan'], warna: ['oranye', 'hitam', 'putih'] },
  ayam: { nama: 'anak ayam', sifat: ['hewan'], warna: ['kuning', 'hitam'] },
};

export const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

// Kerangka alur = rantai sebab-akibat. Gemini hanya menulis prosa di atas kerangka ini,
// jadi soal sebab-akibat dan tebakan selalu punya jawaban di dalam cerita.
// Sudut soal per kerangka ada di src/soal.js.
export const KERANGKA = [
  {
    id: 'rusak',
    butuh: 'rusak',
    tempat: ['rumah_nenek', 'pasar', 'sawah', 'sungai', 'sekolah'],
    sifatAnak: ['suka buru-buru', 'tidak sabaran', 'ceroboh tapi baik hati'],
    kedua: ['nenek', 'kakek', 'ibu', 'ayah'],
    alur: [
      '{kedua} meminta {anak} membawa {benda} di {tempat} dengan hati-hati.',
      '{anak} ingin cepat-cepat bermain, jadi berjalan terburu-buru tanpa melihat jalan.',
      '{anak} tersandung atau menabrak sesuatu, lalu {benda} rusak (jatuh, retak, robek, atau lepas: pilih yang masuk akal untuk benda itu).',
      '{anak} diam dan takut dimarahi. Tunjukkan perasaannya lewat sikap (misalnya menunduk, berjalan pelan), jangan sebut nama perasaannya.',
      '{anak} memilih jujur bercerita kepada {kedua}. {kedua} menghargai kejujurannya, lalu mereka memperbaiki atau menggantinya bersama.',
    ],
  },
  {
    id: 'hilang',
    butuh: 'hilang',
    tempat: ['rumah_nenek', 'pasar', 'sawah', 'sungai', 'sekolah'],
    sifatAnak: ['pelupa', 'mudah teralih perhatiannya', 'penasaran'],
    kedua: ['nenek', 'kakek', 'ibu', 'ayah', 'teman'],
    alur: [
      '{anak} membawa {benda} ketika pergi ke {tempat} bersama {kedua}.',
      'Di {tempat}, {anak} melihat sesuatu yang menarik (pilih yang cocok dengan tempatnya), lalu menaruh {benda} sebentar di satu tempat yang disebut jelas.',
      'Waktu mau pulang, {anak} sadar {benda} tidak ada di tangannya.',
      '{anak} panik. {kedua} mengajaknya mengingat lagi apa saja yang tadi ia lakukan, satu per satu.',
      'Dengan mengingat urutan kejadian, {anak} menemukan {benda} di tempat ia menaruhnya tadi.',
    ],
  },
  {
    id: 'hujan',
    butuh: 'hujan',
    tempat: ['rumah_nenek', 'pasar', 'sawah', 'sungai', 'sekolah'],
    sifatAnak: ['tidak sabaran', 'penasaran', 'suka buru-buru'],
    kedua: ['nenek', 'kakek', 'ibu', 'ayah'],
    alur: [
      '{anak} dan {kedua} sedang berada di {tempat}.',
      '{kedua} melihat tanda-tanda akan hujan: langit menggelap, angin bertiup kencang, dan satu tanda lain yang cocok dengan tempatnya. {kedua} meminta {anak} membawa {benda}.',
      '{anak} merasa langit masih cukup terang, jadi {benda} tidak dibawa dan ia pergi bermain dulu.',
      'Hujan turun deras. {anak} basah kuyup dan kedinginan.',
      '{kedua} datang menjemput membawa {benda}. {anak} jadi tahu cara membaca tanda-tanda akan hujan.',
    ],
  },
  {
    id: 'hewan',
    butuh: 'hewan',
    alat: true,
    tempat: ['rumah_nenek', 'pasar', 'sawah', 'sungai', 'sekolah'],
    sifatAnak: ['suka menolong', 'tidak sabaran', 'penyayang binatang'],
    kedua: ['nenek', 'kakek', 'ibu', 'ayah', 'teman'],
    alur: [
      '{anak} mendengar suara {benda} di {tempat}.',
      '{benda} sedang kesulitan karena sesuatu yang masuk akal di {tempat} (misalnya terjebak atau terpisah dari induknya). Sebutkan penyebabnya dengan jelas.',
      '{anak} ingin langsung menolong, tapi {kedua} mengajak berpikir dulu supaya {benda} tidak makin takut dan semuanya aman.',
      'Mereka memakai {benda2} untuk menolong {benda} dengan cara yang masuk akal.',
      '{benda} selamat dan kembali tenang.',
    ],
  },
  {
    id: 'salah_paham',
    butuh: 'dipinjam',
    tempat: ['rumah_nenek', 'sekolah'],
    sifatAnak: ['cepat kesal', 'pemalu', 'tidak sabaran'],
    kedua: ['teman'],
    alur: [
      '{anak} punya {benda} kesayangan yang biasa disimpan di {tempat}.',
      'Suatu hari {benda} tidak ada di tempat biasanya.',
      '{anak} ingat kemarin {kedua} memegang {benda}, lalu mengira {kedua} mengambilnya. {anak} kesal dan tidak mau menyapa {kedua}.',
      'Ternyata {kedua} meminjam {benda} untuk alasan yang baik (misalnya memperbaikinya atau menjaganya dari hujan), tapi lupa bilang.',
      '{anak} dan {kedua} saling minta maaf. {anak} belajar bertanya dulu sebelum menuduh, dan {kedua} belajar minta izin dulu.',
    ],
  },
];

// Urutan potongan yang ditempel setelah soal 1 sampai 4.
export const URUTAN_POTONGAN = ['benda', 'kedua', 'benda2', 'anak'];

const HURUF_KODE = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const POLA_KODE = /^[A-HJ-NP-Z2-9]{4}$/;

export function buatKode(acak = Math.random) {
  let k = '';
  for (let i = 0; i < 4; i++) k += HURUF_KODE[Math.floor(acak() * HURUF_KODE.length)];
  return k;
}

function hash(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Pengacak deterministik dari teks, misalnya `${kode}|soal`. Dipakai juga oleh src/soal.js.
export const acak = (teks) => mulberry32(hash(teks));

const ambil = (r, arr) => arr[Math.floor(r() * arr.length)];

// hindari: warna yang sudah dipakai benda utama, supaya soal "apa warnanya" tidak ambigu.
function bendaDengan(r, id, hindari) {
  const b = BENDA[id];
  const out = { id, nama: b.nama };
  if (b.warna) {
    const pilihan = b.warna.filter((w) => w !== hindari);
    out.warna = ambil(r, pilihan.length ? pilihan : b.warna);
  }
  if (b.jumlah) out.jumlah = b.jumlah[0] + Math.floor(r() * (b.jumlah[1] - b.jumlah[0] + 1));
  return out;
}

export function pilihBahan(kode) {
  const r = mulberry32(hash(kode));
  const k = ambil(r, KERANGKA);
  const tempat = ambil(r, k.tempat);

  const bendaId = ambil(r, Object.keys(BENDA).filter((id) => BENDA[id].sifat.includes(k.butuh)));
  let pool2 = Object.keys(BENDA).filter((id) => id !== bendaId);
  if (k.alat) pool2 = pool2.filter((id) => BENDA[id].sifat.includes('alat'));
  else pool2 = pool2.filter((id) => !(BENDA[id].langit && BENDA[bendaId].langit));
  const benda2Id = ambil(r, pool2);

  const a = ambil(r, ANAK);
  const anak = {
    nama: a.nama,
    jenis: a.jenis,
    sifat: ambil(r, k.sifatAnak),
    baju: ambil(r, ['merah', 'biru', 'kuning']),
    rambut: a.jenis === 'pr' ? ambil(r, ['kerudung', 'kuncir']) : 'pendek',
    kerudung: ambil(r, ['biru', 'hijau', 'putih']),
  };

  const keduaId = ambil(r, k.kedua);
  const kedua = { id: keduaId, baju: ambil(r, ['merah', 'kuning', 'biru', 'hijau']) };
  if (keduaId === 'teman') {
    const t = ambil(r, ANAK.filter((x) => x.nama !== a.nama));
    Object.assign(kedua, {
      sebutan: t.nama,
      jenis: t.jenis,
      rambut: t.jenis === 'pr' ? ambil(r, ['kerudung', 'kuncir']) : 'pendek',
      kerudung: ambil(r, ['biru', 'hijau', 'putih']),
    });
  } else {
    kedua.sebutan = KEDUA[keduaId].sebutan;
  }

  const benda = bendaDengan(r, bendaId);
  const benda2 = bendaDengan(r, benda2Id, benda.warna);

  return {
    kode,
    kerangka: k.id,
    tempat,
    anak,
    kedua,
    benda,
    benda2,
    hari: ambil(r, HARI),
  };
}

// Detail yang ditanam di cerita dan rencana soal ada di src/soal.js (hanya dipakai server).

const KATA_ANGKA = ['nol', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh'];
export function angkaKata(n) {
  return KATA_ANGKA[n] ?? String(n);
}
