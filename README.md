# Kartu Fokus

Cerita pendek untuk dibacakan orang tua, lalu kartu dibalik dan anak menjawab empat pertanyaan
(ingat-ingat, cari penyebab, coba tebak, punya ide). Tiap jawaban menempel satu stiker sampai
gambarnya lengkap. Kartu yang selesai menambah bintang, gelar, dan tantangan di Pojok Juara si kecil.

## Cara kerjanya

1. **Bahan** (`public/bahan.js`) disusun manual: 5 tempat, 12 nama anak, 5 tokoh kedua, 11 benda,
   dan 12 kerangka alur (rusak, hilang, hujan, menolong hewan, salah paham, tiga kali mencoba, kejutan,
   detektif jejak, terpisah di keramaian, salah dengar, lomba, bergiliran). Sebagian langkah punya
   beberapa versi penyebab dan akhir, dipilih dari kode kartu. Kerangka alur adalah rantai sebab-akibat, jadi soal "kenapa" dan "coba tebak"
   selalu punya jawaban di cerita.
2. **Kode kartu** (4 huruf, misalnya `K7Q2`) menentukan bahan secara deterministik. Kode yang sama
   selalu menghasilkan tokoh, tempat, dan benda yang sama.
3. **Worker** (`src/worker.js`) menyusun prompt dari bahan (`src/prompt.js`), memanggil Gemini dengan
   JSON schema, lalu memeriksa hasilnya: nama tokoh dan detail wajib muncul, kalimat "bukti" untuk
   petunjuk harus benar-benar ada di cerita (kalau sedikit beda, diganti kalimat cerita yang paling mirip).
   Kalau masih kurang pas, dicoba sekali lagi.
   Gaya bercerita juga diatur di prompt: kalimat pertama langsung ke kejadian, ada kata bunyi dan
   satu ucapan yang diulang, perasaan ditunjukkan lewat gerak, dan akhir cerita berupa adegan kecil,
   bukan pesan moral. Dari kode kartu juga dipilih: bentuk pembuka, bentuk judul, gaya bercerita
   (berurutan, mulai dari tengah, pola tiga kali, petunjuk yang jadi kejutan, atau pendengar ikut
   menebak), jenis penutup, dan paragraf tempat tiap detail ditanam (tidak menumpuk di paragraf
   pertama). Kalau percobaan pertama ditolak pemeriksaan, percobaan kedua diberi tahu alasannya.
4. **Rencana soal** (`src/soal.js`) juga ditentukan kode kartu, supaya pertanyaan tidak bisa ditebak
   dari kartu sebelumnya:
   - Urutan tipe soal dipilih dari 7 pola. Soal ingatan tidak selalu di depan, kadang ada dua, dan
     soal ide tidak selalu ada.
   - Sudut tiap soal diambil dari bank. Untuk ingatan: siapa, urutan kejadian, ucapan tokoh, di mana,
     benar-salah, atau satu detail yang ditanam. Untuk sebab dan tebakan, targetnya berganti per
     kerangka: perasaan, andaikan, atau sifat tokoh.
   - Bentuknya terbuka, tiga pilihan, dua pilihan, atau benar-salah.
   - Detail yang ditanam di cerita (warna, jumlah, hari, waktu, bekal, baju) paling banyak satu
     per jenis. Soal warna hanya muncul di sekitar 1 dari 5 kartu.
5. **Gambar stiker** (`public/kolase.js`) dirakit dari bahan yang sama: latar tempat dicetak pucat,
   sosok dan benda jadi stiker bergaris tinta. Warna benda di gambar sama dengan warna di cerita.

Endpoint `/api/kartu` hanya menerima `{ usia, kode }`, bukan prompt bebas, jadi tidak bisa dipakai orang
lain sebagai jalan pintas ke Gemini. Ada batas 20 kartu per menit per IP.

Model dicoba berurutan (`GEMINI_MODEL` di `wrangler.jsonc`): `gemini-3.1-flash-lite`, lalu
`gemini-3.5-flash-lite`, lalu `gemini-2.5-flash` kalau model sebelumnya sedang penuh (503/429).
Saat diuji, satu kartu jadi dalam 2 sampai 12 detik. Kartu berikutnya disiapkan diam-diam selagi
anak menjawab, jadi "Kartu berikutnya" biasanya langsung muncul.

## Jalankan lokal

