import { BENDA, KERANGKA, KEDUA, TEMPAT, USIA, acak } from '../public/bahan.js';
import { BENTUK, detailKartu, rencanaSoal } from './soal.js';

export const TIPE_SOAL = ['ingat', 'penyebab', 'tebak', 'ide'];

export const SKEMA = {
  type: 'OBJECT',
  properties: {
    judul: {
      type: 'STRING',
      description: 'Judul 2 sampai 6 kata yang bikin anak penasaran, mengikuti bentuk judul di prompt. Jangan membocorkan akhir cerita.',
    },
    paragraf: { type: 'ARRAY', items: { type: 'STRING' } },
    soal: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          tipe: { type: 'STRING', enum: TIPE_SOAL },
          pertanyaan: { type: 'STRING' },
          jawaban: { type: 'STRING' },
          bukti: { type: 'STRING' },
        },
        required: ['tipe', 'pertanyaan', 'jawaban', 'bukti'],
        propertyOrdering: ['tipe', 'pertanyaan', 'jawaban', 'bukti'],
      },
    },
  },
  required: ['judul', 'paragraf', 'soal'],
  propertyOrdering: ['judul', 'paragraf', 'soal'],
};

// Gaya per umur: makin kecil anaknya, makin banyak pengulangan dan bunyi; makin besar, makin banyak kejutan.
const GAYA_USIA = {
  '4-5': 'Untuk anak 4–5 tahun: satu masalah sederhana, banyak pengulangan, kata bunyi yang gampang ditirukan, kata kerja yang bisa diperagakan.',
  '6-7': 'Untuk anak 6–7 tahun: selipkan satu hal kecil yang lucu (salah dengar, tingkah hewan, benda di tempat aneh) dan satu kejutan kecil.',
  '8-9': 'Untuk anak 8–9 tahun: tokoh boleh salah sangka atau hampir menyerah dulu sebelum menemukan jalan. Pilih kata kerja yang hidup dan sedikit humor.',
};

// Pembuka dan bentuk judul dipilih dari kode kartu, supaya cerita tidak selalu dibuka dengan cara
// yang sama (model cenderung selalu memilih kata bunyi kalau dibebaskan).
const PEMBUKA = [
  'ucapan tokoh dalam tanda kutip',
  'satu kata bunyi, lalu langsung kejadiannya',
  'tokoh utama sedang melakukan sesuatu yang seru atau sedikit aneh',
  'pertanyaan yang diucapkan salah satu tokoh',
];
const BENTUK_JUDUL = [
  'seruan pendek dari salah satu tokoh (misalnya diawali "Awas", "Tunggu", "Aduh", atau "Hore")',
  'pertanyaan yang membuat penasaran, tapi jangan diawali "Ke mana"',
  'nama tokoh utama ditambah keadaan yang membuat penasaran, tanpa kata "hilang", "rusak", atau bocoran akhir cerita',
  'kata bunyi yang penting di cerita, ditambah sedikit keterangan',
];

// Cara menceritakan alur yang sama. Dipilih dari kode kartu supaya struktur cerita tidak selalu
// "perkenalan, masalah, selesai" dengan urutan yang bisa ditebak.
const GAYA_ALUR = [
  'Ceritakan berurutan, tapi buat bagian tengah (saat masalahnya berkembang) menjadi bagian yang paling panjang dan paling hidup.',
  'Buka cerita langsung di momen paling menegangkan dari alur, lalu dalam satu atau dua kalimat ceritakan bagaimana semuanya bermula, baru lanjutkan sampai selesai.',
  'Pakai pola tiga kali: ada satu hal yang terjadi, dicari, atau dicoba tiga kali dengan hasil berbeda. Yang ketiga membawa perubahan.',
  'Tanam satu petunjuk kecil di bagian awal yang kelihatannya tidak penting, lalu buat petunjuk itu menjadi kunci di akhir cerita, sebagai kejutan kecil yang masuk akal.',
  'Biarkan pendengar ikut menebak: tunjukkan petunjuk-petunjuk lebih dulu kepada pendengar, sebelum tokohnya sendiri menyadari apa yang terjadi.',
];
const PENUTUP = [
  'satu kalimat ucapan tokoh yang lucu atau hangat',
  'adegan kecil yang memantulkan kalimat pembuka cerita',
  'ucapan berulang di cerita, yang kali ini sedikit diubah',
  'gambaran kecil tentang apa yang dilakukan tokoh sesaat setelah masalahnya selesai',
  'tingkah lucu salah satu tokoh atau hewan di sekitar mereka',
];

function frasaBenda(b) {
  const meta = BENDA[b.id];
  if (b.jumlah) return `${b.nama} berisi ${b.jumlah} ${meta.satuan.replace(' telur', '')} telur`;
  if (b.warna) return meta.kataWarna ? `${b.nama}, ${meta.kataWarna} berwarna ${b.warna}` : `${b.nama} berwarna ${b.warna}`;
  return b.nama;
}

