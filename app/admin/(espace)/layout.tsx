import type { Metadata } from "next";
import Link from "next/link";
import { Heart, LogOut } from "lucide-react";
import { seDeconnecter } from "@/app/actions/admin";
import { exigerAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Plateforme de contrôle · Mots doux" };

export default async function EspaceAdmin({ children }: { children: React.ReactNode }) {
  await exigerAdmin();
  return (
    <div className="min-h-dvh bg-stone-100 text-stone-900">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link href="/admin" className="flex items-center gap-2">
            <Heart size={20} className="text-rose-600" fill="currentColor" strokeWidth={0} />
            <span className="font-script text-2xl text-rose-900">Mots doux</span>
          </Link>
          <form action={seDeconnecter}>
            <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-100">
              <LogOut size={16} /> Déconnexion
            </button>
          </form>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-4 py-8">{children}</div>
    </div>
  );
}
