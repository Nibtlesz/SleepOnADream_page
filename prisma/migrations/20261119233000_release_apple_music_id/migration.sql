-- AlterTable
ALTER TABLE "Release" ADD COLUMN     "appleMusicId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Release_appleMusicId_key" ON "Release"("appleMusicId");