```bash
npm install
echo "GEMINI_API_KEY=..." > .dev.vars
npm run dev
```

Buka http://localhost:8787.

## Deploy ke Cloudflare Workers

Live di **https://fokus-anak.tukangdata.com** (custom domain diatur di `routes` pada `wrangler.jsonc`).

Deploy dari laptop (manual, tidak otomatis dari push):

```bash
npx wrangler deploy
npx wrangler secret put GEMINI_API_KEY   # sekali saja, atau saat ganti key
```

Sebaiknya pakai API key Gemini terpisah dari aplikasi lain, supaya kalau kuotanya habis aplikasi
lain tidak ikut berhenti.

## Ikon, SEO, dan pratinjau link

- `public/favicon.svg` dan `favicon.ico` untuk tab browser, `apple-touch-icon.png` (180px) dan
  `ikon-192.png`/`ikon-512.png` (lewat `manifest.webmanifest`) untuk ikon di layar HP.
- Meta title, description, canonical, Open Graph, Twitter card, dan JSON-LD (`WebApplication`) ada
  di `public/index.html`. Judul tab ikut berganti per layar (judul cerita, Pojok Juara, dan seterusnya).
- Gambar pratinjau WhatsApp/Telegram: `public/og.png` (1200x630) dirender dari `public/og.html`
  dengan headless Chrome. Perintahnya ada di komentar atas `og.html`. WhatsApp menyimpan pratinjau
  lama di cache, jadi link yang sudah pernah dibagikan bisa butuh waktu sebelum gambarnya berganti.
- `robots.txt` dan `sitemap.xml` di `public/`.

## Menambah bahan

- Tempat baru: tambah di `TEMPAT` (`bahan.js`) **dan** gambarnya di `LATAR` (`kolase.js`).
  Deskripsi tempat hanya boleh menyebut hal yang memang digambar.
- Benda baru: tambah di `BENDA` dengan `sifat` (peran di kerangka: `rusak`, `hilang`, `hujan`,
  `dipinjam`, `hewan`, `alat`) dan gambarnya di `BENDA_GAMBAR`.
- Kerangka alur baru: tambah di `KERANGKA`. Tulis langkah alur sebagai rantai sebab-akibat (langkah
  berupa array = beberapa versi), pakai `butuh` dan `benda2` untuk peran benda, lalu
  tambahkan sudut soalnya di `PENYEBAB`, `TEBAK`, dan `IDE` (`src/soal.js`), minimal tiga per tipe.
  Tanpa itu kerangka tetap jalan, tapi memakai sudut umum saja.
- Sudut soal baru: tambah di bank yang sesuai di `src/soal.js`. Tulis sebagai perintah untuk Gemini
  ("tanyakan ..."), boleh memakai `{anak}`, `{kedua}`, `{benda}`, `{benda2}`, `{tempat}`, `{sifat}`.

## Gamifikasi (Pojok Juara)

Semuanya di `public/piala.js`, gampang diubah:

- **Bintang:** daftar `MILESTONE`. Tiap baris satu bintang, `kartu` = jumlah kartu selesai untuk
  mendapatkannya, `julukan` = gelarnya (Kuping Siaga sampai Legenda Dongeng). Sekarang 3, 8, 15, 25, 40, 60, 100 cerita.
- **Tantangan:** daftar `LENCANA`, tiap tantangan punya `ajak` (kalimat ajakan selama belum berhasil), `berhasil` (teks di dialog hadiah), dan `cek(statistik)`. Statistik yang tersedia:
  `kartu`, `stiker`, `sekaliDengar` (selesai tanpa intip cerita), `tanpaContekan` (selesai tanpa
  petunjuk), `tempat` (jumlah tempat berbeda), `beruntun` dan `beruntunTerpanjang` (hari).
- Bintang atau lencana baru muncul sebagai dialog setelah kartu selesai. Kartu yang dibuka lagi dari
  koleksi tidak dihitung dua kali.
- **Nama si kecil** ditanya sekali saat pertama mulai (boleh dilewati), lalu dipanggil di setiap soal,
  di layar selesai, dan di Pojok Juara. Nama tidak dikirim ke server atau Gemini.
- **Reset profil** di Pojok Juara menghapus nama, bintang, tantangan, dan rak cerita (selalu dengan konfirmasi).
- **Penyimpanan:** localStorage browser (`kf-profil`, `kf-kartu`, `kf-album`). Tidak ada database
  atau akun, jadi isinya hilang kalau data browser dihapus dan tidak pindah ke perangkat lain.

