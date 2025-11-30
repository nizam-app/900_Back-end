/** @format */

// src/routes/sr.routes.js
import { Router } from "express";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import {
  createSR,
  listSR,
  getSRById,
  cancelSR,
  searchCustomer,
  rebookService,
} from "../controllers/sr.controller.js";

const router = Router();

// Search customer by phone (Call Center only)
router.get(
  "/search-customer",
  authMiddleware,
  requireRole("CALL_CENTER", "DISPATCHER", "ADMIN"),
  searchCustomer
);

// Customer / Guest create SR (no auth required for guests)
router.post("/", createSR);

// List SRs - Customers see their own, Dispatcher/Admin/Call Center see all
router.get(
  "/",
  authMiddleware,
  requireRole("CUSTOMER", "DISPATCHER", "ADMIN", "CALL_CENTER"),
  listSR
);

// Get SR by ID (srNumber)
router.get(
  "/:id",
  authMiddleware,
  requireRole("CUSTOMER", "DISPATCHER", "ADMIN", "CALL_CENTER"),
  getSRById
);

// Cancel SR - Customers can cancel their own, Dispatcher/Admin/Call Center can cancel any
router.patch(
  "/:id/cancel",
  authMiddleware,
  requireRole("CUSTOMER", "DISPATCHER", "ADMIN", "CALL_CENTER"),
  cancelSR
);

// Rebook Service - Customers can rebook completed services
router.post(
  "/:srId/rebook",
  authMiddleware,
  requireRole("CUSTOMER"),
  rebookService
);

export default router;
