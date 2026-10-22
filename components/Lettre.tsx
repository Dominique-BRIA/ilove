"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import dynamic from "next/dynamic";
import { Clapperboard, Heart, HeartCrack, Images, Sparkles } from "lucide-react";
import { noterOui, noterOuverture, noterVisite } from "@/app/actions/lettre";
import Carrousel3D from "./Carrousel3D";
import Inclinable from "./Inclinable";

// Three.js ne tourne que dans le navigateur, et seulement sur cette page.
const Coeur3D = dynamic(() => import("./Scene3D").then((m) => m.Coeur3D), { ssr: false });
const PluieDeCoeurs3D = dynamic(() => import("./Scene3D").then((m) => m.PluieDeCoeurs3D), { ssr: false });

export interface LettreProps {
  slug: string;
  prenom: string;
  nomEnveloppe: string | null;
  auteur: string | null;
  message: string;
  question: string;
  /** Liens de lecture signés ; la première photo sert de couverture. */
  photos: string[];
  videoUrl: string | null;
  /** Relecture par l'ami : ni la visite, ni l'ouverture, ni la réponse ne sont enregistrées. */
  apercu?: boolean;
}

// Le bouton « Non » change d'avis à chaque tentative… et finit toujours par s'enfuir.
const REFUS = [
  "Non",
  "Tu es sûre ?",
  "Vraiment sûre ?",
  "Réfléchis encore…",
  "Allez…",
  "Dernière chance !",
  "Tu me brises le cœur",
  "Essaie plutôt l'autre bouton",
];

interface Eclat {
  dx: number;
  dy: number;
  rot: number;
  taille: number;
  delai: number;
}

