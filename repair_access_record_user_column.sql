ALTER TABLE "Rooms_Records" DROP CONSTRAINT IF EXISTS "room_records_user_id_fkey";
ALTER TABLE "Rooms_Records" DROP CONSTRAINT IF EXISTS "Rooms_Records_userId_fkey";
ALTER TABLE "Rooms_Records" RENAME COLUMN "user_id" TO "userId";
ALTER TABLE "Rooms_Records" ADD CONSTRAINT "Rooms_Records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
