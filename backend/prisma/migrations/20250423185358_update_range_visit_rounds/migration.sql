/*
  Warnings:

  - You are about to drop the column `roundsFired` on the `range_visits` table. All the data in the column will be lost.
  - Added the required column `roundsPerFirearm` to the `range_visits` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "range_visits" DROP COLUMN "roundsFired",
ADD COLUMN     "roundsPerFirearm" JSONB NOT NULL;
