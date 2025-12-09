/** @format */

// src/routes/technician-management.routes.js
import { Router } from "express";
import multer from "multer";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import {
  getTechnicianOverview,
  getTechniciansDirectory,
  getTechnicianDetails,
  createTechnician,
  updateTechnician,
  toggleBlockTechnician,
  uploadTechnicianDocuments,
  exportTechniciansCSV,
} from "../controllers/technician-management.controller.js";

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error("Invalid file type. Only images and PDF files are allowed.")
      );
    }
  },
});

// All routes require Admin role
router.use(authMiddleware, requireRole("ADMIN"));

// Get overview statistics
router.get("/overview", getTechnicianOverview);

// Get technicians directory (list with filters)
router.get("/directory", getTechniciansDirectory);

// Export technicians to CSV
router.get("/export", exportTechniciansCSV);

// Get single technician details
router.get("/:id", getTechnicianDetails);

// Create new technician
router.post("/", createTechnician);

// Update technician
router.patch("/:id", updateTechnician);

// Block/unblock technician
router.patch("/:id/block", toggleBlockTechnician);

// Upload technician documents
router.patch(
  "/:id/documents",
  upload.fields([
    { name: "photoUrl", maxCount: 1 },
    { name: "idCardUrl", maxCount: 1 },
    { name: "residencePermitUrl", maxCount: 1 },
    { name: "degreesUrl", maxCount: 5 },
  ]),
  uploadTechnicianDocuments
);

export default router;
