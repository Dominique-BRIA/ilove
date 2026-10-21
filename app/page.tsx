import type { Metadata } from "next";
import { Heart, Mail, PenLine } from "lucide-react";
import PageLettre from "@/components/PageLettre";
import { prisma } from "@/lib/db";

// La racine du site affiche la lettre « mise à la une » depuis la plateforme de contrôle.
// Rendue à chaque visite : les liens signés des photos expirent.
export const dynamic = "force-dynamic";

const chargerAccueil = () => prisma.declaration.findFirst({ where: { accueil: true, active: true } });

export async function generateMetadata(): Promise<Metadata> {
  const d = await chargerAccueil();
  return d ? { title: `Une lettre pour ${d.prenom}` } : { title: "Mots doux" };
}

export default async function Accueil() {
  const d = await chargerAccueil();
  if (d) return <PageLettre d={d} />;

  return (
    <main className="theme-rose fond-lettre flex flex-col items-center justify-center px-6 text-center">
      <Heart size={56} className="battre text-rose-600" fill="currentColor" strokeWidth={0} />
      <h1 className="mt-6 font-script text-6xl text-rose-900">Mots doux</h1>
      <p className="mt-4 max-w-md font-serif text-lg text-rose-950/80">
        Une lettre d&apos;amour en ligne : une enveloppe à ouvrir, une photo, quelques mots, et une question à laquelle on ne
        peut répondre que oui.
      </p>
      <div className="mt-10 grid max-w-lg gap-4 text-left sm:grid-cols-2">
        <div className="rounded-2xl bg-white/70 p-5 shadow-sm">
          <PenLine className="text-rose-600" size={22} />
          <p className="mt-2 font-serif text-rose-950">Votre message, son prénom, votre plus belle photo.</p>
        </div>
        <div className="rounded-2xl bg-white/70 p-5 shadow-sm">
          <Mail className="text-rose-600" size={22} />
          <p className="mt-2 font-serif text-rose-950">Un lien à lui envoyer, et vous savez quand elle l&apos;a ouverte.</p>
        </div>
      </div>
    </main>
  );
}
