// Session de l'administrateur : jeton signé HMAC-SHA256 avec Web Crypto, pour que
// le même code tourne dans le proxy et dans les pages serveur.

export const COOKIE_ADMIN = "admin";
export const DUREE_SESSION_S = 60 * 60 * 24 * 30;

const encodeur = new TextEncoder();

function b64url(octets: Uint8Array): string {
  let s = "";
  for (const o of octets) s += String.fromCharCode(o);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function depuisB64url(s: string): Uint8Array<ArrayBuffer> {
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
}

async function cle(): Promise<CryptoKey> {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET absent ou trop court (32 caractères minimum)");
  return crypto.subtle.importKey("raw", encodeur.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

export async function signerSession(): Promise<string> {
  const charge = b64url(encodeur.encode(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + DUREE_SESSION_S })));
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await cle(), encodeur.encode(charge)));
  return `${charge}.${b64url(sig)}`;
}

export async function sessionValide(jeton: string | undefined): Promise<boolean> {
  if (!jeton) return false;
  const [charge, sig] = jeton.split(".");
  if (!charge || !sig) return false;
  try {
    const ok = await crypto.subtle.verify("HMAC", await cle(), depuisB64url(sig), encodeur.encode(charge));
    if (!ok) return false;
    const { exp } = JSON.parse(new TextDecoder().decode(depuisB64url(charge))) as { exp: number };
    return exp > Date.now() / 1000;
  } catch {
    return false;
  }
}
