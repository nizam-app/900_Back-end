<!-- @format -->

/\*_ @format _/

# 📱 MOBILE APP PUSH NOTIFICATION INTEGRATION GUIDE

**Quick Start for Mobile Developers**  
**Date:** December 17, 2025  
**Status:** Backend READY ✅

---

## 🎯 What You Need to Do

Push notifications are **fully working** on the backend. You just need to integrate Firebase in your mobile app and register the device token.

---

## ⚡ Quick Setup (3 Steps)

### 1️⃣ Install Firebase

**React Native:**

```bash
npm install @react-native-firebase/app @react-native-firebase/messaging
cd ios && pod install && cd ..
```

**Flutter:**

```bash
flutter pub add firebase_core firebase_messaging
```

### 2️⃣ Register FCM Token After Login

**React Native:**

```javascript
import messaging from "@react-native-firebase/messaging";
import axios from "axios";

const BASE_URL = "https://fsm-api.alright-bd.com";

async function registerForPushNotifications(jwtToken) {
  try {
    // Request permission
    const authStatus = await messaging().requestPermission();
    const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED;

    if (enabled) {
      // Get FCM token
      const fcmToken = await messaging().getToken();

      // Register with backend
      const response = await axios.post(
        `${BASE_URL}/api/notifications/fcm-token`,
        { fcmToken },
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ FCM token registered:", response.data);
      return true;
    }
  } catch (error) {
    console.error("❌ FCM registration failed:", error);
    return false;
  }
}

// Call this after successful login
async function onUserLogin(jwtToken) {
  // ... existing login logic ...

  // Register for push notifications
  await registerForPushNotifications(jwtToken);
}
```

**Flutter:**

```dart
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

const String baseUrl = 'https://fsm-api.alright-bd.com';

Future<bool> registerForPushNotifications(String jwtToken) async {
  try {
    FirebaseMessaging messaging = FirebaseMessaging.instance;

    // Request permission
    NotificationSettings settings = await messaging.requestPermission(
      alert: true,
      sound: true,
      badge: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      // Get FCM token
      String? fcmToken = await messaging.getToken();

      if (fcmToken != null) {
        // Register with backend
        final response = await http.post(
          Uri.parse('$baseUrl/api/notifications/fcm-token'),
          headers: {
            'Authorization': 'Bearer $jwtToken',
            'Content-Type': 'application/json',
          },
          body: jsonEncode({'fcmToken': fcmToken}),
        );

        if (response.statusCode == 200) {
          print('✅ FCM token registered');
          return true;
        }
      }
    }

    return false;
  } catch (e) {
    print('❌ FCM registration failed: $e');
    return false;
  }
}

// Call this after successful login
Future<void> onUserLogin(String jwtToken) async {
  // ... existing login logic ...

  // Register for push notifications
  await registerForPushNotifications(jwtToken);
}
```

### 3️⃣ Listen for Notifications

**React Native:**

```javascript
import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import messaging from '@react-native-firebase/messaging';

function App() {
  const navigation = useNavigation();

  useEffect(() => {
    // Foreground notifications
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      console.log('📱 Notification received:', remoteMessage);

      // Show in-app notification
      Alert.alert(
        remoteMessage.notification?.title || 'New Notification',
        remoteMessage.notification?.body || ''
      );
    });

    // Background/quit - notification tap
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('🔔 Notification tapped:', remoteMessage.data);
      handleNotificationTap(remoteMessage.data);
    });

    // Check if app was opened from notification
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('🔔 App opened from notification:', remoteMessage.data);
          handleNotificationTap(remoteMessage.data);
        }
      });

    return unsubscribe;
  }, []);

  function handleNotificationTap(data) {
    // Navigate based on notification type
    switch (data.type) {
      case 'WO_ASSIGNED':
        navigation.navigate('WorkOrderDetails', { woId: data.woId });
        break;
      case 'PAYMENT_VERIFIED':
        navigation.navigate('Earnings');
        break;
      case 'TECH_ON_WAY':
      case 'TECH_ARRIVED':
        navigation.navigate('OrderTracking', { woId: data.woId });
        break;
      default:
        navigation.navigate('Notifications');
    }
  }

  return (
    // ... your app component ...
  );
}
```

