import sharp from 'sharp';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function fetchWithTimeout(url: string, init: RequestInit, ms: number): Promise<Response> {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function retryFetch(
  doFetch: () => Promise<Response>,
  retryOn503 = 4,
): Promise<Response> {
  let res = await doFetch();
  for (let i = 0; i < retryOn503 && res.status === 503; i++) {
    await new Promise(r => setTimeout(r, (i + 1) * 7_000));
    res = await doFetch();
  }
  if (res.status === 429) {
    await new Promise(r => setTimeout(r, 12_000));
    res = await doFetch();
  }
  return res;
}

// ─── RMBG unified provider (RMBG-2.0 primary, RMBG-1.4 fallback) ─────────────
// RMBG models return an RGBA PNG with background made transparent — NOT a greyscale mask.
// We extract the alpha channel so applyMask receives a proper single-channel mask.
async function removeViaRMBG(imageBuffer: Buffer, modelId: string): Promise<Buffer> {
  const HF_API = `https://api-inference.huggingface.co/models/${modelId}`;
  const headers: Record<string, string> = { 'Content-Type': 'application/octet-stream' };
  if (process.env.HUGGINGFACE_API_KEY) headers['Authorization'] = `Bearer ${process.env.HUGGINGFACE_API_KEY}`;

  const res = await retryFetch(
    () => fetchWithTimeout(HF_API, { method: 'POST', headers, body: new Uint8Array(imageBuffer) }, 50_000),
  );

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HuggingFace ${modelId} ${res.status}: ${text.slice(0, 200)}`);
  }

  const ct = res.headers.get('content-type') ?? '';

  // JSON response: image-segmentation format with base64 binary mask (white=foreground)
  if (ct.includes('application/json')) {
    const segs = (await res.json()) as { label: string; score: number; mask: string }[];
    if (!Array.isArray(segs) || !segs.length) throw new Error(`${modelId}: empty segments`);
    const fg = segs.find(s => s.label === 'foreground') ?? segs.reduce((a, b) => b.score > a.score ? b : a);
    if (!fg.mask) throw new Error(`${modelId}: missing mask`);
    return Buffer.from(fg.mask, 'base64');
  }

  // Binary response: RMBG returns the composited RGBA PNG (background already transparent).
  // We must extract the alpha channel — NOT convert to greyscale (which would use RGB luminance
  // and incorrectly keep white backgrounds opaque).
  const buf = Buffer.from(await res.arrayBuffer());
  const { hasAlpha } = await sharp(buf).metadata();
  if (hasAlpha) {
    return sharp(buf).extractChannel('alpha').png().toBuffer();
  }
  // Rare case: model returned a greyscale/RGB mask — use as-is
  return buf;
}

// ─── Provider 3: HuggingFace Xenova/modnet (portrait matting fallback) ───────
async function removeViaModNet(imageBuffer: Buffer): Promise<Buffer> {
  const HF_API = 'https://api-inference.huggingface.co/models/Xenova/modnet';
  const headers: Record<string, string> = { 'Content-Type': 'application/octet-stream' };
  if (process.env.HUGGINGFACE_API_KEY) headers['Authorization'] = `Bearer ${process.env.HUGGINGFACE_API_KEY}`;

  const res = await retryFetch(
    () => fetchWithTimeout(HF_API, { method: 'POST', headers, body: new Uint8Array(imageBuffer) }, 40_000),
  );
  if (!res.ok) throw new Error(`ModNet ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const { hasAlpha } = await sharp(buf).metadata();
  if (hasAlpha) {
    return sharp(buf).extractChannel('alpha').png().toBuffer();
  }
  return buf;
}

// ─── Provider 3: Groq llama-3.2-11b-vision — smart subject-crop fallback ──────
// Groq cannot do pixel segmentation, but it can identify the main subject's
// bounding region. We use that to produce an alpha vignette that at minimum
// gives the user a result instead of an error.
async function removeViaGroq(imageBuffer: Buffer): Promise<Buffer> {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY not set');

  // Resize to small preview for Groq (max 768px) to minimise token cost
  const preview = await sharp(imageBuffer)
    .resize({ width: 768, height: 768, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();

  const base64 = preview.toString('base64');

  const groqRes = await fetchWithTimeout(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${base64}` },
              },
              {
                type: 'text',
                text: 'Identify the main subject in this image. Reply ONLY with a JSON object: {"x1":0.0,"y1":0.0,"x2":1.0,"y2":1.0} where values are fractional coordinates (0-1) of the subject bounding box. No explanation.',
              },
            ],
          },
        ],
        max_tokens: 80,
        temperature: 0,
      }),
    },
    20_000,
  );

  if (!groqRes.ok) {
    const text = await groqRes.text().catch(() => '');
    throw new Error(`Groq ${groqRes.status}: ${text.slice(0, 200)}`);
  }

  const { choices } = await groqRes.json() as { choices: { message: { content: string } }[] };
  const content = choices?.[0]?.message?.content ?? '{}';

  const bbox = { x1: 0.1, y1: 0.05, x2: 0.9, y2: 0.95 };
  try {
    const match = content.match(/\{[^}]+\}/);
    if (match) Object.assign(bbox, JSON.parse(match[0]));
  } catch { /* use default bbox */ }

  // Build a soft-edged elliptical mask centred on the bounding box
  const { width, height } = await sharp(imageBuffer).metadata();
  const W = width ?? 512;
  const H = height ?? 512;

  const cx = (bbox.x1 + bbox.x2) / 2;
  const cy = (bbox.y1 + bbox.y2) / 2;
  const rx = Math.max(0.1, (bbox.x2 - bbox.x1) / 2) * 1.1; // 10% padding
  const ry = Math.max(0.1, (bbox.y2 - bbox.y1) / 2) * 1.1;

  // Generate grayscale mask via sharp raw buffer
  const maskData = Buffer.alloc(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const nx = (x / W - cx) / rx;
      const ny = (y / H - cy) / ry;
      const d  = Math.sqrt(nx * nx + ny * ny);
      // Smooth falloff: 1 inside, 0 outside, feathered at edge
      const alpha = Math.max(0, Math.min(1, 1.5 - d));
      maskData[y * W + x] = Math.round(alpha * 255);
    }
  }

  return sharp(maskData, { raw: { width: W, height: H, channels: 1 } })
    .png()
    .toBuffer();
}

// ─── Compose final PNG with transparent background ────────────────────────────
async function applyMask(imageBuffer: Buffer, maskBuffer: Buffer): Promise<Buffer> {
  const { data: origData, info } = await sharp(imageBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data: maskData } = await sharp(maskBuffer)
    .resize(info.width, info.height, { fit: 'fill' })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < info.width * info.height; i++) {
    origData[i * 4 + 3] = maskData[i];
  }

  return sharp(Buffer.from(origData), {
    raw: { width: info.width, height: info.height, channels: 4 },
  }).png().toBuffer();
}

// ─── Route ────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('image') as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image too large for server processing. Max 15 MB.' }, { status: 413 });
    }

    const raw = Buffer.from(await file.arrayBuffer());

    // Normalise input → JPEG so all providers get a predictable format
    const imageBuffer = await sharp(raw)
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .jpeg({ quality: 90 })
      .toBuffer();

    // Four-tier provider chain — each falls through to the next on failure
    const providers: Array<[string, () => Promise<Buffer>]> = [
      ['RMBG-2.0',   () => removeViaRMBG(imageBuffer, 'briaai/RMBG-2.0')],
      ['RMBG-1.4',   () => removeViaRMBG(imageBuffer, 'briaai/RMBG-1.4')],
      ['ModNet',     () => removeViaModNet(imageBuffer)],
      ['Groq',       () => removeViaGroq(raw)],
    ];

    let maskBuffer: Buffer | null = null;
    const errors: string[] = [];

    for (const [name, fn] of providers) {
      try {
        maskBuffer = await fn();
        console.log(`[remove-bg] ✓ ${name}`);
        break;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[remove-bg] ✗ ${name}:`, msg);
        errors.push(`${name}: ${msg}`);
      }
    }

    if (!maskBuffer) {
      console.error('[remove-bg] All providers failed:', errors);
      return NextResponse.json(
        { error: 'All processing providers failed. Please try again later.' },
        { status: 500 },
      );
    }

    const resultBuffer = await applyMask(raw, maskBuffer);

    return new NextResponse(new Uint8Array(resultBuffer), {
      status: 200,
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    console.error('[remove-bg] Unhandled error:', err);
    const message = err instanceof Error ? err.message : 'Unexpected server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
