/**
 * Contrôle de Backblaze B2 par le même chemin que le navigateur : lien d'envoi
 * signé, dépôt, vérification, lecture par lien signé, puis suppression.
 *   npx tsx --env-file=.env scripts/tester-stockage.ts
 */
import { lienEnvoi, lienSigne, stockageActif, supprimerFichiers, verifierEnvoi } from "../lib/fichiers";

async function main() {
  if (!stockageActif) throw new Error("Variables B2_* absentes : stockage désactivé.");
  // PNG de 1 × 1 pixel rose.
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP4/5/hPwAHggJ/PrnB3wAAAABJRU5ErkJggg==", "base64");
  const { cle, url } = await lienEnvoi("photo", "image/png");
  const envoi = await fetch(url, { method: "PUT", headers: { "Content-Type": "image/png" }, body: png });
  if (!envoi.ok) throw new Error(`dépôt refusé : HTTP ${envoi.status} ${await envoi.text()}`);
  console.log("déposé par lien signé :", cle);
  await verifierEnvoi(cle, "photo");
  console.log("vérifié dans le stockage");
  const r = await fetch((await lienSigne(cle))!);
  console.log("relu par lien signé : HTTP", r.status, (await r.arrayBuffer()).byteLength, "octets");
  await supprimerFichiers([cle]);
  console.log("supprimé : le stockage fonctionne.");
}

main().catch((e) => {
  console.error("Échec :", e instanceof Error ? e.message : e);
  process.exit(1);
});
