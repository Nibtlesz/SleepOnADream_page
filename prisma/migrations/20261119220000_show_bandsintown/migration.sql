-- AlterTable
ALTER TABLE "Show" ADD COLUMN     "bandsintownId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Show_bandsintownId_key" ON "Show"("bandsintownId");

