"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Les photos en polaroïds, façon « coverflow » : celle du centre face à nous,
 * les voisines inclinées en profondeur. Défile seul, au doigt ou aux flèches.
 */
export default function Carrousel3D({ photos, prenom }: { photos: string[]; prenom: string }) {
  const n = photos.length;
  const [courante, setCourante] = useState(0);
  const [pause, setPause] = useState(false);
  const [decalage, setDecalage] = useState(0);
  const depart = useRef<number | null>(null);

  useEffect(() => {
    if (pause || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setCourante((c) => (c + 1) % n), 3500);
    return () => clearInterval(t);
  }, [pause, n]);

  function aller(sens: number) {
    setPause(true);
    setCourante((c) => (c + sens + n) % n);
  }

  /** Écart circulaire le plus court entre la photo i et la photo courante (−2 … 2). */
  function ecart(i: number) {
    let k = i - courante;
    if (k > n / 2) k -= n;
    if (k < -n / 2) k += n;
    return k;
  }

  return (
    <div>
      <div
        className="relative mx-auto h-[320px] w-full touch-pan-y select-none overflow-hidden"
        style={{ perspective: 900 }}
        onPointerDown={(e) => {
          depart.current = e.clientX;
          setPause(true);
        }}
        onPointerMove={(e) => depart.current !== null && setDecalage(e.clientX - depart.current)}
        onPointerUp={() => {
          if (Math.abs(decalage) > 40) aller(decalage < 0 ? 1 : -1);
          depart.current = null;
          setDecalage(0);
        }}
        onPointerCancel={() => {
          depart.current = null;
          setDecalage(0);
        }}
        onPointerLeave={() => {
          depart.current = null;
          setDecalage(0);
        }}
      >
        {photos.map((src, i) => {
          const k = ecart(i);
          const ak = Math.abs(k);
          return (
            <figure
              key={src}
              onClick={() => k !== 0 && aller(k)}
              className="absolute left-1/2 top-1/2 h-[270px] w-[200px] rounded-sm bg-white p-2 pb-9 shadow-2xl"
              style={{
                transform: `translate(-50%, -50%) translateX(${k * 62 + decalage * 0.4}%) translateZ(${-ak * 140}px) rotateY(${-k * 38}deg) rotateZ(${k ? 0 : -2}deg)`,
                zIndex: 10 - ak,
                opacity: ak > 2 ? 0 : 1 - ak * 0.18,
                filter: ak ? `brightness(${1 - ak * 0.12})` : undefined,
                transition: depart.current !== null ? "none" : "transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.8s, filter 0.8s",
                cursor: k ? "pointer" : "grab",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`${prenom}, photo ${i + 1}`} draggable={false} className="h-full w-full object-cover" />
            </figure>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => aller(-1)}
          aria-label="Photo précédente"
          className="rounded-full bg-white p-2 text-[var(--accent)] shadow ring-1 ring-black/10 hover:brightness-95"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex gap-1.5">
          {photos.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full bg-[var(--accent)] transition-all ${i === courante ? "w-5" : "w-1.5 opacity-30"}`} />
          ))}
        </div>
        <button
          type="button"
          onClick={() => aller(1)}
          aria-label="Photo suivante"
          className="rounded-full bg-white p-2 text-[var(--accent)] shadow ring-1 ring-black/10 hover:brightness-95"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
