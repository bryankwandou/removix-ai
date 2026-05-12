import { NextRequest, NextResponse } from 'next/server';

// PWA Share Target handler — receives images shared from mobile gallery
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File | null;
    if (!file) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // We can't pass the binary to the client directly via redirect.
    // Encode basic metadata as query params; the client re-fetches from the
    // blob it already has in memory (this is the standard PWA share target pattern).
    // The actual file is passed via the FormData — we redirect to homepage
    // with a flag; the SW or client script handles the rest.
    return NextResponse.redirect(new URL('/?shared=1', request.url));
  } catch {
    return NextResponse.redirect(new URL('/', request.url));
  }
}
