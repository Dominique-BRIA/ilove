import Link from "next/link";
import { ChevronRight, Film, Home, ImageOff, Images, PenLine, Plus, UserRound } from "lucide-react";
import Suivi from "@/components/Suivi";
import { prisma } from "@/lib/db";
import { lienSigne } from "@/lib/fichiers";
import { comptesParLettre } from "@/lib/journal";

export default async function TableauDeBord() {
  const lettres = await prisma.declaration.findMany({ orderBy: [{ accueil: "desc" }, { creeLe: "desc" }] });
  const comptes = await comptesParLettre();
  const photos = await Promise.all(lettres.map((d) => lienSigne(d.photos[0] ?? null)));

  return (
    <>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Lettres</h1>
          <p className="mt-1 text-sm text-stone-500">
            {lettres.length === 0 ? "Aucune lettre pour le moment." : `${lettres.length} lettre${lettres.length > 1 ? "s" : ""}`}
          </p>
        </div>
        <Link
          href="/admin/nouvelle"
          className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-700"
        >
          <Plus size={18} /> Nouvelle lettre
        </Link>
      </div>

      <ul className="mt-6 space-y-3">
        {lettres.map((d, i) => (
          <li key={d.id}>
            <Link href={`/admin/${d.id}`} className="flex items-center gap-4 rounded-2xl bg-white p-3 shadow-sm transition hover:shadow-md">
              <div className="flex h-20 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-stone-100">
                {photos[i] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photos[i]!} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ImageOff size={20} className="text-stone-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-script text-2xl text-rose-900">{d.prenom}</span>
                  <span className="truncate text-sm text-stone-500">/pour/{d.slug}</span>
                  {d.accueil && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-2 py-0.5 text-xs font-medium text-white">
                      <Home size={12} /> À la une
                    </span>
                  )}
                </div>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-stone-600">
                  <span className="inline-flex items-center gap-1">
                    <PenLine size={14} /> {d.auteur ? `Signée ${d.auteur}` : "Pas encore signée"}
                  </span>
                  {d.ami && (
                    <span className="inline-flex items-center gap-1">
                      <UserRound size={14} /> Prêtée à {d.ami}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Images size={14} /> {d.photos.length}
                  </span>
                  {d.videoCle && <Film size={14} aria-label="Avec vidéo" />}
                </p>
                <div className="mt-2">
                  <Suivi d={d} comptes={comptes.get(d.id)} />
                </div>
              </div>
              <ChevronRight className="shrink-0 text-stone-400" />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
