/**
 * Convierte una imagen del usuario a WebP en el navegador (antes de subir al servidor).
 */
export async function fileToWebpBlob(
  file: File,
  quality = 0.92
): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = bmp.width;
    canvas.height = bmp.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No 2d context");
    ctx.drawImage(bmp, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/webp", quality);
    });
    if (!blob) throw new Error("toBlob devolvió null");
    return blob;
  } finally {
    bmp.close();
  }
}
