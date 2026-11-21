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
// rusak, hilang, hujan, dipinjam, alat, hewan: peran lama. coba = bisa dicoba berkali-kali,
// hadiah = bisa jadi kejutan, penanda = mencolok dari jauh, lomba = bisa dilombakan,
// diambil = bisa diambilkan/dibawa (untuk salah dengar dan persiapan kejutan).
export const BENDA = {
  telur: { nama: 'keranjang telur', sifat: ['rusak', 'lomba', 'diambil'], jumlah: [3, 8], satuan: 'butir telur' },
  layang: { nama: 'layang-layang', sifat: ['rusak', 'hilang', 'coba', 'hadiah', 'penanda', 'lomba'], warna: ['merah', 'biru', 'kuning'], langit: true },
  payung: { nama: 'payung', sifat: ['hujan', 'hilang', 'dipinjam', 'alat', 'hadiah', 'penanda', 'diambil'], warna: ['merah', 'biru', 'kuning', 'hijau'] },
  bola: { nama: 'bola plastik', sifat: ['hilang', 'dipinjam', 'coba', 'hadiah', 'lomba', 'diambil'], warna: ['merah', 'biru', 'kuning'] },
  ember: { nama: 'ember', sifat: ['rusak', 'dipinjam', 'alat', 'coba', 'lomba', 'diambil'], warna: ['merah', 'biru', 'kuning'] },
  buku: { nama: 'buku cerita', sifat: ['hilang', 'dipinjam', 'hadiah', 'diambil'], warna: ['merah', 'biru', 'kuning', 'hijau'], kataWarna: 'sampulnya' },
  sepeda: { nama: 'sepeda', sifat: ['rusak', 'dipinjam', 'coba', 'lomba'], warna: ['merah', 'biru', 'kuning', 'hijau'] },
  caping: { nama: 'caping bambu', sifat: ['hujan', 'hilang', 'hadiah', 'penanda', 'diambil'] },
  tangga: { nama: 'tangga bambu', sifat: ['alat', 'diambil'] },
  kucing: { nama: 'anak kucing', sifat: ['hewan'], warna: ['oranye', 'hitam', 'putih'] },
  ayam: { nama: 'anak ayam', sifat: ['hewan'], warna: ['kuning', 'hitam'] },
};

export const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

