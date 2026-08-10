-- DropForeignKey
ALTER TABLE "Rooms_Records" DROP CONSTRAINT "Rooms_Records_cardId_fkey";

-- AddForeignKey
ALTER TABLE "Rooms_Records" ADD CONSTRAINT "Rooms_Records_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE SET NULL ON UPDATE CASCADE;
