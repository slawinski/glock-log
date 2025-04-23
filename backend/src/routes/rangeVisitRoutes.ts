import express from "express";
import { PrismaClient } from "@prisma/client";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
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
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage });

// Get all range visits
router.get("/", async (req, res) => {
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
router.get("/:id", async (req, res) => {
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
router.post("/", upload.array("photos", 5), async (req, res) => {
  try {
    console.log("Received request body:", req.body);
    console.log("Received files:", req.files);

    const { date, location, notes, firearmsUsed, roundsFired } = req.body;

    // Validate required fields
    if (!location) {
      console.log("Location validation failed");
      return res.status(400).json({ error: "Location is required" });
    }
    if (!firearmsUsed || firearmsUsed.length === 0) {
      console.log("FirearmsUsed validation failed:", firearmsUsed);
      return res
        .status(400)
        .json({ error: "At least one firearm is required" });
    }

    const photos = (req.files as Express.Multer.File[]).map(
      (file) => `/uploads/${file.filename}`
    );

    // Handle firearmsUsed - it might be a stringified array or already an array
    let firearmsUsedArray;
    try {
      firearmsUsedArray = Array.isArray(firearmsUsed)
        ? firearmsUsed
        : JSON.parse(firearmsUsed);
      console.log("Parsed firearmsUsed:", firearmsUsedArray);
    } catch (error) {
      console.error("Error parsing firearmsUsed:", error);
      return res.status(400).json({ error: "Invalid firearmsUsed format" });
    }

    const visit = await prisma.rangeVisit.create({
      data: {
        date: new Date(date),
        location,
        notes,
        firearmsUsed: firearmsUsedArray,
        roundsFired: parseInt(roundsFired),
        photos,
      },
    });
    console.log("Created visit:", visit);
    res.status(201).json(visit);
  } catch (error) {
    console.error("Error creating range visit:", error);
    res.status(500).json({ error: "Failed to create range visit" });
  }
});

// Update a range visit
router.put("/:id", upload.array("photos", 5), async (req, res) => {
  try {
    const { date, location, notes, firearmsUsed, roundsFired } = req.body;
    const newPhotos = (req.files as Express.Multer.File[]).map(
      (file) => `/uploads/${file.filename}`
    );

    const existingVisit = await prisma.rangeVisit.findUnique({
      where: { id: req.params.id },
    });

    if (!existingVisit) {
      return res.status(404).json({ error: "Range visit not found" });
    }

    const visit = await prisma.rangeVisit.update({
      where: { id: req.params.id },
      data: {
        date: new Date(date),
        location,
        notes,
        firearmsUsed: JSON.parse(firearmsUsed),
        roundsFired: parseInt(roundsFired),
        photos: [...existingVisit.photos, ...newPhotos],
      },
    });
    res.json(visit);
  } catch (error) {
    res.status(500).json({ error: "Failed to update range visit" });
  }
});

// Delete a range visit
router.delete("/:id", async (req, res) => {
  try {
    const visit = await prisma.rangeVisit.delete({
      where: { id: req.params.id },
    });
    res.json({ message: "Range visit deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete range visit" });
  }
});

// Get statistics
router.get("/stats/overview", async (req, res) => {
  try {
    const visits = await prisma.rangeVisit.findMany();

    const stats = {
      totalVisits: visits.length,
      totalRoundsFired: visits.reduce(
        (sum, visit) => sum + visit.roundsFired,
        0
      ),
      mostVisitedLocation: visits.reduce((acc, visit) => {
        acc[visit.location] = (acc[visit.location] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    const mostVisitedLocation = Object.entries(stats.mostVisitedLocation).sort(
      ([, a], [, b]) => b - a
    )[0][0];

    res.json({
      ...stats,
      mostVisitedLocation,
      averageRoundsPerVisit: stats.totalRoundsFired / stats.totalVisits,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

export default router;
