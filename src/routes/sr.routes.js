// src/routes/sr.routes.js
import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { createSR, listSR } from '../controllers/sr.controller.js';

const router = Router();

// Customer / Guest create SR (no auth required for guests)
router.post('/', createSR);

// List SRs - Customers see their own, Dispatcher/Admin/Call Center see all
router.get(
  '/',
  authMiddleware,
  requireRole('CUSTOMER', 'DISPATCHER', 'ADMIN', 'CALL_CENTER'),
  listSR
);

export default router;