**Flutter:**

```dart
import 'package:firebase_messaging/firebase_messaging.dart';

class NotificationService {
  final FirebaseMessaging _messaging = FirebaseMessaging.instance;

  Future<void> initialize() async {
    // Foreground notifications
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print('📱 Notification received: ${message.notification?.title}');

      // Show in-app notification
      _showNotificationDialog(
        message.notification?.title ?? 'New Notification',
        message.notification?.body ?? '',
      );
    });

    // Background/quit - notification tap
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      print('🔔 Notification tapped: ${message.data}');
      _handleNotificationTap(message.data);
    });

    // Check if app was opened from notification
    RemoteMessage? initialMessage = await _messaging.getInitialMessage();
    if (initialMessage != null) {
      print('🔔 App opened from notification: ${initialMessage.data}');
      _handleNotificationTap(initialMessage.data);
    }
  }

  void _handleNotificationTap(Map<String, dynamic> data) {
    String type = data['type'] ?? '';

    switch (type) {
      case 'WO_ASSIGNED':
        Navigator.pushNamed(context, '/work-order', arguments: data['woId']);
        break;
      case 'PAYMENT_VERIFIED':
        Navigator.pushNamed(context, '/earnings');
        break;
      case 'TECH_ON_WAY':
      case 'TECH_ARRIVED':
        Navigator.pushNamed(context, '/order-tracking', arguments: data['woId']);
        break;
      default:
        Navigator.pushNamed(context, '/notifications');
    }
  }
}
```

---

## 🔥 Notification Types You'll Receive

| Type                 | Who Gets It | When                     | Title                    | Action                  |
| -------------------- | ----------- | ------------------------ | ------------------------ | ----------------------- |
| `WO_ASSIGNED`        | Technician  | New job assigned         | 🔔 New Job Assigned!     | Open work order details |
| `WO_ACCEPTED`        | Dispatcher  | Tech accepts job         | ✅ Work Order Accepted   | Open work order         |
| `WO_COMPLETED`       | Dispatcher  | Tech completes job       | ✅ Work Order Completed  | Open work order         |
| `PAYMENT_VERIFIED`   | Technician  | Payment confirmed        | 💰 Payment Verified      | Open earnings           |
| `COMMISSION_PAID`    | Technician  | Commission paid          | 💵 Commission Paid       | Open earnings           |
| `TECHNICIAN_BLOCKED` | Technician  | Account blocked          | 🚫 Account Blocked       | Show alert              |
| `SR_ASSIGNED`        | Customer    | Tech assigned to SR      | 👷 Technician Assigned   | Show technician info    |
| `TECH_ON_WAY`        | Customer    | Tech heading to location | 🚗 Technician On The Way | Open tracking           |
| `TECH_ARRIVED`       | Customer    | Tech arrived             | 📍 Technician Arrived    | Open tracking           |

---

## 🔓 Logout Cleanup

**React Native:**

```javascript
async function onUserLogout() {
  try {
    // Remove FCM token from backend
    await axios.delete(`${BASE_URL}/api/notifications/fcm-token`, {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
    });

    // Clear local auth
    await AsyncStorage.removeItem("authToken");

    // Navigate to login
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  } catch (error) {
    console.error("Logout error:", error);
    // Continue logout even if FCM removal fails
  }
}
```

**Flutter:**

```dart
Future<void> onUserLogout() async {
  try {
    // Remove FCM token from backend
    await http.delete(
      Uri.parse('$baseUrl/api/notifications/fcm-token'),
      headers: {
        'Authorization': 'Bearer $jwtToken',
      },
    );

    // Clear local auth
    await storage.delete(key: 'authToken');

    // Navigate to login
    Navigator.pushNamedAndRemoveUntil(
      context,
      '/login',
      (route) => false,
    );
  } catch (e) {
    print('Logout error: $e');
    // Continue logout even if FCM removal fails
  }
}
```

---

## 📦 Notification Data Structure

Every push notification includes:

