import { POLA_KODE, TEMPAT, URUTAN_POTONGAN, USIA, pilihBahan } from './bahan.js';
import { kolaseSVG, namaPotongan } from './kolase.js';
import {
  LENCANA,
  MILESTONE,
  bintangSVG,
  hariBeruntun,
  jumlahBintang,
  lencanaTercapai,
  milestoneBerikutnya,
  tanggalLokal,
} from './piala.js';

const layar = document.getElementById('layar');
const umum = document.getElementById('umum');
const tautanPiala = document.querySelector('.tautan-piala');
const BOLEH_GERAK = !matchMedia('(prefers-reduced-motion: reduce)').matches;

// Urutan jenis soal berganti per kartu (lihat rencanaSoal di src/soal.js). Warna tiap jenis dipakai
// konsisten di beranda, label soal, dan jejak kemajuan, supaya anak mengenali jenisnya dari warna.
const JENIS = [
  { tipe: 'ingat', label: 'Ingat-ingat', contoh: 'Siapa yang datang lebih dulu, Ibu atau Kakek?' },
  { tipe: 'penyebab', label: 'Cari penyebab', contoh: 'Kenapa telurnya bisa retak?' },
  { tipe: 'tebak', label: 'Coba tebak', contoh: 'Bagaimana perasaan Dika waktu bolanya tidak ada?' },
  { tipe: 'ide', label: 'Punya ide?', contoh: 'Kalau kamu jadi Sari, apa yang akan kamu lakukan?' },
];
const LABEL_SOAL = Object.fromEntries(JENIS.map((j) => [j.tipe, j.label]));
const KODE_CONTOH = 'K7Q2';
const DURASI_BALIK = 640;

// localStorage bisa ditolak (mode privat, penyimpanan penuh); aplikasi tetap jalan tanpanya.
const simpan = {
  baca(kunci, awal) {
    try {
      const v = localStorage.getItem(kunci);
      return v ? JSON.parse(v) : awal;
    } catch {
      return awal;
    }
  },
  tulis(kunci, nilai) {
    try {
      localStorage.setItem(kunci, JSON.stringify(nilai));
    } catch {
      /* abaikan */
    }
  },
  hapus(kunci) {
    try {
      localStorage.removeItem(kunci);
    } catch {
      /* abaikan */
    }
  },
};

// Judul tab browser per layar.
const JUDUL_SITUS = 'Kartu Fokus';
const judulTab = (t) => (document.title = t ? `${t} · ${JUDUL_SITUS}` : `${JUDUL_SITUS} · Dongeng dan Tebak-tebakan Seru untuk Anak`);

const usiaAwal = simpan.baca('kf-usia', '6-7');
const st = {
  usia: USIA[usiaAwal] ? usiaAwal : '6-7',
  kartu: null,
  soalKe: 0, // 0..3 = soal yang sedang ditanyakan, 4 = selesai
  mulaiSoal: false, // kartu sudah pernah dibalik ke sisi soal
  sisi: 'depan', // depan = cerita, belakang = soal
  halaman: 0, // halaman cerita (satu paragraf per halaman)
  halamanRak: 0, // halaman rak cerita di Pojok Juara
  terpasang: [],
  dariAlbum: false,
  bantu: { intip: false, petunjuk: false }, // dipakai untuk lencana
  cadangan: null,
  abort: null,
};

const jeda = (ms) => new Promise((r) => setTimeout(r, ms));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const kunciKartu = (k) => `${k.kode}-${k.usia}`;
const tipeKartu = (k) => k.cerita.soal.map((s) => s.tipe);

function umumkan(teks) {
  umum.textContent = '';
  setTimeout(() => (umum.textContent = teks), 50);
}

function fokuskan(el) {
  if (!el) return;
  if (!el.matches('button, a, input')) el.setAttribute('tabindex', '-1');
  el.focus({ preventScroll: true });
}

function tampilkan(html, fokus = 'h1') {
  layar.innerHTML = html;
  window.scrollTo(0, 0);
  fokuskan(layar.querySelector(fokus));
  if (layar.querySelector('.piala')) tautanPiala.setAttribute('aria-current', 'page');
  else tautanPiala.removeAttribute('aria-current');
  perbaruiKepala();
}

function naikKeAtas() {
  const jauh = window.scrollY > 40;
  window.scrollTo({ top: 0, behavior: BOLEH_GERAK ? 'smooth' : 'auto' });
  return jauh && BOLEH_GERAK ? jeda(320) : Promise.resolve();
}

function labelKartu(k) {
  return `<p class="label-baris"><span class="label">Kartu ${esc(k.kode)}</span><span class="label">${USIA[k.usia].label}</span></p>`;
}

// Empat kotak kemajuan, satu per soal, berwarna sesuai jenis soal di kartu itu.
function jejak(tipe, selesai, { sekarang = -1, baru = -1, label = 'Kemajuan soal' } = {}) {
  const isi = tipe
    .map((t, i) => {
      const sudah = i < selesai;
      const kini = i === sekarang;
      const status = sudah ? 'sudah dijawab' : kini ? 'sedang dijawab' : 'belum';
      const kelas = [`tipe-${t}`, sudah && 'sudah', i === baru && 'baru'].filter(Boolean).join(' ');
      return `<li class="${kelas}"${kini ? ' aria-current="step"' : ''}><span aria-hidden="true">${sudah ? '✓' : i + 1}</span><span class="sr-only">Soal ${i + 1}, ${LABEL_SOAL[t] ?? t}: ${status}</span></li>`;
    })
    .join('');
  return `<ol class="jejak" aria-label="${label}">${isi}</ol>`;
}

// ── Penyimpanan (hanya di browser ini, localStorage) ──────────
function semuaKartu() {
  return simpan.baca('kf-kartu', {});
}

function simpanKartu(k) {
  const semua = semuaKartu();
  semua[kunciKartu(k)] = k;
  const diAlbum = new Set(simpan.baca('kf-album', []).map((a) => a.kunci));
  const kunci = Object.keys(semua);
  if (kunci.length > 60) {
    for (const kk of kunci) {
      if (Object.keys(semua).length <= 40) break;
      if (!diAlbum.has(kk) && kk !== kunciKartu(k)) delete semua[kk];
    }
  }
  simpan.tulis('kf-kartu', semua);
}

