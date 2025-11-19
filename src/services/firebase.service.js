// src/services/firebase.service.js
import admin from 'firebase-admin';
import { FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL } from '../config/env.js';

let firebaseInitialized = false;

// Initialize Firebase Admin SDK
export const initializeFirebase = () => {
  if (firebaseInitialized) {
    return;
  }

  try {
    if (!FIREBASE_PROJECT_ID || !FIREBASE_PRIVATE_KEY || !FIREBASE_CLIENT_EMAIL) {
      console.warn('⚠️  Firebase credentials not configured. Push notifications will be disabled.');
      return;
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: FIREBASE_PROJECT_ID,
        privateKey: FIREBASE_PRIVATE_KEY,
        clientEmail: FIREBASE_CLIENT_EMAIL,
      }),
    });

    firebaseInitialized = true;
    console.log('✅ Firebase Admin SDK initialized');
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
  }
};

// Send push notification to a single device
export const sendPushNotification = async (fcmToken, notification, data = {}) => {
  if (!firebaseInitialized) {
    console.warn('Firebase not initialized. Skipping push notification.');
    return { success: false, error: 'Firebase not initialized' };
  }

  try {
    const message = {
      token: fcmToken,
      notification: {
        title: notification.title,
        body: notification.body,
        imageUrl: notification.image || undefined,
      },
      data: {
        ...data,
        timestamp: new Date().toISOString(),
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'fsm_notifications',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log('✅ Push notification sent:', response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('❌ Push notification error:', error);
    return { success: false, error: error.message };
  }
};

// Send push notification to multiple devices
export const sendMulticastNotification = async (fcmTokens, notification, data = {}) => {
  if (!firebaseInitialized) {
    console.warn('Firebase not initialized. Skipping push notification.');
    return { success: false, error: 'Firebase not initialized' };
  }

  try {
    const message = {
      tokens: fcmTokens,
      notification: {
        title: notification.title,
        body: notification.body,
        imageUrl: notification.image || undefined,
      },
      data: {
        ...data,
        timestamp: new Date().toISOString(),
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'fsm_notifications',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`✅ Multicast notification sent: ${response.successCount}/${fcmTokens.length} successful`);
    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses,
    };
  } catch (error) {
    console.error('❌ Multicast notification error:', error);
    return { success: false, error: error.message };
  }
};

// Send notification to a topic
export const sendTopicNotification = async (topic, notification, data = {}) => {
  if (!firebaseInitialized) {
    console.warn('Firebase not initialized. Skipping push notification.');
    return { success: false, error: 'Firebase not initialized' };
  }

  try {
    const message = {
      topic: topic,
      notification: {
        title: notification.title,
        body: notification.body,
        imageUrl: notification.image || undefined,
      },
      data: {
        ...data,
        timestamp: new Date().toISOString(),
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'fsm_notifications',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log(`✅ Topic notification sent to ${topic}:`, response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('❌ Topic notification error:', error);
    return { success: false, error: error.message };
  }
};

// Subscribe device to topic
export const subscribeToTopic = async (fcmToken, topic) => {
  if (!firebaseInitialized) {
    return { success: false, error: 'Firebase not initialized' };
  }

  try {
    await admin.messaging().subscribeToTopic(fcmToken, topic);
    console.log(`✅ Device subscribed to topic: ${topic}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Subscribe to topic error:', error);
    return { success: false, error: error.message };
  }
};

// Unsubscribe device from topic
export const unsubscribeFromTopic = async (fcmToken, topic) => {
  if (!firebaseInitialized) {
    return { success: false, error: 'Firebase not initialized' };
  }

  try {
    await admin.messaging().unsubscribeFromTopic(fcmToken, topic);
    console.log(`✅ Device unsubscribed from topic: ${topic}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Unsubscribe from topic error:', error);
    return { success: false, error: error.message };
  }
};

// Helper: Send work order notification
export const sendWOPushNotification = async (userId, woNumber, title, body, additionalData = {}) => {
  try {
    // Get user's FCM token from database
    const user = await import('../prisma.js').then(m => m.prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true },
    }));

    if (!user?.fcmToken) {
      console.warn(`No FCM token for user ${userId}`);
      return { success: false, error: 'No FCM token' };
    }

    return await sendPushNotification(
      user.fcmToken,
      { title, body },
      {
        type: 'WORK_ORDER',
        woNumber,
        ...additionalData,
      }
    );
  } catch (error) {
    console.error('WO push notification error:', error);
    return { success: false, error: error.message };
  }
};

// Helper: Send payment notification
export const sendPaymentPushNotification = async (userId, amount, title, body, additionalData = {}) => {
  try {
    const user = await import('../prisma.js').then(m => m.prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true },
    }));

    if (!user?.fcmToken) {
      console.warn(`No FCM token for user ${userId}`);
      return { success: false, error: 'No FCM token' };
    }

    return await sendPushNotification(
      user.fcmToken,
      { title, body },
      {
        type: 'PAYMENT',
        amount: amount.toString(),
        ...additionalData,
      }
    );
  } catch (error) {
    console.error('Payment push notification error:', error);
    return { success: false, error: error.message };
  }
};

// Initialize Firebase when module loads
initializeFirebase();
