// Rencana soal per kartu. Supaya pertanyaan tidak bisa ditebak dari kartu sebelumnya, kode kartu
// menentukan: detail apa yang ditanam di cerita, urutan tipe soal, sudut tiap soal, dan bentuk
// jawabannya (terbuka, pilihan, benar-salah). Semuanya deterministik: kode dan umur yang sama
// selalu menghasilkan rencana yang sama, jadi prompt dan pemeriksaan di worker selalu cocok.
import { BENDA, USIA, acak, angkaKata } from '../public/bahan.js';

const ambil = (r, arr) => arr[Math.floor(r() * arr.length)];

function kocok(r, arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Detail yang ditanam di cerita ─────────────────────────────
const BEKAL = [
  { nama: 'jeruk', satuan: 'buah' },
  { nama: 'pisang', satuan: 'buah' },
  { nama: 'kue lapis', satuan: 'potong' },
  { nama: 'ubi rebus', satuan: 'potong' },
];

// Satu detail per jenis, supaya kartu umur 8-9 tidak berisi tiga warna sekaligus.
export function detailKartu(bahan, usia) {
  const r = acak(`${bahan.kode}|detail`);
  const waktu = bahan.tempat === 'pasar' ? 'pagi' : ambil(r, ['pagi', 'siang', 'sore']);
  const bekal = { ...ambil(r, BEKAL), jumlah: 2 + Math.floor(r() * 4) };
  const anak = bahan.anak.nama;

  const pool = [];
  for (const b of [bahan.benda, bahan.benda2]) {
    const meta = BENDA[b.id];
    if (b.jumlah) {
      pool.push({ jenis: 'jumlah', teks: `${b.jumlah} ${meta.satuan}`, cek: [String(b.jumlah), angkaKata(b.jumlah)], tanya: `berapa ${meta.satuan} yang dibawa` });
    } else if (b.warna) {
      const teks = meta.kataWarna ? `${b.nama} yang ${meta.kataWarna} berwarna ${b.warna}` : `${b.nama} berwarna ${b.warna}`;
      pool.push({ jenis: 'warna', teks, cek: [b.warna], tanya: `apa warna ${b.nama}` });
    }
  }
  pool.push(
    { jenis: 'hari', teks: `kejadiannya hari ${bahan.hari}`, cek: [bahan.hari], tanya: 'hari apa kejadiannya' },
    { jenis: 'waktu', teks: `kejadiannya ${waktu} hari`, cek: [waktu], tanya: 'kejadiannya pagi, siang, atau sore' },
    {
      jenis: 'jumlah',
      teks: `${anak} membawa bekal ${bekal.jumlah} ${bekal.satuan} ${bekal.nama}`,
      cek: [String(bekal.jumlah), angkaKata(bekal.jumlah)],
      tanya: `berapa ${bekal.nama} yang dibawa ${anak} sebagai bekal`,
    },
    { jenis: 'warna', teks: `${anak} memakai baju ${bahan.anak.baju}`, cek: [bahan.anak.baju], tanya: `apa warna baju ${anak}` },
  );

  const out = [];
  const jenis = new Set();
  for (const d of kocok(acak(`${bahan.kode}|${usia}|detail`), pool)) {
    if (out.length >= USIA[usia].detail) break;
    if (jenis.has(d.jenis)) continue;
    jenis.add(d.jenis);
    out.push(d);
  }
  return out;
}

// ── Bank sudut soal ───────────────────────────────────────────
// p: perintah untuk Gemini ({anak}, {kedua}, {benda}, {benda2}, {tempat}, {sifat} diisi di prompt).
// bukti: true = kalimat petunjuk wajib ada di cerita, 'boleh' = kalau ada, false = tidak perlu.

// Urutan tipe soal. Ingatan tidak selalu di depan, dan soal ide tidak selalu ada.
const POLA = [
  ['ingat', 'penyebab', 'tebak', 'ide'],
  ['ingat', 'tebak', 'penyebab', 'ide'],
  ['penyebab', 'ingat', 'tebak', 'ide'],
  ['ingat', 'penyebab', 'ingat', 'tebak'],
  ['tebak', 'ingat', 'penyebab', 'ide'],
  ['ingat', 'penyebab', 'tebak', 'tebak'],
  ['penyebab', 'tebak', 'ingat', 'ide'],
];

const INGAT = [
  { id: 'siapa', p: 'tanyakan SIAPA yang melakukan satu kejadian penting di cerita. Pilih kejadian yang pelakunya bukan {anak}, kalau ada.', bentuk: ['terbuka', 'duaPilihan'] },
  { id: 'urutan', p: 'tanyakan URUTAN kejadian: apa yang terjadi tepat sebelum atau tepat sesudah satu kejadian penting. Untuk bentuk dua pilihan, tanyakan mana yang terjadi lebih dulu.', bentuk: ['terbuka', 'duaPilihan'] },
  { id: 'ucapan', p: 'tanyakan apa yang dikatakan atau diminta {kedua} kepada {anak}.', bentuk: ['terbuka', 'pilihan'] },
  { id: 'dimana', p: 'tanyakan DI MANA sesuatu terjadi atau di mana sebuah benda berada. Tempatnya harus disebut jelas di cerita.', bentuk: ['terbuka', 'pilihan'] },
  { id: 'kejadian', p: 'buat satu pernyataan tentang kejadian di cerita untuk dinilai benar atau salah. Boleh pernyataan yang salah, asal jelas salahnya dari cerita.', bentuk: ['benarSalah'] },
];

// Tipe "penyebab" selalu mencari sebab (label di layar: Cari penyebab), tapi targetnya berganti.
const PENYEBAB = {
  rusak: ['tanyakan kenapa {benda} bisa rusak.', 'tanyakan apa yang membuat {anak} berjalan terburu-buru.', 'tanyakan kenapa {kedua} tidak marah kepada {anak}.'],
  hilang: ['tanyakan kenapa {benda} bisa tertinggal.', 'tanyakan apa yang membuat {anak} menaruh {benda}.', 'tanyakan bagaimana {benda} akhirnya bisa ditemukan.'],
  hujan: ['tanyakan kenapa {anak} bisa basah kuyup.', 'tanyakan kenapa {kedua} menyuruh {anak} membawa {benda}.', 'tanyakan kenapa {anak} tidak membawa {benda}.'],
  hewan: ['tanyakan kenapa {benda} bisa kesulitan.', 'tanyakan untuk apa mereka memakai {benda2}.', 'tanyakan bagaimana {benda} akhirnya bisa selamat.'],
  salah_paham: ['tanyakan kenapa {anak} mengira {kedua} mengambil {benda}.', 'tanyakan kenapa {kedua} meminjam {benda}.', 'tanyakan kenapa {anak} tidak mau menyapa {kedua}.'],
  tiga_coba: ['tanyakan kenapa percobaan pertama gagal.', 'tanyakan kenapa percobaan kedua gagal.', 'tanyakan apa yang membuat percobaan ketiga berhasil.'],
  kejutan: ['tanyakan kenapa {anak} menyiapkan kejutan untuk {kedua}.', 'tanyakan kenapa {anak} buru-buru menyembunyikan kejutannya.', 'tanyakan untuk apa {benda2} dipakai saat menyiapkan kejutan.'],
  jejak: ['tanyakan kenapa {benda} tidak ada di tempat biasanya.', 'tanyakan petunjuk apa yang membuat {anak} tahu ke mana harus mencari.', 'tanyakan kenapa {benda2} membawa {benda}.'],
  tersesat: ['tanyakan kenapa {anak} bisa terpisah dari {kedua}.', 'tanyakan bagaimana {anak} akhirnya bisa menemukan {kedua}.', 'tanyakan kenapa {benda} mudah terlihat dari jauh.'],
  salah_dengar: ['tanyakan kenapa {anak} membawa {benda2}, bukan {benda}.', 'tanyakan untuk apa {kedua} sebenarnya butuh {benda}.', 'tanyakan bagaimana kesalahan itu akhirnya ketahuan.'],
  lomba: ['tanyakan kenapa {anak} berhenti di tengah lomba.', 'tanyakan apa yang terjadi pada {kedua} saat lomba.', 'tanyakan kenapa penonton atau panitia memberi perhatian khusus kepada {anak} dan {kedua}.'],
  bergiliran: ['tanyakan kenapa {anak} dan {kedua} berebut.', 'tanyakan kenapa {benda} hampir rusak.', 'tanyakan bagaimana mereka akhirnya bisa bermain bersama.'],
};
const PENYEBAB_UMUM = ['tanyakan kenapa kejadian paling penting di cerita bisa terjadi.'];

// Tipe "tebak": menyimpulkan perasaan, maksud, atau akibat yang tidak ditulis langsung.
const PERASAAN = ['terbuka', 'terbuka', 'pilihan'];
const TEBAK = {
  rusak: [
    { p: 'tanyakan apa yang dirasakan {anak} sebelum ia bercerita kepada {kedua}, dan dari mana kita tahu.', bentuk: PERASAAN },
    { p: 'tanyakan andaikan {anak} berjalan pelan-pelan, apa yang akan terjadi.', bukti: 'boleh' },
    { p: 'tanyakan kenapa menurut anak, {anak} akhirnya memilih jujur.', bukti: 'boleh' },
  ],
  hilang: [
    { p: 'tanyakan apa yang dirasakan {anak} saat sadar {benda} tidak ada, dan dari mana kita tahu.', bentuk: PERASAAN },
    { p: 'tanyakan andaikan {anak} tidak menaruh {benda}, apa yang akan terjadi.', bukti: 'boleh' },
    { p: 'tanyakan kenapa mengingat kejadian satu per satu bisa membantu {anak}.', bukti: 'boleh' },
  ],
  hujan: [
    { p: 'tanyakan apa yang dirasakan {anak} waktu {kedua} datang menjemput, dan kenapa.', bentuk: PERASAAN },
    { p: 'tanyakan dari mana {kedua} tahu hujan akan turun.' },
    { p: 'tanyakan andaikan {anak} membawa {benda}, apa yang akan terjadi.', bukti: 'boleh' },
  ],
  hewan: [
    { p: 'tanyakan kenapa {kedua} mengajak {anak} berpikir dulu sebelum menolong.' },
    { p: 'tanyakan apa yang dirasakan {benda} waktu kesulitan, dan dari mana kita tahu.', bentuk: PERASAAN },
    { p: 'tanyakan andaikan {anak} langsung menolong tanpa berpikir, apa yang bisa terjadi.', bukti: 'boleh' },
  ],
  salah_paham: [
    { p: 'tanyakan apa yang dirasakan {kedua} waktu tidak disapa {anak}, dan kenapa.', bentuk: PERASAAN },
    { p: 'tanyakan andaikan {kedua} bilang dulu sebelum meminjam, apa yang akan terjadi.', bukti: 'boleh' },
    { p: 'tanyakan apa yang dirasakan {anak} setelah tahu alasan {kedua}, dan dari mana kita tahu.', bentuk: PERASAAN },
  ],
  tiga_coba: [
    { p: 'tanyakan apa yang dirasakan {anak} setelah gagal dua kali, dan dari mana kita tahu.', bentuk: PERASAAN },
    { p: 'tanyakan kenapa menurut anak, {kedua} tidak langsung memberi tahu caranya.', bukti: 'boleh' },
    { p: 'tanyakan andaikan {anak} menyerah setelah percobaan kedua, apa yang akan terjadi.', bukti: 'boleh' },
  ],
  kejutan: [
    { p: 'tanyakan apa yang dirasakan {kedua} saat menerima kejutan, dan dari mana kita tahu.', bentuk: PERASAAN },
    { p: 'tanyakan andaikan {kedua} tahu lebih dulu, apa yang akan terjadi.', bukti: 'boleh' },
    { p: 'tanyakan kenapa menurut anak, {anak} memilih {benda} untuk kejutannya.', bukti: 'boleh' },
  ],
  jejak: [
    { p: 'tanyakan dari petunjuk mana pendengar bisa menebak pelakunya sebelum ketahuan.' },
    { p: 'tanyakan apa yang dirasakan {anak} saat tahu siapa pelakunya, dan dari mana kita tahu.', bentuk: PERASAAN },
    { p: 'tanyakan andaikan {anak} tidak memperhatikan petunjuk-petunjuk itu, apa yang akan terjadi.', bukti: 'boleh' },
  ],
  tersesat: [
    { p: 'tanyakan apa yang dirasakan {anak} saat sadar ia sendirian, dan dari mana kita tahu.', bentuk: PERASAAN },
    { p: 'tanyakan apa yang dirasakan {kedua} saat bertemu {anak} lagi, dan dari mana kita tahu.', bentuk: PERASAAN },
    { p: 'tanyakan andaikan {anak} terus berlari ke sana kemari, apa yang bisa terjadi.', bukti: 'boleh' },
  ],
  salah_dengar: [
    { p: 'tanyakan apa yang dirasakan {anak} saat tahu ia salah membawa barang, dan dari mana kita tahu.', bentuk: PERASAAN },
    { p: 'tanyakan kenapa menurut anak, {kedua} tidak marah.', bukti: 'boleh' },
    { p: 'tanyakan andaikan {anak} bertanya ulang dari awal, apa yang akan terjadi.', bukti: 'boleh' },
  ],
  lomba: [
    { p: 'tanyakan apa yang dirasakan {anak} saat harus memilih antara terus berlari atau menolong, dan dari mana kita tahu.', bentuk: PERASAAN },
    { p: 'tanyakan apa yang dirasakan {kedua} saat ditolong {anak}, dan dari mana kita tahu.', bentuk: PERASAAN },
    { p: 'tanyakan andaikan {anak} tidak berhenti, apa yang akan terjadi.', bukti: 'boleh' },
  ],
  bergiliran: [
    { p: 'tanyakan apa yang dirasakan {anak} dan {kedua} saat duduk berjauhan, dan dari mana kita tahu.', bentuk: PERASAAN },
    { p: 'tanyakan andaikan mereka terus berebut, apa yang akan terjadi pada {benda}.', bukti: 'boleh' },
    { p: 'tanyakan kenapa menurut anak, bermain berdua jadi lebih seru.', bukti: 'boleh' },
  ],
};
const TEBAK_UMUM = [
  { p: 'tanyakan menurut anak, {anak} itu anak yang seperti apa, dan dari mana kita tahu. Jawaban yang diharapkan: {sifat}, dilihat dari kelakuannya di cerita.' },
];

const IDE = {
  rusak: ['tanyakan cara lain supaya {benda} aman dibawa.', 'tanyakan apa yang sebaiknya dilakukan kalau tidak sengaja merusak barang orang lain.'],
  hilang: ['tanyakan cara supaya tidak lupa membawa barang.', 'tanyakan apa yang bisa dilakukan kalau barang kita hilang di tempat ramai.'],
  hujan: ['tanyakan tanda lain bahwa hujan akan turun.', 'tanyakan benda lain yang bisa melindungi kita dari hujan.', 'tanyakan permainan yang bisa dimainkan di dalam rumah waktu hujan.'],
  hewan: ['tanyakan benda lain yang bisa dipakai untuk menolong {benda}.', 'tanyakan cara menjaga {benda} supaya tidak kesulitan lagi.'],
  salah_paham: ['tanyakan apa yang sebaiknya dilakukan kalau barang kita tidak ada di tempatnya.', 'tanyakan cara yang baik untuk meminjam barang teman.'],
  tiga_coba: ['tanyakan cara lain yang bisa dicoba {anak} supaya berhasil.', 'tanyakan apa yang kamu lakukan kalau sudah mencoba dua kali dan masih gagal.'],
  kejutan: ['tanyakan kejutan lain yang bisa dibuat untuk orang tersayang.', 'tanyakan cara menyimpan rahasia kejutan supaya tidak ketahuan.'],
  jejak: ['tanyakan tempat aman untuk menyimpan {benda} supaya tidak dibawa hewan.', 'tanyakan petunjuk lain yang bisa dicari seorang detektif cilik.'],
  tersesat: ['tanyakan apa yang sebaiknya dilakukan kalau terpisah dari orang tua di tempat ramai.', 'tanyakan tanda apa yang bisa dipakai supaya kita mudah ditemukan.'],
  salah_dengar: ['tanyakan cara supaya tidak salah dengar saat disuruh.', 'tanyakan permainan seru apa yang bisa dibuat dari kata-kata yang mirip bunyinya.'],
  lomba: ['tanyakan lomba lain yang seru untuk dimainkan bersama teman.', 'tanyakan apa yang kamu lakukan kalau temanmu jatuh saat lomba.'],
  bergiliran: ['tanyakan cara bergiliran yang adil kalau dua anak ingin memakai satu barang.', 'tanyakan permainan apa yang bisa dimainkan berdua dengan {benda}.'],
};
const IDE_UMUM = [
  'tanyakan: kalau kamu jadi {anak}, apa yang akan kamu lakukan di bagian paling sulit cerita ini?',
  'minta anak memberi judul lain untuk cerita ini.',
  'tanyakan apa yang mungkin terjadi pada {anak} dan {kedua} keesokan harinya.',
];

export const BENTUK = {
  terbuka: 'pertanyaan terbuka',
  pilihan: 'tiga pilihan. Tulis pilihannya sebagai kata biasa di akhir pertanyaan, tanpa huruf A, B, C. Contoh bentuk: "Apa bekal yang dibawa Sari: jeruk, pisang, atau kue?". Satu benar, dua pengecoh yang masuk akal dan singkat. Jawaban menyebut pilihan yang benar',
  duaPilihan: 'dua pilihan, tanpa huruf A atau B. Contoh bentuk: "Siapa yang datang lebih dulu, Ibu atau Kakek?". Jawaban menyebut yang benar',
  benarSalah: 'benar atau salah. Awali dengan "Benar atau salah:" lalu satu pernyataan tentang cerita (boleh pernyataan yang salah). Jawaban diawali "Benar." atau "Salah.", lalu yang sebenarnya',
};

/** @returns {{tipe:string, sudut:string, perintah:string, bentuk:string, bukti:true|'boleh'|false, cek?:string[]}[]} */
export function rencanaSoal(bahan, usia) {
  const r = acak(`${bahan.kode}|${usia}|soal`);
  const k = bahan.kerangka;
  const pola = ambil(r, POLA);
  const detail = detailKartu(bahan, usia);
  const antre = {
    ingat: kocok(r, INGAT),
    penyebab: kocok(r, (PENYEBAB[k] ?? PENYEBAB_UMUM).map((p, i) => ({ id: `penyebab-${i}`, p, bentuk: ['terbuka', 'terbuka', 'pilihan'] }))),
    tebak: kocok(r, [...(TEBAK[k] ?? []), ...TEBAK_UMUM].map((t, i) => ({ id: `tebak-${i}`, ...t }))),
    ide: kocok(r, [...(IDE[k] ?? []), ...IDE_UMUM].map((p, i) => ({ id: `ide-${i}`, p, bukti: false }))),
  };

  let detailDipakai = false;
  return pola.map((tipe) => {
    let s;
    // Paling banyak satu soal "detail" per kartu, dan hanya separuh kesempatan.
    if (tipe === 'ingat' && !detailDipakai && r() < 0.5) {
      detailDipakai = true;
      const d = ambil(r, detail);
      s = { id: `detail-${d.jenis}`, p: `tanyakan ${d.tanya}. Jawabannya: ${d.teks}.`, bentuk: ['terbuka', 'pilihan', 'duaPilihan', 'benarSalah'], cek: d.cek };
    } else {
      s = antre[tipe].shift() ?? { id: `${tipe}-cadangan`, p: tipe === 'ide' ? IDE_UMUM[0] : PENYEBAB_UMUM[0] };
    }
    return {
      tipe,
      sudut: s.id,
      perintah: s.p,
      bentuk: ambil(r, s.bentuk ?? ['terbuka']),
      bukti: s.bukti ?? (tipe === 'ide' ? false : true),
      cek: s.cek,
    };
  });
}
