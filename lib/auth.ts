import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_ADMIN, sessionValide } from "./session";

/** Erreur due à la saisie : son message est montré tel quel dans le formulaire. */
export class ErreurSaisie extends Error {}

export async function estAdmin(): Promise<boolean> {
  return sessionValide((await cookies()).get(COOKIE_ADMIN)?.value);
}

/** Toute page et toute action de /admin commence par ce contrôle : le proxy ne couvre pas les actions. */
export async function exigerAdmin(): Promise<void> {
  if (!(await estAdmin())) redirect("/admin/connexion");
}

export function motDePasseAdminValide(mdp: string): boolean {
  const attendu = process.env.ADMIN_PASSWORD;
  if (!attendu) throw new Error("ADMIN_PASSWORD absent");
  // Empreintes de même longueur : la comparaison prend le même temps quelle que soit la saisie.
  const a = createHash("sha256").update(mdp).digest();
  const b = createHash("sha256").update(attendu).digest();
  return timingSafeEqual(a, b);
}
