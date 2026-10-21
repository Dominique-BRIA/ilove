import type { Declaration } from "@prisma/client";
import { estTheme } from "@/lib/declarations";
import { mediasSignes } from "@/lib/fichiers";
import Lettre from "./Lettre";

/** Page complète d'une lettre : fond du thème, puis l'enveloppe à ouvrir. */
export default async function PageLettre({ d, apercu = false }: { d: Declaration; apercu?: boolean }) {
  const theme = estTheme(d.theme) ? d.theme : "rose";
  const medias = await mediasSignes(d);
  return (
    <main className={`theme-${theme} fond-lettre relative overflow-x-hidden`}>
      <Lettre
        slug={d.slug}
        prenom={d.prenom}
        nomEnveloppe={d.nomEnveloppe}
        auteur={d.auteur}
        message={d.message}
        question={d.question}
        photos={medias.photos.map((m) => m.url)}
        videoUrl={medias.video?.url ?? null}
        apercu={apercu}
      />
    </main>
  );
}
