# Delivery Gate: Kartu Fokus v1 (2026-11-20)

Design Read: kartu cerita interaktif untuk orang tua dan anak 4 sampai 9 tahun, gaya kolase kertas
di atas karton, dial ENERGY 2 / RHYTHM 1 / MOTION 2. Arah desain dipilih pemilik produk (opsi E revisi).

## Klik satu per satu (lokal, `wrangler dev`, desktop dan 375px)

- Beranda, pilih umur (klik dan panah kiri/kanan): pilihan berubah, tersimpan di localStorage
- Ambil kartu: layar memuat, lalu cerita (2 sampai 12 detik), URL jadi `?kartu=KODE&umur=..`
- Sudah dibaca, balik kartu: animasi balik, cerita tertutup, soal 1 muncul
- Minta petunjuk / Lihat jawaban: panel terbuka dan tertutup, label tombol dan `aria-expanded` berubah
- Tempel potongan x4: potongan muncul di kolase satu per satu, soal berikutnya tampil, lalu layar selesai
- Buka album: kartu yang selesai tampil sebagai polaroid; album kosong menampilkan ajakan dan tombol
- Kartu di album: membuka kolase lengkap; Baca cerita lagi lalu Kembali ke kolase: benar
- Kartu berikutnya: kartu cadangan langsung tampil tanpa menunggu
- Tombol kembali browser: kembali ke kartu sebelumnya
- Galat (fetch disimulasikan putus): pesan "Sepertinya internet sedang putus...", Coba lagi berhasil
- Batal saat memuat: kembali ke beranda
- Console: tidak ada error. Tidak ada overflow horizontal di 375px.

## Block 1: Hard Gate

- R-02 PASS: grep tidak menemukan em dash di `public`, `src`, README; output Gemini dibersihkan di server
- R-03 PASS: 375px tanpa overflow (`scrollWidth == innerWidth`), tombol min 48px
- R-17 PASS: tidak ada statistik
- R-18 PASS: tidak ada testimoni
- R-23 PASS: tidak ada logo atau ikon dibuat; favicon sengaja kosong (`data:,`) sampai diputuskan
- R-24 PASS: satu tautan navigasi (merek ke beranda), tujuannya ada
- R-25 PASS: semua pasangan teks di atas 4.5:1, huruf tempel besar minimal 4.1:1 (batas 3:1)
- R-26 PASS: semua tombol punya aksi, diklik satu per satu (daftar di atas)
- R-27 PASS: memuat (dengan pesan lanjutan setelah 7 detik), galat (sebab dan langkah), album kosong
- R-28 PASS: tidak ada FAQ
- R-32 PASS: Tab, Shift+Tab, Enter, panah di radio; cincin fokus biru 3:1 terhadap karton
- R-33 PASS: tidak ada skrip patch
- R-34 PASS: satu tema, tidak ada toggle
- R-35 PASS: dijalankan dan diklik, lihat daftar di atas
- R-36 PASS: tidak ada klaim; catatan di kaki jujur bahwa cerita dirangkai Gemini
- R-37 PASS: arah desain dari pemilik produk
- R-38 PASS: semua isi dari bank bahan atau Gemini, tidak ada data palsu
- R-39 PASS: tombol `<button>`, navigasi `<a href>`, `cursor: pointer`, label fieldset, `lang="id"`, landmark, satu h1 per layar, SVG punya `role="img"` dan label, hover/active berbeda, reduced motion mematikan animasi, animasi memuat berhenti setelah 7 detik
- R-40 PASS: tidak ada gambar bitmap, tidak ada skrip pihak ketiga; angka kinerja tidak diukur

## Block 2: Purpose-Gate

- R-01 PASS: tidak ada gradien
- R-04 PASS: tidak ada ikon
- R-06 PASS: Ultra (huruf poster yang digunting), Alegreya (teks sastra, nuansa buku cerita)
- R-07 PASS: tekstur hanya serat tepi sobek dan karton, bagian dari motif kolase
- R-08 PASS: tidak ada panah di tombol
- R-09 PASS: tidak ada badge
- R-10 PASS: tidak ada glassmorphism
- R-12 PASS: bayangan hanya di potongan kertas kolase, menandai kertas bertumpuk
- R-13 PASS: tidak ada glow
- R-14 PASS: tidak ada kartu fitur
- R-19 PASS: dua gerak bertujuan (balik kartu, potongan ditempel)
- R-22 PASS: gambar dirakit dari bahan cerita, bukan ilustrasi stok

## Block 3: Liveliness

- Dial dinyatakan: ya (ENERGY 2 / RHYTHM 1 / MOTION 2)
- Hasil konsisten dengan dial: ya, semua kartu satu struktur, gerak hanya dua
- Satu titik fokus per layar: ya (kolase atau pertanyaan)
- Whitespace struktural: ya
- Satu aksen: merah, hanya di label soal dan matahari
- Motif identitas: huruf tempel, tepi sobek, selotip, garis pensil
- Design Read sebelum membangun: ya

## Block 4: Craftsmanship

- C-1 sampai C-5: PASS
- R-05, R-11, R-15, R-16, R-20, R-21, R-29, R-30, R-31: PASS (alasan tiap keputusan ada di README, bagian Catatan desain)
