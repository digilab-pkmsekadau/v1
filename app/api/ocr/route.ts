import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { ALL_PARAMS } from '@/lib/param-options';
import { requireAuth } from '@/lib/require-auth';

export const dynamic = 'force-dynamic';

const VISION_API_URL = 'https://ollama.com/v1/chat/completions';
// Fallback antar model: kalau model utama error/sibuk, coba berikutnya. Keduanya di
// Ollama Cloud — sengaja tidak menambah provider lain, foto lembar lab berisi
// nama/NIK/hasil pasien jadi hanya boleh ke vendor yang menyatakan no-logging.
// Nama model harus persis seperti di GET https://ollama.com/api/tags.
const MODELS = [
  'gemma4:31b',
  'minimax-m3',
];

// Thinking Gemma 4 mati kalau prompt tidak memuat token <|think|>, jadi token hanya
// terpakai untuk JSON. Lembar lab 40+ parameter terukur jauh di bawah angka ini.
const MAX_TOKENS = 4000;

// Sampling yang direkomendasikan Google untuk Gemma 4.
const TEMPERATURE = 1.0;
const TOP_P = 0.95;

// Cap body: route handler App Router tidak punya batas ukuran bawaan, jadi tanpa ini
// satu request 200 MB bisa menghabiskan memori server dan kuota API vision.
const MAX_IMAGE_CHARS = 8_000_000;

const requestSchema = z.object({
  image: z.string().max(MAX_IMAGE_CHARS).startsWith('data:image/', 'Gambar harus berupa data URL'),
});

const VALID_KEYS = new Set(ALL_PARAMS.map(p => p.key));

function buildParamGuide() {
  return ALL_PARAMS.map(p => {
    if (p.type === 'select' && p.opts) return `- ${p.key}: pilih salah satu persis dari [${p.opts.join(', ')}]`;
    if (p.type === 'number') return `- ${p.key}: angka saja (tanpa satuan)`;
    return `- ${p.key}: teks`;
  }).join('\n');
}

function buildPrompt() {
  return `Kamu membaca foto lembar "HASIL PEMERIKSAAN LABORATORIUM" Puskesmas (tulisan tangan mungkin ada).
Ekstrak data menjadi JSON valid. JANGAN mengarang: kalau suatu nilai tidak tertulis di foto, JANGAN sertakan key-nya.

Kembalikan HANYA JSON dengan bentuk:
{
  "patient": {
    "nama_pasien": string, "nik": string, "jenis_kelamin": "L"|"P", "alamat": string,
    "tgl_lahir": "YYYY-MM-DD", "tgl_permintaan": "YYYY-MM-DD",
    "dokter": string, "status_biaya": "Umum"|"BPJS"|"Gratis"
  },
  "params": { "<key>": "<nilai>", ... }
}

Aturan konversi nilai hasil lab (WAJIB dipetakan ke nilai resmi berikut, jangan pakai singkatan mentah):
- Kode "NR" pada serologi/imunologi berarti "Non Reaktif". Kode "R" berarti "Reaktif".
- Kode "N" pada dengue/malaria/widal/napza/mikrobiologi/urin berarti "Negatif". Kode "P" berarti "Positif".
- Golongan darah tulis apa adanya (mis. "O+").
- Angka desimal pertahankan titik (mis. "13.0", bukan "130").
- Tanggal ubah ke format YYYY-MM-DD.

Daftar key params yang valid beserta nilai yang diizinkan:
${buildParamGuide()}

Hanya gunakan key dari daftar di atas. Output JSON murni tanpa teks lain, tanpa markdown fence.`;
}

function extractJson(content: string): unknown {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : content;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('Tidak ada JSON pada respons AI');
  return JSON.parse(raw.slice(start, end + 1));
}

async function askVision(apiKey: string, image: string) {
  let lastStatus = 0;

  // Coba model satu per satu. Endpoint ini tidak mendukung field `models` untuk
  // fallback otomatis (model tak valid -> 404, tidak lanjut), jadi loop di sini.
  for (const model of MODELS) {
    const res = await fetch(VISION_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: MAX_TOKENS,
        temperature: TEMPERATURE,
        top_p: TOP_P,
        messages: [
          {
            role: 'user',
            content: [
              // Gambar HARUS sebelum teks. Dengan urutan terbalik Gemma 4 terbukti
              // salah memetakan tanggal permintaan ke tgl_lahir.
              { type: 'image_url', image_url: { url: image } },
              { type: 'text', text: buildPrompt() },
            ],
          },
        ],
      }),
    });

    if (res.ok) return { ok: true as const, res };

    lastStatus = res.status;
    console.error('Vision API error:', model, res.status, await res.text());

    // 401/403 = masalah kredensial, bukan model. Mencoba model lain sia-sia.
    if (res.status === 401 || res.status === 403) break;
  }

  return { ok: false as const, status: lastStatus };
}

export async function POST(request: NextRequest) {
  const denied = await requireAuth();
  if (denied) return denied;

  const apiKey = process.env.VISION_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Fitur OCR belum dikonfigurasi (VISION_API_KEY hilang)' }, { status: 503 });
  }

  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > MAX_IMAGE_CHARS) {
    return NextResponse.json({ error: 'Gambar terlalu besar (maks 8 MB)' }, { status: 413 });
  }

  const parsedReq = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsedReq.success) {
    return NextResponse.json({ error: 'Gambar tidak valid' }, { status: 400 });
  }

  try {
    const attempt = await askVision(apiKey, parsedReq.data.image);

    if (!attempt.ok) {
      // Teruskan sebab yang jelas ke petugas: rate-limit/model sibuk vs error lain.
      const hint = attempt.status === 429
        ? 'AI sedang sibuk/limit tercapai, coba lagi sebentar'
        : attempt.status === 402
          ? 'Kuota AI habis'
          : attempt.status === 401 || attempt.status === 403
            ? 'Kredensial AI tidak valid, hubungi admin'
            : 'AI gagal memproses gambar';
      return NextResponse.json({ error: hint }, { status: 502 });
    }

    const aiResult = await attempt.res.json();
    const message = aiResult?.choices?.[0]?.message;
    // Reasoning model menaruh jawaban di `content`, tapi kalau kuota token habis
    // di tengah berpikir, content null dan JSON-nya tertinggal di `reasoning`.
    const content: string = message?.content || message?.reasoning || '';
    const extracted = extractJson(content) as { patient?: Record<string, unknown>; params?: Record<string, unknown> };

    const patient: Record<string, string> = {};
    for (const [k, v] of Object.entries(extracted.patient ?? {})) {
      if (typeof v === 'string' && v.trim()) patient[k] = v.trim();
    }

    const params: { paramKey: string; value: string }[] = [];
    for (const [k, v] of Object.entries(extracted.params ?? {})) {
      if (VALID_KEYS.has(k) && v != null && String(v).trim()) {
        params.push({ paramKey: k, value: String(v).trim() });
      }
    }

    return NextResponse.json({ patient, params });
  } catch (err) {
    console.error('OCR route error:', err);
    return NextResponse.json({ error: 'Gagal membaca hasil AI' }, { status: 500 });
  }
}