// Mengembalikan true kalau kartu ini baru pertama kali selesai.
function masukAlbum(k) {
  const album = simpan.baca('kf-album', []);
  if (album.some((a) => a.kunci === kunciKartu(k))) return false;
  album.unshift({ kunci: kunciKartu(k), tanggal: new Date().toISOString() });
  simpan.tulis('kf-album', album.slice(0, 200));
  return true;
}

// Profil si kecil. nama: null = belum ditanya, '' = dilewati.
// Kalau belum ada profil tapi album sudah berisi (versi lama), statistik diisi dari album.
function profil() {
  const p = simpan.baca('kf-profil', null);
  if (p) return p;
  const semua = semuaKartu();
  const album = simpan.baca('kf-album', []);
  return {
    nama: null,
    stat: {
      kartu: album.length,
      sekaliDengar: 0,
      tanpaContekan: 0,
      tempat: [...new Set(album.map((a) => semua[a.kunci]?.bahan.tempat).filter(Boolean))],
      hari: [...new Set(album.map((a) => tanggalLokal(a.tanggal)))],
    },
  };
}
const simpanProfil = (p) => simpan.tulis('kf-profil', p);
const namaAnak = () => profil().nama || '';

function statistik(p = profil()) {
  const s = p.stat;
  const { sekarang, terpanjang } = hariBeruntun(s.hari);
  return {
    kartu: s.kartu,
    stiker: s.kartu * 4,
    sekaliDengar: s.sekaliDengar,
    tanpaContekan: s.tanpaContekan,
    tempat: s.tempat.length,
    beruntun: sekarang,
    beruntunTerpanjang: terpanjang,
  };
}

function catatSelesai(k) {
  const p = profil();
  const s = p.stat;
  s.kartu += 1;
  if (!st.bantu.intip) s.sekaliDengar += 1;
  if (!st.bantu.petunjuk) s.tanpaContekan += 1;
  if (!s.tempat.includes(k.bahan.tempat)) s.tempat.push(k.bahan.tempat);
  const hariIni = tanggalLokal();
  if (!s.hari.includes(hariIni)) s.hari.push(hariIni);
  s.hari = s.hari.slice(-400);
  simpanProfil(p);
}

// ── Ambil kartu dari server ───────────────────────────────────
async function mintaKartu(usia, kode, signal) {
  let res;
  try {
    res = await fetch('/api/kartu', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ usia, kode }),
      signal,
    });
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    throw new Error('Sepertinya internet sedang putus. Periksa koneksi, lalu coba lagi.');
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* respons bukan JSON */
  }
  if (!res.ok || !data?.cerita) throw new Error(data?.pesan || 'Ceritanya belum jadi. Coba lagi sebentar.');
  return data;
}

// Kartu berikutnya disiapkan diam-diam selagi anak menjawab, supaya tidak menunggu lagi.
function siapkanCadangan() {
  if (st.cadangan && st.cadangan.usia === st.usia) return;
  const c = { usia: st.usia, data: null };
  c.janji = mintaKartu(st.usia).then((d) => (c.data = d));
  c.janji.catch(() => {
    if (st.cadangan === c) st.cadangan = null;
  });
  st.cadangan = c;
}

async function ambilKartu(kode) {
  if (!kode && st.cadangan && st.cadangan.usia === st.usia) {
    const c = st.cadangan;
    st.cadangan = null;
    if (c.data) return mulaiKartu(c.data);
    tampilMemuat();
    try {
      return mulaiKartu(await c.janji);
    } catch {
      /* lanjut minta kartu baru */
    }
  }
  if (kode) {
    const ada = semuaKartu()[`${kode}-${st.usia}`];
    if (ada) return mulaiKartu(ada);
  }
  tampilMemuat();
  st.abort?.abort();
  const ac = new AbortController();
  st.abort = ac;
  try {
    const d = await mintaKartu(st.usia, kode, ac.signal);
    if (!ac.signal.aborted) mulaiKartu(d);
  } catch (e) {
    if (!ac.signal.aborted) tampilGalat(e.message, kode);
  }
}

function mulaiKartu(d, { dorong = true } = {}) {
  Object.assign(st, {
    kartu: d,
    soalKe: 0,
    mulaiSoal: false,
    sisi: 'depan',
    halaman: 0,
    terpasang: [],
    dariAlbum: false,
    bantu: { intip: false, petunjuk: false },
  });
  simpanKartu(d);
  const url = `/?kartu=${d.kode}&umur=${d.usia}`;
  if (dorong && location.pathname + location.search !== url) history.pushState({}, '', url);
  tampilMeja();
}

// Tombol Pojok Juara di header sekaligus penanda si kecil: "Nuha ⭐ 2". Satu pintu, bukan dua.
function perbaruiKepala() {
  const nama = namaAnak();
  const bintang = jumlahBintang(statistik().kartu);
  if (!nama && !bintang) {
    tautanPiala.textContent = 'Pojok Juara';
    tautanPiala.removeAttribute('aria-label');
    return;
  }
  tautanPiala.innerHTML = `<span class="sapa-nama">${nama ? esc(nama) : 'Pojok Juara'}</span>
    <span class="sapa-bintang">${bintangSVG({ ukuran: 20 })}${bintang}</span>`;
  tautanPiala.setAttribute('aria-label', `Pojok Juara${nama ? ` ${nama}` : ''}, ${bintang} bintang`);
}

// ── Beranda ───────────────────────────────────────────────────

