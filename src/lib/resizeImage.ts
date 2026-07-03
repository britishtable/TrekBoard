export interface ResizedImage {
  blob: Blob;
  width: number;
  height: number;
}

// Decode with EXIF orientation applied, scale so the longest edge is at most
// maxEdge (never upscaling), and re-encode as JPEG (which also strips EXIF).
export async function resizeImage(
  file: File,
  maxEdge = 1600,
  quality = 0.8,
): Promise<ResizedImage> {
  const bitmap = await createImageBitmap(file, {
    imageOrientation: 'from-image',
  });
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable.');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Image encode failed.'))),
      'image/jpeg',
      quality,
    );
  });
  return { blob, width, height };
}
