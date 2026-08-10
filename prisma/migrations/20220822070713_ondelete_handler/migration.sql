-- DropForeignKey
ALTER TABLE "Rooms_Records" DROP CONSTRAINT "Rooms_Records_roomId_fkey";

-- AddForeignKey
ALTER TABLE "Rooms_Records" ADD CONSTRAINT "Rooms_Records_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;
