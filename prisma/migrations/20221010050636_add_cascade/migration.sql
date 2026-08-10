-- DropForeignKey
ALTER TABLE "Device" DROP CONSTRAINT "Device_roomId_fkey";

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
