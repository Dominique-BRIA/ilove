import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Heart } from "lucide-react";
import { estAdmin } from "@/lib/auth";
import FormulaireConnexion from "./FormulaireConnexion";

export const metadata: Metadata = { title: "Connexion · Mots doux" };

export default async function Connexion() {
  if (await estAdmin()) redirect("/admin");
  return (
    <main className="flex min-h-dvh items-center justify-center bg-stone-100 px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl">
        <div className="flex items-center gap-2">
          <Heart size={22} className="text-rose-600" fill="currentColor" strokeWidth={0} />
          <span className="font-script text-3xl text-rose-900">Mots doux</span>
        </div>
        <h1 className="mt-6 text-xl font-semibold text-stone-900">Plateforme de contrôle</h1>
        <p className="mt-1 text-sm text-stone-500">Entrez le mot de passe administrateur.</p>
        <FormulaireConnexion />
      </div>
    </main>
  );
}
