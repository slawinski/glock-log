import { Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export const createRangeVisit = async (req: Request, res: Response) => {
  try {
    const { date, location, notes, firearmsUsed, roundsPerFirearm } = req.body;

    // Validate required fields
    if (!location) {
      return res.status(400).json({ error: "Location is required" });
    }
    if (!firearmsUsed || firearmsUsed.length === 0) {
      return res
        .status(400)
        .json({ error: "At least one firearm is required" });
    }

    // Handle firearmsUsed - it might be a stringified array or already an array
    let firearmsUsedArray;
    try {
      firearmsUsedArray = Array.isArray(firearmsUsed)
        ? firearmsUsed
        : JSON.parse(firearmsUsed);
    } catch (error) {
      return res.status(400).json({ error: "Invalid firearmsUsed format" });
    }

    // Parse roundsPerFirearm if it's a string
    let roundsPerFirearmMap;
    try {
      roundsPerFirearmMap =
        typeof roundsPerFirearm === "string"
          ? JSON.parse(roundsPerFirearm)
          : roundsPerFirearm;
    } catch (error) {
      return res.status(400).json({ error: "Invalid roundsPerFirearm format" });
    }

    // Validate that all selected firearms have rounds assigned
    for (const firearmId of firearmsUsedArray) {
      if (
        !(firearmId in roundsPerFirearmMap) ||
        roundsPerFirearmMap[firearmId] <= 0
      ) {
        return res.status(400).json({
          error: `No rounds specified for firearm ${firearmId}`,
        });
      }
    }

    // Start a transaction to ensure all updates succeed or fail together
    const result = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // Create the range visit
        const visit = await tx.rangeVisit.create({
          data: {
            date: new Date(date),
            location,
            notes,
            firearmsUsed: firearmsUsedArray,
            roundsPerFirearm: roundsPerFirearmMap,
            photos: req.files
              ? (req.files as Express.Multer.File[]).map(
                  (file) => `/uploads/${file.filename}`
                )
              : [],
          },
        });

        // Group rounds by caliber for efficient ammo inventory updates
        const roundsByCaliber: Record<string, number> = {};

        // Update each firearm's roundsFired count and track rounds by caliber
        for (const firearmId of firearmsUsedArray) {
          const rounds = roundsPerFirearmMap[firearmId];

          // Update firearm's roundsFired count
          await tx.firearm.update({
            where: { id: firearmId },
            data: {
              roundsFired: {
                increment: rounds,
              },
            },
          });

          // Get the firearm's caliber
          const firearm = await tx.firearm.findUnique({
            where: { id: firearmId },
          });

          if (!firearm) {
            throw new Error(`Firearm ${firearmId} not found`);
          }

          // Add to rounds by caliber
          roundsByCaliber[firearm.caliber] =
            (roundsByCaliber[firearm.caliber] || 0) + rounds;
        }

        // Update ammunition inventory for each caliber
        for (const [caliber, totalRounds] of Object.entries(roundsByCaliber)) {
          // Find matching ammunition
          const ammunition = await tx.ammunition.findFirst({
            where: {
              caliber,
              quantity: {
                gt: 0,
              },
            },
            orderBy: {
              datePurchased: "asc", // Use oldest ammunition first
            },
          });

          if (!ammunition) {
            throw new Error(`No ammunition found for caliber ${caliber}`);
          }

          if (ammunition.quantity < totalRounds) {
            throw new Error(
              `Not enough ammunition in inventory for ${caliber}. Available: ${ammunition.quantity}, Needed: ${totalRounds}`
            );
          }

          // Update ammunition quantity
          await tx.ammunition.update({
            where: { id: ammunition.id },
            data: {
              quantity: {
                decrement: totalRounds,
              },
            },
          });
        }

        return visit;
      }
    );

    res.status(201).json(result);
  } catch (error) {
    console.error("Error creating range visit:", error);
    res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to create range visit",
    });
  }
};
