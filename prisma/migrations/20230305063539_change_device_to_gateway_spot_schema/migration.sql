/*
  Warnings:

  - You are about to drop the column `gateway_DeviceId` on the `Device` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Device" DROP CONSTRAINT "Device_gateway_DeviceId_fkey";

-- AlterTable
ALTER TABLE "Device" DROP COLUMN "gateway_DeviceId",
ADD COLUMN     "gateway_SpotId" TEXT;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_gateway_SpotId_fkey" FOREIGN KEY ("gateway_SpotId") REFERENCES "Gateway_Spot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
