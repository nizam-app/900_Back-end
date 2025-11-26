// src/routes/auth.routes.js
import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { register, login, logout, changePassword, getProfile, updateProfile, updateCustomerProfile } from '../controllers/auth.controller.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', authMiddleware, logout);
router.post('/change-password', authMiddleware, changePassword);

// Profile management routes
router.get('/profile', authMiddleware, getProfile);
router.patch('/profile', authMiddleware, updateProfile);

// CALL_CENTER can update any customer's profile
router.patch('/customer/:userId', authMiddleware, requireRole('CALL_CENTER', 'ADMIN'), updateCustomerProfile);

export default router;