## Catatan desain

Gaya: buku stiker. Bentuknya mengikuti contoh yang dipilih pemilik produk
([uupm.cc educational-platform](https://www.uupm.cc/demo/educational-platform)): kartu putih
bergaris tinta tebal, bayangan keras, sudut membulat, huruf bulat. Dial: tenaga sedang, ritme
seragam (setiap kartu strukturnya sama supaya anak terbiasa), gerak cukup banyak tapi tiap gerak
punya arti (diminta pemilik produk).

- **Kartu dua sisi:** depan cerita, belakang soal, seperti kartu sungguhan. "Balik kartu" memutar
  kartu menyamping (sumbu Y). Dari sisi soal, "Intip ceritanya lagi" memutarnya kembali, jadi orang
  tua bisa membaca ulang kalau anak lupa.
- **Cerita per halaman:** satu paragraf per halaman dengan tombol Sebelumnya/Lanjut (atau panah
  kiri/kanan), supaya kartu tidak memanjang. Halaman berganti dengan geser ke samping.
- **Warna:** latar langit biru (`#B5E0FF`) dengan awan, bintang, dan titik warna yang ditebar acak tiap halaman dibuka (`lukisLangit()` di app.js), samar, dan awannya berjalan pelan melintasi layar seperti tertiup angin; menyambung dengan langit di gambar stiker, tinta ungu tua (`#2B2A3A`), dan empat warna krayon
  cerah: kuning `#FFC93C`, merah `#EF4B3F`, biru `#3B8CF0`, hijau `#4DBA5E`. Alasannya dari riset
  warna anak: warna cerah dan hangat paling menarik perhatian, tapi latar yang ramai mengganggu fokus.
  Jadi warna cerah hanya dipakai di bagian yang harus dilihat (tombol utama, jenis soal, stiker),
  dan versi mudanya untuk bidang besar.
  Sumber: [Frontiers in Psychology 2023](https://www.frontiersin.org/articles/10.3389/fpsyg.2023.1205213),
  [UXmatters: color for toddlers and preschoolers](https://www.uxmatters.com/mt/archives/2011/10/effective-use-of-color-and-graphics-in-applications-for-children-part-i-toddlers-and-preschoolers.php).
- **Warna jenis soal:** ingat-ingat biru, cari penyebab merah, coba tebak kuning, punya ide hijau.
  Dipakai sama di beranda, label soal, dan kotak kemajuan, supaya anak mengenali jenisnya dari warna.
- **Huruf:** Fredoka untuk judul (bulat dan tebal, ramah anak, sama dengan contoh), Nunito untuk
  cerita dan tombol (ujung membulat, tetap mudah dibaca di ukuran 20px saat dibacakan).
- **Tombol ajakan di beranda:** satu-satunya oranye (`#EA5A12`) di halaman, bentuk kapsul, paling
  besar, dan "mencolek" dua kali setelah halaman terbuka. Pilihan umur yang terpilih sengaja gelap,
  bukan kuning, supaya tidak menyaingi tombol ini.
- **Bayangan keras:** bukan hiasan. Tombol turun menutup bayangannya saat ditekan, jadi terasa
  seperti tombol sungguhan. Pilihan umur yang terpilih juga tampil "tertekan".
- **Stiker:** tokoh dan benda punya pinggiran putih dan bayangan, latar tidak. Yang belum ditempel
  tampil sebagai garis putus-putus, seperti tempat kosong di buku stiker.
- **Gerak:** kartu berputar menyamping saat dibalik; stiker jatuh dan memantul ke gambar saat
  "Sudah dijawab, dapat stiker!" ditekan; kotak kemajuan terisi; soal berikutnya datang dari kanan
  seperti kartu baru; konfeti sekali saat gambar lengkap. Semuanya mati kalau sistem meminta gerak
  dikurangi.
- **Tema:** satu tema terang. Hiasan latar sengaja pucat supaya teks tetap terbaca (teks kedua minimal 4.9:1). Cincin fokus keyboard berupa garis putus-putus gelap karena biru tidak cukup kontras di atas langit.
- **Kaki halaman:** mengikuti pola side project Tukangdata: "Made With ❤️ By Tukangdata.com".
- **Tanpa gambar AI.** Semua gambar dirakit dari bentuk vektor. Ikon aplikasi belum dibuat.
