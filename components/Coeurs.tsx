import type { CSSProperties } from "react";
import { Heart } from "lucide-react";

// Positions fixes (pas de hasard) : le rendu serveur et le navigateur doivent coïncider.
const COEURS = Array.from({ length: 18 }, (_, i) => ({
  gauche: (i * 37 + 11) % 100,
  taille: 12 + ((i * 7) % 5) * 6,
  duree: 11 + ((i * 5) % 7) * 2,
  delai: -((i * 13) % 22),
  derive: (i % 2 ? 1 : -1) * (10 + ((i * 3) % 30)),
  opacite: 0.3 + ((i * 3) % 5) * 0.1,
}));

export function CoeursFlottants() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      {COEURS.map((c, i) => (
        <Heart
          key={i}
          className="coeur-flottant"
          fill="currentColor"
          strokeWidth={0}
          size={c.taille}
          style={
            {
              left: `${c.gauche}%`,
              "--duree": `${c.duree}s`,
              "--delai": `${c.delai}s`,
              "--derive": `${c.derive}px`,
              "--opacite": c.opacite,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
