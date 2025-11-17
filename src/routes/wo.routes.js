// src/routes/wo.routes.js
import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import {
  createWOFromSR,
  assignWO,
  respondWO,
  startWO,
  completeWO,
} from '../services/wo.service.js';

const router = Router();

router.post(
  '/from-sr/:srId',
  authMiddleware,
  requireRole('DISPATCHER', 'ADMIN'),
  createWOFromSR
);

router.patch(
  '/:id/assign',
  authMiddleware,
  requireRole('DISPATCHER', 'ADMIN'),
  assignWO
);

router.patch(
  '/:id/respond',
  authMiddleware,
  requireRole('TECH_INTERNAL', 'TECH_FREELANCER'),
  respondWO
);

router.patch(
  '/:id/start',
  authMiddleware,
  requireRole('TECH_INTERNAL', 'TECH_FREELANCER'),
  startWO
);

router.patch(
  '/:id/complete',
  authMiddleware,
  requireRole('TECH_INTERNAL', 'TECH_FREELANCER'),
  completeWO
);

export default router;
