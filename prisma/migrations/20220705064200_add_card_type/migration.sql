-- CreateEnum
CREATE TYPE "CARD_TYPE" AS ENUM ('card_id', 'card_atm', 'card_driver', 'card_emoney', 'card_studentid');

-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "type" "CARD_TYPE" NOT NULL DEFAULT E'card_id';