export function buatPrompt(bahan, usia) {
  const k = KERANGKA.find((x) => x.id === bahan.kerangka);
  const u = USIA[usia];
  const detail = detailKartu(bahan, usia);
  const rencana = rencanaSoal(bahan, usia);
  const isi = (s) =>
    s
      .replaceAll('{sifat}', bahan.anak.sifat)
      .replaceAll('{anak}', bahan.anak.nama)
      .replaceAll('{kedua}', bahan.kedua.sebutan)
      .replaceAll('{benda2}', bahan.benda2.nama)
      .replaceAll('{benda}', bahan.benda.nama)
      .replaceAll('{tempat}', TEMPAT[bahan.tempat].nama);

  const r = acak(`${bahan.kode}|gaya`);
  const pilih = (arr) => arr[Math.floor(r() * arr.length)];
  const gaya = { pembuka: pilih(PEMBUKA), judul: pilih(BENTUK_JUDUL), alur: pilih(GAYA_ALUR), penutup: pilih(PENUTUP) };

  // Langkah alur bisa punya beberapa versi; satu dipilih per kartu.
  const alur = k.alur.map((a, i) => (Array.isArray(a) ? a[Math.floor(acak(`${bahan.kode}|alur|${i}`)() * a.length)] : a));
  const benda2Penting = k.alur.flat().some((a) => a.includes('{benda2}'));

  // Detail disebar ke paragraf 2 sampai terakhir, masing-masing di paragraf berbeda (kalau cukup),
  // supaya tidak menumpuk di paragraf pertama atau di satu tempat.
  const rd = acak(`${bahan.kode}|${usia}|sebar`);
  const paragrafTersedia = Array.from({ length: u.paragraf - 1 }, (_, i) => i + 2);
  for (let i = paragrafTersedia.length - 1; i > 0; i--) {
    const j = Math.floor(rd() * (i + 1));
    [paragrafTersedia[i], paragrafTersedia[j]] = [paragrafTersedia[j], paragrafTersedia[i]];
  }
  const sebaran = detail
    .map((d, i) => ({ teks: d.teks, paragraf: paragrafTersedia[i % paragrafTersedia.length] }))
    .sort((a, b) => a.paragraf - b.paragraf);

  const kedua =
    bahan.kedua.id === 'teman'
      ? `${bahan.kedua.sebutan}, ${KEDUA.teman.deskripsi} (${bahan.kedua.jenis === 'pr' ? 'perempuan' : 'laki-laki'})`
      : `${bahan.kedua.sebutan}, ${KEDUA[bahan.kedua.id].deskripsi}`;

  return `Kamu penulis cerita anak berbahasa Indonesia. Tulis satu cerita pendek yang akan DIBACAKAN orang tua untuk anak usia ${u.label}, lalu buat 4 pertanyaan untuk melatih anak mendengar dengan fokus dan berpikir.

BAHAN (wajib dipakai persis, jangan diganti):
- Tokoh utama: ${bahan.anak.nama}, anak ${bahan.anak.jenis === 'pr' ? 'perempuan' : 'laki-laki'}, sifatnya ${bahan.anak.sifat}.
- Tokoh kedua: ${kedua}.
- Tempat: ${TEMPAT[bahan.tempat].deskripsi}.
- Benda penting: ${frasaBenda(bahan.benda)}.
- Benda tambahan: ${frasaBenda(bahan.benda2)}.${benda2Penting ? ' Benda ini punya peran di alur.' : ' Cukup muncul sekali sebagai detail suasana, di tengah cerita.'}

DETAIL YANG DITANAM (wajib muncul jelas, walau tidak semua ditanyakan). Selipkan di tengah kejadian, sebagai bagian dari aksi atau ucapan tokoh, bukan daftar di awal:
${sebaran.map((d) => `- "${d.teks}": di paragraf ${d.paragraf}.`).join('\n')}
Paragraf pertama cukup membawa pendengar masuk ke kejadian; jangan menumpuk ciri-ciri benda, warna, atau jumlah di sana.
Tulis detail dengan kalimatmu sendiri, jangan disalin apa adanya (misalnya bukan "kejadiannya sore hari", tapi "Sore itu, matahari sudah condong ...").

ALUR (rantai sebab-akibat; isi kejadiannya wajib, cara menceritakannya mengikuti GAYA di bawah):
${alur.map((a, i) => `${i + 1}. ${isi(a)}`).join('\n')}

ATURAN CERITA:
- Panjang ${u.kata[0]} sampai ${u.kata[1]} kata, dibagi ${u.paragraf} paragraf pendek. Ini batas keras: kalau kepanjangan, kurangi deskripsi, bukan ucapan tokoh.
- Kosakata sehari-hari anak Indonesia. Pakai nama dan sebutan persis seperti di bahan. Tokoh kedua disebut "${bahan.kedua.sebutan}".
- Sebab dan akibat harus jelas dari kejadian, bukan dari ceramah.
- Tidak ada kekerasan, hal yang terlalu menakutkan, atau merek dagang.
- Sebut tempat-tempat kecil dengan jelas (misalnya "di bawah pohon", "di dekat lapak buah"), dan buat urutan kejadian mudah diikuti.

CARA BERCERITA (cerita ini dibacakan keras, jadi harus seru didengar, bukan seperti laporan):
- GAYA untuk kartu ini: ${gaya.alur}
- Judul berbentuk ${gaya.judul}. Judul apa pun tidak boleh membocorkan akhir cerita, dan tidak memakai kata "hilang", "rusak", atau "ketemu".
- Buka cerita dengan ${gaya.pembuka}. Jangan dibuka dengan "Pada suatu hari", nama hari, atau kalimat yang hanya menjelaskan tempat.
- Deskripsi tempat di bahan hanya catatan untukmu. Jangan salin utuh; munculkan bagiannya satu per satu saat tokoh melihat, mendengar, atau melewatinya.
- Pakai 2 atau 3 kata bunyi yang cocok dengan kejadian (bunyi langkah, benda jatuh, air, hewan, angin), tersebar di cerita.
- Pilih satu ucapan pendek atau bunyi khas (paling banyak 6 kata) yang muncul lagi 2 atau 3 kali, dan setiap kali muncul harus masuk akal dengan kejadiannya. Yang terakhir boleh sedikit diubah supaya terasa sebagai penutup. Anak senang menebak kapan ucapan itu muncul lagi.
- Minimal tiga kalimat ucapan tokoh dalam tanda kutip, dengan nada yang berbeda-beda (bertanya, berseru, berbisik), supaya orang tua bisa memainkan suaranya.
- Tunjukkan perasaan lewat gerak tubuh dan ucapan (menunduk, menggigit bibir, menghentakkan kaki, suaranya mengecil, memeluk lutut), bukan dengan menyebut "sedih", "senang", atau "takut". ${usia === '4-5' ? 'Untuk anak 4–5 tahun, buat gerak tubuhnya jelas dan mudah dikenali.' : 'Petunjuknya boleh halus, asal ada.'}
- Ada satu momen menahan napas sebelum masalahnya selesai: tokoh mencari, menunggu, ragu, atau hampir salah langkah.
- Setiap paragraf membawa satu hal baru yang bisa dilihat, didengar, atau dirasakan (bukan sekadar ringkasan "lalu ... lalu ..."). Bagian tengah harus terasa, bukan dilewati dalam satu kalimat.
- Panjang kalimat berganti-ganti. Kebanyakan pendek, sesekali satu kalimat yang sangat pendek untuk memberi jeda.
- ${GAYA_USIA[usia]}
- Akhiri dengan ${gaya.penutup}. Kalimat terakhir tidak boleh tentang pelajaran, kebiasaan baru, atau pesan moral (misalnya "sejak hari itu", "kini ${bahan.anak.nama} tahu", "${bahan.anak.nama} selalu", "${bahan.anak.nama} sadar bahwa").
- Kalimat pertama tidak boleh tentang tokoh yang melompat-lompat, berlari kecil, atau berjalan riang. Detail tempat yang sama (misalnya gunung, tiang bendera) cukup disebut sekali.
- Hindari klise: "pada suatu hari", "melompat-lompat", "tiba-tiba" lebih dari sekali, "dengan wajah ceria", "tersenyum lebar", "hari yang cerah", "terlihat sebuah", "sangat" berulang kali, "lucu", "indah", "menyenangkan".

PERTANYAAN (tepat 4, urutannya tetap, masing-masing dengan perintah dan bentuknya sendiri):
${rencana.map((s, i) => `${i + 1}. tipe "${s.tipe}": ${isi(s.perintah)} Bentuk: ${BENTUK[s.bentuk]}.`).join('\n')}

Aturan pertanyaan:
- Bahasa lisan yang mudah dipahami anak ${u.label}. Maksimal 14 kata; bentuk pilihan boleh sampai 20 kata.
- Keempat pertanyaan diawali kata yang berbeda-beda. Jangan menanyakan warna kecuali perintahnya memang menanyakan warna.
- Pertanyaan tipe "tebak" jawabannya tidak tertulis langsung di cerita; anak menyimpulkan dari kejadian.
- "jawaban": singkat, untuk dibaca orang tua. Untuk tipe "ide", tulis 2 sampai 3 contoh jawaban yang masuk akal.
- "bukti": salin PERSIS satu kalimat utuh dari cerita yang paling membantu menjawab. Untuk tipe "ide", isi string kosong. Untuk soal andaikan, boleh kosong kalau tidak ada kalimat yang cocok.`;
}
