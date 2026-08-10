/*
  Warnings:

  - You are about to drop the `_BuildingToRoom` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_BuildingToRoom" DROP CONSTRAINT "_BuildingToRoom_A_fkey";

-- DropForeignKey
ALTER TABLE "_BuildingToRoom" DROP CONSTRAINT "_BuildingToRoom_B_fkey";

-- DropTable
DROP TABLE "_BuildingToRoom";

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE SET NULL ON UPDATE CASCADE;
