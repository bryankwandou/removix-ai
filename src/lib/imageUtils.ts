export const validateImage = (file: File): { valid: boolean; error?: string } => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: "Unsupported file type. Please upload a JPG, PNG, WEBP, or HEIC image." };
  }
  const maxSize = 25 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: "File size too large. Please upload an image under 25MB." };
  }
  return { valid: true };
};

// Resize + JPEG-compress before sending to the API (Vercel payload limit ~4.5MB)
export const compressForUpload = async (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const objectURL = URL.createObjectURL(file);
    const img = new Image();
    img.src = objectURL;

    img.onload = () => {
      URL.revokeObjectURL(objectURL);

      // Cap at 4MP so the JPEG payload stays comfortably under 4.5MB
      const MAX_PX = 4_000_000;
      const pixels = img.width * img.height;
      const scale = pixels > MAX_PX ? Math.sqrt(MAX_PX / pixels) : 1;

      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(img.width * scale);
      canvas.height = Math.floor(img.height * scale);

      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas context failed')); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Always send as JPEG — smaller payload, server returns PNG anyway
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('Compression failed')),
        'image/jpeg',
        0.88
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectURL);
      reject(new Error('Failed to load image. The file may be corrupt or unsupported.'));
    };
  });
};

export const blobToURL = (blob: Blob): string => URL.createObjectURL(blob);
export const revokeURL = (url: string): void => URL.revokeObjectURL(url);

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
