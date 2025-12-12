/** @format */

import express from "express";
import { getCallCenterStats } from "../controllers/call-center.controller.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = express.Router();

// All routes require CALL_CENTER role
router.use(authenticate);
router.use(requireRole("CALL_CENTER"));

// Get dashboard stats
router.get("/stats", getCallCenterStats);

export default router;
