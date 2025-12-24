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
  // Individual technician rate management
  getTechniciansWithRates,
  getTechnicianRate,
  setTechnicianRate,
  applyRateStructureToTechnician,
  bulkApplyRateStructure,
  resetTechnicianRateToDefault,
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

// =====================================
// Individual Technician Rate Management
// =====================================

// Get all technicians with their rates
router.get("/technicians/list", getTechniciansWithRates);

// Get single technician's rate details
router.get("/technicians/:technicianId", getTechnicianRate);

// Set individual rate for a technician
router.patch("/technicians/:technicianId", setTechnicianRate);

// Apply a rate structure to a single technician
router.post(
  "/technicians/:technicianId/apply/:rateStructureId",
  applyRateStructureToTechnician
);

// Reset technician's rate to default
router.post(
  "/technicians/:technicianId/reset-to-default",
  resetTechnicianRateToDefault
);

// Bulk apply rate structure to multiple technicians
router.post("/:rateStructureId/bulk-apply", bulkApplyRateStructure);

export default router;
