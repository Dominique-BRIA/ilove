# Mots doux

Des lettres d'amour en ligne, une page par amoureuse : une enveloppe à ouvrir, un cœur en 3D,
jusqu'à 5 photos (dont un carrousel 3D), une vidéo, le message, la signature, et une question
à laquelle on ne peut répondre que « oui » (le bouton « Non » s'enfuit).

La plateforme de contrôle (`/admin`) gère toutes les lettres et permet d'en **prêter une à un ami** :
il reçoit un lien secret pour écrire lui-même son message, le prénom de sa copine, sa signature,
et téléverser ses photos et sa vidéo. L'administrateur peut tout corriger ensuite, signature comprise.

## Pages

| Adresse | Pour qui | Rôle |
|---|---|---|
| `/` | tout le monde | la lettre « à la une » (sinon une présentation) |
| `/pour/<adresse>` | l'amoureuse | la lettre |
| `/admin` | l'administrateur | liste, création, modification, suivi (ouverte ? « oui » reçu ?) |
| `/modifier/<jeton>` | l'ami | modifier sa lettre, sans compte |

Les visites de l'administrateur et les relectures de l'ami (`?apercu=1`) ne comptent pas dans le suivi.
Avant d'envoyer le lien, « Remettre le suivi à zéro » efface ses propres essais.

## Lancer en local

```bash
npm install
cp .env.example .env        # renseigner les variables (voir plus bas)
npx prisma migrate deploy   # crée la table
npm run db:seed             # crée la lettre de Blanche, à la une
npm run dev                 # http://localhost:3000, admin sur /admin
```

## Déploiement : Neon, Backblaze B2, Vercel

1. **Neon** : chaîne « pooled » (hôte `-pooler`) dans `DATABASE_URL` avec `&pgbouncer=true`,
   chaîne directe dans `DIRECT_URL`. Retirer `channel_binding=require`, que Prisma ne gère pas.
2. **Backblaze B2** : compartiment privé, clé limitée à ce compartiment ; renseigner `B2_KEY_ID`,
   `B2_APPLICATION_KEY`, `B2_BUCKET` et `B2_ENDPOINT` (`https://s3.<region>.backblazeb2.com`).
   Le navigateur dépose les fichiers directement par des liens signés : le compartiment doit avoir
   une règle CORS autorisant `s3_put`, `s3_get` et `s3_head` (déjà en place sur `jetaime`).
   Contrôle : `npx tsx --env-file=.env scripts/tester-stockage.ts`.
3. **Vercel** : importer le dépôt GitHub, ajouter les variables ci-dessus, `ADMIN_PASSWORD` et
   `SESSION_SECRET` (32 caractères aléatoires au moins), puis déployer. La commande de build applique
   les migrations avant de compiler. La région `fra1` (Francfort) est celle de la base Neon.

## Architecture

- **Next.js 16** (App Router), actions serveur ; chaque action d'administration revérifie la session.
- **Prisma 6 et PostgreSQL (Neon)** : une table `Declaration`.
- **Backblaze B2** par son API S3 : photos réduites dans le navigateur (1600 px, JPEG), vidéo
  jusqu'à 200 Mo ; le serveur vérifie chaque fichier déposé avant de l'enregistrer.
- **Three.js** pour le cœur et la pluie de cœurs en 3D, chargé seulement sur la page de la lettre ;
  sans WebGL, ou si le téléphone demande moins d'animations, des cœurs plats prennent le relais.
