-- CreateTable
CREATE TABLE "Evenement" (
    "id" SERIAL NOT NULL,
    "declarationId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appareil" TEXT,
    "lieu" TEXT,

    CONSTRAINT "Evenement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Evenement_declarationId_date_idx" ON "Evenement"("declarationId", "date");

-- AddForeignKey
ALTER TABLE "Evenement" ADD CONSTRAINT "Evenement_declarationId_fkey" FOREIGN KEY ("declarationId") REFERENCES "Declaration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

