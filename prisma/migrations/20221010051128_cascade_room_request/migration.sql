-- DropForeignKey
ALTER TABLE "Room_Request" DROP CONSTRAINT "Room_Request_cardId_fkey";

-- DropForeignKey
ALTER TABLE "Room_Request" DROP CONSTRAINT "Room_Request_roomId_fkey";

-- AddForeignKey
ALTER TABLE "Room_Request" ADD CONSTRAINT "Room_Request_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room_Request" ADD CONSTRAINT "Room_Request_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
