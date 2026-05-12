# Removix — AI Background Remover

**Live:** https://removix.vercel.app

Remove image backgrounds instantly using a neural network that runs 100% inside your browser. No server, no account, no payment, no data upload.

## How it works

1. You drop an image onto the page.
2. The ISNet fp16 ONNX model runs inference via WebGPU (or WASM fallback).
3. An alpha matte is generated and applied to the original image.
4. You get a transparent PNG — your image never left your device.

The ~40 MB model downloads once and is cached in the browser's Cache API. Every subsequent use is instant.

## Features

- **Auto background removal** — ISNet neural network, same model class as commercial tools
- **Manual refinement** — Erase and restore brush with soft/hard modes and undo history
- **Background replacement** — Transparent, solid color (12 presets + custom), or gradient (8 directions)
- **Batch processing** — Up to 10 images, sequential inference, one-click zip download
- **Copy to clipboard** — One-click copy (Chrome/Edge)
- **Keyboard shortcuts** — `Ctrl+V` paste · `Ctrl+D` download · `Esc` reset
- **Zoom inspect** — Pan and zoom to check edge quality at full resolution
- **PWA installable** — Add to home screen on mobile
- **SEO ready** — OG image, sitemap, robots.txt, JSON-LD structured data

## Tech stack

| Layer | Library |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v3 |
| Animation | Framer Motion |
| AI model | ISNet fp16 via `@imgly/background-removal` |
| Inference | ONNX Runtime Web (WebGPU → WASM) |
| Batch zip | JSZip |
| OG image | `@vercel/og` |
| Deployment | Vercel |

## Local development

```bash
git clone https://github.com/nayrbryanGaming/removix-ai
cd removix-ai
npm install   # postinstall copies model files to public/models/
npm run dev
```

Open http://localhost:3000. Model downloads on first use (~40 MB, cached after).

## Deployment

Push to `main` — Vercel auto-deploys. No environment variables required.

```bash
git push origin main
```

The Vercel build: `npm install` → postinstall (copies model files) → `next build`. Model files are included in the static output and served from Vercel's CDN.

## Privacy

All processing happens inside your browser. Your images are never uploaded to any server. The only network request after the initial page load is the one-time model download (~40 MB), permanently cached in your browser.

## Architecture notes

- `Cross-Origin-Opener-Policy: same-origin` + `Cross-Origin-Embedder-Policy: require-corp` are required for `SharedArrayBuffer` (multi-threaded WASM inference).
- `.onnx` / `.wasm` model files are excluded from git. The `postinstall` script copies them to `public/models/` on every `npm install`. The build fails loudly if they are missing.
- `/models/(.*)` gets `Cross-Origin-Resource-Policy: cross-origin` and a 1-year immutable cache header.
