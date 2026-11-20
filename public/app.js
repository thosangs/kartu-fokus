import { POLA_KODE, URUTAN_POTONGAN, USIA, pilihBahan } from './bahan.js';
import { kolaseSVG, namaPotongan } from './kolase.js';

const layar = document.getElementById('layar');
const umum = document.getElementById('umum');
const tautanAlbum = document.querySelector('.tautan-album');
const BOLEH_GERAK = !matchMedia('(prefers-reduced-motion: reduce)').matches;

// Urutan jenis soal berganti per kartu (lihat rencanaSoal di src/soal.js). Warna tiap jenis dipakai
// konsisten di beranda, label soal, dan jejak kemajuan, supaya anak mengenali jenisnya dari warna.
const JENIS = [
  { tipe: 'ingat', label: 'Ingat-ingat', ket: 'Siapa, di mana, mana yang lebih dulu, atau detail kecil dari cerita.' },
  { tipe: 'penyebab', label: 'Cari penyebab', ket: 'Kenapa sesuatu bisa terjadi di cerita.' },
  { tipe: 'tebak', label: 'Coba tebak', ket: 'Perasaan atau sifat tokoh, ditebak dari petunjuk di cerita.' },
  { tipe: 'ide', label: 'Punya ide?', ket: 'Jalan keluar versi anak sendiri. Semua ide yang masuk akal boleh.' },
];
const LABEL_SOAL = Object.fromEntries(JENIS.map((j) => [j.tipe, j.label]));
const KODE_CONTOH = 'K7Q2';

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
};

const usiaAwal = simpan.baca('kf-usia', '6-7');
const st = {
  usia: USIA[usiaAwal] ? usiaAwal : '6-7',
  kartu: null,
  soalKe: 0,
  terpasang: [],
  ulang: false,
  dariAlbum: false,
  cadangan: null,
  abort: null,
};

const jeda = (ms) => new Promise((r) => setTimeout(r, ms));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const kunciKartu = (k) => `${k.kode}-${k.usia}`;

function umumkan(teks) {
  umum.textContent = '';
  setTimeout(() => (umum.textContent = teks), 50);
}

function tampilkan(html, fokus = 'h1') {
  layar.innerHTML = html;
  window.scrollTo(0, 0);
  const el = layar.querySelector(fokus);
  if (el) {
    el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  }
  if (layar.querySelector('.album')) tautanAlbum.setAttribute('aria-current', 'page');
  else tautanAlbum.removeAttribute('aria-current');
}

function labelKartu(k) {
  return `<p class="label-baris"><span class="label">Kartu ${esc(k.kode)}</span><span class="label">${USIA[k.usia].label}</span></p>`;
}

// Empat kotak kemajuan, satu per soal, berwarna sesuai jenis soal di kartu itu.
function jejak(tipe, selesai, sekarang = -1, label = 'Kemajuan soal') {
  const isi = tipe
    .map((t, i) => {
      const sudah = i < selesai;
      const kini = i === sekarang;
      const status = sudah ? 'sudah dijawab' : kini ? 'sedang dijawab' : 'belum';
      return `<li class="tipe-${t}${sudah ? ' sudah' : ''}"${kini ? ' aria-current="step"' : ''}><span aria-hidden="true">${sudah ? '✓' : i + 1}</span><span class="sr-only">Soal ${i + 1}, ${LABEL_SOAL[t] ?? t}: ${status}</span></li>`;
    })
    .join('');
  return `<ol class="jejak" aria-label="${label}">${isi}</ol>`;
}
const tipeKartu = (k) => k.cerita.soal.map((s) => s.tipe);

// ── Penyimpanan kartu & album ─────────────────────────────────
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

function masukAlbum(k) {
  const album = simpan.baca('kf-album', []);
  if (!album.some((a) => a.kunci === kunciKartu(k))) album.unshift({ kunci: kunciKartu(k), tanggal: new Date().toISOString() });
  simpan.tulis('kf-album', album.slice(0, 60));
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
  st.kartu = d;
  st.soalKe = 0;
  st.terpasang = [];
  st.ulang = false;
  st.dariAlbum = false;
  simpanKartu(d);
  const url = `/?kartu=${d.kode}&umur=${d.usia}`;
  if (dorong && location.pathname + location.search !== url) history.pushState({}, '', url);
  tampilCerita();
}

