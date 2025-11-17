// src/routes/location.routes.js
import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { updateLocation, getNearbyTechnicians } from '../services/location.service.js';

const router = express.Router();

// Technician updates their location
router.post('/update', authenticate, authorize(['TECH_INTERNAL', 'TECH_FREELANCER']), updateLocation);

// Dispatcher/Admin gets nearby technicians
router.get('/nearby', authenticate, authorize(['ADMIN', 'DISPATCHER']), getNearbyTechnicians);

export default router;
