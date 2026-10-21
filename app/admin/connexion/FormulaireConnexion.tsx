"use client";

import { useActionState } from "react";
import { CircleAlert, Loader2, LogIn } from "lucide-react";
import { seConnecter } from "@/app/actions/admin";

export default function FormulaireConnexion() {
  const [etat, action, enCours] = useActionState(seConnecter, undefined);
  return (
    <form action={action} className="mt-6 space-y-4">
      <input
        type="password"
        name="motDePasse"
        required
        autoFocus
        autoComplete="current-password"
        placeholder="Mot de passe"
        className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
      />
      {etat?.erreur && (
        <p role="alert" className="flex items-center gap-2 text-sm text-red-600">
          <CircleAlert size={16} /> {etat.erreur}
        </p>
      )}
      <button
        disabled={enCours}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 py-2.5 font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
      >
        {enCours ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
        Entrer
      </button>
    </form>
  );
}