function reduireAnimations() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function Lettre(p: LettreProps) {
  const [etape, setEtape] = useState<"enveloppe" | "ouverture" | "lettre">("enveloppe");
  const [refus, setRefus] = useState(0);
  const [posNon, setPosNon] = useState<{ x: number; y: number } | null>(null);
  const [oui, setOui] = useState(false);
  const [eclats, setEclats] = useState<Eclat[]>([]);
  const zone = useRef<HTMLDivElement>(null);
  const boutonNon = useRef<HTMLButtonElement>(null);
  const boutonOui = useRef<HTMLButtonElement>(null);
  const finLettre = useRef<HTMLDivElement>(null);
  const visiteNotee = useRef(false);

  // La visite est notée depuis le navigateur, pas au rendu serveur : l'aperçu de
  // lien que WhatsApp ou Messenger fabriquent en recevant l'adresse ne compte pas.
  useEffect(() => {
    if (p.apercu || visiteNotee.current) return;
    visiteNotee.current = true;
    noterVisite(p.slug).catch(() => {});
  }, [p.apercu, p.slug]);

  const paragraphes = p.message.split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean);
  // Chaque paragraphe apparaît après le précédent, puis la signature, les souvenirs et la question.
  const delaiTexte = (i: number) => 1.1 + i * 0.6;
  const delaiSignature = delaiTexte(paragraphes.length);
  const delaiQuestion = delaiSignature + 0.6;
  const couverture = p.photos[0] ?? null;

  function ouvrir() {
    if (etape !== "enveloppe") return;
    setEtape("ouverture");
    if (!p.apercu) noterOuverture(p.slug).catch(() => {});
    setTimeout(() => setEtape("lettre"), reduireAnimations() ? 0 : 1300);
  }

  function fuir() {
    const z = zone.current?.getBoundingClientRect();
    const n = boutonNon.current?.getBoundingClientRect();
    const o = boutonOui.current?.getBoundingClientRect();
    setRefus((r) => r + 1);
    if (!z || !n || !o) return;
    // Le libellé suivant peut être plus long : on garde de la marge.
    const l = n.width + 60;
    const h = n.height;
    const ox = o.left - z.left;
    const oy = o.top - z.top;
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * Math.max(0, z.width - l);
      const y = Math.random() * Math.max(0, z.height - h);
      const chevauche = x < ox + o.width + 16 && x + l + 16 > ox && y < oy + o.height + 16 && y + h + 16 > oy;
      const memePlace = posNon && Math.hypot(x - posNon.x, y - posNon.y) < 60;
      if (!chevauche && !memePlace) {
        setPosNon({ x, y });
        return;
      }
    }
  }

  function direOui() {
    if (oui) return;
    setOui(true);
    if (!p.apercu) noterOui(p.slug).catch(() => {});
    if (!reduireAnimations()) {
      setEclats(
        Array.from({ length: 42 }, () => {
          const angle = Math.random() * Math.PI * 2;
          const distance = 120 + Math.random() * 320;
          return {
            dx: Math.cos(angle) * distance,
            dy: Math.sin(angle) * distance - 80,
            rot: Math.random() * 90 - 45,
            taille: 14 + Math.random() * 26,
            delai: Math.random() * 0.25,
          };
        }),
      );
    }
    setTimeout(() => finLettre.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  }

  const enveloppe = (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div className={`enveloppe-scene flex w-full max-w-sm flex-col items-center ${etape === "ouverture" ? "ouverture" : ""}`}>
        <Coeur3D className="apparaitre mb-2 h-28 w-28" />
        <p className="apparaitre text-xs font-medium uppercase tracking-[0.35em] opacity-80">Une lettre pour</p>
        <h1 className="apparaitre mt-2 text-center font-script text-5xl leading-tight sm:text-6xl" style={{ animationDelay: "0.2s" }}>
          {p.nomEnveloppe || p.prenom}
        </h1>
        <Inclinable className="apparaitre mt-10 w-full" force={18}>
          <button
            type="button"
            onClick={ouvrir}
            aria-label="Ouvrir la lettre"
            className="w-full rounded-xl outline-none focus-visible:ring-4 focus-visible:ring-[var(--coeur)]"
          >
            <svg viewBox="0 0 320 210" className="w-full drop-shadow-2xl">
              <rect x="0" y="0" width="320" height="210" rx="12" fill="var(--enveloppe)" />
              <path d="M0 210 L160 100 L320 210 Z" fill="var(--enveloppe-2)" />
              <path d="M0 6 L148 112 L0 204 Z" fill="var(--enveloppe-3)" opacity="0.55" />
              <path d="M320 6 L172 112 L320 204 Z" fill="var(--enveloppe-3)" opacity="0.55" />
              <path className="rabat" d="M0 4 Q0 0 6 0 L314 0 Q320 0 320 4 L160 122 Z" fill="var(--enveloppe-3)" />
              <g className="sceau">
                <circle cx="160" cy="118" r="26" fill="var(--accent)" />
                <circle cx="160" cy="118" r="21" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.5" />
                <path
                  transform="translate(148 106)"
                  d="M12 21s-7.4-4.5-9.6-9.2C.9 8.5 3 4.5 6.8 4.5c2.1 0 3.6 1.1 5.2 3 1.6-1.9 3.1-3 5.2-3 3.8 0 5.9 4 4.4 7.3C19.4 16.5 12 21 12 21z"
                  fill="#fff"
                />
              </g>
            </svg>
          </button>
        </Inclinable>
        {p.auteur && (
          <p className="apparaitre mt-5 text-center font-serif text-sm italic opacity-90" style={{ animationDelay: "0.7s" }}>
            de la part de <span className="font-script text-3xl not-italic">{p.auteur}</span>
          </p>
        )}
        <p className="apparaitre mt-6 flex items-center gap-2 text-sm opacity-80" style={{ animationDelay: "0.9s" }}>
          <Heart size={14} fill="currentColor" strokeWidth={0} className="battre" />
          Touche l&apos;enveloppe pour l&apos;ouvrir
        </p>
      </div>
    </div>
  );

  const lettre = (
    <div className="relative px-4 py-10 sm:py-16">
      <article className="apparaitre mx-auto max-w-xl rounded-[2rem] bg-[var(--carte)] px-6 pb-12 pt-8 text-[var(--encre)] shadow-2xl sm:px-12">
        {couverture ? (
          <Inclinable className="apparaitre mx-auto -mt-2 mb-8 w-[85%] max-w-sm" force={16}>
            <figure className="-rotate-2 rounded-sm bg-white p-3 pb-10 shadow-xl">
              {/* Lien signé vers Backblaze B2 : pas d'optimisation d'image Next à travers ce lien temporaire. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={couverture} alt={p.prenom} className="aspect-[4/5] w-full object-cover" />
              <figcaption className="mt-3 flex items-center justify-center gap-2 font-script text-2xl text-[var(--doux)]">
                {p.prenom}
                <Heart size={16} fill="var(--accent)" strokeWidth={0} />
              </figcaption>
            </figure>
          </Inclinable>
        ) : (
          <Coeur3D className="apparaitre mx-auto -mt-2 mb-4 h-40 w-40" />
        )}

        <h1 className="apparaitre font-script text-5xl text-[var(--accent)] sm:text-6xl" style={{ animationDelay: "0.7s" }}>
          {p.prenom},
        </h1>

        <div className="mt-6 space-y-5 font-serif text-lg leading-relaxed sm:text-xl">
          {paragraphes.map((t, i) => (
            <p key={i} className="apparaitre whitespace-pre-line" style={{ animationDelay: `${delaiTexte(i)}s` }}>
              {t}
            </p>
          ))}
        </div>

        {p.auteur && (
          <div className="apparaitre mt-10 flex flex-col items-end" style={{ animationDelay: `${delaiSignature}s` }}>
            <p className="font-serif italic text-[var(--doux)]">Avec tout mon amour,</p>
            <p className="mt-1 font-script text-5xl leading-tight text-[var(--accent)]">{p.auteur}</p>
            <svg viewBox="0 0 160 14" className="-mt-1 w-40 text-[var(--accent)]" aria-hidden>
              <path d="M2 9 C 40 2, 70 13, 100 7 S 150 3, 158 8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>
        )}

        {p.photos.length > 1 && (
          <section className="apparaitre -mx-4 mt-14 sm:-mx-8" style={{ animationDelay: `${delaiQuestion}s` }}>
            <h2 className="flex items-center justify-center gap-2 font-script text-4xl text-[var(--accent)]">
              <Images size={22} className="shrink-0" /> Nos souvenirs
            </h2>
            <div className="mt-4">
              <Carrousel3D photos={p.photos} prenom={p.prenom} />
            </div>
          </section>
        )}

        {p.videoUrl && (
          <section className="apparaitre mt-14" style={{ animationDelay: `${delaiQuestion}s` }}>
            <h2 className="flex items-center justify-center gap-2 font-script text-4xl text-[var(--accent)]">
              <Clapperboard size={22} className="shrink-0" /> Un petit film pour toi
            </h2>
            <div className="mt-5 rounded-2xl bg-[var(--encre)] p-1.5 shadow-2xl">
              <video src={p.videoUrl} controls playsInline preload="metadata" className="max-h-[70vh] w-full rounded-xl bg-black" />
            </div>
          </section>
        )}

        <div ref={finLettre} className="apparaitre mt-12 border-t border-black/10 pt-10" style={{ animationDelay: `${delaiQuestion}s` }}>
          {oui ? (
            <div className="apparaitre text-center">
              <Coeur3D battre className="mx-auto h-56 w-56" />
              <p className="mt-2 font-script text-5xl text-[var(--accent)]">Je le savais !</p>
              <p className="mt-4 font-serif text-xl">
                {p.prenom}, je t&apos;aime. Aujourd&apos;hui, demain, et tous les jours d&apos;après.
              </p>
              {p.auteur && <p className="mt-6 font-script text-3xl text-[var(--doux)]">{p.auteur}</p>}
            </div>
          ) : (
            <>
              <p className="flex items-center justify-center gap-2 text-center font-serif text-2xl italic">
                <Sparkles size={20} className="shrink-0 text-[var(--accent)]" />
                {p.question}
              </p>
              <div ref={zone} className="relative mt-6 h-56 w-full touch-none select-none">
                <button
                  ref={boutonOui}
                  type="button"
                  onClick={direOui}
                  className="absolute left-[8%] top-1/2 flex origin-left items-center gap-2 rounded-full bg-[var(--accent)] px-7 py-3 text-lg font-semibold text-white shadow-lg transition-transform duration-300 hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--coeur)]"
                  style={{ transform: `translateY(-50%) scale(${1 + Math.min(refus, 8) * 0.1})` }}
                >
                  <Heart size={18} fill="currentColor" strokeWidth={0} />
                  Oui
                </button>
                <button
                  ref={boutonNon}
                  type="button"
                  onPointerEnter={(e) => e.pointerType === "mouse" && fuir()}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    fuir();
                  }}
                  onClick={fuir}
                  className={`absolute flex items-center gap-2 whitespace-nowrap rounded-full border border-black/15 bg-white px-5 py-2.5 text-base text-[var(--encre)] shadow transition-all duration-300 ${
                    posNon ? "" : "right-[8%] top-1/2 -translate-y-1/2"
                  }`}
                  style={posNon ? { left: posNon.x, top: posNon.y } : undefined}
                >
                  {refus >= 4 && <HeartCrack size={16} className="text-[var(--doux)]" />}
                  {REFUS[Math.min(refus, REFUS.length - 1)]}
                </button>
              </div>
            </>
          )}
        </div>
      </article>

      {eclats.map((e, i) => (
        <Heart
          key={i}
          aria-hidden
          className="eclat pointer-events-none"
          fill="currentColor"
          strokeWidth={0}
          size={e.taille}
          style={
            {
              "--dx": `${e.dx}px`,
              "--dy": `${e.dy}px`,
              "--rot": `${e.rot}deg`,
              animationDelay: `${e.delai}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );

  return (
    <>
      <PluieDeCoeurs3D />
      {etape === "lettre" ? lettre : enveloppe}
    </>
  );
}
