-- AlterTable
ALTER TABLE "User" ADD COLUMN "google_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_google_id_key" ON "User"("google_id");
