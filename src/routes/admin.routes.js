// src/routes/admin.routes.js
import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import {
  getDashboard,
  listUsers,
  createUser,
  updateUser,
  blockTechnician,
  updateTechnicianProfile,
  getAuditLogs,
  getTechnicianLocations,
  getTop5Technicians,
  createWeeklyPayoutBatch
} from '../controllers/admin.controller.js';

const router = Router();

// Admin only routes
router.get('/dashboard', authMiddleware, requireRole('ADMIN', 'DISPATCHER'), getDashboard);
router.get('/users', authMiddleware, requireRole('ADMIN', 'DISPATCHER'), listUsers);
router.post('/users', authMiddleware, requireRole('ADMIN', 'DISPATCHER'), createUser);
router.patch('/users/:id', authMiddleware, requireRole('ADMIN'), updateUser);
router.patch('/users/:id/block', authMiddleware, requireRole('ADMIN', 'DISPATCHER'), blockTechnician);
router.patch('/users/:id/profile', authMiddleware, requireRole('ADMIN', 'DISPATCHER'), updateTechnicianProfile);
router.get('/audit-logs', authMiddleware, requireRole('ADMIN'), getAuditLogs);
router.get('/technician-locations', authMiddleware, requireRole('ADMIN', 'DISPATCHER'), getTechnicianLocations);
router.get('/top-5-technicians', authMiddleware, requireRole('ADMIN'), getTop5Technicians);
router.post('/payouts/batch', authMiddleware, requireRole('ADMIN'), createWeeklyPayoutBatch);

export default router;
  
