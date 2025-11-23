// src/routes/admin.routes.js
import { Router } from 'express';
import multer from 'multer';
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

// Configure multer for profile image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and PDF are allowed.'));
    }
  }
});

// Admin only routes
router.get('/dashboard', authMiddleware, requireRole('ADMIN', 'DISPATCHER'), getDashboard);
router.get('/users', authMiddleware, requireRole('ADMIN', 'DISPATCHER'), listUsers);
router.post('/users', authMiddleware, requireRole('ADMIN', 'DISPATCHER'), createUser);
router.patch('/users/:id', authMiddleware, requireRole('ADMIN'), updateUser);
router.patch('/users/:id/block', authMiddleware, requireRole('ADMIN', 'DISPATCHER'), blockTechnician);
router.patch(
  '/users/:id/profile', 
  authMiddleware, 
  requireRole('ADMIN', 'DISPATCHER'),
  upload.fields([
    { name: 'photoUrl', maxCount: 1 },
    { name: 'idCardUrl', maxCount: 1 },
    { name: 'residencePermitUrl', maxCount: 1 },
    { name: 'degreesUrl', maxCount: 5 }
  ]),
  updateTechnicianProfile
);
router.get('/audit-logs', authMiddleware, requireRole('ADMIN'), getAuditLogs);
router.get('/technician-locations', authMiddleware, requireRole('ADMIN', 'DISPATCHER'), getTechnicianLocations);
router.get('/top-5-technicians', authMiddleware, requireRole('ADMIN'), getTop5Technicians);
router.post('/payouts/batch', authMiddleware, requireRole('ADMIN'), createWeeklyPayoutBatch);

export default router;
  
