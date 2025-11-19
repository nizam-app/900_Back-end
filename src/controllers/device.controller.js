// src/controllers/device.controller.js
import { prisma } from '../prisma.js';
import { subscribeToTopic, unsubscribeFromTopic } from '../services/firebase.service.js';

// Register/Update FCM token
export const registerDevice = async (req, res, next) => {
  try {
    const { fcmToken, deviceInfo } = req.body;
    const userId = req.user.id;

    if (!fcmToken) {
      return res.status(400).json({ message: 'FCM token is required' });
    }

    // Update user's FCM token
    await prisma.user.update({
      where: { id: userId },
      data: { fcmToken },
    });

    // Subscribe to role-based topic
    const user = req.user;
    await subscribeToTopic(fcmToken, `role_${user.role.toLowerCase()}`);

    // Subscribe to user-specific topic
    await subscribeToTopic(fcmToken, `user_${userId}`);

    return res.json({
      message: 'Device registered successfully',
      topics: [`role_${user.role.toLowerCase()}`, `user_${userId}`],
    });
  } catch (err) {
    next(err);
  }
};

// Unregister device
export const unregisterDevice = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get current FCM token
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true, role: true },
    });

    if (user?.fcmToken) {
      // Unsubscribe from topics
      await unsubscribeFromTopic(user.fcmToken, `role_${user.role.toLowerCase()}`);
      await unsubscribeFromTopic(user.fcmToken, `user_${userId}`);
    }

    // Remove FCM token
    await prisma.user.update({
      where: { id: userId },
      data: { fcmToken: null },
    });

    return res.json({ message: 'Device unregistered successfully' });
  } catch (err) {
    next(err);
  }
};

// Test push notification
export const testPushNotification = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { title, body } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true },
    });

    if (!user?.fcmToken) {
      return res.status(400).json({ message: 'No FCM token registered for this user' });
    }

    const result = await import('../services/firebase.service.js').then(m =>
      m.sendPushNotification(
        user.fcmToken,
        {
          title: title || 'Test Notification',
          body: body || 'This is a test push notification',
        },
        {
          type: 'TEST',
          timestamp: new Date().toISOString(),
        }
      )
    );

    return res.json({
      message: 'Test notification sent',
      result,
    });
  } catch (err) {
    next(err);
  }
};
