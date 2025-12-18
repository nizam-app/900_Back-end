/** @format */

// src/routes/notification.routes.js
import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  registerFCMToken,
  removeFCMToken,
  sendNotification,
  sendNotificationToTopic,
} from "../controllers/notification.controller.js";
import { requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", authMiddleware, getNotifications);
router.patch("/:id/read", authMiddleware, markAsRead);
router.patch("/read-all", authMiddleware, markAllAsRead);

// FCM token management for push notifications
router.post("/fcm-token", authMiddleware, registerFCMToken);
router.post("/save-fcm-token", authMiddleware, registerFCMToken); // Alternative endpoint
router.delete("/fcm-token", authMiddleware, removeFCMToken);

// Admin: Send custom notifications
router.post(
  "/send-notification",
  authMiddleware,
  requireRole("ADMIN", "DISPATCHER"),
  sendNotification
);

router.post(
  "/send-notification-to-topic",
  authMiddleware,
  requireRole("ADMIN"),
  sendNotificationToTopic
);

export default router;
