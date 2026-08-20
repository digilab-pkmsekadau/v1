import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { ALL_PARAMS } from '@/lib/param-options';
import { requireAuth } from '@/lib/require-auth';

export const dynamic = 'force-dynamic';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'google/gemma-4-26b-a4b-it:free';

const requestSchema = z.object({
  image: z.string().startsWith('data:image/', 'Gambar harus berupa data URL'),
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

export async function POST(request: NextRequest) {
  const denied = await requireAuth();
  if (denied) return denied;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Fitur OCR belum dikonfigurasi (OPENROUTER_API_KEY hilang)' }, { status: 503 });
  }

  const parsedReq = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsedReq.success) {
    return NextResponse.json({ error: 'Gambar tidak valid' }, { status: 400 });
  }

  try {
    const aiRes = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: buildPrompt() },
              { type: 'image_url', image_url: { url: parsedReq.data.image } },
            ],
          },
        ],
      }),
    });

    if (!aiRes.ok) {
      const detail = await aiRes.text();
      console.error('OpenRouter error:', aiRes.status, detail);
      return NextResponse.json({ error: 'AI gagal memproses gambar' }, { status: 502 });
    }

    const aiResult = await aiRes.json();
    const content: string = aiResult?.choices?.[0]?.message?.content ?? '';
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
