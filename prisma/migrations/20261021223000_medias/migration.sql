-- AlterTable
ALTER TABLE "Declaration" DROP COLUMN "photoCle",
ADD COLUMN     "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "videoCle" TEXT;

