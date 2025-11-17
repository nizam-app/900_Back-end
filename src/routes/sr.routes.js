// src/routes/sr.routes.js
import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { createSR, listSR } from '../controllers/sr.controller.js';

const router = Router();

// Customer / Guest create SR (no auth)
router.post('/', createSR);

// Dispatcher / Admin / Call Center list SRs
router.get(
  '/',
  authMiddleware,
  requireRole('DISPATCHER', 'ADMIN', 'CALL_CENTER'),
  listSR
);

export default router;
