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
 * @param {Object} notification - Notification payload (title, body)
 * @param {Object} data - Data payload (optional)
 */
export const sendPushNotification = async (
  fcmToken,
  notification,
  data = {}
) => {
  try {
    const messaging = getFirebaseMessaging();

    // Generate a unique notification tag to prevent duplicates
    const notificationTag = data.notificationId
      ? `notif_${data.notificationId}`
      : `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const notificationPayload = {
      title: notification.title,
      body: notification.body,
    };

    // Only add imageUrl if it exists
    if (notification.imageUrl) {
      notificationPayload.imageUrl = notification.imageUrl;
    }

    const message = {
      token: fcmToken,
      notification: notificationPayload,
      data: {
        // Include all data as strings
        ...Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, String(v)])
        ),
        // Add title and body to data for app to use
        title: notification.title || "",
        body: notification.body || "",
        // Flag to identify this came from push (app should not show duplicate from data)
        source: "fcm_push",
        timestamp: new Date().toISOString(),
        // Include tag in data so app can use it for deduplication
        notificationTag: notificationTag,
      },
      android: {
        priority: "high",
        notification: {
          sound: "default",
          channelId: "high_importance_channel",
          priority: "high",
          defaultSound: true,
          defaultVibrateTimings: true,
          // Use notification tag to prevent duplicates - same tag = replace previous notification
          tag: notificationTag,
        },
        // Collapse key for message deduplication (groups messages with same key)
        collapseKey: data.notificationId
          ? `collapse_${data.notificationId}`
          : undefined,
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
            contentAvailable: true,
            category: data.type || "DEFAULT",
            // Thread ID to group related notifications
            threadId: data.woNumber || data.type || "default",
          },
        },
        headers: {
          // iOS collapse ID header for deduplication
          ...(data.notificationId && {
            "apns-collapse-id": `collapse_${data.notificationId}`,
          }),
        },
      },
    };

    const response = await messaging.send(message);
    console.log("✅ Push notification sent successfully:", response);
    console.log("📱 Notification details:", {
      title: notification.title,
      body: notification.body,
      dataType: data.type,
      notificationId: data.notificationId,
      notificationTag: notificationTag,
    });
    return response;
  } catch (error) {
    // Check if token is invalid before logging
    const invalidTokenCodes = [
      "messaging/invalid-registration-token",
      "messaging/registration-token-not-registered",
      "messaging/invalid-argument",
      "messaging/unsupported-registration-token",
      "messaging/mismatched-credential", // SenderId mismatch - token from different Firebase project
    ];

    const isInvalidToken =
      invalidTokenCodes.includes(error.code) ||
      error.message?.includes("not a valid FCM registration token") ||
      error.message?.includes("Invalid registration token");

    if (isInvalidToken) {
      console.error("❌ Invalid FCM token detected:", {
        tokenPreview: fcmToken ? `${fcmToken.substring(0, 30)}...` : "missing",
        errorCode: error.code,
        errorMessage: error.message,
      });
    } else {
      console.error("❌ Error sending push notification:", error);
      console.error("Failed message details:", {
        token: fcmToken ? `${fcmToken.substring(0, 20)}...` : "missing",
        title: notification.title,
        errorCode: error.code,
        errorMessage: error.message,
      });
    }
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
          channelId: "high_importance_channel", // Match Flutter app channel ID
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
