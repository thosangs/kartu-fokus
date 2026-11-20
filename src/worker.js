import { POLA_KODE, USIA, buatKode, pilihBahan } from '../public/bahan.js';
import { SKEMA, buatPrompt } from './prompt.js';
import { detailKartu, rencanaSoal } from './soal.js';

// Urutan model: kalau satu sedang penuh (503/429), coba berikutnya.
// Flash-lite dipilih karena cerita pendek tidak butuh penalaran berat dan selesai dalam ±7 detik.
const MODEL_BAWAAN = 'gemini-3.1-flash-lite,gemini-3.5-flash-lite,gemini-2.5-flash';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/kartu') {
      if (request.method !== 'POST') return json({ pesan: 'Pakai POST.' }, 405);
      return buatKartu(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

async function buatKartu(request, env) {
  if (Number(request.headers.get('content-length') ?? 0) > 500) return json({ pesan: 'Permintaan terlalu besar.' }, 413);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ pesan: 'Format permintaan salah.' }, 400);
  }
  const usia = body?.usia;
  if (!USIA[usia]) return json({ pesan: 'Umur tidak dikenal.' }, 400);
  const kode = typeof body.kode === 'string' && POLA_KODE.test(body.kode) ? body.kode : buatKode();

  // Endpoint ini hanya menerima umur dan kode, bukan prompt bebas, jadi tidak bisa
  // dipakai orang lain sebagai jalan pintas ke Gemini. Batas per IP mencegah kuota habis.
  if (env.RL) {
    const ip = request.headers.get('cf-connecting-ip') ?? 'lokal';
    const { success } = await env.RL.limit({ key: ip });
    if (!success) return json({ pesan: 'Terlalu banyak kartu dalam semenit. Tunggu sebentar, lalu coba lagi.' }, 429);
  }

  if (!env.GEMINI_API_KEY) return json({ pesan: 'GEMINI_API_KEY belum diatur di server.' }, 500);

  const bahan = pilihBahan(kode);
  const prompt = buatPrompt(bahan, usia);

  let terbaik = null;
  for (let percobaan = 0; percobaan < 2; percobaan++) {
    let cerita;
    try {
      cerita = await panggilGemini(prompt, env);
    } catch (e) {
      console.error('gemini gagal', kode, String(e));
      continue;
    }
    const hasil = periksa(cerita, bahan, usia);
    if (!terbaik || hasil.masalah.length < terbaik.masalah.length) terbaik = hasil;
    if (hasil.masalah.length === 0) break;
    console.warn('cerita kurang pas, coba lagi', kode, hasil.masalah);
  }

  if (!terbaik || terbaik.fatal) {
    return json({ pesan: 'Ceritanya belum jadi karena server cerita sedang ramai. Coba lagi sebentar, ya.' }, 502);
  }
  if (terbaik.masalah.length) console.warn('dipakai dengan catatan', kode, terbaik.masalah);

  return json({ kode, usia, bahan, cerita: terbaik.cerita });
}

function setelanBerpikir(model) {
  if (model.startsWith('gemini-2.5')) return { thinkingBudget: 0 };
  if (model.includes('lite')) return { thinkingLevel: 'minimal' };
  return { thinkingLevel: 'low' };
}

