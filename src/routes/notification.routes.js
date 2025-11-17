// src/routes/notification.routes.js
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { getNotifications, markAsRead, markAllAsRead } from '../services/notification.service.js';

const router = express.Router();

router.get('/', authenticate, getNotifications);
router.patch('/:id/read', authenticate, markAsRead);
router.patch('/read-all', authenticate, markAllAsRead);

export default router;
