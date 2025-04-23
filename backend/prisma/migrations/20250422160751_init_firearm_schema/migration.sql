-- CreateTable
CREATE TABLE "firearms" (
    "id" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "caliber" TEXT NOT NULL,
    "datePurchased" TIMESTAMP(3) NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL,
    "photos" TEXT[],
    "roundsFired" INTEGER NOT NULL,
    "totalRoundsInInventory" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "firearms_pkey" PRIMARY KEY ("id")
);
