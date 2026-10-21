import { HeartCrack } from "lucide-react";

export default function Introuvable() {
  return (
    <main className="theme-rose fond-lettre flex flex-col items-center justify-center px-6 text-center">
      <HeartCrack size={48} className="text-rose-600" />
      <h1 className="mt-4 font-script text-5xl text-rose-900">Lettre introuvable</h1>
      <p className="mt-3 max-w-sm font-serif text-rose-950/80">
        Ce lien ne mène à aucune lettre, ou elle n&apos;est plus en ligne. Vérifiez l&apos;adresse reçue.
      </p>
    </main>
  );
}
