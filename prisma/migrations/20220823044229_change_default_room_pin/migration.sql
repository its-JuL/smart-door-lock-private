/*
  Warnings:

  - Made the column `pin` on table `Room` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Room" ALTER COLUMN "pin" SET NOT NULL,
ALTER COLUMN "pin" SET DEFAULT '$2b$10$MA.L1/xba8c9hy7tOFm9eOnFf/dELLcNXrC3KPXlzEZrd.1pdW1CW';
