// src/routes/payment.routes.js
import { Router } from 'express';
import multer from 'multer';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import {
  createPayment,
  verifyPayment,
} from '../services/payment.service.js';

const router = Router();

// simple disk storage (you can change to cloud later)
const upload = multer({ dest: 'uploads/' });

// Technician uploads payment proof (multipart/form-data)
router.post(
  '/',
  authMiddleware,
  requireRole('TECH_INTERNAL', 'TECH_FREELANCER'),
  upload.single('proof'), // <--- form-data field name: proof
  createPayment
);

// Dispatcher/Admin verifies (still JSON body)
router.patch(
  '/:id/verify',
  authMiddleware,
  requireRole('DISPATCHER', 'ADMIN'),
  verifyPayment
);

export default router;
