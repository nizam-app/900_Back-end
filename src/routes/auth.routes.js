// src/routes/auth.routes.js
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { register, login, changePassword } from '../controllers/auth.controller.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/change-password', authMiddleware, changePassword);

export default router;
