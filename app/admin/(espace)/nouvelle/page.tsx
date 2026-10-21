import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { creerDeclaration } from "@/app/actions/admin";
import FormulaireLettre from "@/components/FormulaireLettre";

export default function NouvelleLettre() {
  return (
    <>
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800">
        <ArrowLeft size={16} /> Toutes les lettres
      </Link>
      <h1 className="mt-3 text-2xl font-semibold">Nouvelle lettre</h1>
      <div className="mt-6 rounded-3xl bg-white p-5 shadow-sm sm:p-8">
        <FormulaireLettre action={creerDeclaration} admin libelle="Créer la lettre" />
      </div>
    </>
  );
}