// ── Layar ─────────────────────────────────────────────────────
function tampilBeranda() {
  st.abort?.abort();
  const pilihan = Object.entries(USIA)
    .map(
      ([nilai, u]) => `<label><input type="radio" name="umur" value="${nilai}"${nilai === st.usia ? ' checked' : ''}>
        <span class="centang" aria-hidden="true">✓</span>${u.label}</label>`,
    )
    .join('');
  const contoh = kolaseSVG(pilihBahan(KODE_CONTOH), { tampil: ['benda', 'kedua'], sketsa: true });
  const jenis = JENIS.map(
    (j) => `<li class="tipe-${j.tipe}"><span class="kunci-warna" aria-hidden="true"></span><h3>${j.label}</h3><p>${j.ket}</p></li>`,
  ).join('');
  tampilkan(`<section class="layar beranda">
    <div class="pembuka">
      <div class="pembuka-teks">
        <h1 class="judul-utama">Dengarkan ceritanya, kumpulkan stikernya</h1>
        <p class="pengantar">Orang tua membacakan satu cerita pendek. Setelah kartu dibalik, anak menjawab empat pertanyaan, dan tiap jawaban menempel satu stiker sampai gambarnya lengkap.</p>
        <fieldset class="pilih-umur"><legend>Umur anak</legend><div class="umur-pilihan">${pilihan}</div></fieldset>
        <div class="aksi"><button class="tombol utama" type="button" data-aksi="ambil">Ambil kartu</button></div>
      </div>
      <figure class="contoh">
        <div class="bingkai">${contoh}</div>
        <figcaption>${jejak(JENIS.map((j) => j.tipe), 2, -1, 'Contoh kemajuan')}<p class="catatan">Contoh: dua stiker sudah ditempel, dua lagi menunggu jawaban.</p></figcaption>
      </figure>
    </div>
    <section class="jenis" aria-labelledby="judul-jenis">
      <h2 id="judul-jenis">Jenis pertanyaannya</h2>
      <p class="pengantar-jenis">Tiap kartu berisi empat pertanyaan dari jenis-jenis ini. Urutannya berganti setiap kartu, jadi anak tidak bisa menebak polanya.</p>
      <ul class="daftar-jenis">${jenis}</ul>
      <p class="catatan">Cerita dan pertanyaan dirangkai Gemini dari bahan yang disusun sendiri, jadi sesekali bisa ada kalimat yang janggal.</p>
    </section>
  </section>`);
}

function tampilMemuat() {
  tampilkan(`<section class="layar memuat" aria-busy="true">
    <div class="kartu kartu-tengah">
      <h1 class="sr-only">Menyiapkan kartu</h1>
      <div class="loncat" aria-hidden="true">${JENIS.map((j) => `<span class="tipe-${j.tipe}"></span>`).join('')}</div>
      <p class="status-muat" role="status" id="status-muat">Sedang menyiapkan cerita baru…</p>
      <div class="aksi tengah"><button class="tombol" type="button" data-aksi="batal">Batal</button></div>
    </div>
  </section>`);
  const status = document.getElementById('status-muat');
  setTimeout(() => {
    if (status.isConnected) status.textContent = 'Masih menyusun ceritanya. Biasanya selesai dalam 15 detik.';
  }, 7000);
}

