/*
  Warnings:

  - The primary key for the `Card` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "Rooms_Records" DROP CONSTRAINT "Rooms_Records_cardId_fkey";

-- DropForeignKey
ALTER TABLE "_CardToRoom" DROP CONSTRAINT "_CardToRoom_A_fkey";

-- DropForeignKey
ALTER TABLE "_CardToRoom_Request" DROP CONSTRAINT "_CardToRoom_Request_A_fkey";

-- AlterTable
ALTER TABLE "Card" DROP CONSTRAINT "Card_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Card_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Card_id_seq";

-- AlterTable
ALTER TABLE "Rooms_Records" ALTER COLUMN "cardId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "_CardToRoom" ALTER COLUMN "A" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "_CardToRoom_Request" ALTER COLUMN "A" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "Rooms_Records" ADD CONSTRAINT "Rooms_Records_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CardToRoom" ADD CONSTRAINT "_CardToRoom_A_fkey" FOREIGN KEY ("A") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CardToRoom_Request" ADD CONSTRAINT "_CardToRoom_Request_A_fkey" FOREIGN KEY ("A") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;
