-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Declaration" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "nomEnveloppe" TEXT,
    "auteur" TEXT,
    "message" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "photoCle" TEXT,
    "theme" TEXT NOT NULL DEFAULT 'rose',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "accueil" BOOLEAN NOT NULL DEFAULT false,
    "ami" TEXT,
    "jetonEdition" TEXT NOT NULL,
    "ouvertures" INTEGER NOT NULL DEFAULT 0,
    "ouverteLe" TIMESTAMP(3),
    "repondueLe" TIMESTAMP(3),
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "majLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Declaration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Declaration_slug_key" ON "Declaration"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Declaration_jetonEdition_key" ON "Declaration"("jetonEdition");

