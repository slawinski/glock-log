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

// Get all firearms
router.get("/", async (req, res) => {
  try {
    const firearms = await prisma.firearm.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(firearms);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch firearms" });
  }
});

// Get a single firearm
router.get("/:id", async (req, res) => {
  try {
    const firearm = await prisma.firearm.findUnique({
      where: { id: req.params.id },
    });
    if (!firearm) {
      return res.status(404).json({ error: "Firearm not found" });
    }
    res.json(firearm);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch firearm" });
  }
});

// Create a new firearm
router.post("/", upload.array("photos", 5), async (req, res) => {
  try {
    const { modelName, caliber, datePurchased, amountPaid } = req.body;
    const photos = (req.files as Express.Multer.File[]).map(
      (file) => `/uploads/${file.filename}`
    );

    const firearm = await prisma.firearm.create({
      data: {
        modelName,
        caliber,
        datePurchased: new Date(datePurchased),
        amountPaid: parseFloat(amountPaid),
        photos,
      },
    });
    res.status(201).json(firearm);
  } catch (error) {
    res.status(500).json({ error: "Failed to create firearm" });
  }
});

// Update a firearm
router.put("/:id", upload.array("photos", 5), async (req, res) => {
  try {
    const { modelName, caliber, datePurchased, amountPaid } = req.body;
    const newPhotos = (req.files as Express.Multer.File[]).map(
      (file) => `/uploads/${file.filename}`
    );

    const existingFirearm = await prisma.firearm.findUnique({
      where: { id: req.params.id },
    });

    if (!existingFirearm) {
      return res.status(404).json({ error: "Firearm not found" });
    }

    const firearm = await prisma.firearm.update({
      where: { id: req.params.id },
      data: {
        modelName,
        caliber,
        datePurchased: new Date(datePurchased),
        amountPaid: parseFloat(amountPaid),
        photos: [...existingFirearm.photos, ...newPhotos],
      },
    });
    res.json(firearm);
  } catch (error) {
    res.status(500).json({ error: "Failed to update firearm" });
  }
});

// Delete a firearm
router.delete("/:id", async (req, res) => {
  try {
    const firearm = await prisma.firearm.delete({
      where: { id: req.params.id },
    });
    res.json({ message: "Firearm deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete firearm" });
  }
});

// Get statistics
router.get("/stats/overview", async (req, res) => {
  try {
    const firearms = await prisma.firearm.findMany();

    const stats = {
      totalFirearms: firearms.length,
      totalValue: firearms.reduce(
        (sum, firearm) => sum + firearm.amountPaid,
        0
      ),
      mostUsedCaliber: firearms.reduce((acc, firearm) => {
        acc[firearm.caliber] = (acc[firearm.caliber] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    const mostUsedCaliber = Object.entries(stats.mostUsedCaliber).sort(
      ([, a], [, b]) => b - a
    )[0][0];

    res.json({
      ...stats,
      mostUsedCaliber,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

export default router;