```javascript
{
  notification: {
    title: "🔔 New Job Assigned!",
    body: "Work Order WO-123 - Customer: John Doe"
  },
  data: {
    type: "WO_ASSIGNED",        // Notification type
    woId: "123",                // Work order ID (if applicable)
    woNumber: "WO-123",         // Work order number
    customerId: "456",          // Customer ID (if applicable)
    customerName: "John Doe",   // Customer name
    priority: "high",           // Priority level
    sound: "default"            // Sound to play
  }
}
```

---

## 🧪 Testing Checklist

### Backend Testing (Already Done ✅)

- [x] Firebase initialized
- [x] FCM token registration endpoint works
- [x] FCM token removal endpoint works
- [x] All 9 notification types send push
- [x] Push includes sound and high priority
- [x] Postman collection updated

### Mobile Testing (Your Turn 📱)

- [ ] Install Firebase SDK
- [ ] Request notification permission
- [ ] Get FCM token from Firebase
- [ ] Register token with backend
- [ ] Receive test notification
- [ ] Verify sound plays
- [ ] Verify notification shows in bar
- [ ] Test notification tap navigation
- [ ] Test logout token removal
- [ ] Test token refresh on app restart

---

## 🆘 Troubleshooting

### No notifications received?

1. **Check FCM token is registered:**

   ```bash
   # Call this endpoint to verify
   GET /api/notifications
   # Check if your user has notifications
   ```

2. **Check Firebase console:**

   - Go to Firebase Console → Cloud Messaging
   - Send a test notification to your FCM token
   - If Firebase test works but app doesn't = app issue
   - If Firebase test fails = token issue

3. **Check backend logs:**

   ```bash
   # Look for these in server logs:
   ✅ Push notification sent successfully: projects/xxx/messages/xxx
   🔔 Push notification sent to user 123

   # Or errors:
   ❌ Error sending push notification: ...
   ```

4. **Check app permissions:**
   - iOS: Settings → Your App → Notifications → Allow
   - Android: Settings → Apps → Your App → Notifications → Enabled

### Notifications not playing sound?

1. **iOS:**

   - Check "Allow Sounds" in notification settings
   - Check phone is not in silent mode
   - Ensure `sound: "default"` is in payload

2. **Android:**
   - Check notification channel settings
   - Ensure channel ID matches: `"job_assignments"`
   - Check "Make sound" is enabled for channel

---

## 📚 API Endpoints

### Register FCM Token

```
POST /api/notifications/fcm-token
Headers: Authorization: Bearer {JWT_TOKEN}
Body: { "fcmToken": "device_token_here" }

Response:
{
  "message": "FCM token registered successfully",
  "fcmToken": "device_token_here"
}
```

### Remove FCM Token (Logout)

```
DELETE /api/notifications/fcm-token
Headers: Authorization: Bearer {JWT_TOKEN}

Response:
{
  "message": "FCM token removed successfully"
}
```

### Get Notifications

```
GET /api/notifications?unreadOnly=true
Headers: Authorization: Bearer {JWT_TOKEN}

Response:
{
  "notifications": [
    {
      "id": 123,
      "type": "WO_ASSIGNED",
      "title": "New Work Order Assigned",
      "message": "...",
      "isRead": false,
      "createdAt": "2025-12-17T10:30:00Z"
    }
  ]
}
```

---

## ✅ Ready to Go!

Backend is **100% ready**. Follow the 3 steps above and you'll have working push notifications with:

- ✅ Sound alerts
- ✅ High priority delivery
- ✅ Notification bar display
- ✅ Deep linking to app screens
- ✅ Vibration on device
- ✅ Works in foreground, background, and quit state

---

## 📞 Need Help?

- Backend code: `src/services/notification.service.js`
- Firebase utils: `src/utils/firebase.js`
- Test script: `test-push-notifications.js`
- Full guide: `FIREBASE_PUSH_NOTIFICATIONS.md`
- Fix details: `PUSH_NOTIFICATIONS_FIX_DEC17.md`
- Postman: Collection → Notifications → FCM endpoints

**Questions?** Check the documentation files or ask!

---

**🎉 Good luck with mobile integration!**
