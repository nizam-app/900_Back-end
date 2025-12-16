/** @format */

// src/utils/firebase.js
import admin from "firebase-admin";

// Initialize Firebase Admin SDK
let firebaseApp = null;

export const initializeFirebase = () => {
  try {
    if (!firebaseApp) {
      const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      };

      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      console.log("✅ Firebase Admin SDK initialized successfully");
    }
    return firebaseApp;
  } catch (error) {
    console.error("❌ Firebase initialization error:", error);
    throw error;
  }
};

// Get Firebase Messaging instance
export const getFirebaseMessaging = () => {
  if (!firebaseApp) {
    initializeFirebase();
  }
  return admin.messaging();
};

/**
 * Send push notification to a single device
 * @param {string} fcmToken - Device FCM token
 * @param {Object} notification - Notification payload
 * @param {Object} data - Data payload (optional)
 */
export const sendPushNotification = async (
  fcmToken,
  notification,
  data = {}
) => {
  try {
    const messaging = getFirebaseMessaging();

    const message = {
      token: fcmToken,
      notification: {
        title: notification.title,
        body: notification.body,
        imageUrl: notification.imageUrl,
      },
      data: {
        ...data,
        // Ensure all values are strings
        ...(data.woId && { woId: String(data.woId) }),
        ...(data.woNumber && { woNumber: String(data.woNumber) }),
        ...(data.type && { type: String(data.type) }),
      },
      android: {
        priority: "high",
        notification: {
          sound: "default", // Play default notification sound
          channelId: "job_assignments", // Custom channel for job notifications
          priority: "high",
          defaultSound: true,
          defaultVibrateTimings: true,
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default", // Play sound on iOS
            badge: 1,
            contentAvailable: true,
            category: "JOB_ASSIGNMENT",
          },
        },
      },
    };

    const response = await messaging.send(message);
    console.log("✅ Push notification sent successfully:", response);
    return response;
  } catch (error) {
    console.error("❌ Error sending push notification:", error);
    throw error;
  }
};

/**
 * Send push notification to multiple devices
 * @param {string[]} fcmTokens - Array of device FCM tokens
 * @param {Object} notification - Notification payload
 * @param {Object} data - Data payload (optional)
 */
export const sendPushNotificationToMultiple = async (
  fcmTokens,
  notification,
  data = {}
) => {
  try {
    const messaging = getFirebaseMessaging();

    const message = {
      tokens: fcmTokens,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: {
        ...data,
        ...(data.woId && { woId: String(data.woId) }),
        ...(data.woNumber && { woNumber: String(data.woNumber) }),
      },
      android: {
        priority: "high",
        notification: {
          sound: "default",
          channelId: "job_assignments",
          priority: "high",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
          },
        },
      },
    };

    const response = await messaging.sendEachForMulticast(message);
    console.log(
      `✅ Push notifications sent: ${response.successCount} successful, ${response.failureCount} failed`
    );
    return response;
  } catch (error) {
    console.error("❌ Error sending push notifications:", error);
    throw error;
  }
};

export default {
  initializeFirebase,
  getFirebaseMessaging,
  sendPushNotification,
  sendPushNotificationToMultiple,
};
