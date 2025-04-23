import express from "express";
import {
  getAmmunition,
  createAmmunition,
  updateAmmunition,
  deleteAmmunition,
} from "../controllers/ammunitionController";

const router = express.Router();

router.get("/", getAmmunition);
router.post("/", createAmmunition);
router.put("/:id", updateAmmunition);
router.delete("/:id", deleteAmmunition);

export default router;
