/*
  Warnings:

  - A unique constraint covering the columns `[ruid]` on the table `Room` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Room_ruid_key" ON "Room"("ruid");
