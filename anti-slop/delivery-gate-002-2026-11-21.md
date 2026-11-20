# Delivery Gate: Kartu Fokus, tampilan buku stiker (2026-11-21)

Design Read: kartu cerita untuk orang tua dan anak 4 sampai 9 tahun. Arah dari pemilik produk:
"lebih rapi", contoh uupm.cc educational-platform, warna yang menarik untuk anak. Gaya: buku stiker
(kartu putih bergaris tinta tebal, bayangan keras, huruf bulat). Dial ENERGY 2 / RHYTHM 1 / MOTION 2.

## Yang berubah dari 001

- Kolase kertas di atas karton diganti buku stiker di atas krem. Huruf tempel (Ultra) dan Alegreya
  diganti Fredoka + Nunito.
- Layout dua kolom di desktop (gambar kiri menempel saat digulir, kartu kanan), satu kolom di HP.
- Kotak kemajuan 4 soal, berwarna sesuai jenis soal kartu itu.
- Beranda: contoh gambar dengan 2 stiker, lalu penjelasan empat jenis pertanyaan.
- Kaki halaman: "Made With ❤️ By Tukangdata.com".

## Klik satu per satu (lokal, desktop 1280px dan 375px)

- Beranda, pilih umur, Ambil kartu, layar memuat, cerita: benar
- Balik kartu, Minta petunjuk (panel terbuka, label jadi "Tutup petunjuk"), Tempel stiker x4: benar
- Kotak kemajuan mengikuti urutan jenis soal dari server (urutan sekarang diacak per kartu)
- Layar selesai, Buka album, kartu di album, Baca cerita lagi, Kembali ke gambar, tombol kembali
  browser, merek ke beranda: benar
- 375px: `scrollWidth == innerWidth`, tidak ada overflow
- Console: satu 503 tercatat saat worker sedang dibangun ulang oleh perubahan `src/` dari sesi lain;
  permintaan sesudahnya 200

## Hard Gate

- R-02 PASS: tidak ada em dash di `public` dan README
- R-03 PASS: 375px tanpa overflow, tombol min 52px, label umur 54px
- R-17, R-18, R-28 PASS: tidak ada statistik, testimoni, atau FAQ
- R-23 PASS: tidak ada logo atau ikon baru; emoji di kaki halaman diminta pemilik produk
- R-24 PASS: navigasi hanya merek (ke beranda) dan Album, keduanya ada tujuannya
- R-25 PASS: teks utama 13:1, teks kedua `#5A5870` minimal 5.6:1 di krem, kuning muda, hijau muda,
  biru muda; tinta di tombol kuning 9.2:1; tanda ✓ di kotak merah 3.9:1 (teks besar, batas 3:1);
  cincin fokus biru 3.2:1 di krem
- R-26, R-35 PASS: semua tombol diklik (daftar di atas)
- R-27 PASS: memuat, galat, album kosong tetap ada
- R-32 PASS: fokus keyboard pakai cincin biru; judul layar yang difokuskan skrip tidak diberi cincin
- R-36, R-38 PASS: catatan jujur soal Gemini dipindah ke beranda; contoh gambar diberi label "Contoh"
- R-39 PASS: `<button>`, `<a href>`, fieldset untuk umur, `aria-current` di jejak dan tautan Album,
  satu h1 per layar, reduced motion mematikan animasi

## Purpose-Gate

- R-01 PASS: tidak ada gradien
- R-06 PASS: Fredoka dan Nunito, alasan di README
- R-09 PASS: label "Kartu K75C" dan umur adalah data (kode dipakai di tautan), bukan hiasan
- R-11 PASS: tiga radius saja (22px kartu, 14px tombol, penuh untuk label)
- R-12 PASS: bayangan keras = tombol yang bisa ditekan; stiker berbayang, latar tidak
- R-14 PASS: empat kartu jenis soal berisi konten nyata produk, warnanya kunci warna yang dipakai lagi
- R-19 PASS: dua gerak (balik kartu, stiker menempel) + animasi memuat yang berhenti setelah ±7 detik
- R-29 PASS: satu netral (krem/putih/tinta) + empat warna jenis soal, masing-masing punya arti

## Liveliness

- Satu titik fokus per layar: gambar stiker atau pertanyaan
- Motif identitas: stiker berpinggiran putih, slot putus-putus, warna jenis soal
