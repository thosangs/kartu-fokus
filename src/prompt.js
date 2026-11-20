import { BENDA, KERANGKA, KEDUA, TEMPAT, USIA } from '../public/bahan.js';
import { BENTUK, detailKartu, rencanaSoal } from './soal.js';

export const TIPE_SOAL = ['ingat', 'penyebab', 'tebak', 'ide'];

export const SKEMA = {
  type: 'OBJECT',
  properties: {
    judul: {
      type: 'STRING',
      description: 'Judul 2 sampai 4 kata. Kata pertama kata benda kunci cerita, contoh "Telur untuk Nenek" atau "Payung Kuning Raka".',
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
- Benda tambahan: ${frasaBenda(bahan.benda2)}.${k.alat ? '' : ' Cukup disebut sekali sebagai detail suasana.'}
- Detail yang wajib muncul jelas di cerita (sebut semuanya, walau tidak semua ditanyakan): ${detail.map((d) => d.teks).join('; ')}.

ALUR (ikuti urutannya, ini rantai sebab-akibat):
${k.alur.map((a, i) => `${i + 1}. ${isi(a)}`).join('\n')}

ATURAN CERITA:
- Panjang ${u.kata[0]} sampai ${u.kata[1]} kata, dibagi ${u.paragraf} paragraf pendek.
- Kalimat pendek dan jelas, enak dibacakan keras. Kosakata sehari-hari anak Indonesia.
- Sebab dan akibat harus jelas dari kejadian, bukan dari ceramah. Jangan menulis pesan moral di akhir.
- Tidak ada kekerasan, hal yang terlalu menakutkan, atau merek dagang.
- Pakai nama dan sebutan persis seperti di bahan. Tokoh kedua disebut "${bahan.kedua.sebutan}".
- Ada minimal dua kalimat ucapan tokoh dalam tanda kutip.
- Sebut tempat-tempat kecil dengan jelas (misalnya "di bawah pohon", "di dekat lapak buah"), dan buat urutan kejadian mudah diikuti.

PERTANYAAN (tepat 4, urutannya tetap, masing-masing dengan perintah dan bentuknya sendiri):
${rencana.map((s, i) => `${i + 1}. tipe "${s.tipe}": ${isi(s.perintah)} Bentuk: ${BENTUK[s.bentuk]}.`).join('\n')}

Aturan pertanyaan:
- Bahasa lisan yang mudah dipahami anak ${u.label}. Maksimal 14 kata; bentuk pilihan boleh sampai 20 kata.
- Keempat pertanyaan diawali kata yang berbeda-beda. Jangan menanyakan warna kecuali perintahnya memang menanyakan warna.
- Pertanyaan tipe "tebak" jawabannya tidak tertulis langsung di cerita; anak menyimpulkan dari kejadian.
- "jawaban": singkat, untuk dibaca orang tua. Untuk tipe "ide", tulis 2 sampai 3 contoh jawaban yang masuk akal.
- "bukti": salin PERSIS satu kalimat utuh dari cerita yang paling membantu menjawab. Untuk tipe "ide", isi string kosong. Untuk soal andaikan, boleh kosong kalau tidak ada kalimat yang cocok.`;
}