// Kerangka alur = rantai sebab-akibat. Gemini hanya menulis prosa di atas kerangka ini,
// jadi soal sebab-akibat dan tebakan selalu punya jawaban di dalam cerita.
// Langkah berupa array = beberapa versi; satu dipilih dari kode kartu (lihat src/prompt.js), supaya
// kerangka yang sama tidak selalu berakhir sama. benda2: peran wajib untuk benda kedua.
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
      [
        '{anak} ingin cepat-cepat bermain, jadi berjalan terburu-buru tanpa melihat jalan.',
        '{anak} membawa {benda} sambil sibuk memperhatikan sesuatu yang menarik di {tempat}, bukan jalan di depannya.',
        '{anak} membawa {benda} dengan satu tangan saja, karena tangan satunya ingin melambai atau memegang barang lain.',
      ],
      '{anak} tersandung atau menabrak sesuatu, lalu {benda} rusak (jatuh, retak, robek, atau lepas: pilih yang masuk akal untuk benda itu).',
      '{anak} diam dan takut dimarahi. Tunjukkan perasaannya lewat sikap (misalnya menunduk, berjalan pelan), jangan sebut nama perasaannya.',
      [
        '{anak} memilih jujur bercerita kepada {kedua}. {kedua} tidak marah, lalu mereka memperbaikinya bersama dengan cara yang cerdik.',
        '{anak} memilih jujur. {kedua} tertawa kecil dan bercerita pernah mengalami hal yang mirip waktu kecil, lalu mereka mengubah {benda} yang rusak menjadi sesuatu yang lucu atau berguna.',
        '{anak} memilih jujur dan menawarkan diri menebusnya dengan membantu pekerjaan {kedua}. Pekerjaan itu ternyata membawa kejutan kecil yang menyenangkan.',
      ],
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
      [
        '{anak} panik. {kedua} mengajaknya mengingat lagi apa saja yang tadi ia lakukan, satu per satu.',
        '{anak} panik dan lebih dulu mencari di dua tempat yang salah. Lalu {kedua} bertanya, di mana terakhir kali {benda} dipegang.',
      ],
      [
        'Dengan mengingat urutan kejadian, {anak} menemukan {benda} di tempat ia menaruhnya tadi.',
        'Ternyata seseorang yang baik hati sudah memindahkan {benda} ke tempat yang lebih aman di dekat situ, dan {anak} bisa mendapatkannya lagi karena ia ingat ciri-ciri {benda}.',
      ],
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
      [
        '{anak} merasa langit masih cukup terang, jadi {benda} tidak dibawa dan ia pergi bermain dulu.',
        '{anak} ingin menyelesaikan permainannya dulu, jadi {benda} ditinggal di dekat {kedua}.',
      ],
      'Hujan turun deras. {anak} basah kuyup dan kedinginan.',
      [
        '{kedua} datang menjemput membawa {benda}. Di perjalanan pulang, {anak} ikut menunjuk tanda-tanda yang tadi dilihat {kedua}.',
        '{kedua} datang membawa {benda}. Sambil berteduh berdua, mereka mendengarkan bunyi hujan dan {anak} menebak kapan hujan akan reda dari warna langit.',
      ],
    ],
  },
  {
    id: 'hewan',
    butuh: 'hewan',
    benda2: 'alat',
    tempat: ['rumah_nenek', 'pasar', 'sawah', 'sungai', 'sekolah'],
    sifatAnak: ['suka menolong', 'tidak sabaran', 'penyayang binatang'],
    kedua: ['nenek', 'kakek', 'ibu', 'ayah', 'teman'],
    alur: [
      '{anak} mendengar suara {benda} di {tempat}.',
      [
        '{benda} terjebak di tempat yang sempit atau tinggi di {tempat}. Sebutkan tempatnya dengan jelas.',
        '{benda} terpisah dari induknya dan tidak bisa menyeberang ke tempat induknya. Sebutkan penghalangnya dengan jelas.',
      ],
      '{anak} ingin langsung menolong, tapi {kedua} mengajak berpikir dulu supaya {benda} tidak makin takut dan semuanya aman.',
      'Mereka memakai {benda2} untuk menolong {benda} dengan cara yang masuk akal.',
      [
        '{benda} selamat dan kembali tenang.',
        '{benda} selamat, lalu mengikuti {anak} beberapa langkah seolah berterima kasih.',
        '{benda} selamat dan langsung berlari ke induknya.',
      ],
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
      [
        '{anak} dan {kedua} saling minta maaf, lalu memakai {benda} bersama.',
        '{kedua} mengembalikan {benda} yang kini malah lebih bagus. {anak} malu sendiri, lalu membalas dengan kebaikan kecil.',
      ],
    ],
  },
  {
    id: 'tiga_coba',
    butuh: 'coba',
    tempat: ['rumah_nenek', 'sawah', 'sungai', 'sekolah'],
    sifatAnak: ['mudah menyerah', 'tidak sabaran', 'penasaran'],
    kedua: ['nenek', 'kakek', 'ibu', 'ayah', 'teman'],
    alur: [
      '{anak} ingin berhasil melakukan sesuatu dengan {benda} di {tempat}. Pilih yang cocok dengan bendanya (misalnya menerbangkan layang-layang, menendang bola masuk ke sasaran, membawa ember penuh air tanpa tumpah, atau naik sepeda tanpa oleng).',
      'Percobaan pertama gagal karena satu alasan yang jelas dan bisa dilihat.',
      'Percobaan kedua gagal lagi karena alasan yang berbeda. {anak} hampir menyerah.',
      '{kedua} tidak memberi tahu caranya, tapi bertanya satu hal yang membuat {anak} memperhatikan sesuatu (angin, arah, kecepatan, atau cara memegang).',
      'Percobaan ketiga berhasil karena {anak} mengubah satu hal. Rayakan dengan cara yang lucu.',
    ],
  },
  {
    id: 'kejutan',
    butuh: 'hadiah',
    benda2: 'diambil',
    tempat: ['rumah_nenek', 'sekolah', 'pasar'],
    sifatAnak: ['suka berbagi', 'penyayang', 'tidak pandai menyimpan rahasia'],
    kedua: ['nenek', 'kakek', 'ibu', 'ayah', 'teman'],
    alur: [
      '{anak} diam-diam menyiapkan kejutan untuk {kedua} di {tempat}, memakai {benda}. Sebutkan alasannya (misalnya ucapan terima kasih atau hari istimewa {kedua}).',
      'Persiapannya butuh {benda2}, dan ada satu kesulitan kecil yang lucu saat menyiapkannya.',
      '{kedua} hampir saja tahu. {anak} buru-buru menyembunyikan kejutannya dengan cara yang lucu.',
      '{anak} memberikan kejutan itu. Tunjukkan reaksi {kedua} lewat gerak tubuh dan ucapan.',
      [
        'Ternyata {kedua} juga diam-diam menyimpan kejutan kecil untuk {anak}.',
        'Kejutan itu langsung dipakai bersama saat itu juga, dan hasilnya tidak seperti yang dibayangkan, tapi lebih lucu.',
      ],
    ],
  },
  {
    id: 'jejak',
    butuh: 'hilang',
    benda2: 'hewan',
    tempat: ['rumah_nenek', 'pasar', 'sawah', 'sungai', 'sekolah'],
    sifatAnak: ['teliti', 'penasaran', 'suka menebak'],
    kedua: ['nenek', 'kakek', 'ibu', 'ayah', 'teman'],
    alur: [
      '{benda} milik {anak} tidak ada di tempat biasanya di {tempat}.',
      '{anak} dan {kedua} menemukan petunjuk pertama (misalnya jejak kecil, bulu, atau sesuatu yang tercecer). Sebutkan dengan jelas.',
      'Petunjuk kedua dan ketiga jenisnya berbeda (misalnya suara, bekas basah, atau benda yang bergeser), dan semuanya mengarah ke satu tempat.',
      '{anak} menebak siapa pelakunya sebelum melihatnya. Biarkan pendengar ikut menebak dari petunjuk-petunjuk tadi.',
      'Ternyata {benda2} yang membawa {benda}, karena alasan yang lucu dan masuk akal untuk hewan itu.',
    ],
  },
  {
    id: 'tersesat',
    butuh: 'penanda',
    tempat: ['pasar', 'sawah', 'sekolah'],
    sifatAnak: ['mudah teralih perhatiannya', 'penasaran', 'pemberani tapi ceroboh'],
    kedua: ['nenek', 'kakek', 'ibu', 'ayah'],
    alur: [
      'Sebelum berangkat ke {tempat}, {kedua} berpesan: kalau terpisah, diam di satu tempat dan cari {benda} yang dibawa {kedua}.',
      'Di {tempat}, {anak} asyik melihat sesuatu (pilih yang cocok dengan tempatnya) sampai tertinggal dan terpisah dari {kedua}.',
      '{anak} sadar ia sendirian. Tunjukkan rasa takutnya lewat gerak tubuh. {anak} hampir berlari ke sana kemari.',
      '{anak} ingat pesan {kedua}, berhenti, lalu mencari {benda} yang mencolok di antara keramaian atau di kejauhan.',
      '{anak} melihat {benda} dan memanggil {kedua}. Mereka bertemu kembali.',
    ],
  },
  {
    id: 'salah_dengar',
    butuh: 'diambil',
    benda2: 'diambil',
    tempat: ['rumah_nenek', 'sawah', 'sekolah', 'pasar'],
    sifatAnak: ['terburu-buru', 'suka bercanda', 'tidak sabaran'],
    kedua: ['nenek', 'kakek', 'ibu', 'ayah', 'teman'],
    alur: [
      '{kedua} sedang sibuk di {tempat} dan meminta {anak} mengambilkan {benda}.',
      '{anak} kurang mendengar karena suasananya ramai atau ia sambil bermain, lalu malah membawa {benda2}.',
      'Kesalahan itu membuat kejadian lucu saat {kedua} mencoba memakai {benda2} untuk keperluannya.',
      'Mereka tertawa. {anak} mengulang permintaan {kedua} pelan-pelan untuk memastikan, lalu mengambil {benda}.',
      [
        'Ternyata {benda2} juga berguna untuk hal lain di {tempat}.',
        'Sebelum pulang, {anak} gantian meminta {kedua} mengambilkan sesuatu, dan ia sengaja berbisik pelan sekali.',
      ],
    ],
  },
  {
    id: 'lomba',
    butuh: 'lomba',
    tempat: ['sekolah', 'rumah_nenek', 'sawah'],
    sifatAnak: ['ingin selalu menang', 'tidak sabaran', 'bersemangat'],
    kedua: ['teman'],
    alur: [
      'Ada lomba kecil di {tempat} yang memakai {benda}. Pilih lomba yang cocok (misalnya membawa telur di sendok, mengisi ember, balap sepeda pelan, atau menerbangkan layang-layang paling tinggi).',
      '{anak} sangat ingin menang dan berangkat terlalu bersemangat.',
      'Di tengah lomba, {kedua} kesulitan atau terjatuh di dekat {anak}.',
      '{anak} ragu sebentar, lalu berhenti untuk menolong {kedua}.',
      [
        'Mereka tidak juara satu, tapi penonton bersorak paling keras untuk mereka, dan ada hadiah kecil yang lucu.',
        'Mereka sampai paling akhir sambil bergandengan, dan panitia membuat hadiah khusus yang belum pernah ada sebelumnya.',
      ],
    ],
  },
  {
    id: 'bergiliran',
    butuh: 'dipinjam',
    tempat: ['rumah_nenek', 'sekolah', 'sungai', 'sawah'],
    sifatAnak: ['tidak mau mengalah', 'keras kepala', 'cepat kesal'],
    kedua: ['teman'],
    alur: [
      '{anak} dan {kedua} sama-sama ingin memakai {benda} di {tempat} pada saat yang sama.',
      'Mereka berebut sampai {benda} hampir rusak.',
      'Keduanya duduk berjauhan dan cemberut. Tunjukkan lewat gerak tubuh, bukan nama perasaannya.',
      '{benda2} memberi mereka ide permainan yang bisa dimainkan berdua, atau cara bergiliran yang adil.',
      'Bermain berdua ternyata lebih seru. Tutup dengan tawa mereka berdua.',
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
  const syarat2 = k.benda2 ?? (k.alat ? 'alat' : null);
  if (syarat2) pool2 = pool2.filter((id) => BENDA[id].sifat.includes(syarat2));
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
