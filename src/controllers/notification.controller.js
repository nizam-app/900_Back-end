/** @format */

// src/controllers/notification.controller.js
import { prisma } from "../prisma.js";

// Helper function to format date
const formatDate = (date) => {
  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return new Date(date).toLocaleString("en-US", options);
};

export const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { unreadOnly } = req.query;

    const where = { userId };

    if (unreadOnly === "true") {
      where.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Format notifications with createdAtFormatted and referenceId
    const formattedNotifications = notifications.map((notification) => {
      const data = notification.dataJson
        ? JSON.parse(notification.dataJson)
        : null;
      return {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        referenceId: data?.srId || data?.woId || data?.paymentId || null,
        createdAt: notification.createdAt,
        createdAtFormatted: formatDate(notification.createdAt),
        isRead: notification.isRead,
        readAt: notification.readAt,
        data: data,
      };
    });

    return res.json(formattedNotifications);
  } catch (err) {
    next(err);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const notificationId = Number(req.params.id);
    const userId = req.user.id;

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      return res.status(404).json({ message: "Notification not found" });
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return res.json(updated);
  } catch (err) {
    next(err);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return res.json({ message: "All notifications marked as read" });
  } catch (err) {
    next(err);
  }
};

// Register or update FCM token for push notifications
export const registerFCMToken = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({ message: "FCM token is required" });
    }

    // Update user's FCM token
    await prisma.user.update({
      where: { id: userId },
      data: { fcmToken },
    });

    console.log(`✅ FCM token registered for user ${userId}`);

    return res.json({
      message: "FCM token registered successfully",
      userId,
    });
  } catch (err) {
    next(err);
  }
};

// Remove FCM token (on logout)
export const removeFCMToken = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await prisma.user.update({
      where: { id: userId },
      data: { fcmToken: null },
    });

    console.log(`✅ FCM token removed for user ${userId}`);

    return res.json({ message: "FCM token removed successfully" });
  } catch (err) {
    next(err);
  }
};
