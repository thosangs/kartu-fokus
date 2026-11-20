// Gamifikasi Kartu Fokus: bintang dari milestone dan lencana dari pencapaian.
// Semua data anak hanya disimpan di browser (localStorage), tidak dikirim ke server.

// ── Atur di sini ──────────────────────────────────────────────
// Tiap baris = satu bintang sekaligus gelar. `kartu` = jumlah cerita tamat untuk mendapatkannya.
// Gelarnya naik pangkat: dari kuping yang mulai siaga sampai legenda.
export const MILESTONE = [
  { kartu: 3, julukan: 'Kuping Siaga' },
  { kartu: 8, julukan: 'Pendengar Jitu' },
  { kartu: 15, julukan: 'Detektif Cilik' },
  { kartu: 25, julukan: 'Pendekar Fokus' },
  { kartu: 40, julukan: 'Kapten Cerita' },
  { kartu: 60, julukan: 'Juragan Dongeng' },
  { kartu: 100, julukan: 'Legenda Dongeng' },
];

// Tantangan: `ajak` tampil selama belum berhasil (kalimat ajakan), `berhasil` tampil di dialog hadiah.
// `cek` menerima statistik (lihat statistik() di app.js) dan mengembalikan true kalau tercapai.
export const LENCANA = [
  { id: 'pertama', nama: 'Pemanasan', ajak: 'Tamatkan cerita pertamamu', berhasil: 'Cerita pertama sudah tamat.', warna: 'kuning', cek: (s) => s.kartu >= 1 },
  { id: 'sekali-dengar', nama: 'Sekali Dengar, Nempel!', ajak: 'Tamatkan satu cerita tanpa mengintip', berhasil: 'Satu cerita tamat tanpa mengintip.', warna: 'biru', cek: (s) => s.sekaliDengar >= 1 },
  { id: 'tanpa-contekan', nama: 'Anti Contekan', ajak: 'Jawab semua soal tanpa petunjuk', berhasil: 'Semua soal terjawab tanpa petunjuk.', warna: 'merah', cek: (s) => s.tanpaContekan >= 1 },
  { id: 'rajin-3', nama: 'Mulai Ketagihan', ajak: 'Main 3 hari berturut-turut', berhasil: 'Tiga hari berturut-turut, tanpa bolos.', warna: 'hijau', cek: (s) => s.beruntunTerpanjang >= 3 },
  { id: 'seminggu', nama: 'Rajin Pangkal Pandai', ajak: 'Main 7 hari berturut-turut', berhasil: 'Seminggu penuh, tanpa bolos.', warna: 'kuning', cek: (s) => s.beruntunTerpanjang >= 7 },
  { id: 'keliling', nama: 'Keliling Kampung', ajak: 'Dengar cerita dari 5 tempat berbeda', berhasil: 'Lima tempat sudah dijelajah.', warna: 'biru', cek: (s) => s.tempat >= 5 },
];

// ── Hitungan ──────────────────────────────────────────────────
export const jumlahBintang = (kartu) => MILESTONE.filter((m) => kartu >= m.kartu).length;
export const milestoneBerikutnya = (kartu) => MILESTONE.find((m) => kartu < m.kartu) ?? null;
export const lencanaTercapai = (stat) => LENCANA.filter((l) => l.cek(stat)).map((l) => l.id);

// Tanggal lokal YYYY-MM-DD (bukan UTC), supaya "hari ini" sesuai jam di rumah.
export function tanggalLokal(d = new Date()) {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

// Hari beruntun dari daftar tanggal bermain. `sekarang` hanya dihitung kalau terakhir main hari ini atau kemarin.
export function hariBeruntun(hari) {
  const urut = [...new Set(hari)].sort();
  const keHari = (t) => Math.round(new Date(`${t}T00:00:00`).getTime() / 86400000);
  let terpanjang = 0;
  let jalan = 0;
  let sebelum = null;
  for (const t of urut) {
    const h = keHari(t);
    jalan = sebelum !== null && h - sebelum === 1 ? jalan + 1 : 1;
    terpanjang = Math.max(terpanjang, jalan);
    sebelum = h;
  }
  const hariIni = keHari(tanggalLokal());
  const sekarang = sebelum !== null && hariIni - sebelum <= 1 ? jalan : 0;
  return { sekarang, terpanjang };
}

// ── Gambar bintang ────────────────────────────────────────────
export function bintangSVG({ terisi = true, angka = null, ukuran = 64, kelas = '' } = {}) {
  const titik = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 30 : 14;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    titik.push(`${(32 + Math.cos(a) * r).toFixed(1)},${(34 + Math.sin(a) * r).toFixed(1)}`);
  }
  const garis = terisi ? '' : ' stroke-dasharray="5 4"';
  const isi = terisi ? '#FFC93C' : '#FFFFFF';
  const teks = angka
    ? `<text x="32" y="41" text-anchor="middle" font-family="Fredoka, Nunito, sans-serif" font-weight="700" font-size="17" fill="#2B2A3A">${angka}</text>`
    : '';
  return `<svg class="bintang ${kelas}" viewBox="0 0 64 64" width="${ukuran}" height="${ukuran}" aria-hidden="true" focusable="false"><polygon points="${titik.join(' ')}" fill="${isi}" stroke="#2B2A3A" stroke-width="3" stroke-linejoin="round"${garis}/>${teks}</svg>`;
}
