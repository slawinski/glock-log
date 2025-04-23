-- CreateTable
CREATE TABLE "ammunition" (
    "id" TEXT NOT NULL,
    "caliber" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "grain" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "datePurchased" TIMESTAMP(3) NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ammunition_pkey" PRIMARY KEY ("id")
);
