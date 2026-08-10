-- CreateTable
CREATE TABLE "Room_Request" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_Request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CardToRoom_Request" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_RoomToRoom_Request" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_Room_RequestToUser" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_CardToRoom_Request_AB_unique" ON "_CardToRoom_Request"("A", "B");

-- CreateIndex
CREATE INDEX "_CardToRoom_Request_B_index" ON "_CardToRoom_Request"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_RoomToRoom_Request_AB_unique" ON "_RoomToRoom_Request"("A", "B");

-- CreateIndex
CREATE INDEX "_RoomToRoom_Request_B_index" ON "_RoomToRoom_Request"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_Room_RequestToUser_AB_unique" ON "_Room_RequestToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_Room_RequestToUser_B_index" ON "_Room_RequestToUser"("B");

-- AddForeignKey
ALTER TABLE "_CardToRoom_Request" ADD CONSTRAINT "_CardToRoom_Request_A_fkey" FOREIGN KEY ("A") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CardToRoom_Request" ADD CONSTRAINT "_CardToRoom_Request_B_fkey" FOREIGN KEY ("B") REFERENCES "Room_Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RoomToRoom_Request" ADD CONSTRAINT "_RoomToRoom_Request_A_fkey" FOREIGN KEY ("A") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RoomToRoom_Request" ADD CONSTRAINT "_RoomToRoom_Request_B_fkey" FOREIGN KEY ("B") REFERENCES "Room_Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Room_RequestToUser" ADD CONSTRAINT "_Room_RequestToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Room_Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Room_RequestToUser" ADD CONSTRAINT "_Room_RequestToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
