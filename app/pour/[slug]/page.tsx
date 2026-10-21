import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageLettre from "@/components/PageLettre";
import { prisma } from "@/lib/db";

const charger = cache((slug: string) => prisma.declaration.findFirst({ where: { slug, active: true } }));

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ apercu?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = await charger((await params).slug);
  if (!d) return { title: "Lettre introuvable" };
  return {
    title: `Une lettre pour ${d.prenom}`,
    description: "Quelqu'un t'a écrit une lettre. Ouvre-la.",
    // Pas de photo dans l'aperçu du lien : elle reste réservée à la lettre.
    openGraph: { title: `Une lettre pour ${d.prenom}`, description: "Quelqu'un t'a écrit une lettre. Ouvre-la." },
  };
}

export default async function Page({ params, searchParams }: Props) {
  const d = await charger((await params).slug);
  if (!d) notFound();
  return <PageLettre d={d} apercu={(await searchParams).apercu === "1"} />;
}
