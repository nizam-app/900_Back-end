// src/routes/payment.routes.js
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { uploadPaymentProof, verifyPayment } from '../controllers/payment.controller.js';

const router = Router();

// store files in /uploads for now
const upload = multer({ dest: 'uploads/' });

// Technician uploads payment proof (multipart/form-data)
router.post(
  '/',
  authMiddleware,
  requireRole('TECH_INTERNAL', 'TECH_FREELANCER'),
  upload.single('proof'),
  uploadPaymentProof
);

// Dispatcher/Admin verifies payment
router.patch(
  '/:id/verify',
  authMiddleware,
  requireRole('DISPATCHER', 'ADMIN'),
  verifyPayment
);

export default router;
