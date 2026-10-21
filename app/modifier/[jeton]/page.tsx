import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExternalLink, Heart } from "lucide-react";
import { modifierParJeton } from "@/app/actions/ami";
import FormulaireLettre from "@/components/FormulaireLettre";
import Suivi from "@/components/Suivi";
import { prisma } from "@/lib/db";
import { mediasSignes } from "@/lib/fichiers";
import { origine } from "@/lib/url";
import { BoutonCopier } from "@/components/Boutons";

export const metadata: Metadata = { title: "Ma lettre · Mots doux" };

// Page de l'ami à qui la lettre est prêtée : son lien secret est son seul accès.
export default async function ModifierLettre({ params }: { params: Promise<{ jeton: string }> }) {
  const { jeton } = await params;
  const d = await prisma.declaration.findUnique({ where: { jetonEdition: jeton } });
  if (!d) notFound();
  const lien = `${await origine()}/pour/${d.slug}`;

  return (
    <div className="min-h-dvh bg-stone-100 text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3">
          <Heart size={20} className="text-rose-600" fill="currentColor" strokeWidth={0} />
          <span className="font-script text-2xl text-rose-900">Mots doux</span>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-semibold">Votre lettre pour {d.prenom}</h1>
        <p className="mt-1 text-sm text-stone-500">
          Écrivez votre message, ajoutez vos photos (5 au plus) et une vidéo, signez, puis envoyez-lui le lien. Gardez cette page pour vous : son adresse permet de
          modifier la lettre.
        </p>
        <div className="mt-3">
          <Suivi d={d} />
        </div>

        <div className="mt-6 rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-stone-800">Lien à lui envoyer</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-lg bg-stone-100 px-3 py-1.5 text-sm text-stone-700">{lien}</code>
            <BoutonCopier texte={lien} />
            <a
              href={`${lien}?apercu=1`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              <ExternalLink size={15} /> Relire
            </a>
          </div>
        </div>

        <div className="mt-6 rounded-3xl bg-white p-5 shadow-sm sm:p-8">
          <FormulaireLettre
            action={modifierParJeton.bind(null, jeton)}
            valeurs={d}
            medias={await mediasSignes(d)}
            jeton={jeton}
            admin={false}
            libelle="Enregistrer ma lettre"
          />
        </div>
      </main>
    </div>
  );
}
