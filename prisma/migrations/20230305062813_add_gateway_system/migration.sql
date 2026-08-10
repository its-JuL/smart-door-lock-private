-- CreateEnum
CREATE TYPE "DEVICE_TYPE" AS ENUM ('SINGLE_NETWORK', 'MULTI_NETWORK');

-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "deviceType" "DEVICE_TYPE" DEFAULT 'SINGLE_NETWORK',
ADD COLUMN     "firmwareVersion" TEXT,
ADD COLUMN     "gateway_DeviceId" TEXT;

-- CreateTable
CREATE TABLE "Gateway_Device" (
    "id" TEXT NOT NULL,
    "gateway_short_id" TEXT NOT NULL,
    "pin" TEXT NOT NULL,
    "lastOnline" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Gateway_Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gateway_Spot" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "gateway_DeviceId" TEXT NOT NULL,

    CONSTRAINT "Gateway_Spot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Gateway_Device_gateway_short_id_key" ON "Gateway_Device"("gateway_short_id");

-- CreateIndex
CREATE UNIQUE INDEX "Gateway_Spot_gateway_DeviceId_key" ON "Gateway_Spot"("gateway_DeviceId");

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_gateway_DeviceId_fkey" FOREIGN KEY ("gateway_DeviceId") REFERENCES "Gateway_Device"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gateway_Spot" ADD CONSTRAINT "Gateway_Spot_gateway_DeviceId_fkey" FOREIGN KEY ("gateway_DeviceId") REFERENCES "Gateway_Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
