"use server";

import { estAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Suivi vu depuis la plateforme de contrôle. Les visites de l'administrateur
// (qui relit sa lettre avant de l'envoyer) ne comptent pas.

export async function noterOuverture(slug: string) {
  if (await estAdmin()) return;
  await prisma.declaration.updateMany({ where: { slug, active: true }, data: { ouvertures: { increment: 1 } } });
  await prisma.declaration.updateMany({ where: { slug, active: true, ouverteLe: null }, data: { ouverteLe: new Date() } });
}

export async function noterOui(slug: string) {
  if (await estAdmin()) return;
  await prisma.declaration.updateMany({ where: { slug, active: true, repondueLe: null }, data: { repondueLe: new Date() } });
}
