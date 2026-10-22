"use server";

import { headers } from "next/headers";
import { estAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { decrireAppareil, decrireLieu, type TypeEvenement } from "@/lib/journal";

// Suivi vu depuis la plateforme de contrôle : chaque visite, chaque ouverture de
// l'enveloppe et chaque « oui » entrent dans le journal, avec leur date. Les
// visites de l'administrateur (qui relit sa lettre avant de l'envoyer) ne comptent pas.

async function noter(slug: string, type: TypeEvenement): Promise<number | null> {
  if (await estAdmin()) return null;
  const d = await prisma.declaration.findFirst({ where: { slug, active: true }, select: { id: true } });
  if (!d) return null;
  const h = await headers();
  await prisma.evenement.create({
    data: { declarationId: d.id, type, appareil: decrireAppareil(h.get("user-agent")), lieu: decrireLieu(h) },
  });
  return d.id;
}

export async function noterVisite(slug: string) {
  await noter(slug, "VISITE");
}

export async function noterOuverture(slug: string) {
  const id = await noter(slug, "OUVERTURE");
  if (!id) return;
  await prisma.declaration.update({ where: { id }, data: { ouvertures: { increment: 1 } } });
  await prisma.declaration.updateMany({ where: { id, ouverteLe: null }, data: { ouverteLe: new Date() } });
}

export async function noterOui(slug: string) {
  const id = await noter(slug, "OUI");
  if (!id) return;
  await prisma.declaration.updateMany({ where: { id, repondueLe: null }, data: { repondueLe: new Date() } });
}
