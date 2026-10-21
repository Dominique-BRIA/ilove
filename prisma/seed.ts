/**
 * Crée la lettre pour Blanche, mise à la une du site, si elle n'existe pas encore.
 * Le message est un premier jet : on le remplace depuis /admin, avec la photo.
 *   npm run db:seed
 */
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { QUESTION_PAR_DEFAUT } from "../lib/declarations";

const prisma = new PrismaClient();

const MESSAGE = `Il y a des mots qu'on garde pour les grandes occasions. J'ai décidé que chaque jour avec toi en était une.

Merci pour ton sourire, pour ta douceur, pour ta patience, et pour toutes ces petites choses qui font que, près de toi, je me sens chez moi.

Je t'aime, aujourd'hui un peu plus qu'hier, et bien moins que demain.`;

async function main() {
  const existante = await prisma.declaration.findUnique({ where: { slug: "blanche" } });
  if (existante) {
    console.log("La lettre pour Blanche existe déjà : rien à faire.");
    return;
  }
  const aLaUne = await prisma.declaration.count({ where: { accueil: true } });
  await prisma.declaration.create({
    data: {
      slug: "blanche",
      prenom: "Blanche",
      nomEnveloppe: "Blanche Tchiengang",
      message: MESSAGE,
      question: QUESTION_PAR_DEFAUT,
      theme: "rose",
      accueil: aLaUne === 0,
      jetonEdition: randomBytes(18).toString("base64url"),
    },
  });
  console.log("Lettre pour Blanche créée : /pour/blanche" + (aLaUne === 0 ? " (et à l'accueil du site)" : ""));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
