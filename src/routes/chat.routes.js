// src/routes/chat.routes.js
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getChatMessages,
  markMessagesAsRead,
  getUnreadCount,
  sendMessage,
} from '../controllers/chat.controller.js';

const router = Router();

// All chat routes require authentication
router.use(authMiddleware);

// Get chat messages for a work order
router.get('/wo/:woId', getChatMessages);

// Send message (HTTP alternative to Socket.IO)
router.post('/wo/:woId', sendMessage);

// Mark messages as read
router.patch('/wo/:woId/read', markMessagesAsRead);

// Get unread message count
router.get('/unread-count', getUnreadCount);

export default router;
