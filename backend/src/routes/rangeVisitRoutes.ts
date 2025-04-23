import { Router, Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import multer from "multer";
import { Multer } from "multer";
import path from "path";
import fs from "fs";
import { createRangeVisit } from "../controllers/rangeVisitController";

const router = Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) => {
    const uploadDir = path.join(
      __dirname,
      "..",
      "..",
      process.env.UPLOAD_DIR || "uploads"
    );
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage });

// Define a custom type for requests with files
interface RequestWithFiles extends Request {
  files: Express.Multer.File[];
}

// Get all range visits
router.get("/", async (req: Request, res: Response) => {
  try {
    const visits = await prisma.rangeVisit.findMany({
      orderBy: { date: "desc" },
    });
    res.json(visits);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch range visits" });
  }
});

// Get a single range visit
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const visit = await prisma.rangeVisit.findUnique({
      where: { id: req.params.id },
    });
    if (!visit) {
      return res.status(404).json({ error: "Range visit not found" });
    }
    res.json(visit);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch range visit" });
  }
});

// Create a new range visit
router.post(
  "/",
  upload.array("photos", 5),
  async (req: Request, res: Response) => {
    try {
      const reqWithFiles = req as RequestWithFiles;
      const { date, location, notes, firearmsUsed, roundsPerFirearm } =
        reqWithFiles.body;
      const newPhotos = reqWithFiles.files.map(
        (file) => `/uploads/${file.filename}`
      );

      // Parse firearmsUsed and roundsPerFirearm
      const firearms = JSON.parse(firearmsUsed);
      const roundsMap = JSON.parse(roundsPerFirearm);

      // Start a transaction to ensure all updates succeed or fail together
      const result = await prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          // Create the range visit
          const visit = await tx.rangeVisit.create({
            data: {
              date: new Date(date),
              location,
              notes,
              firearmsUsed: firearms,
              roundsPerFirearm: roundsMap,
              photos: newPhotos,
            },
          });

          // Group rounds by caliber for efficient ammo inventory updates
          const roundsByCaliber: Record<string, number> = {};

          // Update each firearm's roundsFired count and track rounds by caliber
          for (const firearmId of firearms) {
            const rounds = roundsMap[firearmId];

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
          for (const [caliber, totalRounds] of Object.entries(
            roundsByCaliber
          )) {
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

      res.json(result);
    } catch (error) {
      console.error("Error creating range visit:", error);
      res.status(500).json({ error: "Failed to create range visit" });
    }
  }
);

// Update a range visit
router.put(
  "/:id",
  upload.array("photos", 5),
  async (req: Request, res: Response) => {
    try {
      const reqWithFiles = req as RequestWithFiles;
      const { date, location, notes, firearmsUsed, roundsFired } =
        reqWithFiles.body;
      const newPhotos = reqWithFiles.files.map(
        (file) => `/uploads/${file.filename}`
      );

      // Parse firearmsUsed and roundsFired
      const firearms = JSON.parse(firearmsUsed);
      const rounds = parseInt(roundsFired);

      // Get the existing visit to calculate the difference in rounds fired
      const existingVisit = await prisma.rangeVisit.findUnique({
        where: { id: req.params.id },
      });

      if (!existingVisit) {
        return res.status(404).json({ error: "Range visit not found" });
      }

      const roundsDifference = rounds - existingVisit.roundsFired;

      // Start a transaction to ensure all updates succeed or fail together
      const result = await prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          // Update the range visit
          const visit = await tx.rangeVisit.update({
            where: { id: req.params.id },
            data: {
              date: new Date(date),
              location,
              notes,
              firearmsUsed: firearms,
              roundsFired: rounds,
              photos: [...existingVisit.photos, ...newPhotos],
            },
          });

          // Update each firearm's roundsFired count
          for (const firearmId of firearms) {
            await tx.firearm.update({
              where: { id: firearmId },
              data: {
                roundsFired: {
                  increment: roundsDifference,
                },
              },
            });
          }

          // Find the firearm to get its caliber
          const firearm = await tx.firearm.findUnique({
            where: { id: firearms[0] }, // Using first firearm's caliber
          });

          if (firearm) {
            // Update ammo inventory
            await tx.ammunition.updateMany({
              where: {
                caliber: firearm.caliber,
                quantity: {
                  gt: 0,
                },
              },
              data: {
                quantity: {
                  decrement: roundsDifference,
                },
              },
            });
          }

          return visit;
        }
      );

      res.json(result);
    } catch (error) {
      console.error("Error updating range visit:", error);
      res.status(500).json({ error: "Failed to update range visit" });
    }
  }
);

// Delete a range visit
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    await prisma.rangeVisit.delete({
      where: { id: req.params.id },
    });
    res.json({ message: "Range visit deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete range visit" });
  }
});

// Get statistics
router.get("/stats/overview", async (req: Request, res: Response) => {
  try {
    const visits = await prisma.rangeVisit.findMany();

    const totalRoundsFired = visits.reduce(
      (sum: number, visit: { roundsFired: number | null }) => {
        return sum + (visit.roundsFired || 0);
      },
      0
    );

    const locationCounts: Record<string, number> = visits.reduce(
      (acc: Record<string, number>, visit: { location: string | null }) => {
        if (visit.location) {
          acc[visit.location] = (acc[visit.location] || 0) + 1;
        }
        return acc;
      },
      {}
    );

    const sortedLocations = Object.entries(locationCounts).sort(
      ([, a], [, b]) => b - a
    );

    const mostVisitedLocation =
      sortedLocations.length > 0 ? sortedLocations[0][0] : null;

    res.json({
      totalVisits: visits.length,
      totalRoundsFired,
      mostVisitedLocation,
      averageRoundsPerVisit:
        visits.length > 0 ? totalRoundsFired / visits.length : 0,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

export default router;