function tampilBeranda() {
  st.abort?.abort();
  judulTab();
  const pilihan = Object.entries(USIA)
    .map(
      ([nilai, u]) => `<label><input type="radio" name="umur" value="${nilai}"${nilai === st.usia ? ' checked' : ''}>
        <span class="centang" aria-hidden="true">✓</span>${u.label}</label>`,
    )
    .join('');
  const contoh = kolaseSVG(pilihBahan(KODE_CONTOH), { tampil: ['benda', 'kedua'], sketsa: true });
  tampilkan(`<section class="layar beranda">
    <div class="pembuka">
      <div class="pembuka-teks">
        <h1 class="judul-utama">Yuk, dongeng sambil main tebak-tebakan!</h1>
        <p class="pengantar">Bacakan ceritanya, tantang si kecil, kumpulkan stikernya.</p>
        <fieldset class="pilih-umur"><legend>Umur si kecil</legend><div class="umur-pilihan">${pilihan}</div></fieldset>
        <button class="tombol ajak" type="button" data-aksi="mulai">Ayo, mulai dongeng!</button>
        <p class="jaminan">Gratis · Tanpa daftar · Ceritanya selalu baru</p>
      </div>
      <figure class="contoh">
        <div class="bingkai">${contoh}</div>
        <figcaption>${jejak(JENIS.map((j) => j.tipe), 2, { label: 'Contoh kemajuan' })}<p class="catatan">Satu jawaban, satu stiker.</p></figcaption>
      </figure>
    </div>
    <section class="jenis" aria-labelledby="judul-jenis">
      <h2 id="judul-jenis">Empat tantangan di tiap kartu</h2>
      <ul class="daftar-jenis">${JENIS.map(
        (j) => `<li class="tipe-${j.tipe}"><h3><span class="kunci-warna" aria-hidden="true"></span>${j.label}</h3>
          <p class="contoh-soal"><span class="sr-only">Contoh: </span>“${j.contoh}”</p></li>`,
      ).join('')}</ul>
      <p class="jual">Ceritanya selalu baru: ditulis AI dari bahan pilihan, lalu dicek dulu sebelum sampai ke si kecil.</p>
    </section>
  </section>`);
}

// ── Kenalan ───────────────────────────────────────────────────
// lanjut: 'ambil' (dari tombol mulai) atau 'piala' (dari Ganti nama).
function tampilKenalan(lanjut = 'ambil') {
  const nama = namaAnak();
  judulTab('Kenalan dulu');
  tampilkan(
    `<section class="layar kenalan">
    <form class="kartu kartu-tengah" data-form="kenalan" data-lanjut="${lanjut}">
      <h1>${lanjut === 'piala' ? 'Ganti nama si kecil' : 'Kenalan dulu, yuk!'}</h1>
      <p class="pengantar-kenalan">Siapa nama si kecil? Nanti namanya dipanggil di setiap soal.</p>
      <label class="sr-only" for="nama">Nama si kecil</label>
      <input class="isian" id="nama" name="nama" maxlength="20" autocomplete="off" autocapitalize="words" spellcheck="false" placeholder="Misalnya: Raka" value="${esc(nama)}">
      <button class="tombol ajak" type="submit">${lanjut === 'piala' ? 'Simpan' : 'Ayo, mulai dongeng!'}</button>
      <button class="tautan-intip" type="button" data-aksi="lewati-nama" data-lanjut="${lanjut}">${lanjut === 'piala' ? 'Batal' : 'Lewati dulu'}</button>
      <p class="jaminan">Nama hanya disimpan di perangkat ini.</p>
    </form>
  </section>`,
    'input',
  );
}

function rapikanNama(s) {
  const n = String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, 20);
  return n.replace(/(^|\s)\p{Ll}/gu, (h) => h.toUpperCase());
}

function selesaiKenalan(nama, lanjut) {
  const p = profil();
  if (nama !== null) p.nama = nama;
  else if (p.nama === null) p.nama = '';
  simpanProfil(p);
  if (lanjut === 'piala') {
    tampilPiala();
  } else {
    ambilKartu();
  }
}

function tampilMemuat() {
  judulTab('Menyiapkan cerita');
  tampilkan(`<section class="layar memuat" aria-busy="true">
    <div class="kartu kartu-tengah">
      <h1 class="sr-only">Menyiapkan kartu</h1>
      <div class="loncat" aria-hidden="true">${JENIS.map((j) => `<span class="tipe-${j.tipe}"></span>`).join('')}</div>
      <p class="status-muat" role="status" id="status-muat">Sebentar, ceritanya sedang ditulis…</p>
      <div class="aksi tengah"><button class="tombol" type="button" data-aksi="batal">Batal</button></div>
    </div>
  </section>`);
  const status = document.getElementById('status-muat');
  setTimeout(() => {
    if (status.isConnected) status.textContent = 'Masih ditulis. Biasanya selesai dalam 15 detik.';
  }, 7000);
}

function tampilGalat(pesan, kode) {
  judulTab('Kartunya belum jadi');
  tampilkan(`<section class="layar galat">
    <div class="kartu kartu-tengah">
      <h1>Kartunya belum jadi</h1>
      <p>${esc(pesan)}</p>
      <div class="aksi tengah">
        <button class="tombol utama" type="button" data-aksi="coba-lagi" data-kode="${esc(kode ?? '')}">Coba lagi</button>
        <button class="tombol" type="button" data-aksi="beranda">Kembali ke awal</button>
      </div>
    </div>
  </section>`);
}

// ── Meja: satu kartu dua sisi (depan cerita, belakang soal) ──
function gambarMeja(baru = null) {
  return kolaseSVG(st.kartu.bahan, { tampil: st.terpasang, sketsa: st.mulaiSoal && st.soalKe < 4, baru });
}

function jejakMeja(baru = -1) {
  const sekarang = st.mulaiSoal && st.soalKe < 4 ? st.soalKe : -1;
  return jejak(tipeKartu(st.kartu), st.soalKe, { sekarang, baru });
}

// Gambar dan jejak ada di dua tempat: kolom kiri (desktop) dan di dalam kartu (HP). Isi semuanya.
function isiGambarMeja(baru = null) {
  layar.querySelectorAll('.gambar-meja').forEach((el) => (el.innerHTML = gambarMeja(baru)));
}
function isiJejakMeja(baru = -1) {
  layar.querySelectorAll('.jejak-meja').forEach((el) => (el.innerHTML = jejakMeja(baru)));
}

