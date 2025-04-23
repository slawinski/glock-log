/*
  Warnings:

  - You are about to drop the column `roundsFired` on the `firearms` table. All the data in the column will be lost.
  - You are about to drop the column `totalRoundsInInventory` on the `firearms` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "firearms" DROP COLUMN "roundsFired",
DROP COLUMN "totalRoundsInInventory";
