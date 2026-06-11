// Accepted MIME types — covers every common format browsers can decode
const ACCEPTED_MIME = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
  'image/heic', 'image/heif',
  'image/bmp', 'image/x-bmp', 'image/x-ms-bmp',
  'image/tiff', 'image/tif',
  'image/avif', 'image/gif',
  'image/svg+xml', 'image/ico', 'image/x-icon', 'image/vnd.microsoft.icon',
]);

// Accepted file extensions as fallback when MIME is generic / wrong
const ACCEPTED_EXT = new Set([
  'jpg','jpeg','png','webp','heic','heif',
  'bmp','tiff','tif','avif','gif','svg','ico',
]);

function getExtension(filename: string): string {
  return (filename.split('.').pop() ?? '').toLowerCase();
}

export const validateImage = (file: File): { valid: boolean; error?: string } => {
  const ext = getExtension(file.name);
  const mimeOk = ACCEPTED_MIME.has(file.type);
  const extOk  = ACCEPTED_EXT.has(ext);

  // Accept if either MIME or extension looks like an image
  if (!mimeOk && !extOk && file.type !== '' && !file.type.startsWith('image/')) {
    return {
      valid: false,
      error: `Unsupported file type "${file.type || ext}". Please upload an image (JPG, PNG, WebP, HEIC, BMP, etc.).`,
    };
  }

  const maxSize = 50 * 1024 * 1024; // 50 MB — generous for large RAW photos
  if (file.size > maxSize) {
    return { valid: false, error: 'File too large. Maximum size is 50 MB.' };
  }

  if (file.size === 0) {
    return { valid: false, error: 'File is empty or corrupt.' };
  }

  return { valid: true };
};

// Convert any image the browser can render → JPEG Blob ready for server upload.
// Handles HEIC/AVIF/BMP/TIFF/GIF via the browser's own decoder (createImageBitmap).
export const compressForUpload = async (file: File): Promise<Blob> => {
  // Try fast path via ImageBitmap (supports more formats than HTMLImageElement on modern browsers)
  try {
    return await compressViaBitmap(file);
  } catch {
    // Fallback to HTMLImageElement (needed for SVG and some edge cases)
    return await compressViaImg(file);
  }
};

async function compressViaBitmap(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);

  const MAX_PX = 4_000_000;
  const pixels = bitmap.width * bitmap.height;
  const scale  = pixels > MAX_PX ? Math.sqrt(MAX_PX / pixels) : 1;

  const w = Math.max(1, Math.floor(bitmap.width  * scale));
  const h = Math.max(1, Math.floor(bitmap.height * scale));

  const canvas = new OffscreenCanvas(w, h);
  const ctx    = canvas.getContext('2d');
  if (!ctx) throw new Error('OffscreenCanvas context unavailable');

  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.88 });
  return blob;
}

async function compressViaImg(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const objectURL = URL.createObjectURL(file);
    const img = new Image();
    img.src = objectURL;

    img.onload = () => {
      URL.revokeObjectURL(objectURL);

      const MAX_PX = 4_000_000;
      const pixels = img.width * img.height;
      const scale  = pixels > MAX_PX ? Math.sqrt(MAX_PX / pixels) : 1;

      const canvas = document.createElement('canvas');
      canvas.width  = Math.max(1, Math.floor(img.width  * scale));
      canvas.height = Math.max(1, Math.floor(img.height * scale));

      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas context failed')); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('Compression failed')),
        'image/jpeg',
        0.88,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectURL);
      reject(new Error('Browser could not decode this image. Try converting it to JPG or PNG first.'));
    };
  });
}

export const blobToURL    = (blob: Blob): string => URL.createObjectURL(blob);
export const revokeURL    = (url: string): void  => URL.revokeObjectURL(url);

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
