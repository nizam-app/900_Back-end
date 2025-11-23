// src/routes/payment.routes.js
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { 
  getAllPayments, 
  getPaymentById, 
  uploadPaymentProof, 
  verifyPayment 
} from '../controllers/payment.controller.js';

const router = Router();

// Configure multer for payment proof uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/payments/');
  },
  filename: (req, file, cb) => {
    cb(null, 'payment-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and GIF images are allowed.'));
    }
  }
});

// Get all payments (Admin/Dispatcher)
router.get(
  '/',
  authMiddleware,
  requireRole('ADMIN', 'DISPATCHER'),
  getAllPayments
);

// Get payment by ID
router.get(
  '/:id',
  authMiddleware,
  requireRole('ADMIN', 'DISPATCHER', 'TECH_INTERNAL', 'TECH_FREELANCER'),
  getPaymentById
);

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
