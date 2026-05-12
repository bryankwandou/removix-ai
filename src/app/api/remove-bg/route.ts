import sharp from 'sharp';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

const HF_MODEL = 'briaai/RMBG-1.4';
const HF_API = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

async function callHuggingFace(imageBuffer: Buffer): Promise<Buffer> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/octet-stream',
    Accept: 'application/json',
  };
  if (process.env.HUGGINGFACE_API_KEY) {
    headers['Authorization'] = `Bearer ${process.env.HUGGINGFACE_API_KEY}`;
  }

  const body = new Uint8Array(imageBuffer);

  const doFetch = () => fetch(HF_API, { method: 'POST', headers, body });

  let res = await doFetch();

  // 503 = model loading — retry after 8 s
  if (res.status === 503) {
    await new Promise(r => setTimeout(r, 8000));
    res = await doFetch();
  }

  // 429 = rate limited — retry after 15 s
  if (res.status === 429) {
    await new Promise(r => setTimeout(r, 15000));
    res = await doFetch();
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HuggingFace error ${res.status}: ${text.slice(0, 200)}`);
  }

  return handleHFResponse(res);
}

async function handleHFResponse(res: Response): Promise<Buffer> {
  const segments = (await res.json()) as { label: string; score: number; mask: string }[];
  if (!Array.isArray(segments) || segments.length === 0) {
    throw new Error('Unexpected response from HuggingFace API');
  }
  const best = segments.reduce((a, b) => (b.score > a.score ? b : a));
  return Buffer.from(best.mask, 'base64');
}

async function applyMask(imageBuffer: Buffer, maskBuffer: Buffer): Promise<Buffer> {
  const { data: origData, info } = await sharp(imageBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data: maskData } = await sharp(maskBuffer)
    .resize(info.width, info.height)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < info.width * info.height; i++) {
    origData[i * 4 + 3] = maskData[i];
  }

  return sharp(Buffer.from(origData), {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('image') as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image too large. Max 10MB.' }, { status: 413 });
    }

    const imageBuffer = Buffer.from(await file.arrayBuffer());
    const maskBuffer = await callHuggingFace(imageBuffer);
    const resultBuffer = await applyMask(imageBuffer, maskBuffer);

    return new NextResponse(new Uint8Array(resultBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[API/remove-bg]', err);
    const message = err instanceof Error ? err.message : 'Processing failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
