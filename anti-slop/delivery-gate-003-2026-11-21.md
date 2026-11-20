# Delivery Gate: beranda ringkas, kartu dua sisi (2026-11-21)

Masukan pemilik produk: hero tidak punya nilai jual, bagian kedua terlalu banyak teks, tips
kepanjangan; tidak bisa kembali ke cerita dari soal; animasi balik kartu tidak masuk akal (kartu
dibalik menyamping); "Tempel stiker" tidak jelas; gerak terlalu sedikit.

## Yang berubah

- Hero: judul berisi manfaat ("Cerita 5 menit yang melatih anak menyimak dan berpikir"), satu kalimat
  cara main, empat nilai jual pendek. Tombol "Ambil kartu cerita" terlihat tanpa menggulir di 1280x860
  dan 375x812 (bawah tombol di y=780).
- Bagian kedua: hanya label jenis soal + satu contoh pertanyaan. Tidak ada paragraf penjelasan.
- Bagian tips dihapus. Dua tips yang paling berguna pindah ke catatan di sisi cerita.
- Kartu dua sisi (depan cerita, belakang soal), diputar menyamping 640ms. Bisa intip cerita dari soal.
- "Tempel stiker" jadi "Sudah dijawab, dapat stiker!".
- Gerak baru: stiker jatuh dan memantul, kotak kemajuan pop, soal berganti dari kanan, konfeti saat
  lengkap, layar masuk 280ms.

## Diperiksa

- Putaran kartu: sumbu Y terukur (13°, 124°, 180°) saat panel terlihat. Kurva diganti simetris supaya
  90° tepat di tengah waktu, saat sisi aktif ditukar.
- Alur lewat DOM: balik, intip, balik lagi, jawab x4 (stiker baru, jejak pop, fokus ke h2 tiap soal),
  konfeti 26 potong lalu dihapus, album bertambah, baca lagi dari layar selesai, buka dari album,
  tombol kembali browser.
- Sisi yang tidak aktif `inert`, jadi tidak bisa difokus dengan Tab.
- 375px: `scrollWidth == innerWidth` di beranda, selesai, dan cerita. `main { overflow-x: clip }`
  mencegah gulir samping saat kartu berputar.
- Tidak ada em dash. Console bersih (503 lama dari saat worker dibangun ulang).

## Catatan aturan

- R-19 (gerak): dial MOTION dinaikkan atas permintaan pemilik produk. Tiap gerak punya fungsi:
  orientasi (layar masuk, kartu berputar), umpan balik (stiker, jejak), hadiah (konfeti sekali).
  Semua mati dengan `prefers-reduced-motion`.
- R-17/R-36: "5 menit" adalah perkiraan dari panjang cerita (70 sampai 210 kata) ditambah empat soal,
  bukan hasil pengukuran. "Cerita baru setiap kartu" benar: tiap kode baru ditulis Gemini saat itu.