async function panggilGemini(prompt, env) {
  const daftar = (env.GEMINI_MODEL || MODEL_BAWAAN).split(',').map((m) => m.trim()).filter(Boolean);
  let galat;
  for (const model of daftar) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;
    let res;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        signal: AbortSignal.timeout(30000),
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: SKEMA,
            temperature: 1,
            thinkingConfig: setelanBerpikir(model),
          },
        }),
      });
    } catch (e) {
      galat = new Error(`${model}: ${e.name}`);
      continue;
    }
    if (res.status === 503 || res.status === 429 || res.status === 500) {
      galat = new Error(`${model}: ${res.status}`);
      continue;
    }
    if (!res.ok) throw new Error(`${model} ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = await res.json();
    const teks = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('');
    if (!teks) throw new Error(`${model}: tidak ada teks`);
    return JSON.parse(teks);
  }
  throw galat ?? new Error('tidak ada model');
}

const rapikan = (s) =>
  String(s ?? '')
    .replace(/\s*\u2014\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();

const normal = (s) => rapikan(s).toLowerCase().replace(/[^\p{L}\p{N} ]/gu, '');

function kalimat(paragraf) {
  return paragraf.flatMap((p) => p.match(/[^.!?]+[.!?]+["”']?|[^.!?]+$/g) ?? []).map((k) => k.trim()).filter(Boolean);
}

// Cocokkan bukti dengan kalimat cerita. Kalau Gemini sedikit mengubah kalimatnya,
// ganti dengan kalimat cerita yang kata-katanya paling banyak sama.
function perbaikiBukti(bukti, daftarKalimat) {
  const nb = normal(bukti);
  if (!nb) return { bukti: '', cocok: false };
  const persis = daftarKalimat.find((k) => normal(k) === nb || normal(k).includes(nb));
  if (persis) return { bukti: persis, cocok: true };
  const kata = new Set(nb.split(' '));
  let skor = 0;
  let pilih = '';
  for (const k of daftarKalimat) {
    const kk = normal(k).split(' ');
    const sama = kk.filter((w) => kata.has(w)).length / Math.max(kata.size, 1);
    if (sama > skor) {
      skor = sama;
      pilih = k;
    }
  }
  return skor >= 0.5 ? { bukti: pilih, cocok: true } : { bukti: '', cocok: false };
}

function periksa(mentah, bahan, usia) {
  const masalah = [];
  const paragraf = Array.isArray(mentah?.paragraf) ? mentah.paragraf.map(rapikan).filter(Boolean) : [];
  const soalMentah = Array.isArray(mentah?.soal) ? mentah.soal : [];
  if (!paragraf.length || soalMentah.length < 4) return { fatal: true, masalah: ['struktur tidak lengkap'] };

  const daftarKalimat = kalimat(paragraf);
  const semua = normal(paragraf.join(' '));

  const jumlahKata = semua.split(' ').length;
  const [min, max] = USIA[usia].kata;
  if (jumlahKata < min * 0.75 || jumlahKata > max * 1.4) masalah.push(`panjang ${jumlahKata} kata`);

  for (const nama of [bahan.anak.nama, bahan.kedua.sebutan]) {
    if (!semua.includes(nama.toLowerCase())) masalah.push(`nama ${nama} tidak muncul`);
  }
  for (const d of detailKartu(bahan, usia)) {
    if (!d.cek.some((c) => semua.includes(c.toLowerCase()))) masalah.push(`detail "${d.teks}" tidak muncul`);
  }

  // Soal dipetakan menurut urutan rencana (tipe bisa muncul dua kali), tipe ditentukan server.
  const soal = rencanaSoal(bahan, usia).map((rs, i) => {
    const s = soalMentah[i];
    const out = { tipe: rs.tipe, sudut: rs.sudut, pertanyaan: rapikan(s?.pertanyaan), jawaban: rapikan(s?.jawaban), bukti: '' };
    if (!out.pertanyaan || !out.jawaban) masalah.push(`soal ${i + 1} kosong`);
    // Soal dibacakan lisan, jadi pilihan bergaya ujian ("A. ..., B. ...") tidak boleh.
    if (/(^|[\s,:(])[ABC][.:)]\s|A, B, atau C/.test(out.pertanyaan)) masalah.push(`soal ${i + 1} memakai huruf pilihan`);
    if (rs.bukti) {
      const b = perbaikiBukti(s?.bukti, daftarKalimat);
      out.bukti = b.bukti;
      if (!b.cocok && rs.bukti === true) masalah.push(`bukti soal ${i + 1} tidak ada di cerita`);
    }
    if (rs.cek && !rs.cek.some((c) => normal(out.jawaban).includes(c.toLowerCase()))) {
      masalah.push(`jawaban soal ${i + 1} tidak memuat detail`);
    }
    return out;
  });

  // Kalau tiga soal diawali kata yang sama ("Kenapa ...", "Apa ..."), anak bisa menebak polanya.
  const awal = {};
  for (const s of soal) {
    const kata = normal(s.pertanyaan).split(' ')[0];
    awal[kata] = (awal[kata] ?? 0) + 1;
  }
  if (Math.max(...Object.values(awal)) >= 3) masalah.push('tiga soal diawali kata yang sama');

  return {
    fatal: false,
    masalah,
    cerita: { judul: rapikan(mentah.judul) || 'Cerita Hari Ini', paragraf, soal },
  };
}
