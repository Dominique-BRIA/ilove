// Constantes partagées par le navigateur et le serveur : rien ici ne doit
// dépendre de Node, de Prisma ou des secrets.

export const THEMES = {
  rose: "Rose poudré",
  rouge: "Rouge passion",
  nuit: "Nuit étoilée",
} as const;

export type Theme = keyof typeof THEMES;

export function estTheme(t: string): t is Theme {
  return t in THEMES;
}

export const QUESTION_PAR_DEFAUT = "Veux-tu rester mon amour pour toujours ?";

export const LIMITES = {
  prenom: 60,
  nomEnveloppe: 80,
  auteur: 60,
  message: 5000,
  question: 160,
  ami: 80,
  slug: 50,
};

/** « Blanche Tchiengang » → « blanche-tchiengang » */
export function slugifier(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, LIMITES.slug);
}

export const MEDIAS = {
  photos: 5,
  // Les photos sont réduites dans le navigateur avant l'envoi ; ce plafond n'arrête que les anomalies.
  photoOctets: 10 * 1024 * 1024,
  videoOctets: 200 * 1024 * 1024,
  typesVideo: ["video/mp4", "video/quicktime", "video/webm"],
};

export type Etat = { erreur?: string; ok?: string } | undefined;
