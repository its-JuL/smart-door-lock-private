/*
  Warnings:

  - You are about to drop the column `lastOnline` on the `Room` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "lastOnline" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Room" DROP COLUMN "lastOnline";
