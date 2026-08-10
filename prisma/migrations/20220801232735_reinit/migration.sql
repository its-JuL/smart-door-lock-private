/*
  Warnings:

  - The primary key for the `Profil` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Role` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Room` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Room_Request` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Rooms_Records` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "Room_Request" DROP CONSTRAINT "Room_Request_roomId_fkey";

-- DropForeignKey
ALTER TABLE "Rooms_Records" DROP CONSTRAINT "Rooms_Records_roomId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_roleId_fkey";

-- DropForeignKey
ALTER TABLE "_CardToRoom" DROP CONSTRAINT "_CardToRoom_B_fkey";

-- AlterTable
ALTER TABLE "Profil" DROP CONSTRAINT "Profil_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Profil_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Profil_id_seq";

-- AlterTable
ALTER TABLE "Role" DROP CONSTRAINT "Role_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Role_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Role_id_seq";

-- AlterTable
ALTER TABLE "Room" DROP CONSTRAINT "Room_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Room_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Room_id_seq";

-- AlterTable
ALTER TABLE "Room_Request" DROP CONSTRAINT "Room_Request_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "roomId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Room_Request_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Room_Request_id_seq";

-- AlterTable
ALTER TABLE "Rooms_Records" DROP CONSTRAINT "Rooms_Records_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "roomId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Rooms_Records_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Rooms_Records_id_seq";

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "roleId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "_CardToRoom" ALTER COLUMN "B" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room_Request" ADD CONSTRAINT "Room_Request_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rooms_Records" ADD CONSTRAINT "Rooms_Records_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CardToRoom" ADD CONSTRAINT "_CardToRoom_B_fkey" FOREIGN KEY ("B") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
