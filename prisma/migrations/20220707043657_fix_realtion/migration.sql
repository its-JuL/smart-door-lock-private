/*
  Warnings:

  - You are about to drop the `_RoomToRoom_Request` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_Room_RequestToUser` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `roomId` to the `Room_Request` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_RoomToRoom_Request" DROP CONSTRAINT "_RoomToRoom_Request_A_fkey";

-- DropForeignKey
ALTER TABLE "_RoomToRoom_Request" DROP CONSTRAINT "_RoomToRoom_Request_B_fkey";

-- DropForeignKey
ALTER TABLE "_Room_RequestToUser" DROP CONSTRAINT "_Room_RequestToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_Room_RequestToUser" DROP CONSTRAINT "_Room_RequestToUser_B_fkey";

-- AlterTable
ALTER TABLE "Room_Request" ADD COLUMN     "roomId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "_RoomToRoom_Request";

-- DropTable
DROP TABLE "_Room_RequestToUser";

-- AddForeignKey
ALTER TABLE "Room_Request" ADD CONSTRAINT "Room_Request_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
