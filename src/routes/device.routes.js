// src/routes/device.routes.js
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  registerDevice,
  unregisterDevice,
  testPushNotification,
} from '../controllers/device.controller.js';

const router = Router();

// All device routes require authentication
router.use(authMiddleware);

// Register/Update FCM token
router.post('/register', registerDevice);

// Unregister device
router.post('/unregister', unregisterDevice);

// Test push notification
router.post('/test-notification', testPushNotification);

export default router;