// Cerita dibaca per halaman, satu paragraf per halaman, supaya kartunya tidak memanjang.
function isiDepan({ arah = 0 } = {}) {
  const k = st.kartu;
  const nama = namaAnak();
  const n = k.cerita.paragraf.length;
  const i = Math.min(st.halaman, n - 1);
  const akhir = i === n - 1;
  const labelBalik = !st.mulaiSoal ? 'Sudah dibaca, balik kartu' : st.soalKe >= 4 ? 'Balik kartu' : 'Balik lagi ke soal';
  const masuk = arah > 0 ? ' masuk-kanan' : arah < 0 ? ' masuk-kiri' : '';
  const titik = Array.from({ length: n }, (_, j) => `<span class="${j === i ? 'aktif' : j < i ? 'lewat' : ''}"></span>`).join('');
  return `${nama ? `<p class="untuk">Cerita untuk ${esc(nama)}</p>` : ''}
    <h1 class="judul-kartu">${esc(k.cerita.judul)}</h1>
    ${!st.mulaiSoal && i === 0 ? '<p class="catatan-baca">Bacakan pelan-pelan, dan beri suara yang beda untuk tiap tokoh. Setelah kartu dibalik, ceritanya tertutup.</p>' : ''}
    <div class="halaman-cerita${masuk}" aria-live="polite"><p>${esc(k.cerita.paragraf[i])}</p></div>
    <div class="titik-halaman" role="img" aria-label="Halaman ${i + 1} dari ${n}">${titik}</div>
    <div class="aksi aksi-halaman">
      ${i > 0 ? '<button class="tombol" type="button" data-aksi="halaman-sebelum">Sebelumnya</button>' : ''}
      ${
        akhir
          ? `<button class="tombol utama" type="button" data-aksi="balik">${labelBalik}</button>`
          : '<button class="tombol utama" type="button" data-aksi="halaman-lanjut">Lanjut</button>'
      }
    </div>
    ${st.mulaiSoal && !akhir ? `<button class="tautan-intip" type="button" data-aksi="balik">${labelBalik}</button>` : ''}`;
}

function isiSoal() {
  const i = st.soalKe;
  const s = st.kartu.cerita.soal[i];
  const nama = namaAnak();
  const adaPetunjuk = s.tipe !== 'ide' && s.bukti;
  return `<div class="isi-belakang tipe-${s.tipe}">
    <p class="chip">Soal ${i + 1} dari 4 · ${LABEL_SOAL[s.tipe] ?? s.tipe}</p>
    ${nama ? `<p class="panggil">${esc(nama)},</p>` : ''}
    <h2 class="pertanyaan${nama ? ' dipanggil' : ''}">${esc(s.pertanyaan)}</h2>
    ${s.tipe === 'ide' ? '<p class="bantuan">Tidak ada jawaban yang salah, asal masuk akal. Coba tanyakan balik: kenapa begitu?</p>' : ''}
    ${adaPetunjuk ? `<div class="lipatan petunjuk" id="petunjuk" hidden><p class="kecil">Petunjuk dari cerita</p><blockquote>“${esc(s.bukti)}”</blockquote></div>` : ''}
    <div class="lipatan jawaban" id="jawaban" hidden><p class="kecil">${s.tipe === 'ide' ? 'Contoh jawaban' : 'Jawaban'}</p><p>${esc(s.jawaban)}</p></div>
    <div class="aksi">
      ${adaPetunjuk ? '<button class="tombol" type="button" data-aksi="buka" data-target="petunjuk" aria-controls="petunjuk" aria-expanded="false">Minta petunjuk</button>' : ''}
      <button class="tombol" type="button" data-aksi="buka" data-target="jawaban" aria-controls="jawaban" aria-expanded="false">Lihat jawaban</button>
      <button class="tombol utama" type="button" data-aksi="jawab">Sudah dijawab, dapat stiker!</button>
    </div>
    <button class="tautan-intip" type="button" data-aksi="intip">Intip ceritanya lagi</button>
  </div>`;
}

function menujuBintang() {
  const kartu = statistik().kartu;
  const m = milestoneBerikutnya(kartu);
  if (!m) return `<p class="menuju">Semua gelar sudah jadi milikmu. Legenda!</p>`;
  const ke = MILESTONE.indexOf(m) + 1;
  const dari = ke > 1 ? MILESTONE[ke - 2].kartu : 0;
  const persen = Math.round(((kartu - dari) / (m.kartu - dari)) * 100);
  return `<div class="menuju">
    <p>${bintangSVG({ ukuran: 24, terisi: false })}<span>${m.kartu - kartu} cerita lagi, gelar <b>${esc(m.julukan)}</b> jadi milikmu!</span></p>
    <div class="progres" role="progressbar" aria-label="Menuju gelar ${esc(m.julukan)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${persen}"><span style="width:${persen}%"></span></div>
  </div>`;
}

function isiSelesai() {
  const nama = namaAnak();
  return `<div class="isi-belakang isi-selesai">
    ${st.dariAlbum ? '' : `<p class="sorak">${nama ? `Hebat, ${esc(nama)}!` : 'Gambarnya lengkap!'}</p>`}
    <h2>${st.dariAlbum ? 'Kartu ini sudah selesai' : 'Keempat stiker sudah menempel'}</h2>
    ${st.dariAlbum ? '<p class="pesan">Balik kartunya kalau mau membaca ceritanya lagi.</p>' : menujuBintang()}
    <div class="aksi">
      <button class="tombol utama" type="button" data-aksi="ambil">Kartu berikutnya</button>
      <button class="tombol" type="button" data-aksi="intip">Baca ceritanya lagi</button>
      <button class="tombol" type="button" data-aksi="piala">Pojok Juara</button>
    </div>
  </div>`;
}

const isiBelakang = () => (st.soalKe >= 4 ? isiSelesai() : isiSoal());

function tampilMeja() {
  const belakang = st.sisi === 'belakang';
  judulTab(st.kartu.cerita.judul);
  tampilkan(
    `<section class="layar meja">
    <div class="dua-kolom">
      <div class="kolom-gambar">
        <figure class="bingkai gambar-meja">${gambarMeja()}</figure>
        <div class="jejak-meja">${jejakMeja()}</div>
        ${labelKartu(st.kartu)}
      </div>
      <div class="kartu-flip${belakang ? ' dibalik' : ''}" data-sisi="${st.sisi}">
        <div class="kartu-putar">
          <article class="sisi depan kartu"${belakang ? ' inert' : ''}>
            <figure class="gambar-hp gambar-meja" aria-hidden="true">${gambarMeja()}</figure>
            <div class="wadah-depan">${isiDepan()}</div>
          </article>
          <section class="sisi belakang kartu" aria-label="Sisi soal"${belakang ? '' : ' inert'}>
            <figure class="gambar-hp gambar-meja" aria-hidden="true">${gambarMeja()}</figure>
            <div class="jejak-hp jejak-meja">${jejakMeja()}</div>
            <div class="wadah-belakang">${isiBelakang()}</div>
          </section>
        </div>
      </div>
    </div>
  </section>`,
    belakang ? '.belakang h2' : 'h1',
  );
}

