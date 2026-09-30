import { supabase } from '../../../shared/lib/supabaseClient';
import { resizeToSquareJpeg } from '../utils/resizeImage';

const BUCKET = 'avatars';

/** Envoie la photo dans "<uid>/<uuid>.jpg" (dossier imposé par les policies Storage) et renvoie son URL publique. */
export async function uploadAvatar(file: File): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) throw new Error('Connecte-toi pour ajouter une photo.');

  const image = await resizeToSquareJpeg(file);
  const path = `${userId}/${crypto.randomUUID()}.jpg`;

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
