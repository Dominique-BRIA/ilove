"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Check, Copy, Loader2 } from "lucide-react";

export function BoutonCopier({ texte, libelle = "Copier" }: { texte: string; libelle?: string }) {
  const [copie, setCopie] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(texte);
        setCopie(true);
        setTimeout(() => setCopie(false), 1800);
      }}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
    >
      {copie ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
      {copie ? "Copié" : libelle}
    </button>
  );
}

/** Bouton d'action serveur, avec confirmation facultative avant les gestes irréversibles. */
export function BoutonAction({
  action,
  confirmation,
  children,
  danger = false,
}: {
  action: () => Promise<void>;
  confirmation?: string;
  children: ReactNode;
  danger?: boolean;
}) {
  const [enCours, demarrer] = useTransition();
  return (
    <button
      type="button"
      disabled={enCours}
      onClick={() => {
        if (confirmation && !window.confirm(confirmation)) return;
        demarrer(() => action());
      }}
      className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition disabled:opacity-60 ${
        danger ? "border-red-200 bg-white text-red-700 hover:bg-red-50" : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
      }`}
    >
      {enCours && <Loader2 size={15} className="animate-spin" />}
      {children}
    </button>
  );
}
