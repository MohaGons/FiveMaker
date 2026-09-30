import { supabase } from '../../../shared/lib/supabaseClient';
import type { ID } from '../../../shared/types/common';
import { resizeToSquareJpeg } from '../utils/resizeImage';

const BUCKET = 'avatars';

/**
 * Envoie la photo dans "<id du groupe>/<uuid>.jpg" (dossier imposé par les policies Storage : seuls
 * le créateur et les admins du groupe y écrivent) et renvoie son URL publique.
 */
export async function uploadAvatar(groupId: ID, file: File): Promise<string> {
  const image = await resizeToSquareJpeg(file);
  const path = `${groupId}/${crypto.randomUUID()}.jpg`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, image, { contentType: 'image/jpeg' });
  if (error) throw error;

  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/**
 * Supprime une photo précédemment envoyée. Sans conséquence si ça échoue (fichier orphelin) :
 * on ne bloque donc jamais l'enregistrement du joueur pour ça.
 */
export async function deleteAvatar(publicUrl: string): Promise<void> {
  const marker = `/${BUCKET}/`;
  const index = publicUrl.indexOf(marker);
  if (index === -1) return;

  const path = decodeURIComponent(publicUrl.slice(index + marker.length));
  await supabase.storage.from(BUCKET).remove([path]);
}
