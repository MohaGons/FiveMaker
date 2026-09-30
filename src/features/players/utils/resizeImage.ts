/** Taille (en px) du carré enregistré : suffisant pour les avatars affichés en 48px, même sur écran Retina. */
const AVATAR_SIZE = 256;
const JPEG_QUALITY = 0.85;

/**
 * Recadre l'image au centre en carré et la réduit, pour envoyer ~20 Ko au lieu d'une photo de plusieurs Mo.
 * createImageBitmap applique l'orientation EXIF (photos de téléphone prises en portrait).
 */
export async function resizeToSquareJpeg(file: File): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("Impossible de lire cette image. Essaie avec une photo JPEG ou PNG.");
  }

  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;

  const context = canvas.getContext('2d');
  if (!context) throw new Error("Impossible de préparer l'image.");

  context.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    AVATAR_SIZE,
    AVATAR_SIZE,
  );
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Impossible de préparer l'image."))),
      'image/jpeg',
      JPEG_QUALITY,
    );
  });
}
