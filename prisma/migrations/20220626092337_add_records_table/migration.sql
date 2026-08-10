-- CreateTable
CREATE TABLE "Rooms_Records" (
    "id" SERIAL NOT NULL,
    "roomId" INTEGER NOT NULL,
    "cardId" INTEGER NOT NULL,

    CONSTRAINT "Rooms_Records_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Rooms_Records" ADD CONSTRAINT "Rooms_Records_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rooms_Records" ADD CONSTRAINT "Rooms_Records_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
