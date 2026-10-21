import type { Metadata, Viewport } from "next";
import { Great_Vibes, Lora } from "next/font/google";
import "./globals.css";

const script = Great_Vibes({ subsets: ["latin"], weight: "400", variable: "--font-script", display: "swap" });
const serif = Lora({ subsets: ["latin"], variable: "--font-serif", display: "swap", style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: { default: "Mots doux", template: "%s" },
  description: "Une lettre d'amour en ligne, rien que pour elle.",
  // Les lettres sont personnelles : aucun moteur de recherche ne doit les indexer.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#e11d48",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${script.variable} ${serif.variable}`}>
      <body className="min-h-dvh bg-rose-50 antialiased">{children}</body>
    </html>
  );
}
