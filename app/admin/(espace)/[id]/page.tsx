import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CircleCheck, ExternalLink, Home, KeyRound, RotateCcw, Trash2 } from "lucide-react";
import {
  basculerAccueil,
  modifierDeclaration,
  nouveauLienAmi,
  reinitialiserSuivi,
  supprimerDeclaration,
} from "@/app/actions/admin";
import { BoutonAction, BoutonCopier } from "@/components/Boutons";
import FormulaireLettre from "@/components/FormulaireLettre";
import Suivi from "@/components/Suivi";
import { prisma } from "@/lib/db";
import { mediasSignes } from "@/lib/fichiers";
import { origine } from "@/lib/url";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ cree?: string }> };

function Lien({ titre, aide, url }: { titre: string; aide: string; url: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-stone-800">{titre}</p>
      <p className="text-xs text-stone-500">{aide}</p>
      <div className="mt-2 flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-lg bg-stone-100 px-3 py-1.5 text-sm text-stone-700">{url}</code>
        <BoutonCopier texte={url} />
        <a href={url} target="_blank" rel="noreferrer" className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100" aria-label="Ouvrir">
          <ExternalLink size={17} />
        </a>
      </div>
    </div>
  );
}

export default async function DetailLettre({ params, searchParams }: Props) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const d = await prisma.declaration.findUnique({ where: { id } });
  if (!d) notFound();
  const base = await origine();
  const { cree } = await searchParams;

  return (
    <>
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800">
        <ArrowLeft size={16} /> Toutes les lettres
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="font-script text-4xl text-rose-900">{d.prenom}</h1>
        <Suivi d={d} />
      </div>

      {cree && (
        <p className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CircleCheck size={18} /> Lettre créée. Relisez-la, puis envoyez le lien.
        </p>
      )}

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <Lien titre="Lien de la lettre" aide="À envoyer à l'amoureuse." url={`${base}/pour/${d.slug}`} />
        <Lien titre="Lien pour l'ami" aide="Il modifie lui-même le message, le prénom et la photo." url={`${base}/modifier/${d.jetonEdition}`} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <BoutonAction action={basculerAccueil.bind(null, d.id)}>
          <Home size={16} /> {d.accueil ? "Retirer de l'accueil" : "Afficher à l'accueil du site"}
        </BoutonAction>
        <BoutonAction
          action={reinitialiserSuivi.bind(null, d.id)}
          confirmation="Remettre à zéro les ouvertures et la réponse ?"
        >
          <RotateCcw size={16} /> Remettre le suivi à zéro
        </BoutonAction>
        <BoutonAction
          action={nouveauLienAmi.bind(null, d.id)}
          confirmation="L'ancien lien de l'ami ne fonctionnera plus. Continuer ?"
        >
          <KeyRound size={16} /> Nouveau lien pour l&apos;ami
        </BoutonAction>
        <BoutonAction
          action={supprimerDeclaration.bind(null, d.id)}
          confirmation={`Supprimer définitivement la lettre pour ${d.prenom} et ses fichiers ?`}
          danger
        >
          <Trash2 size={16} /> Supprimer
        </BoutonAction>
      </div>

      <div className="mt-6 rounded-3xl bg-white p-5 shadow-sm sm:p-8">
        <FormulaireLettre
          action={modifierDeclaration.bind(null, d.id)}
          valeurs={d}
          medias={await mediasSignes(d)}
          admin
          libelle="Enregistrer"
        />
      </div>
    </>
  );
}
