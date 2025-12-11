/** @format */

// src/routes/rate.routes.js
import { Router } from "express";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import {
  getRateSummary,
  getRateStructures,
  getRateStructure,
  createRateStructure,
  updateRateStructure,
  deleteRateStructure,
  setDefaultRate,
  getDefaultRate,
} from "../controllers/rate.controller.js";

const router = Router();

// All routes require admin authentication
router.use(authMiddleware);
router.use(requireRole("ADMIN"));

// Dashboard summary
router.get("/summary", getRateSummary);

// CRUD for rate structures
router.get("/", getRateStructures);
router.get("/:id", getRateStructure);
router.post("/", createRateStructure);
router.patch("/:id", updateRateStructure);
router.delete("/:id", deleteRateStructure);

// Set a rate as default
router.patch("/:id/set-default", setDefaultRate);

// Get default rate for a tech type (used when creating technicians)
router.get("/default/:techType", getDefaultRate);

export default router;
