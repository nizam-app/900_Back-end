// src/routes/report.routes.js
import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getWorkOrderReport,
  getCommissionReport,
  getPaymentReport,
  getTechnicianPerformance,
  getFinancialReport,
} from '../services/report.service.js';

const router = express.Router();

// Admin and Dispatcher can access reports
router.get('/work-orders', authenticate, authorize(['ADMIN', 'DISPATCHER']), getWorkOrderReport);
router.get('/commissions', authenticate, authorize(['ADMIN', 'DISPATCHER']), getCommissionReport);
router.get('/payments', authenticate, authorize(['ADMIN', 'DISPATCHER']), getPaymentReport);
router.get('/technician-performance', authenticate, authorize(['ADMIN', 'DISPATCHER']), getTechnicianPerformance);
router.get('/financial', authenticate, authorize(['ADMIN']), getFinancialReport);

export default router;
