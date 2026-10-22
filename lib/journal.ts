// Journal du suivi : ce qu'on retient de chaque visite, ouverture de l'enveloppe ou « oui ».
// Ni adresse IP ni identifiant : seulement l'appareil et la ville, pour s'y retrouver.

import { prisma } from "./db";

export const TYPES_EVENEMENT = {
  VISITE: "Visite",
  OUVERTURE: "Enveloppe ouverte",
  OUI: "A dit oui",
} as const;

export type TypeEvenement = keyof typeof TYPES_EVENEMENT;

/** « iPhone · Safari », « Android · Chrome », « Windows · Edge »… */
export function decrireAppareil(ua: string | null): string | null {
  if (!ua) return null;
  const systeme = /iPhone/.test(ua)
    ? "iPhone"
    : /iPad/.test(ua)
      ? "iPad"
      : /Android/.test(ua)
        ? "Android"
        : /Windows/.test(ua)
          ? "Windows"
          : /Mac OS X/.test(ua)
            ? "Mac"
            : /Linux/.test(ua)
              ? "Linux"
              : null;
  // Navigateurs intégrés aux applications d'abord : leur signature contient aussi « Safari » ou « Chrome ».
  const navigateur = /FBAN|FBAV/.test(ua)
    ? "Facebook"
    : /Instagram/.test(ua)
      ? "Instagram"
      : /Edg\//.test(ua)
        ? "Edge"
        : /OPR\//.test(ua)
          ? "Opera"
          : /SamsungBrowser/.test(ua)
            ? "Samsung Internet"
            : /CriOS|Chrome\//.test(ua)
              ? "Chrome"
              : /FxiOS|Firefox\//.test(ua)
                ? "Firefox"
                : /Safari\//.test(ua)
                  ? "Safari"
                  : null;
  return [systeme, navigateur].filter(Boolean).join(" · ") || null;
}

/** « Douala, CM » : Vercel ajoute ces en-têtes à chaque requête ; en local, il n'y en a pas. */
export function decrireLieu(h: Headers): string | null {
  const ville = h.get("x-vercel-ip-city");
  const pays = h.get("x-vercel-ip-country");
  const lieu = [ville ? decodeURIComponent(ville) : null, pays].filter(Boolean).join(", ");
  return lieu || null;
}

export type Comptes = Partial<Record<TypeEvenement, number>>;

/** Nombre de visites, d'ouvertures et de « oui » de chaque lettre, en une requête. */
export async function comptesParLettre(): Promise<Map<number, Comptes>> {
  const lignes = await prisma.evenement.groupBy({ by: ["declarationId", "type"], _count: { _all: true } });
  const comptes = new Map<number, Comptes>();
  for (const l of lignes) {
    const c = comptes.get(l.declarationId) ?? {};
    c[l.type as TypeEvenement] = l._count._all;
    comptes.set(l.declarationId, c);
  }
  return comptes;
}
