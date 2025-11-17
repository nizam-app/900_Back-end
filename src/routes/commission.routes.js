// src/routes/commission.routes.js
import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import {
  runWeeklyPayout,
  getMyCommissions,
  requestPayout,
  reviewPayoutRequest,
  getAllPayoutRequests,
  getTechnicianDashboard,
} from '../services/commission.service.js';

const router = Router();

// Technician routes
router.get('/my-commissions', authMiddleware, requireRole('TECH_INTERNAL', 'TECH_FREELANCER'), getMyCommissions);
router.get('/dashboard', authMiddleware, requireRole('TECH_INTERNAL', 'TECH_FREELANCER'), getTechnicianDashboard);
router.post('/payout-request', authMiddleware, requireRole('TECH_INTERNAL', 'TECH_FREELANCER'), requestPayout);

// Admin routes
router.get('/payout-requests', authMiddleware, requireRole('ADMIN', 'DISPATCHER'), getAllPayoutRequests);
router.patch('/payout-requests/:id', authMiddleware, requireRole('ADMIN'), reviewPayoutRequest);

// Admin triggers weekly payout (you can later move to cron)
router.post(
  '/payouts/weekly',
  authMiddleware,
  requireRole('ADMIN'),
  async (req, res, next) => {
    try {
      const result = await runWeeklyPayout();
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