// Ganti halaman cerita: halaman lama keluar ke samping, halaman baru masuk dari sisi lain.
let sedangGanti = false;
async function gantiHalaman(arah) {
  const n = st.kartu.cerita.paragraf.length;
  const tujuan = Math.min(Math.max(st.halaman + arah, 0), n - 1);
  const depan = layar.querySelector('.wadah-depan');
  if (!depan || tujuan === st.halaman || sedangGanti || st.sisi !== 'depan') return;
  sedangGanti = true;
  const lama = depan.querySelector('.halaman-cerita');
  if (BOLEH_GERAK && lama) {
    lama.classList.add(arah > 0 ? 'keluar-kiri' : 'keluar-kanan');
    await jeda(170);
  }
  st.halaman = tujuan;
  depan.innerHTML = isiDepan({ arah });
  fokuskan(depan.querySelector(arah > 0 ? '[data-aksi="halaman-lanjut"], .aksi-halaman [data-aksi="balik"]' : '[data-aksi="halaman-sebelum"], [data-aksi="halaman-lanjut"]'));
  // Di HP kartu ada di bawah gambar: geser supaya awal paragraf dan tombolnya kelihatan.
  // Gulirnya langsung (bukan halus): gulir halus sering terpotong di tengah oleh animasi halaman masuk.
  const teks = depan.querySelector('.halaman-cerita').getBoundingClientRect();
  const tombol = depan.querySelector('.aksi-halaman').getBoundingClientRect();
  if (teks.top < 0 || tombol.bottom > window.innerHeight) {
    window.scrollTo({ top: window.scrollY + teks.top - 16, behavior: 'instant' });
  }
  sedangGanti = false;
}

// Kartu diputar menyamping seperti kartu sungguhan. Di tengah putaran (kartu tegak lurus, tidak
// kelihatan) sisi yang aktif ditukar, jadi tinggi kartu ikut menyesuaikan tanpa terlihat melompat.
let sedangBalik = false;
async function balikKartu(ke) {
  const flip = layar.querySelector('.kartu-flip');
  if (!flip || sedangBalik || st.sisi === ke) return;
  sedangBalik = true;
  const depan = flip.querySelector('.depan');
  const belakang = flip.querySelector('.belakang');
  const aktif = ke === 'belakang' ? belakang : depan;
  const pasif = ke === 'belakang' ? depan : belakang;
  st.sisi = ke;
  pasif.inert = true;
  flip.classList.toggle('dibalik', ke === 'belakang');
  if (BOLEH_GERAK) await jeda(DURASI_BALIK / 2);
  flip.dataset.sisi = ke;
  if (BOLEH_GERAK) await jeda(DURASI_BALIK / 2);
  aktif.inert = false;
  if (ke === 'belakang') pasif.querySelector('.wadah-depan').innerHTML = isiDepan();
  else pasif.querySelector('.wadah-belakang').innerHTML = isiBelakang();
  sedangBalik = false;
  await naikKeAtas();
  fokuskan(aktif.querySelector(ke === 'belakang' ? 'h2' : 'h1'));
}

async function mulaiSoal() {
  if (!st.mulaiSoal) {
    st.mulaiSoal = true;
    isiGambarMeja();
    isiJejakMeja();
    siapkanCadangan();
  }
  await balikKartu('belakang');
}

function intipCerita() {
  if (st.mulaiSoal && st.soalKe < 4) st.bantu.intip = true;
  st.halaman = 0;
  const depan = layar.querySelector('.wadah-depan');
  if (depan) depan.innerHTML = isiDepan();
  balikKartu('depan');
}

// Anak sudah menjawab: stiker jatuh ke gambar, kotak kemajuan terisi, soal berikutnya masuk.
let sedangJawab = false;
async function jawab() {
  if (sedangJawab) return;
  sedangJawab = true;
  const kunci = URUTAN_POTONGAN[st.soalKe];
  await naikKeAtas();
  st.terpasang.push(kunci);
  st.soalKe++;
  umumkan(`Stiker ${namaPotongan(st.kartu.bahan, kunci)} menempel.`);
  isiGambarMeja(kunci);
  isiJejakMeja(st.soalKe - 1);
  let hadiah = null;
  if (st.soalKe >= 4) {
    const sebelum = statistik();
    if (masukAlbum(st.kartu)) {
      catatSelesai(st.kartu);
      hadiah = hadiahBaru(sebelum, statistik());
      perbaruiKepala();
    }
    rayakan();
  }
  const wadah = layar.querySelector('.wadah-belakang');
  const lama = wadah.querySelector('.isi-belakang');
  if (BOLEH_GERAK && lama) {
    lama.classList.add('keluar');
    await jeda(200);
  }
  wadah.innerHTML = isiBelakang();
  if (BOLEH_GERAK) wadah.querySelector('.isi-belakang').classList.add('masuk');
  layar.querySelector('.wadah-depan').innerHTML = isiDepan();
  fokuskan(wadah.querySelector('h2'));
  sedangJawab = false;
  if (hadiah) setTimeout(() => tampilHadiah(hadiah), BOLEH_GERAK ? 1300 : 0);
}

// Konfeti dari potongan warna jenis soal, sekali saja saat gambar lengkap.
function rayakan() {
  if (!BOLEH_GERAK) return;
  const kolom = [...layar.querySelectorAll('.kolom-gambar, .sisi.belakang')].find((el) => el.offsetParent !== null);
  if (!kolom) return;
  const wadah = document.createElement('div');
  wadah.className = 'konfeti';
  wadah.setAttribute('aria-hidden', 'true');
  const warna = ['biru', 'merah', 'kuning', 'hijau'];
  for (let i = 0; i < 26; i++) {
    const s = document.createElement('span');
    const sudut = (i / 26) * Math.PI * 2 + Math.random() * 0.4;
    const jarak = 90 + Math.random() * 110;
    s.style.setProperty('--x', `${Math.round(Math.cos(sudut) * jarak)}px`);
    s.style.setProperty('--y', `${Math.round(Math.sin(sudut) * jarak * 0.8 - 40)}px`);
    s.style.setProperty('--r', `${Math.round(Math.random() * 360 - 180)}deg`);
    s.style.background = `var(--${warna[i % 4]})`;
    s.style.animationDelay = `${Math.round(Math.random() * 90)}ms`;
    wadah.append(s);
  }
  kolom.append(wadah);
  setTimeout(() => wadah.remove(), 1600);
}

