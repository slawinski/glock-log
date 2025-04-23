import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getAmmunition = async (req: Request, res: Response) => {
  try {
    const ammunition = await prisma.ammunition.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    res.json(ammunition);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch ammunition" });
  }
};

export const createAmmunition = async (req: Request, res: Response) => {
  try {
    const {
      caliber,
      brand,
      grain,
      quantity,
      datePurchased,
      amountPaid,
      notes,
    } = req.body;
    const ammunition = await prisma.ammunition.create({
      data: {
        caliber,
        brand,
        grain,
        quantity,
        datePurchased: new Date(datePurchased),
        amountPaid,
        notes,
      },
    });
    res.json(ammunition);
  } catch (error) {
    res.status(500).json({ error: "Failed to create ammunition record" });
  }
};

export const updateAmmunition = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      caliber,
      brand,
      grain,
      quantity,
      datePurchased,
      amountPaid,
      notes,
    } = req.body;
    const ammunition = await prisma.ammunition.update({
      where: { id },
      data: {
        caliber,
        brand,
        grain,
        quantity,
        datePurchased: new Date(datePurchased),
        amountPaid,
        notes,
      },
    });
    res.json(ammunition);
  } catch (error) {
    res.status(500).json({ error: "Failed to update ammunition record" });
  }
};

export const deleteAmmunition = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.ammunition.delete({
      where: { id },
    });
    res.json({ message: "Ammunition record deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete ammunition record" });
  }
};
