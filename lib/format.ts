// Heure du Cameroun : les dates du suivi doivent se lire à l'heure locale, pas à celle du serveur Vercel.
const DATE = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Africa/Douala",
});

export function dateHeure(d: Date): string {
  return DATE.format(d).replace(":", " h ");
}