// ── Hadiah: bintang dan lencana baru ──────────────────────────
function hadiahBaru(sebelum, sesudah) {
  const bintangLama = jumlahBintang(sebelum.kartu);
  const bintangBaru = jumlahBintang(sesudah.kartu);
  const punya = new Set(lencanaTercapai(sebelum));
  const lencana = LENCANA.filter((l) => l.cek(sesudah) && !punya.has(l.id));
  if (bintangBaru === bintangLama && !lencana.length) return null;
  return { bintang: bintangBaru > bintangLama ? bintangBaru : 0, lencana, kartu: sesudah.kartu };
}

function tampilHadiah({ bintang, lencana, kartu }) {
  const nama = namaAnak();
  const m = bintang ? MILESTONE[bintang - 1] : null;
  const bonus = m ? lencana : lencana.slice(1);
  const d = document.createElement('dialog');
  d.className = 'dialog-hadiah';
  d.setAttribute('aria-labelledby', 'judul-hadiah');
  d.innerHTML = `${
    m
      ? `<div class="hadiah-bintang">${bintangSVG({ ukuran: 120, angka: bintang })}</div>
         <p class="label-hadiah">Gelar baru!</p>
         <h2 id="judul-hadiah">${esc(m.julukan)}</h2>
         <p>Selamat${nama ? `, ${esc(nama)}` : ''}! ${kartu} cerita sudah kamu tamatkan.</p>`
      : `<p class="label-hadiah">Tantangan berhasil!</p><h2 id="judul-hadiah">${esc(lencana[0].nama)}</h2><p>${esc(lencana[0].berhasil)}</p>`
  }
    ${bonus.length ? `<p class="lencana-ikut">Bonus tantangan: ${bonus.map((l) => `<b>${esc(l.nama)}</b>`).join(', ')}</p>` : ''}
    <div class="aksi tengah">
      <button class="tombol ajak" type="button" data-aksi="piala">Lihat Pojok Juara</button>
      <button class="tautan-intip" type="button" data-aksi="tutup-dialog">Lanjut main</button>
    </div>`;
  document.body.append(d);
  d.addEventListener('close', () => d.remove());
  d.showModal();
  umumkan(m ? `Gelar baru: ${m.julukan}.` : `Tantangan berhasil: ${lencana[0].nama}.`);
}

// ── Pojok Juara (Hall of Fame) ────────────────────────────────
const PER_HALAMAN_RAK = 12;

function koleksiCerita() {
  const semua = semuaKartu();
  return simpan
    .baca('kf-album', [])
    .map((a) => ({ a, k: semua[a.kunci] }))
    .filter((x) => x.k);
}