function tampilGalat(pesan, kode) {
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

function tampilCerita() {
  const k = st.kartu;
  const gambar = st.ulang ? kolaseSVG(k.bahan, { tampil: URUTAN_POTONGAN }) : kolaseSVG(k.bahan);
  tampilkan(`<section class="layar cerita">
    <div class="dua-kolom">
      <div class="kolom-gambar">
        <figure class="bingkai">${gambar}</figure>
        ${labelKartu(k)}
        ${st.ulang ? '' : '<p class="catatan">Untuk orang tua: bacakan sekali dengan pelan. Setelah kartu dibalik, ceritanya tertutup.</p>'}
      </div>
      <article class="kartu kartu-cerita">
        <h1 class="judul-kartu">${esc(k.cerita.judul)}</h1>
        ${k.cerita.paragraf.map((p) => `<p>${esc(p)}</p>`).join('')}
        <div class="aksi">
          ${
            st.ulang
              ? '<button class="tombol utama" type="button" data-aksi="ke-selesai">Kembali ke gambar</button>'
              : '<button class="tombol utama" type="button" data-aksi="balik">Sudah dibaca, balik kartu</button>'
          }
        </div>
      </article>
    </div>
  </section>`);
}

function tampilSoal(baru = null) {
  const k = st.kartu;
  const i = st.soalKe;
  const s = k.cerita.soal[i];
  const adaPetunjuk = s.tipe !== 'ide' && s.bukti;
  tampilkan(
    `<section class="layar soal">
    <div class="dua-kolom">
      <div class="kolom-gambar">
        <figure class="bingkai">${kolaseSVG(k.bahan, { tampil: st.terpasang, sketsa: true, baru })}</figure>
        ${jejak(tipeKartu(k), i, i)}
      </div>
      <div class="kartu kartu-soal tipe-${s.tipe}">
        <h1 class="judul-kecil">${esc(k.cerita.judul)}</h1>
        <p class="chip">Soal ${i + 1} dari 4 · ${LABEL_SOAL[s.tipe]}</p>
        <h2 class="pertanyaan">${esc(s.pertanyaan)}</h2>
        ${s.tipe === 'ide' ? '<p class="bantuan">Semua ide boleh, asal masuk akal.</p>' : ''}
        ${adaPetunjuk ? `<div class="lipatan petunjuk" id="petunjuk" hidden><p class="kecil">Petunjuk dari cerita</p><blockquote>“${esc(s.bukti)}”</blockquote></div>` : ''}
        <div class="lipatan jawaban" id="jawaban" hidden><p class="kecil">${s.tipe === 'ide' ? 'Contoh jawaban' : 'Jawaban'}</p><p>${esc(s.jawaban)}</p></div>
        <div class="aksi">
          ${adaPetunjuk ? '<button class="tombol" type="button" data-aksi="buka" data-target="petunjuk" aria-controls="petunjuk" aria-expanded="false">Minta petunjuk</button>' : ''}
          <button class="tombol" type="button" data-aksi="buka" data-target="jawaban" aria-controls="jawaban" aria-expanded="false">Lihat jawaban</button>
          <button class="tombol utama" type="button" data-aksi="tempel">Tempel stiker</button>
        </div>
      </div>
    </div>
  </section>`,
    baru ? '.pertanyaan' : 'h1',
  );
}

function tampilSelesai(baru = null) {
  const k = st.kartu;
  st.ulang = false;
  tampilkan(`<section class="layar selesai">
    <div class="dua-kolom">
      <div class="kolom-gambar">
        <figure class="bingkai">${kolaseSVG(k.bahan, { tampil: URUTAN_POTONGAN, baru })}</figure>
        ${jejak(tipeKartu(k), 4)}
      </div>
      <div class="kartu kartu-selesai">
        ${st.dariAlbum ? '' : '<p class="sorak">Gambarnya lengkap!</p>'}
        <h1 class="judul-kartu">${esc(k.cerita.judul)}</h1>
        <p class="pesan">${st.dariAlbum ? 'Kartu ini sudah selesai dan tersimpan di album.' : 'Keempat stiker sudah ditempel, dan kartu ini sudah masuk ke album.'}</p>
        ${labelKartu(k)}
        <div class="aksi">
          <button class="tombol utama" type="button" data-aksi="ambil">Kartu berikutnya</button>
          <button class="tombol" type="button" data-aksi="baca-lagi">Baca cerita lagi</button>
          <button class="tombol" type="button" data-aksi="album">Buka album</button>
        </div>
      </div>
    </div>
  </section>`);
}

function tampilAlbum() {
  const semua = semuaKartu();
  const isi = simpan
    .baca('kf-album', [])
    .map((a) => ({ a, k: semua[a.kunci] }))
    .filter((x) => x.k);
  const daftar = isi
    .map(({ a, k }) => {
      const tgl = new Date(a.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      return `<li><button class="kartu-album" type="button" data-aksi="buka-album" data-kunci="${esc(a.kunci)}">
        ${kolaseSVG(k.bahan, { tampil: URUTAN_POTONGAN, hias: false })}
        <span class="judul">${esc(k.cerita.judul)}</span><span class="tgl">${tgl} · ${USIA[k.usia].label}</span></button></li>`;
    })
    .join('');
  tampilkan(`<section class="layar album">
    <div class="kepala-layar">
      <h1>Album stiker</h1>
      ${isi.length ? `<p>${isi.length} kartu sudah selesai. Pilih satu untuk membaca ceritanya lagi.</p>` : ''}
    </div>
    ${
      isi.length
        ? `<ul class="rak">${daftar}</ul>
           <div class="aksi"><button class="tombol utama" type="button" data-aksi="ambil">Ambil kartu baru</button><button class="tombol" type="button" data-aksi="beranda">Kembali ke awal</button></div>`
        : `<div class="kartu kartu-tengah kosong"><p>Albummu masih kosong. Selesaikan satu kartu, nanti gambarnya disimpan di sini.</p>
           <div class="aksi tengah"><button class="tombol utama" type="button" data-aksi="ambil">Ambil kartu</button><button class="tombol" type="button" data-aksi="beranda">Kembali ke awal</button></div></div>`
    }
  </section>`);
}

// ── Aksi ──────────────────────────────────────────────────────
async function balikKartu() {
  const sec = layar.querySelector('.cerita');
  if (BOLEH_GERAK && sec) {
    sec.classList.add('membalik');
    await jeda(320);
  }
  st.soalKe = 0;
  tampilSoal();
  siapkanCadangan();
}

function tempelStiker() {
  const kunci = URUTAN_POTONGAN[st.soalKe];
  st.terpasang.push(kunci);
  st.soalKe++;
  umumkan(`Stiker ${namaPotongan(st.kartu.bahan, kunci)} ditempel.`);
  if (st.soalKe >= 4) {
    masukAlbum(st.kartu);
    tampilSelesai(kunci);
  } else {
    tampilSoal(kunci);
  }
}

function bukaLipatan(tombol) {
  const panel = document.getElementById(tombol.dataset.target);
  if (!panel) return;
  const buka = panel.hidden;
  panel.hidden = !buka;
  tombol.setAttribute('aria-expanded', String(buka));
  const petunjuk = tombol.dataset.target === 'petunjuk';
  tombol.textContent = buka ? (petunjuk ? 'Tutup petunjuk' : 'Tutup jawaban') : petunjuk ? 'Minta petunjuk' : 'Lihat jawaban';
}

function bukaDariAlbum(kunci) {
  const k = semuaKartu()[kunci];
  if (!k) return tampilAlbum();
  st.kartu = k;
  st.terpasang = [...URUTAN_POTONGAN];
  st.dariAlbum = true;
  history.pushState({}, '', `/?kartu=${k.kode}&umur=${k.usia}&album=1`);
  tampilSelesai();
}

document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-aksi]');
  if (!t) return;
  const aksi = t.dataset.aksi;
  if (t.tagName === 'A') e.preventDefault();
  switch (aksi) {
    case 'beranda':
      if (location.search) history.pushState({}, '', '/');
      tampilBeranda();
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
    case 'balik':
      balikKartu();
      break;
    case 'buka':
      bukaLipatan(t);
      break;
    case 'tempel':
      tempelStiker();
      break;
    case 'baca-lagi':
      st.ulang = true;
      tampilCerita();
      break;
    case 'ke-selesai':
      tampilSelesai();
      break;
    case 'album':
      if (location.search !== '?album=1') history.pushState({}, '', '/?album=1');
      tampilAlbum();
      break;
    case 'buka-album':
      bukaDariAlbum(t.dataset.kunci);
      break;
  }
});

document.addEventListener('change', (e) => {
  if (e.target.name !== 'umur') return;
  st.usia = e.target.value;
  simpan.tulis('kf-usia', st.usia);
});

// ── Rute dari URL (muat ulang, tombol kembali, tautan kartu) ──
function rute() {
  const q = new URLSearchParams(location.search);
  const kode = q.get('kartu');
  const umur = q.get('umur');
  if (kode && POLA_KODE.test(kode) && USIA[umur]) {
    st.usia = umur;
    const ada = semuaKartu()[`${kode}-${umur}`];
    if (ada && q.get('album')) {
      st.kartu = ada;
      st.terpasang = [...URUTAN_POTONGAN];
      st.dariAlbum = true;
      return tampilSelesai();
    }
    if (ada) return mulaiKartu(ada, { dorong: false });
    return ambilKartu(kode);
  }
  if (q.has('album')) return tampilAlbum();
  tampilBeranda();
}

window.addEventListener('popstate', rute);
rute();
