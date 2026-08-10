/*
  Warnings:

  - You are about to drop the `fingerprints` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "fingerprints" DROP CONSTRAINT "fingerprints_room_id_fkey";

-- DropForeignKey
ALTER TABLE "fingerprints" DROP CONSTRAINT "fingerprints_user_id_fkey";

-- DropTable
DROP TABLE "fingerprints";

-- CreateTable
CREATE TABLE "fingerprint_mappings" (
    "id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "finger_id" INTEGER NOT NULL,
    "user_id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fingerprint_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fingerprint_mappings_device_id_finger_id_key" ON "fingerprint_mappings"("device_id", "finger_id");

-- AddForeignKey
ALTER TABLE "fingerprint_mappings" ADD CONSTRAINT "fingerprint_mappings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fingerprint_mappings" ADD CONSTRAINT "fingerprint_mappings_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