// Rak cerita yang sudah tamat: kartu kecil, 12 per halaman.
function isiRak({ arah = 0 } = {}) {
  const koleksi = koleksiCerita();
  if (!koleksi.length) {
    return `<h2 id="judul-rak">Rak Cerita</h2>
      <p class="kosong-teks">Raknya masih kosong. Tamatkan satu cerita, gambarnya langsung dipajang di sini.</p>`;
  }
  const total = Math.ceil(koleksi.length / PER_HALAMAN_RAK);
  st.halamanRak = Math.min(Math.max(st.halamanRak, 0), total - 1);
  const awal = st.halamanRak * PER_HALAMAN_RAK;
  const isi = koleksi
    .slice(awal, awal + PER_HALAMAN_RAK)
    .map(({ a, k }) => {
      const tgl = new Date(a.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      return `<li><button class="kartu-album kecil" type="button" data-aksi="buka-album" data-kunci="${esc(a.kunci)}">
        ${kolaseSVG(k.bahan, { tampil: URUTAN_POTONGAN, hias: false })}
        <span class="judul">${esc(k.cerita.judul)}</span><span class="tgl">${tgl}</span></button></li>`;
    })
    .join('');
  const masuk = arah > 0 ? ' masuk' : arah < 0 ? ' masuk-kiri' : '';
  return `<div class="kepala-rak">
      <h2 id="judul-rak">Rak Cerita</h2>
      <p>${koleksi.length} cerita tamat. Ketuk untuk baca lagi.</p>
    </div>
    <ul class="rak rak-kecil${masuk}">${isi}</ul>
    ${
      total > 1
        ? `<nav class="paginasi" aria-label="Halaman rak cerita">
        <button class="tombol" type="button" data-aksi="rak-sebelum"${st.halamanRak === 0 ? ' disabled' : ''}>Sebelumnya</button>
        <span aria-live="polite">${st.halamanRak + 1} / ${total}</span>
        <button class="tombol" type="button" data-aksi="rak-berikut"${st.halamanRak === total - 1 ? ' disabled' : ''}>Berikutnya</button>
      </nav>`
        : ''
    }`;
}

function gantiHalamanRak(arah) {
  const wadah = document.getElementById('rak-cerita');
  if (!wadah) return;
  st.halamanRak += arah;
  wadah.innerHTML = isiRak({ arah });
  const tujuan = wadah.querySelector(`[data-aksi="${arah > 0 ? 'rak-berikut' : 'rak-sebelum'}"]:not([disabled])`);
  fokuskan(tujuan ?? wadah.querySelector('.paginasi button:not([disabled])'));
}

function tampilPiala() {
  const nama = namaAnak();
  judulTab(`Pojok Juara${nama ? ` ${nama}` : ''}`);
  const stat = statistik();
  const punya = jumlahBintang(stat.kartu);
  const gelar = punya ? MILESTONE[punya - 1] : null;
  const lencanaPunya = new Set(lencanaTercapai(stat));
  st.halamanRak = 0;

  const bintang = MILESTONE.map((m, i) => {
    const dapat = i < punya;
    return `<li class="${dapat ? 'dapat' : 'terkunci'}">
      ${bintangSVG({ ukuran: 56, terisi: dapat, angka: i + 1 })}
      <span class="julukan">${esc(m.julukan)}</span>
      <span class="syarat">${dapat ? 'Punya!' : `${m.kartu} cerita`}</span></li>`;
  }).join('');

  const angka = [
    { nilai: stat.kartu, label: 'cerita tamat' },
    { nilai: stat.stiker, label: 'stiker ditempel' },
    { nilai: stat.beruntun, label: 'hari tanpa bolos' },
    { nilai: `${stat.tempat}/${Object.keys(TEMPAT).length}`, label: 'tempat dijelajah' },
  ]
    .map((a) => `<li><b>${a.nilai}</b><span>${a.label}</span></li>`)
    .join('');

  const lencana = LENCANA.map((l) => {
    const dapat = lencanaPunya.has(l.id);
    return `<li class="${dapat ? 'dapat' : 'terkunci'} warna-${l.warna}">
      <span class="medali" aria-hidden="true">${dapat ? '✓' : '?'}</span>
      <span><b>${esc(l.nama)}</b><span class="syarat">${dapat ? 'Berhasil!' : esc(l.ajak)}</span></span></li>`;
  }).join('');

  tampilkan(`<section class="layar piala">
    <div class="kepala-piala">
      <h1>Pojok Juara${nama ? ` ${esc(nama)}` : ''}</h1>
      <div class="aksi-profil">
        <button class="tautan-intip" type="button" data-aksi="ganti-nama">${nama ? 'Ganti nama' : 'Isi nama si kecil'}</button>
        <button class="tautan-intip tautan-bahaya" type="button" data-aksi="reset">Reset profil</button>
      </div>
    </div>

    <section class="kartu panel-gelar" aria-labelledby="judul-gelar">
      <div class="gelar">
        ${bintangSVG({ ukuran: 92, terisi: Boolean(gelar), angka: punya || null, kelas: 'bintang-gelar' })}
        <div class="gelar-teks">
          <p class="label-gelar">${gelar ? 'Gelarmu sekarang' : 'Belum punya gelar'}</p>
          <h2 id="judul-gelar">${gelar ? esc(gelar.julukan) : 'Ayo, kejar bintang pertama!'}</h2>
          ${menujuBintang()}
        </div>
      </div>
      <ol class="daftar-bintang" aria-label="Semua gelar">${bintang}</ol>
    </section>

    <ul class="statistik" aria-label="Catatan ${nama ? esc(nama) : 'si kecil'}">${angka}</ul>

    <section class="panel-lencana" aria-labelledby="judul-lencana">
      <div class="kepala-rak">
        <h2 id="judul-lencana">Tantangan</h2>
        <p>${lencanaPunya.size} dari ${LENCANA.length} berhasil</p>
      </div>
      <ul class="daftar-lencana">${lencana}</ul>
    </section>

    <section class="panel-koleksi" id="rak-cerita" aria-labelledby="judul-rak">${isiRak()}</section>

    <button class="tombol ajak tombol-akhir" type="button" data-aksi="mulai">Ayo, dongeng lagi!</button>
  </section>`);
}

function bukaSelesai(k) {
  Object.assign(st, {
    kartu: k,
    soalKe: 4,
    mulaiSoal: true,
    sisi: 'belakang',
    halaman: 0,
    terpasang: [...URUTAN_POTONGAN],
    dariAlbum: true,
  });
  tampilMeja();
}

function bukaDariAlbum(kunci) {
  const k = semuaKartu()[kunci];
  if (!k) return tampilPiala();
  history.pushState({}, '', `/?kartu=${k.kode}&umur=${k.usia}&album=1`);
  bukaSelesai(k);
}

function bukaLipatan(tombol) {
  const panel = document.getElementById(tombol.dataset.target);
  if (!panel) return;
  const buka = panel.hidden;
  panel.hidden = !buka;
  tombol.setAttribute('aria-expanded', String(buka));
  const petunjuk = tombol.dataset.target === 'petunjuk';
  if (petunjuk && buka) st.bantu.petunjuk = true;
  tombol.textContent = buka ? (petunjuk ? 'Tutup petunjuk' : 'Tutup jawaban') : petunjuk ? 'Minta petunjuk' : 'Lihat jawaban';
}

// Reset: hapus nama, bintang, tantangan, dan rak cerita dari perangkat ini. Selalu dikonfirmasi dulu,
// dan fokus awal ada di "Batal" supaya tidak terhapus karena salah pencet.
function tanyaReset() {
  const nama = namaAnak();
  const d = document.createElement('dialog');
  d.className = 'dialog-hadiah dialog-reset';
  d.setAttribute('aria-labelledby', 'judul-reset');
  d.innerHTML = `<h2 id="judul-reset">Mulai dari nol?</h2>
    <p>Nama${nama ? ` ${esc(nama)}` : ''}, semua bintang, tantangan, dan rak cerita akan dihapus dari perangkat ini. Tidak bisa dikembalikan.</p>
    <div class="aksi tengah">
      <button class="tombol bahaya" type="button" data-aksi="reset-ya">Ya, hapus semua</button>
      <button class="tautan-intip" type="button" data-aksi="tutup-dialog" autofocus>Batal</button>
    </div>`;
  document.body.append(d);
  d.addEventListener('close', () => d.remove());
  d.showModal();
}

function resetProfil() {
  for (const k of ['kf-profil', 'kf-album', 'kf-kartu']) simpan.hapus(k);
  simpanProfil(profil());
  Object.assign(st, { kartu: null, soalKe: 0, mulaiSoal: false, sisi: 'depan', halaman: 0, halamanRak: 0, terpasang: [], dariAlbum: false });
  history.pushState({}, '', '/');
  tampilBeranda();
  umumkan('Profil sudah direset. Selamat mulai dari awal!');
}

function keHalamanPiala() {
  if (location.search !== '?piala=1') history.pushState({}, '', '/?piala=1');
  tampilPiala();
}

document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-aksi]');
  if (!t) return;
  const aksi = t.dataset.aksi;
  if (t.tagName === 'A') e.preventDefault();
  t.closest('dialog')?.close();
  switch (aksi) {
    case 'beranda':
      if (location.search) history.pushState({}, '', '/');
      tampilBeranda();
      break;
    case 'mulai':
      if (profil().nama === null) tampilKenalan('ambil');
      else ambilKartu();
      break;
    case 'ambil':
      ambilKartu();
      break;
    case 'coba-lagi':
      ambilKartu(t.dataset.kode || undefined);
      break;
    case 'batal':
      st.abort?.abort();
      tampilBeranda();
      break;
    case 'lewati-nama':
      selesaiKenalan(null, t.dataset.lanjut);
      break;
    case 'reset':
      tanyaReset();
      break;
    case 'reset-ya':
      resetProfil();
      break;
    case 'ganti-nama':
      tampilKenalan('piala');
      break;
    case 'halaman-lanjut':
      gantiHalaman(1);
      break;
    case 'halaman-sebelum':
      gantiHalaman(-1);
      break;
    case 'balik':
      if (st.sisi === 'depan') mulaiSoal();
      break;
    case 'intip':
      intipCerita();
      break;
    case 'buka':
      bukaLipatan(t);
      break;
    case 'jawab':
      jawab();
      break;
    case 'piala':
      keHalamanPiala();
      break;
    case 'rak-sebelum':
      gantiHalamanRak(-1);
      break;
    case 'rak-berikut':
      gantiHalamanRak(1);
      break;
    case 'buka-album':
      bukaDariAlbum(t.dataset.kunci);
      break;
  }
});

