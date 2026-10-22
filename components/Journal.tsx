import type { Evenement } from "@prisma/client";
import { Eye, Heart, History, MailOpen, MapPin, Smartphone } from "lucide-react";
import { dateHeure } from "@/lib/format";
import { TYPES_EVENEMENT, type TypeEvenement } from "@/lib/journal";

const ICONES: Record<TypeEvenement, React.ReactNode> = {
  VISITE: <Eye size={16} className="text-sky-600" />,
  OUVERTURE: <MailOpen size={16} className="text-emerald-600" />,
  OUI: <Heart size={16} className="text-rose-600" fill="currentColor" strokeWidth={0} />,
};

/** Chaque visite, ouverture de l'enveloppe et « oui », du plus récent au plus ancien. */
export default function Journal({ evenements, total }: { evenements: Evenement[]; total: number }) {
  return (
    <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm sm:p-8">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <History size={20} className="text-stone-500" /> Journal
      </h2>
      {evenements.length === 0 ? (
        <p className="mt-2 text-sm text-stone-500">Rien pour le moment : la lettre n&apos;a pas encore été visitée.</p>
      ) : (
        <>
          <ul className="mt-4 divide-y divide-stone-100">
            {evenements.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5 text-sm">
                <span className="flex w-44 items-center gap-2 font-medium text-stone-800">
                  {ICONES[e.type as TypeEvenement]}
                  {TYPES_EVENEMENT[e.type as TypeEvenement] ?? e.type}
                </span>
                <span className="w-40 text-stone-600">{dateHeure(e.date)}</span>
                {e.appareil && (
                  <span className="inline-flex items-center gap-1 text-stone-500">
                    <Smartphone size={14} /> {e.appareil}
                  </span>
                )}
                {e.lieu && (
                  <span className="inline-flex items-center gap-1 text-stone-500">
                    <MapPin size={14} /> {e.lieu}
                  </span>
                )}
              </li>
            ))}
          </ul>
          {total > evenements.length && (
            <p className="mt-3 text-xs text-stone-500">
              {evenements.length} plus récents affichés sur {total}.
            </p>
          )}
        </>
      )}
    </section>
  );
}
