# Kartu Fokus

Cerita pendek untuk dibacakan orang tua, lalu kartu dibalik dan anak menjawab empat pertanyaan
(ingat-ingat, cari penyebab, coba tebak, punya ide). Tiap jawaban menempel satu stiker sampai
gambarnya lengkap, lalu gambar itu masuk album.

## Cara kerjanya

1. **Bahan** (`public/bahan.js`) disusun manual: 5 tempat, 12 nama anak, 5 tokoh kedua, 11 benda,
   dan 5 kerangka alur. Kerangka alur adalah rantai sebab-akibat, jadi soal "kenapa" dan "coba tebak"
   selalu punya jawaban di cerita.
2. **Kode kartu** (4 huruf, misalnya `K7Q2`) menentukan bahan secara deterministik. Kode yang sama
   selalu menghasilkan tokoh, tempat, dan benda yang sama.
3. **Worker** (`src/worker.js`) menyusun prompt dari bahan (`src/prompt.js`), memanggil Gemini dengan
   JSON schema, lalu memeriksa hasilnya: nama tokoh dan detail wajib muncul, kalimat "bukti" untuk
   petunjuk harus benar-benar ada di cerita (kalau sedikit beda, diganti kalimat cerita yang paling mirip).
   Kalau masih kurang pas, dicoba sekali lagi.
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

```bash
npx wrangler secret put GEMINI_API_KEY
npx wrangler deploy
```

Hasilnya di `kartu-fokus.<akun>.workers.dev`. Untuk subdomain sendiri (misalnya `fokus.tukangdata.com`),
tambahkan di `wrangler.jsonc`:

```jsonc
"routes": [{ "pattern": "fokus.tukangdata.com", "custom_domain": true }]
```

Sebaiknya pakai API key Gemini terpisah dari aplikasi lain, supaya kalau kuotanya habis aplikasi
lain tidak ikut berhenti.

## Menambah bahan

- Tempat baru: tambah di `TEMPAT` (`bahan.js`) **dan** gambarnya di `LATAR` (`kolase.js`).
  Deskripsi tempat hanya boleh menyebut hal yang memang digambar.
- Benda baru: tambah di `BENDA` dengan `sifat` (peran di kerangka: `rusak`, `hilang`, `hujan`,
  `dipinjam`, `hewan`, `alat`) dan gambarnya di `BENDA_GAMBAR`.
- Kerangka alur baru: tambah di `KERANGKA`. Tulis langkah alur sebagai rantai sebab-akibat, lalu
  tambahkan sudut soalnya di `PENYEBAB`, `TEBAK`, dan `IDE` (`src/soal.js`), minimal tiga per tipe.
  Tanpa itu kerangka tetap jalan, tapi memakai sudut umum saja.
- Sudut soal baru: tambah di bank yang sesuai di `src/soal.js`. Tulis sebagai perintah untuk Gemini
  ("tanyakan ..."), boleh memakai `{anak}`, `{kedua}`, `{benda}`, `{benda2}`, `{tempat}`, `{sifat}`.

## Catatan desain

Gaya: buku stiker. Bentuknya mengikuti contoh yang dipilih pemilik produk
([uupm.cc educational-platform](https://www.uupm.cc/demo/educational-platform)): kartu putih
bergaris tinta tebal, bayangan keras, sudut membulat, huruf bulat. Dial: tenaga sedang, ritme
seragam (setiap kartu strukturnya sama supaya anak terbiasa), gerak secukupnya.

- **Warna:** latar krem yang tenang (`#FFF7EA`), tinta ungu tua (`#2B2A3A`), dan empat warna krayon
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
- **Bayangan keras:** bukan hiasan. Tombol turun menutup bayangannya saat ditekan, jadi terasa
  seperti tombol sungguhan. Pilihan umur yang terpilih juga tampil "tertekan".
- **Stiker:** tokoh dan benda punya pinggiran putih dan bayangan, latar tidak. Yang belum ditempel
  tampil sebagai garis putus-putus, seperti tempat kosong di buku stiker.
- **Gerak:** hanya dua. Kartu dibalik (cerita tertutup sebelum soal) dan stiker jatuh ke tempatnya
  (hadiah per jawaban). Keduanya mati kalau sistem meminta gerak dikurangi.
- **Tema:** satu tema terang. Krem tidak semenyilaukan putih saat dibacakan malam hari.
- **Kaki halaman:** mengikuti pola side project Tukangdata: "Made With ❤️ By Tukangdata.com".
- **Tanpa gambar AI.** Semua gambar dirakit dari bentuk vektor. Ikon aplikasi belum dibuat.
