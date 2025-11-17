// src/routes/location.routes.js
import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { updateLocation, getNearbyTechnicians } from '../controllers/location.controller.js';

const router = Router();

// Technician updates their location
router.post('/update', authMiddleware, requireRole('TECH_INTERNAL', 'TECH_FREELANCER'), updateLocation);

// Dispatcher/Admin gets nearby technicians
router.get('/nearby', authMiddleware, requireRole('ADMIN', 'DISPATCHER'), getNearbyTechnicians);

export default router;
