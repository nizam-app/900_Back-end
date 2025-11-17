// src/routes/wo.routes.js
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import {
  createWOFromSR,
  assignWO,
  respondWO,
  startWO,
  completeWO,
} from '../controllers/wo.controller.js';

const router = Router();

// Configure multer for completion photos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/wo-completion');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'wo-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max per file
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, PNG) and PDFs are allowed'));
    }
  },
});

router.post(
  '/from-sr/:srId',
  authMiddleware,
  requireRole('DISPATCHER', 'ADMIN'),
  createWOFromSR
);

router.patch(
  '/:woId/assign',
  authMiddleware,
  requireRole('DISPATCHER', 'ADMIN'),
  assignWO
);

router.patch(
  '/:woId/respond',
  authMiddleware,
  requireRole('TECH_INTERNAL', 'TECH_FREELANCER'),
  respondWO
);

router.patch(
  '/:woId/start',
  authMiddleware,
  requireRole('TECH_INTERNAL', 'TECH_FREELANCER'),
  startWO
);

router.patch(
  '/:woId/complete',
  authMiddleware,
  requireRole('TECH_INTERNAL', 'TECH_FREELANCER'),
  upload.array('photos', 5), // Max 5 photos
  completeWO
);

export default router;
