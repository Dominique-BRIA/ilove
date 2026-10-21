"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import type { Etat } from "@/lib/declarations";
import { erreurDe, lireContenu, lireMedias, supprimerFichiers } from "@/lib/enregistrement";

// L'ami à qui la lettre est prêtée n'a pas de compte : le jeton secret de son
// lien lui donne accès à cette lettre seulement, et à son contenu seulement
// (ni l'adresse, ni l'activation, ni la suppression).
export async function modifierParJeton(jeton: string, _: Etat, fd: FormData): Promise<Etat> {
  try {
    const d = await prisma.declaration.findUnique({ where: { jetonEdition: jeton } });
    if (!d) return { erreur: "Ce lien n'est plus valable. Demandez-en un nouveau." };
    const contenu = lireContenu(fd);
    const { aSupprimer, ...medias } = await lireMedias(fd, d);
    await prisma.declaration.update({ where: { id: d.id }, data: { ...contenu, ...medias } });
    await supprimerFichiers(aSupprimer);
    revalidatePath(`/pour/${d.slug}`);
    revalidatePath(`/modifier/${jeton}`);
    if (d.accueil) revalidatePath("/");
  } catch (e) {
    return erreurDe(e);
  }
  return { ok: "C'est enregistré ! Ouvrez la lettre pour la relire." };
}
