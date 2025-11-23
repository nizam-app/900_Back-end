// src/routes/location.routes.js
import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { 
  updateLocation, 
  getNearbyTechnicians,
  getTechnicianLocation,
  getLocationHistory,
  getETA
} from '../controllers/location.controller.js';

const router = Router();

// Technician updates their location
router.post('/update', authMiddleware, requireRole('TECH_INTERNAL', 'TECH_FREELANCER'), updateLocation);

// Dispatcher/Admin gets nearby technicians
router.get('/nearby', authMiddleware, requireRole('ADMIN', 'DISPATCHER'), getNearbyTechnicians);

// Get specific technician's current location
router.get('/technician/:id', authMiddleware, requireRole('ADMIN', 'DISPATCHER', 'CUSTOMER'), getTechnicianLocation); 

// Get ETA for technician to destination
router.get('/eta', authMiddleware, requireRole('ADMIN', 'DISPATCHER', 'CUSTOMER'), getETA);

// Get location history for a technician
router.get('/history/:technicianId', authMiddleware, requireRole('ADMIN', 'DISPATCHER'), getLocationHistory);

export default router;
