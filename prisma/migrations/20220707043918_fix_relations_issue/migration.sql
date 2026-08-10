/*
  Warnings:

  - You are about to drop the `_CardToRoom_Request` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `cardId` to the `Room_Request` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_CardToRoom_Request" DROP CONSTRAINT "_CardToRoom_Request_A_fkey";

-- DropForeignKey
ALTER TABLE "_CardToRoom_Request" DROP CONSTRAINT "_CardToRoom_Request_B_fkey";

-- AlterTable
ALTER TABLE "Room_Request" ADD COLUMN     "cardId" TEXT NOT NULL;

-- DropTable
DROP TABLE "_CardToRoom_Request";

-- AddForeignKey
ALTER TABLE "Room_Request" ADD CONSTRAINT "Room_Request_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
