import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ErreurSaisie } from "./auth";
import { MEDIAS } from "./declarations";

// Photos et vidéo sur Backblaze B2, par son API compatible S3. Le compartiment
// reste privé : le navigateur y dépose les fichiers par des liens d'envoi signés
// (une vidéo dépasse la limite de 4,5 Mo des fonctions Vercel), et on ne les
// relit que par des liens de lecture signés.
const conf = {
  id: process.env.B2_KEY_ID,
  cle: process.env.B2_APPLICATION_KEY,
  bucket: process.env.B2_BUCKET,
  endpoint: process.env.B2_ENDPOINT,
};

export const stockageActif = Boolean(conf.id && conf.cle && conf.bucket && conf.endpoint);

function client() {
  // La région est la 2e partie de l'endpoint : s3.<region>.backblazeb2.com
  const region = conf.endpoint!.replace(/^https?:\/\//, "").split(".")[1] ?? "us-west-004";
  return new S3Client({
    region,
    endpoint: conf.endpoint,
    credentials: { accessKeyId: conf.id!, secretAccessKey: conf.cle! },
    // Sinon le SDK ajoute aux liens signés des sommes de contrôle que le navigateur n'envoie pas.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
}

export type Nature = "photo" | "video";

const TYPES: Record<Nature, Record<string, string>> = {
  photo: { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" },
  video: { "video/mp4": "mp4", "video/quicktime": "mov", "video/webm": "webm" },
};

const prefixe = (nature: Nature) => `lettres/${nature}s/`;

/** Lien d'envoi signé, valable 30 minutes, pour un nouveau fichier. */
export async function lienEnvoi(nature: Nature, type: string): Promise<{ cle: string; url: string }> {
  if (!stockageActif) throw new ErreurSaisie("Le stockage des photos (Backblaze B2) n'est pas encore configuré.");
  const ext = TYPES[nature][type];
  if (!ext) {
    throw new ErreurSaisie(nature === "photo" ? "Format de photo accepté : JPEG, PNG ou WebP." : "Format de vidéo accepté : MP4, MOV ou WebM.");
  }
  const cle = `${prefixe(nature)}${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
  const url = await getSignedUrl(client(), new PutObjectCommand({ Bucket: conf.bucket, Key: cle, ContentType: type }), {
    expiresIn: 1800,
  });
  return { cle, url };
}

/** Vérifie qu'un fichier annoncé par le navigateur a bien été déposé, au bon endroit et pas trop lourd. */
export async function verifierEnvoi(cle: string, nature: Nature): Promise<void> {
  if (!stockageActif || !cle.startsWith(prefixe(nature)) || cle.includes("..")) throw new ErreurSaisie("Fichier inconnu.");
  const tete = await client()
    .send(new HeadObjectCommand({ Bucket: conf.bucket, Key: cle }))
    .catch(() => null);
  if (!tete) throw new ErreurSaisie("Un fichier n'est pas arrivé jusqu'au stockage : réessayez l'envoi.");
  const max = nature === "photo" ? MEDIAS.photoOctets : MEDIAS.videoOctets;
  if ((tete.ContentLength ?? 0) > max) {
    await supprimerFichiers([cle]);
    throw new ErreurSaisie(nature === "photo" ? "Photo trop lourde." : `Vidéo trop lourde : ${MEDIAS.videoOctets / 1024 / 1024} Mo au maximum.`);
  }
}

/** Lien de lecture valable 6 heures : la lettre peut rester ouverte longtemps. */
export async function lienSigne(cle: string | null): Promise<string | null> {
  if (!cle || !stockageActif) return null;
  return getSignedUrl(client(), new GetObjectCommand({ Bucket: conf.bucket, Key: cle }), { expiresIn: 6 * 3600 });
}

/** Supprime des fichiers remplacés ; un échec ne doit pas bloquer l'enregistrement. */
export async function supprimerFichiers(cles: string[]): Promise<void> {
  if (!stockageActif) return;
  const s3 = client();
  await Promise.all(
    cles.map((cle) =>
      s3.send(new DeleteObjectCommand({ Bucket: conf.bucket, Key: cle })).catch((e) => console.error("Suppression B2 impossible :", cle, e)),
    ),
  );
}

/** Photos et vidéo d'une lettre avec leurs liens de lecture, pour le formulaire ou la lettre. */
export async function mediasSignes(d: { photos: string[]; videoCle: string | null }) {
  const photos = await Promise.all(d.photos.map(async (cle) => ({ cle, url: await lienSigne(cle) })));
  const videoUrl = await lienSigne(d.videoCle);
  return {
    photos: photos.filter((p): p is { cle: string; url: string } => p.url !== null),
    video: d.videoCle && videoUrl ? { cle: d.videoCle, url: videoUrl } : null,
  };
}