document.addEventListener('submit', (e) => {
  const form = e.target.closest('[data-form="kenalan"]');
  if (!form) return;
  e.preventDefault();
  const nama = rapikanNama(form.elements.nama.value);
  selesaiKenalan(nama || null, form.dataset.lanjut);
});

document.addEventListener('change', (e) => {
  if (e.target.name !== 'umur') return;
  st.usia = e.target.value;
  simpan.tulis('kf-usia', st.usia);
});

// Panah kiri/kanan untuk membalik halaman cerita.
document.addEventListener('keydown', (e) => {
  if (st.sisi !== 'depan' || !layar.querySelector('.meja') || document.querySelector('dialog[open]')) return;
  if (e.target instanceof Element && e.target.matches('input, textarea, select')) return;
  if (e.key === 'ArrowRight') gantiHalaman(1);
  if (e.key === 'ArrowLeft') gantiHalaman(-1);
});

// ── Rute dari URL (muat ulang, tombol kembali, tautan kartu) ──
function rute() {
  const q = new URLSearchParams(location.search);
  const kode = q.get('kartu');
  const umur = q.get('umur');
  if (kode && POLA_KODE.test(kode) && USIA[umur]) {
    st.usia = umur;
    const ada = semuaKartu()[`${kode}-${umur}`];
    if (ada && q.get('album')) return bukaSelesai(ada);
    if (ada) return mulaiKartu(ada, { dorong: false });
    return ambilKartu(kode);
  }
  if (q.has('piala') || q.has('album')) return tampilPiala();
  tampilBeranda();
}

// ── Langit latar ──────────────────────────────────────────────
// Awan, bintang, dan titik warna ditebar acak tiap halaman dibuka. Supaya acaknya tetap rata (tidak
// menumpuk di satu sudut), layar dibagi petak dan tiap petak dapat satu benda dengan posisi acak.
const BENTUK_AWAN = [
  'M10 46a12 12 0 0 1 8-18a17 17 0 0 1 32-4a13 13 0 0 1 18 12a9 9 0 0 1-2 10z',
  'M6 44a10 10 0 0 1 10-14a14 14 0 0 1 24-8a16 16 0 0 1 28 6a10 10 0 0 1 6 16z',
  'M8 44a9 9 0 0 1 6-14a12 12 0 0 1 22-6a10 10 0 0 1 16 4a8 8 0 0 1 10 8a7 7 0 0 1 0 8z',
];
const WARNA_TITIK = ['#FFE07A', '#FFD0CA', '#C4F0BA', '#FFD7A8'];

function lukisLangit() {
  const acak = (a, b) => a + Math.random() * (b - a);
  const petak = (kolom, baris, isi) => {
    let out = '';
    for (let b = 0; b < baris; b++) {
      for (let k = 0; k < kolom; k++) {
        const x = ((k + acak(0.05, 0.85)) / kolom) * 100;
        const y = ((b + acak(0.05, 0.85)) / baris) * 100;
        out += isi(x.toFixed(1), y.toFixed(1));
      }
    }
    return out;
  };
  // Awan berjalan melintasi layar dari kiri ke kanan, seperti tertiup angin. Tiap awan dapat satu
  // lajur tinggi. Awan besar terasa lebih dekat: lebih cepat dan sedikit lebih jelas.
  // Delay negatif acak membuat awan sudah tersebar di layar sejak halaman dibuka.
  const JUMLAH_AWAN = 9;
  const awan = Array.from({ length: JUMLAH_AWAN }, (_, i) => {
    const lebar = Math.round(acak(80, 230));
    const dekat = (lebar - 80) / 150;
    const y = ((i + acak(0.05, 0.85)) / JUMLAH_AWAN) * 100;
    const durasi = Math.round(125 - dekat * 55 + acak(-8, 8));
    return `<svg class="awan-latar" viewBox="0 0 80 50" width="${lebar}" style="top:calc(${y.toFixed(1)}% - 30px);--x:${acak(-5, 95).toFixed(1)}vw;opacity:${(0.22 + dekat * 0.2).toFixed(2)};animation-duration:${durasi}s;animation-delay:-${Math.round(acak(0, durasi))}s"><path d="${BENTUK_AWAN[Math.floor(Math.random() * BENTUK_AWAN.length)]}" fill="#fff"/></svg>`;
  }).join('');
  let n = 0;
  const titik = petak(5, 4, (x, y) => {
    const lempar = Math.random();
    if (lempar < 0.3) return '';
    if (lempar < 0.5) {
      return `<svg class="bintang-latar" viewBox="0 0 24 24" width="${Math.round(acak(14, 22))}" style="left:${x}%;top:${y}%;opacity:${acak(0.35, 0.6).toFixed(2)};transform:rotate(${Math.round(acak(-20, 20))}deg)"><polygon points="12,1 14.6,8.4 22.5,8.6 16.2,13.4 18.5,21 12,16.5 5.5,21 7.8,13.4 1.5,8.6 9.4,8.4" fill="#FFE07A"/></svg>`;
    }
    const r = Math.round(acak(3, 7));
    return `<span class="titik-latar" style="left:${x}%;top:${y}%;width:${r * 2}px;height:${r * 2}px;background:${WARNA_TITIK[n++ % WARNA_TITIK.length]};opacity:${acak(0.3, 0.55).toFixed(2)}"></span>`;
  });
  const lapisan = document.createElement('div');
  lapisan.className = 'langit-latar';
  lapisan.setAttribute('aria-hidden', 'true');
  lapisan.innerHTML = awan + titik;
  document.body.prepend(lapisan);
}

lukisLangit();

// Simpan profil sekali di awal (termasuk hasil pindahan dari album lama), supaya kartu yang baru
// selesai tidak terhitung dua kali.
if (!simpan.baca('kf-profil', null)) simpanProfil(profil());

window.addEventListener('popstate', rute);
rute();
