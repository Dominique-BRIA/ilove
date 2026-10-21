"use client";

import { startTransition, useActionState, useState } from "react";
import { Check, CircleAlert, Film, ImagePlus, Loader2, Star, Trash2, X } from "lucide-react";
import { preparerEnvoi } from "@/app/actions/medias";
import { LIMITES, MEDIAS, QUESTION_PAR_DEFAUT, THEMES, type Etat, type Theme } from "@/lib/declarations";

export interface ValeursLettre {
  prenom: string;
  nomEnveloppe: string | null;
  auteur: string | null;
  message: string;
  question: string;
  theme: string;
  slug: string;
  ami: string | null;
  active: boolean;
}

/** Fichier déjà dans le stockage (cle) ou choisi et pas encore envoyé (fichier). */
export interface Media {
  cle?: string;
  url: string;
  fichier?: File;
}

const PASTILLES: Record<Theme, string> = {
  rose: "linear-gradient(135deg, #fff1f2, #fbcfe8 60%, #e11d48)",
  rouge: "linear-gradient(135deg, #3b0a10, #8b1a26 60%, #fff4e8)",
  nuit: "linear-gradient(135deg, #0b1026, #3b2a6b 60%, #f9a8d4)",
};

/** Réduit la photo dans le navigateur (1600 px de côté au plus, JPEG) : l'envoi reste rapide sur mobile. */
async function reduirePhoto(f: File): Promise<File> {
  try {
    const image = await createImageBitmap(f);
    const echelle = Math.min(1, 1600 / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.width * echelle);
    canvas.height = Math.round(image.height * echelle);
    canvas.getContext("2d")!.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/jpeg", 0.86));
    return blob ? new File([blob], "photo.jpg", { type: "image/jpeg" }) : f;
  } catch {
    return f;
  }
}

/** Certains téléphones ne donnent pas le type de la vidéo : on le déduit de l'extension. */
function typeVideo(f: File): string {
  if (f.type) return f.type;
  const ext = f.name.split(".").pop()?.toLowerCase();
  return ext === "mov" ? "video/quicktime" : ext === "webm" ? "video/webm" : "video/mp4";
}

/** Dépose le fichier dans Backblaze B2 par le lien signé, en suivant la progression. */
function deposer(url: string, fichier: File, type: string, progres: (octets: number) => void): Promise<void> {
  return new Promise((ok, echec) => {
    const x = new XMLHttpRequest();
    x.open("PUT", url);
    x.setRequestHeader("Content-Type", type);
    x.upload.onprogress = (e) => progres(e.loaded);
    x.onload = () => (x.status < 300 ? ok() : echec(new Error(`Le stockage a refusé le fichier (HTTP ${x.status}).`)));
    x.onerror = () => echec(new Error("Connexion interrompue pendant l'envoi. Réessayez."));
    x.send(fichier);
  });
}

const champ =
  "mt-1 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-stone-900 shadow-sm outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100";
const etiquette = "block text-sm font-medium text-stone-700";
const bouton =
  "inline-flex cursor-pointer items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm hover:bg-stone-50";

