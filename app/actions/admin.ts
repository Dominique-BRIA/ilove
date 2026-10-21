"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { exigerAdmin, motDePasseAdminValide } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Etat } from "@/lib/declarations";
import { erreurDe, lireContenu, lireMedias, lireReglages, nouveauJeton, slugLibre, supprimerFichiers } from "@/lib/enregistrement";
import { COOKIE_ADMIN, DUREE_SESSION_S, signerSession } from "@/lib/session";

export async function seConnecter(_: Etat, fd: FormData): Promise<Etat> {
  if (!motDePasseAdminValide(String(fd.get("motDePasse") ?? ""))) {
    // Ralentit les essais en série.
    await new Promise((r) => setTimeout(r, 800));
    return { erreur: "Mot de passe incorrect." };
  }
  (await cookies()).set(COOKIE_ADMIN, await signerSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DUREE_SESSION_S,
  });
  redirect("/admin");
}

export async function seDeconnecter() {
  (await cookies()).delete(COOKIE_ADMIN);
  redirect("/admin/connexion");
}

function rafraichir(slug?: string) {
  revalidatePath("/admin", "layout");
  revalidatePath("/");
  if (slug) revalidatePath(`/pour/${slug}`);
}

export async function creerDeclaration(_: Etat, fd: FormData): Promise<Etat> {
  await exigerAdmin();
  let id: number;
  try {
    const contenu = lireContenu(fd);
    const reglages = lireReglages(fd);
    const { photos, videoCle } = await lireMedias(fd, { photos: [], videoCle: null });
    const slug = reglages.slug || (await slugLibre(contenu.prenom));
    const d = await prisma.declaration.create({
      data: { ...contenu, ...reglages, slug, photos, videoCle, jetonEdition: nouveauJeton() },
    });
    id = d.id;
  } catch (e) {
    return erreurDe(e);
  }
  rafraichir();
  redirect(`/admin/${id}?cree=1`);
}

export async function modifierDeclaration(id: number, _: Etat, fd: FormData): Promise<Etat> {
  await exigerAdmin();
  try {
    const d = await prisma.declaration.findUniqueOrThrow({ where: { id } });
    const contenu = lireContenu(fd);
    const reglages = lireReglages(fd);
    const { aSupprimer, ...medias } = await lireMedias(fd, d);
    const maj = await prisma.declaration.update({
      where: { id },
      data: { ...contenu, ...reglages, ...medias, slug: reglages.slug || d.slug },
    });
    await supprimerFichiers(aSupprimer);
    rafraichir(d.slug);
    if (maj.slug !== d.slug) rafraichir(maj.slug);
  } catch (e) {
    return erreurDe(e);
  }
  return { ok: "Lettre enregistrée." };
}

export async function supprimerDeclaration(id: number) {
  await exigerAdmin();
  const d = await prisma.declaration.delete({ where: { id } });
  await supprimerFichiers([...d.photos, ...(d.videoCle ? [d.videoCle] : [])]);
  rafraichir(d.slug);
  redirect("/admin");
}

/** Met la lettre à la racine du site, ou l'en retire si elle y est déjà. */
export async function basculerAccueil(id: number) {
  await exigerAdmin();
  const d = await prisma.declaration.findUniqueOrThrow({ where: { id } });
  await prisma.$transaction([
    prisma.declaration.updateMany({ where: { accueil: true }, data: { accueil: false } }),
    prisma.declaration.update({ where: { id }, data: { accueil: !d.accueil } }),
  ]);
  rafraichir(d.slug);
}

/** Invalide l'ancien lien de l'ami (si on reprend la lettre ou qu'on la prête à un autre). */
export async function nouveauLienAmi(id: number) {
  await exigerAdmin();
  await prisma.declaration.update({ where: { id }, data: { jetonEdition: nouveauJeton() } });
  rafraichir();
}

/** Remet le suivi à zéro, après ses propres essais et avant d'envoyer le lien. */
export async function reinitialiserSuivi(id: number) {
  await exigerAdmin();
  await prisma.declaration.update({ where: { id }, data: { ouvertures: 0, ouverteLe: null, repondueLe: null } });
  rafraichir();
}
