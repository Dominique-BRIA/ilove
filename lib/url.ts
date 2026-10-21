import { headers } from "next/headers";

/** Origine du site (https://exemple.vercel.app), pour les liens à copier et à envoyer. */
export async function origine(): Promise<string> {
  const h = await headers();
  const hote = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (hote.startsWith("localhost") ? "http" : "https");
  return `${proto}://${hote}`;
}
