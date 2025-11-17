// src/routes/auth.routes.js
import { Router } from 'express';
import { register, login } from '../services/auth.service.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);

export default router;
