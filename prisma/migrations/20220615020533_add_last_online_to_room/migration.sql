/*
  Warnings:

  - Added the required column `lastOnline` to the `Room` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "lastOnline" TIMESTAMP(3) NOT NULL;
