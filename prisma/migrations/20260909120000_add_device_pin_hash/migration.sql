ALTER TABLE "pin_credentials" ADD COLUMN "device_pin_hash" TEXT;
CREATE UNIQUE INDEX "pin_credentials_device_pin_hash_key" ON "pin_credentials"("device_pin_hash");
