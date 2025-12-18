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

// Admin: Send custom notification to specific user
export const sendNotification = async (req, res, next) => {
  try {
    const { userId, title, message, data } = req.body;

    if (!userId || !title || !message) {
      return res.status(400).json({
        message: "userId, title, and message are required",
      });
    }

    // Get user's FCM token
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: { fcmToken: true, name: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Create database notification
    const notification = await prisma.notification.create({
      data: {
        userId: Number(userId),
        type: data?.type || "CUSTOM",
        title,
        message,
        dataJson: data ? JSON.stringify(data) : null,
      },
    });

    // Send push notification if FCM token exists
    let pushSent = false;
    if (user.fcmToken) {
      try {
        const { sendPushNotification } = await import("../utils/firebase.js");
        await sendPushNotification(
          user.fcmToken,
          {
            title,
            body: message,
          },
          {
            ...data,
            notificationId: String(notification.id),
            priority: "high",
            sound: "default",
          }
        );
        pushSent = true;
        console.log(`✅ Push notification sent to user ${userId}`);
      } catch (pushError) {
        console.error("❌ Failed to send push notification:", pushError);
      }
    }

    return res.json({
      message: "Notification sent successfully",
      notification,
      pushSent,
      userHasToken: !!user.fcmToken,
    });
  } catch (err) {
    next(err);
  }
};

// Admin: Send notification to multiple users (topic-style)
export const sendNotificationToTopic = async (req, res, next) => {
  try {
    const { role, title, message, data } = req.body;

    if (!role || !title || !message) {
      return res.status(400).json({
        message: "role, title, and message are required",
      });
    }

    // Valid roles
    const validRoles = [
      "CUSTOMER",
      "TECH_FREELANCER",
      "TECH_INTERNAL",
      "DISPATCHER",
      "CALL_CENTER",
      "ADMIN",
    ];

    if (!validRoles.includes(role)) {
      return res.status(400).json({
        message: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
      });
    }

    // Get all users with this role
    const users = await prisma.user.findMany({
      where: {
        role,
        isBlocked: false,
      },
      select: {
        id: true,
        fcmToken: true,
        name: true,
      },
    });

    if (users.length === 0) {
      return res.status(404).json({
        message: `No users found with role: ${role}`,
      });
    }

    // Create notifications for all users
    const notifications = await prisma.notification.createMany({
      data: users.map((user) => ({
        userId: user.id,
        type: data?.type || "ANNOUNCEMENT",
        title,
        message,
        dataJson: data ? JSON.stringify(data) : null,
      })),
    });

    // Send push notifications to users with FCM tokens
    const usersWithTokens = users.filter((u) => u.fcmToken);
    let pushResults = {
      total: usersWithTokens.length,
      sent: 0,
      failed: 0,
    };

    if (usersWithTokens.length > 0) {
      try {
        const { sendPushNotification } = await import("../utils/firebase.js");

        for (const user of usersWithTokens) {
          try {
            await sendPushNotification(
              user.fcmToken,
              {
                title,
                body: message,
              },
              {
                ...data,
                priority: "high",
                sound: "default",
              }
            );
            pushResults.sent++;
          } catch (pushError) {
            pushResults.failed++;
            console.error(
              `❌ Failed to send push to user ${user.id}:`,
              pushError.message
            );
          }
        }

        console.log(
          `✅ Push notifications sent to ${pushResults.sent}/${pushResults.total} users with role: ${role}`
        );
      } catch (error) {
        console.error("❌ Error in batch push notifications:", error);
      }
    }

    return res.json({
      message: `Notifications sent to ${users.length} users with role: ${role}`,
      totalUsers: users.length,
      notificationsCreated: notifications.count,
      pushNotifications: pushResults,
    });
  } catch (err) {
    next(err);
  }
};
