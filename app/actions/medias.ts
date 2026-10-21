"use server";

import { estAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { erreurDe } from "@/lib/enregistrement";
import { lienEnvoi, type Nature } from "@/lib/fichiers";

/**
 * Donne au navigateur un lien pour déposer une photo ou la vidéo directement
 * dans Backblaze B2. Réservé à l'administrateur, ou à l'ami muni d'un lien valable.
 */
export async function preparerEnvoi(jeton: string | null, nature: Nature, type: string): Promise<{ cle: string; url: string } | { erreur: string }> {
  if (nature !== "photo" && nature !== "video") return { erreur: "Type de fichier inconnu." };
  if (jeton) {
    const d = await prisma.declaration.findUnique({ where: { jetonEdition: jeton }, select: { id: true } });
    if (!d) return { erreur: "Ce lien n'est plus valable. Demandez-en un nouveau." };
  } else if (!(await estAdmin())) {
    return { erreur: "Session expirée : reconnectez-vous." };
  }
  try {
    return await lienEnvoi(nature, type);
  } catch (e) {
    return { erreur: erreurDe(e)?.erreur ?? "Envoi impossible." };
  }
}