export default function FormulaireLettre({
  action,
  valeurs,
  medias,
  admin,
  jeton,
  libelle,
}: {
  action: (etat: Etat, fd: FormData) => Promise<Etat>;
  valeurs?: Partial<ValeursLettre>;
  medias?: { photos: Media[]; video: Media | null };
  admin: boolean;
  /** Lien secret de l'ami : il autorise l'envoi des fichiers sans session admin. */
  jeton?: string;
  libelle: string;
}) {
  const [etat, envoyer, enCours] = useActionState(action, undefined);
  const [photos, setPhotos] = useState<Media[]>(medias?.photos ?? []);
  const [video, setVideo] = useState<Media | null>(medias?.video ?? null);
  const [preparation, setPreparation] = useState(false);
  const [envoi, setEnvoi] = useState<{ fait: number; total: number } | null>(null);
  const [erreurLocale, setErreurLocale] = useState<string | null>(null);
  const [theme, setTheme] = useState(valeurs?.theme ?? "rose");

  async function ajouterPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const choisies = Array.from(e.target.files ?? []);
    e.target.value = "";
    const place = MEDIAS.photos - photos.length;
    if (choisies.length > place) setErreurLocale(`${MEDIAS.photos} photos au maximum : seules les ${place} premières sont ajoutées.`);
    else setErreurLocale(null);
    setPreparation(true);
    const reduites = await Promise.all(choisies.slice(0, place).map(reduirePhoto));
    setPreparation(false);
    setPhotos((p) => [...p, ...reduites.map((f) => ({ fichier: f, url: URL.createObjectURL(f) }))].slice(0, MEDIAS.photos));
  }

  function choisirVideo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!MEDIAS.typesVideo.includes(typeVideo(f))) return setErreurLocale("Format de vidéo accepté : MP4, MOV ou WebM.");
    if (f.size > MEDIAS.videoOctets) return setErreurLocale(`Vidéo trop lourde : ${MEDIAS.videoOctets / 1024 / 1024} Mo au maximum.`);
    setErreurLocale(null);
    setVideo({ fichier: f, url: URL.createObjectURL(f) });
  }

  async function soumettre(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.delete("choixPhotos");
    fd.delete("choixVideo");
    setErreurLocale(null);

    // 1. Les nouveaux fichiers partent directement vers le stockage.
    const aEnvoyer = [...photos, ...(video ? [video] : [])].filter((m) => m.fichier);
    const total = aEnvoyer.reduce((s, m) => s + m.fichier!.size, 0);
    const deposes = new Map<Media, string>();
    let fait = 0;
    if (aEnvoyer.length) setEnvoi({ fait: 0, total });
    try {
      for (const m of aEnvoyer) {
        const estVideo = m === video;
        const type = estVideo ? typeVideo(m.fichier!) : m.fichier!.type;
        const r = await preparerEnvoi(jeton ?? null, estVideo ? "video" : "photo", type);
        if ("erreur" in r) throw new Error(r.erreur);
        await deposer(r.url, m.fichier!, type, (o) => setEnvoi({ fait: fait + o, total }));
        fait += m.fichier!.size;
        deposes.set(m, r.cle);
      }
    } catch (err) {
      setEnvoi(null);
      setErreurLocale(err instanceof Error ? err.message : "Envoi impossible.");
      return;
    }
    setEnvoi(null);

    // Les fichiers déposés ne seront pas renvoyés si l'enregistrement échoue puis est relancé.
    const avecCle = (m: Media): Media => (deposes.has(m) ? { cle: deposes.get(m), url: m.url } : m);
    const photosFinales = photos.map(avecCle);
    const videoFinale = video ? avecCle(video) : null;
    setPhotos(photosFinales);
    setVideo(videoFinale);

    // 2. Le formulaire n'emporte que les clés, puis le serveur vérifie chaque fichier.
    fd.set("photos", JSON.stringify(photosFinales.map((m) => m.cle)));
    fd.set("video", videoFinale?.cle ?? "");
    startTransition(() => envoyer(fd));
  }

  const occupe = enCours || preparation || envoi !== null;
  const erreur = erreurLocale ?? etat?.erreur;

  return (
    <form onSubmit={soumettre} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className={etiquette}>Prénom de votre amoureuse *</span>
          <input name="prenom" required maxLength={LIMITES.prenom} defaultValue={valeurs?.prenom} placeholder="Blanche" className={champ} />
        </label>
        <label className="block">
          <span className={etiquette}>Nom sur l&apos;enveloppe</span>
          <input
            name="nomEnveloppe"
            maxLength={LIMITES.nomEnveloppe}
            defaultValue={valeurs?.nomEnveloppe ?? ""}
            placeholder="Blanche Tchiengang"
            className={champ}
          />
        </label>
      </div>

      <label className="block">
        <span className={etiquette}>Votre message *</span>
        <textarea
          name="message"
          required
          rows={9}
          maxLength={LIMITES.message}
          defaultValue={valeurs?.message}
          placeholder={"Depuis que tu es entrée dans ma vie…\n\nLaissez une ligne vide entre deux paragraphes."}
          className={`${champ} font-serif leading-relaxed`}
        />
        <span className="mt-1 block text-xs text-stone-500">Une ligne vide sépare deux paragraphes ; ils apparaissent l&apos;un après l&apos;autre.</span>
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className={etiquette}>Votre nom (signature) *</span>
          <input name="auteur" required maxLength={LIMITES.auteur} defaultValue={valeurs?.auteur ?? ""} placeholder="Votre prénom" className={champ} />
          <span className="mt-1 block text-xs text-stone-500">Écrit à la main sous l&apos;enveloppe et à la fin de la lettre.</span>
        </label>
        <label className="block">
          <span className={etiquette}>Question finale</span>
          <input name="question" maxLength={LIMITES.question} defaultValue={valeurs?.question ?? QUESTION_PAR_DEFAUT} className={champ} />
        </label>
      </div>

      <fieldset>
        <legend className={etiquette}>Ambiance</legend>
        <div className="mt-2 grid grid-cols-3 gap-3">
          {(Object.keys(THEMES) as Theme[]).map((t) => (
            <label
              key={t}
              className={`cursor-pointer rounded-xl border-2 p-2 text-center text-sm transition ${
                theme === t ? "border-rose-500 bg-rose-50" : "border-stone-200 bg-white hover:border-stone-300"
              }`}
            >
              <input type="radio" name="theme" value={t} checked={theme === t} onChange={() => setTheme(t)} className="sr-only" />
              <span className="block h-12 rounded-lg" style={{ background: PASTILLES[t] }} />
              <span className="mt-1.5 block font-medium text-stone-700">{THEMES[t]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <div className="flex items-baseline justify-between">
          <span className={etiquette}>Photos</span>
          <span className="text-xs text-stone-500">
            {photos.length} / {MEDIAS.photos} · la première sert de couverture
          </span>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-5">
          {photos.map((m, i) => (
            <div key={m.url} className="group relative aspect-[4/5] overflow-hidden rounded-lg border border-stone-200 bg-stone-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.url} alt="" className="h-full w-full object-cover" />
              {i === 0 ? (
                <span className="absolute left-1 top-1 inline-flex items-center gap-1 rounded-full bg-rose-600 px-2 py-0.5 text-[11px] font-medium text-white">
                  <Star size={11} fill="currentColor" /> Couverture
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setPhotos((p) => [m, ...p.filter((x) => x !== m)])}
                  className="absolute left-1 top-1 rounded-full bg-white/90 p-1 text-stone-700 shadow hover:text-rose-600"
                  aria-label="Mettre en couverture"
                  title="Mettre en couverture"
                >
                  <Star size={14} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setPhotos((p) => p.filter((x) => x !== m))}
                className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-stone-700 shadow hover:text-red-600"
                aria-label="Retirer cette photo"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          {photos.length < MEDIAS.photos && (
            <label className="flex aspect-[4/5] cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-stone-300 bg-white text-center text-xs text-stone-500 hover:border-rose-300 hover:text-rose-600">
              {preparation ? <Loader2 size={22} className="animate-spin" /> : <ImagePlus size={22} />}
              Ajouter
              <input name="choixPhotos" type="file" accept="image/*" multiple onChange={ajouterPhotos} className="sr-only" />
            </label>
          )}
        </div>
      </div>

      <div>
        <span className={etiquette}>Vidéo</span>
        <div className="mt-2 flex flex-wrap items-center gap-4">
          {video ? (
            <video src={video.url} controls playsInline preload="metadata" className="h-36 max-w-full rounded-lg bg-black" />
          ) : (
            <div className="flex h-24 w-32 items-center justify-center rounded-lg border border-stone-200 bg-stone-100">
              <Film className="text-stone-400" size={28} />
            </div>
          )}
          <div className="space-y-2">
            <label className={bouton}>
              <Film size={16} />
              {video ? "Changer la vidéo" : "Choisir une vidéo"}
              <input name="choixVideo" type="file" accept="video/mp4,video/quicktime,video/webm,video/*" onChange={choisirVideo} className="sr-only" />
            </label>
            {video && (
              <button type="button" onClick={() => setVideo(null)} className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-red-600">
                <Trash2 size={14} /> Retirer la vidéo
              </button>
            )}
            <p className="text-xs text-stone-500">MP4 de préférence, {MEDIAS.videoOctets / 1024 / 1024} Mo au plus.</p>
          </div>
        </div>
      </div>

      {admin && (
        <div className="space-y-5 rounded-2xl border border-stone-200 bg-stone-50 p-5">
          <p className="text-sm font-semibold text-stone-800">Réglages de la plateforme</p>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className={etiquette}>Adresse de la lettre</span>
              <div className="mt-1 flex items-center rounded-xl border border-stone-300 bg-white pl-3.5 shadow-sm focus-within:border-rose-400 focus-within:ring-4 focus-within:ring-rose-100">
                <span className="text-sm text-stone-500">/pour/</span>
                <input
                  name="slug"
                  maxLength={LIMITES.slug}
                  defaultValue={valeurs?.slug}
                  placeholder="automatique"
                  className="w-full rounded-xl bg-transparent px-1 py-2.5 text-stone-900 outline-none"
                />
              </div>
            </label>
            <label className="block">
              <span className={etiquette}>Prêtée à (note interne)</span>
              <input name="ami" maxLength={LIMITES.ami} defaultValue={valeurs?.ami ?? ""} placeholder="Nom de l'ami" className={champ} />
            </label>
          </div>
          <label className="flex items-center gap-3 text-sm text-stone-700">
            <input type="checkbox" name="active" defaultChecked={valeurs?.active ?? true} className="h-4 w-4 accent-rose-600" />
            Lettre en ligne (décochez pour la masquer sans la supprimer)
          </label>
        </div>
      )}

      {erreur && (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <CircleAlert size={18} className="mt-px shrink-0" /> {erreur}
        </p>
      )}
      {etat?.ok && !erreurLocale && !occupe && (
        <p role="status" className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <Check size={18} /> {etat.ok}
        </p>
      )}

      {envoi && (
        <div className="space-y-1.5">
          <div className="h-2 overflow-hidden rounded-full bg-stone-200">
            <div className="h-full rounded-full bg-rose-500 transition-[width]" style={{ width: `${Math.round((envoi.fait / envoi.total) * 100)}%` }} />
          </div>
          <p className="text-xs text-stone-500">Envoi des fichiers… {Math.round((envoi.fait / envoi.total) * 100)} %</p>
        </div>
      )}

      <button
        type="submit"
        disabled={occupe}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-60 sm:w-auto"
      >
        {occupe && <Loader2 size={18} className="animate-spin" />}
        {envoi ? "Envoi des fichiers…" : enCours ? "Enregistrement…" : libelle}
      </button>
    </form>
  );
}
