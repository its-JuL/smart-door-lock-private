-- AlterTable
ALTER TABLE "Rooms_Records"
ADD COLUMN "deviceId" TEXT,
ADD COLUMN "detail" TEXT,
ADD COLUMN "capturePath" TEXT;

-- AddForeignKey
ALTER TABLE "Rooms_Records"
ADD CONSTRAINT "Rooms_Records_deviceId_fkey"
FOREIGN KEY ("deviceId") REFERENCES "Device"("device_id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Rooms_Records_deviceId_createdAt_idx"
ON "Rooms_Records"("deviceId", "createdAt");

-- CreateIndex
CREATE INDEX "Rooms_Records_authenticationMethod_isSuccess_createdAt_idx"
ON "Rooms_Records"("authenticationMethod", "isSuccess", "createdAt");
