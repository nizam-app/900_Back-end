// src/routes/location.routes.js
import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { updateLocation, getNearbyTechnicians, getLocationHistory } from '../services/location.service.js';

const router = Router();

// Technician updates their location with enhanced functionality
router.post('/update', authMiddleware, requireRole('TECH_INTERNAL', 'TECH_FREELANCER'), updateLocation);

// Dispatcher/Admin gets nearby technicians with location names and distances
router.get('/nearby', authMiddleware, requireRole('ADMIN', 'DISPATCHER'), getNearbyTechnicians);

// Get location history for a technician
router.get('/history/:technicianId', authMiddleware, requireRole('ADMIN', 'DISPATCHER'), async (req, res, next) => {
  try {
    // Move technicianId from params to query for service compatibility
    req.query.technicianId = req.params.technicianId;
    
    // Call the service function
    await getLocationHistory(req, res, next);
  } catch (error) {
    next(error);
  }
});export default router;
