import type { Declaration } from "@prisma/client";
import { Eye, EyeOff, Heart, MailOpen, Mail } from "lucide-react";
import { dateHeure } from "@/lib/format";

/** Où en est la lettre : jamais ouverte, ouverte, ou « oui » reçu. */
export default function Suivi({ d }: { d: Pick<Declaration, "active" | "ouvertures" | "ouverteLe" | "repondueLe"> }) {
  return (
    <div className="flex flex-wrap gap-2 text-xs font-medium">
      {!d.active && (
        <span className="inline-flex items-center gap-1 rounded-full bg-stone-200 px-2.5 py-1 text-stone-700">
          <EyeOff size={13} /> Hors ligne
        </span>
      )}
      {d.repondueLe ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-rose-700">
          <Heart size={13} fill="currentColor" strokeWidth={0} /> A dit oui le {dateHeure(d.repondueLe)}
        </span>
      ) : null}
      {d.ouverteLe ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
          <MailOpen size={13} /> Ouverte le {dateHeure(d.ouverteLe)}
          {d.ouvertures > 1 && (
            <>
              <Eye size={13} className="ml-1" /> {d.ouvertures} fois
            </>
          )}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">
          <Mail size={13} /> Pas encore ouverte
        </span>
      )}
    </div>
  );
}
