// src/routes/admin.routes.js  talha
import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getDashboard,
  listUsers,
  createUser,
  updateUser,
  blockTechnician,
  updateTechnicianProfile,
  getAuditLogs,
  getTechnicianLocations,
} from '../services/admin.service.js';

const router = express.Router();

// Admin only routes
router.get('/dashboard', authenticate, authorize(['ADMIN', 'DISPATCHER']), getDashboard);
router.get('/users', authenticate, authorize(['ADMIN', 'DISPATCHER']), listUsers);
router.post('/users', authenticate, authorize(['ADMIN']), createUser);
router.patch('/users/:id', authenticate, authorize(['ADMIN']), updateUser);
router.patch('/users/:id/block', authenticate, authorize(['ADMIN', 'DISPATCHER']), blockTechnician);
router.patch('/users/:id/profile', authenticate, authorize(['ADMIN']), updateTechnicianProfile);
router.get('/audit-logs', authenticate, authorize(['ADMIN']), getAuditLogs);
router.get('/technician-locations', authenticate, authorize(['ADMIN', 'DISPATCHER']), getTechnicianLocations);

export default router;
