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
} from "../controllers/notification.controller.js";

const router = Router();

router.get("/", authMiddleware, getNotifications);
router.patch("/:id/read", authMiddleware, markAsRead);
router.patch("/read-all", authMiddleware, markAllAsRead);

// FCM token management for push notifications
router.post("/fcm-token", authMiddleware, registerFCMToken);
router.delete("/fcm-token", authMiddleware, removeFCMToken);

export default router;
