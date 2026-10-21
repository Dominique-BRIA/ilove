import { randomBytes } from "node:crypto";
import { Prisma, type Declaration } from "@prisma/client";
import { ErreurSaisie } from "./auth";
import { prisma } from "./db";
import { LIMITES, MEDIAS, QUESTION_PAR_DEFAUT, estTheme, slugifier, type Etat } from "./declarations";
import { supprimerFichiers, verifierEnvoi } from "./fichiers";

export function nouveauJeton(): string {
  return randomBytes(18).toString("base64url");
}

function texte(fd: FormData, champ: keyof typeof LIMITES, libelle: string, obligatoire: boolean): string | null {
  const v = String(fd.get(champ) ?? "").trim();
  if (!v) {
    if (obligatoire) throw new ErreurSaisie(`${libelle} : champ obligatoire.`);
    return null;
  }
  if (v.length > LIMITES[champ]) throw new ErreurSaisie(`${libelle} : ${LIMITES[champ]} caractères au maximum.`);
  return v;
}

/** Champs que l'ami à qui la lettre est prêtée peut lui aussi modifier. */
export function lireContenu(fd: FormData) {
  const theme = String(fd.get("theme") ?? "rose");
  return {
    prenom: texte(fd, "prenom", "Prénom", true)!,
    nomEnveloppe: texte(fd, "nomEnveloppe", "Nom sur l'enveloppe", false),
    auteur: texte(fd, "auteur", "Votre nom (signature)", true)!,
    message: texte(fd, "message", "Message", true)!,
    question: texte(fd, "question", "Question", false) ?? QUESTION_PAR_DEFAUT,
    theme: estTheme(theme) ? theme : "rose",
  };
}

/** Champs réservés à l'administrateur. */
export function lireReglages(fd: FormData) {
  const brut = String(fd.get("slug") ?? "").trim();
  const slug = brut ? slugifier(brut) : "";
  if (brut && !slug) throw new ErreurSaisie("Adresse : utilisez des lettres, des chiffres et des tirets.");
  return { slug, ami: texte(fd, "ami", "Prêtée à", false), active: fd.get("active") === "on" };
}

/**
 * Photos et vidéo annoncées par le formulaire (clés déjà déposées par le
 * navigateur). Les nouvelles sont vérifiées dans le stockage ; celles qui ne
 * sont plus utilisées seront supprimées une fois la base à jour.
 */
export async function lireMedias(fd: FormData, ancien: Pick<Declaration, "photos" | "videoCle">) {
  let photos: unknown;
  try {
    photos = JSON.parse(String(fd.get("photos") ?? "[]"));
  } catch {
    photos = null;
  }
  if (!Array.isArray(photos) || photos.some((c) => typeof c !== "string")) throw new ErreurSaisie("Liste de photos illisible.");
  const cles = [...new Set(photos as string[])];
  if (cles.length > MEDIAS.photos) throw new ErreurSaisie(`${MEDIAS.photos} photos au maximum.`);
  for (const c of cles) if (!ancien.photos.includes(c)) await verifierEnvoi(c, "photo");

  const videoCle = String(fd.get("video") ?? "") || null;
  if (videoCle && videoCle !== ancien.videoCle) await verifierEnvoi(videoCle, "video");

  const aSupprimer = ancien.photos.filter((c) => !cles.includes(c));
  if (ancien.videoCle && ancien.videoCle !== videoCle) aSupprimer.push(ancien.videoCle);
  return { photos: cles, videoCle, aSupprimer };
}

export { supprimerFichiers };

export function erreurDe(e: unknown): Etat {
  if (e instanceof ErreurSaisie) return { erreur: e.message };
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
    return { erreur: "Cette adresse est déjà prise par une autre lettre : choisissez-en une autre." };
  }
  console.error(e);
  return { erreur: "Enregistrement impossible pour le moment. Réessayez dans un instant." };
}

export async function slugLibre(base: string): Promise<string> {
  const racine = slugifier(base) || "lettre";
  if (!(await prisma.declaration.findUnique({ where: { slug: racine }, select: { id: true } }))) return racine;
  return `${racine.slice(0, LIMITES.slug - 5)}-${randomBytes(2).toString("hex")}`;
}
