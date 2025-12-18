<!-- @format -->

# Multi-Device FCM Token Support

## Overview

The system now supports **multiple FCM (Firebase Cloud Messaging) tokens per user**, allowing users to receive push notifications on all their devices simultaneously (phone, tablet, web browser, etc.).

## What Changed

### Database Schema

**New `FCMToken` Model:**

```prisma
model FCMToken {
  id          Int      @id @default(autoincrement())
  userId      Int
  token       String   @unique
  deviceType  String?  // IOS, ANDROID, WEB
  deviceName  String?  // "iPhone 13 Pro", "Samsung Galaxy S23"
  deviceId    String?  // Unique device identifier
  isActive    Boolean  @default(true)
  lastUsedAt  DateTime @default(now())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
}
```

**User Model Update:**

- `fcmToken` field kept for backward compatibility (marked as DEPRECATED)
- New `fcmTokens` relation to `FCMToken` model

## API Changes

### POST /api/notifications/fcm-token (Updated)

**Register FCM token for a device**

**Request Body:**

```json
{
  "fcmToken": "dA1B2c3D4e5F6g7H8i9J0k:APA91bH...",
  "deviceType": "ANDROID", // Optional: IOS, ANDROID, WEB
  "deviceName": "Samsung Galaxy S23", // Optional
  "deviceId": "device_unique_id" // Optional
}
```

**Response:**

```json
{
  "message": "FCM token registered successfully",
  "userId": 5,
  "deviceType": "ANDROID"
}
```

**Behavior:**

- If token already exists: Updates `lastUsedAt`, `isActive=true`, device info
- If new token: Creates new `FCMToken` record
- User can have unlimited device registrations
- Each device tracked independently

### DELETE /api/notifications/fcm-token (Updated)

**Remove FCM token(s)**

**Request Body (Optional):**

```json
{
  "fcmToken": "specific_token_to_remove", // Remove specific token
  "deviceId": "device_unique_id" // Or remove by device ID
}
```

**Removal Options:**

1. **Specific token** - Provide `fcmToken` in body
2. **By device** - Provide `deviceId` in body
3. **All tokens** - Send empty body (logout from all devices)

**Response:**

```json
{
  "message": "FCM token removed successfully"
}
```

## Push Notification Behavior

### Before (Single Device)

```javascript
// Old: Only sent to one device (last registered token)
if (user && user.fcmToken) {
  await sendPushNotification(user.fcmToken, notification, data);
}
```

### After (All Devices)

```javascript
// New: Sent to ALL registered devices
await sendPushToAllUserDevices(userId, notification, data);
```

**What Happens:**

1. Queries all active `FCMToken` records for user
2. Sends push notification to each token
3. Updates `lastUsedAt` on successful delivery
4. **Auto-deactivates invalid tokens** (invalid-registration-token errors)
5. Returns statistics: `sentCount`, `totalDevices`, `failedCount`

## Notification Service Updates

All notification functions updated to use `sendPushToAllUserDevices()`:

✅ **Technician Notifications:**

- `notifyWOAssignment()` - Job assigned
- `notifyPaymentVerified()` - Payment verified
- `notifyCommissionPaid()` - Commission paid
- `notifyTechnicianBlocked()` - Account blocked

✅ **Dispatcher Notifications:**

- `notifyWOAccepted()` - Work order accepted
- `notifyWOCompleted()` - Work order completed

✅ **Customer Notifications:**

- `notifySRAssigned()` - Technician assigned
- `notifyTechnicianOnWay()` - Technician on the way
- `notifyTechnicianArrived()` - Technician arrived

## Mobile App Integration

### React Native (Updated)

```javascript
import messaging from "@react-native-firebase/messaging";
import { Platform } from "react-native";
import DeviceInfo from "react-native-device-info";
import axios from "axios";

async function registerForPushNotifications() {
  const authStatus = await messaging().requestPermission();
  const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED;

  if (enabled) {
    const fcmToken = await messaging().getToken();

    // NEW: Include device information
    await axios.post(
      "/api/notifications/fcm-token",
      {
        fcmToken,
        deviceType: Platform.OS === "ios" ? "IOS" : "ANDROID",
        deviceName: await DeviceInfo.getDeviceName(),
        deviceId: await DeviceInfo.getUniqueId(),
      },
      {
        headers: { Authorization: `Bearer ${jwtToken}` },
      }
    );

    console.log("✅ Device registered for push notifications");
  }
}

// Remove token for current device only
async function unregisterCurrentDevice() {
  const fcmToken = await messaging().getToken();
  const deviceId = await DeviceInfo.getUniqueId();

  await axios.delete("/api/notifications/fcm-token", {
    data: { fcmToken, deviceId },
    headers: { Authorization: `Bearer ${jwtToken}` },
  });
}

// Remove all devices (full logout)
async function logoutAllDevices() {
  await axios.delete("/api/notifications/fcm-token", {
    data: {}, // Empty body = remove all
    headers: { Authorization: `Bearer ${jwtToken}` },
  });
}
```

### Flutter (Updated)

```dart
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:http/http.dart' as http;
import 'dart:io';

Future<void> registerFCMToken() async {
  FirebaseMessaging messaging = FirebaseMessaging.instance;
  DeviceInfoPlugin deviceInfo = DeviceInfoPlugin();

  NotificationSettings settings = await messaging.requestPermission(
    alert: true,
    sound: true,
    badge: true,
  );

  if (settings.authorizationStatus == AuthorizationStatus.authorized) {
    String? fcmToken = await messaging.getToken();

    // Get device info
    String deviceType = Platform.isIOS ? 'IOS' : 'ANDROID';
    String deviceName = '';
    String deviceId = '';

    if (Platform.isAndroid) {
      AndroidDeviceInfo androidInfo = await deviceInfo.androidInfo;
      deviceName = '${androidInfo.manufacturer} ${androidInfo.model}';
      deviceId = androidInfo.id;
    } else if (Platform.isIOS) {
      IosDeviceInfo iosInfo = await deviceInfo.iosInfo;
      deviceName = '${iosInfo.name} ${iosInfo.model}';
      deviceId = iosInfo.identifierForVendor ?? '';
    }

    // Register with device info
    await http.post(
      Uri.parse('$baseUrl/api/notifications/fcm-token'),
      headers: {
        'Authorization': 'Bearer $jwtToken',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'fcmToken': fcmToken,
        'deviceType': deviceType,
        'deviceName': deviceName,
        'deviceId': deviceId,
      }),
    );

    print('✅ Device registered: $deviceName');
  }
}

// Remove specific device
Future<void> unregisterDevice(String fcmToken, String deviceId) async {
  await http.delete(
    Uri.parse('$baseUrl/api/notifications/fcm-token'),
    headers: {
      'Authorization': 'Bearer $jwtToken',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({
      'fcmToken': fcmToken,
      'deviceId': deviceId,
    }),
  );
}

// Logout all devices
Future<void> logoutAllDevices() async {
  await http.delete(
    Uri.parse('$baseUrl/api/notifications/fcm-token'),
    headers: {
      'Authorization': 'Bearer $jwtToken',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({}), // Empty = remove all
  );
}
```

## Use Cases

### 1. Multi-Device User

**Scenario:** User has phone, tablet, and web app

- Registers token from phone → Android device tracked
- Registers token from tablet → iOS device tracked
- Registers token from web → Web device tracked
- **Result:** Push notifications appear on all 3 devices simultaneously

### 2. Device Upgrade

**Scenario:** User gets new phone

- Registers token from new phone → New FCM token created
- Old phone token remains active (both receive notifications)
- User can explicitly remove old device if needed

### 3. Logout from One Device

**Scenario:** User logs out from tablet only

```javascript
// Remove tablet token only
await axios.delete("/api/notifications/fcm-token", {
  data: { deviceId: "tablet_device_id" },
});
```

- Phone continues to receive notifications
- Tablet stops receiving notifications

### 4. Logout from All Devices (Security)

**Scenario:** User changes password or reports device stolen

```javascript
// Remove ALL tokens
await axios.delete("/api/notifications/fcm-token", {
  data: {}, // Empty body
});
```

- All devices logged out
- No notifications sent to any device
- User must re-login and re-register

## Token Management

### Automatic Cleanup

```javascript
// Invalid tokens automatically deactivated
if (error.code === "messaging/invalid-registration-token") {
  await prisma.fCMToken.update({
    where: { id: tokenId },
    data: { isActive: false },
  });
}
```

**When tokens become invalid:**

- App uninstalled
- Token expired/refreshed by Firebase
- Device factory reset
- Clear app data

### Manual Cleanup

```sql
-- Find inactive tokens older than 30 days
SELECT * FROM "FCMToken"
WHERE "isActive" = false
  AND "updatedAt" < NOW() - INTERVAL '30 days';

-- Delete old inactive tokens
DELETE FROM "FCMToken"
WHERE "isActive" = false
  AND "updatedAt" < NOW() - INTERVAL '30 days';
```

## Testing

### Test Script

```bash
node test-multi-device-fcm.js
```

**Test Results:**

```
📱 Registering 3 devices for user 5
  ✅ ANDROID: Samsung Galaxy S23 (ID: 4)
  ✅ IOS: iPhone 13 Pro (ID: 5)
  ✅ WEB: Chrome Browser (ID: 6)

📊 Total FCM Tokens for User: 5
  1. WEB - Chrome Browser (Active: true)
  2. IOS - iPhone 13 Pro (Active: true)
  3. ANDROID - Samsung Galaxy S23 (Active: true)

✅ Test completed successfully!
```

### Postman Testing

**Register Multiple Devices:**

```bash
# Device 1 (Android)
POST /api/notifications/fcm-token
{
  "fcmToken": "android_token_123",
  "deviceType": "ANDROID",
  "deviceName": "Samsung Galaxy S23"
}

# Device 2 (iOS)
POST /api/notifications/fcm-token
{
  "fcmToken": "ios_token_456",
  "deviceType": "IOS",
  "deviceName": "iPhone 13 Pro"
}
```

**Trigger Test Notification:**

```bash
# Trigger any notification event (e.g., assign work order)
# Both devices should receive push notification
```

**Remove Specific Device:**

```bash
DELETE /api/notifications/fcm-token
{
  "fcmToken": "android_token_123"
}
```

## Migration Notes

### Database Migration

```bash
npx prisma migrate dev --name add_fcm_token_multi_device_support
```

**Migration Creates:**

- `FCMToken` table with indexes on `userId` and `token`
- Cascade delete on user deletion
- Unique constraint on `token`

### Backward Compatibility

- ✅ Old `User.fcmToken` field still updated (for legacy code)
- ✅ Existing single-token logic still works
- ✅ New multi-token logic takes precedence when available
- ✅ No breaking changes to existing API consumers

### Deployment Checklist

- [x] Database migration applied
- [x] Prisma Client regenerated
- [x] Server restarted with new code
- [x] Postman collection updated
- [x] Mobile app integration documented
- [x] Test script verified

## Benefits

### For Users

✅ Receive notifications on all devices (phone + tablet + web)
✅ No need to re-login when switching devices
✅ Seamless multi-device experience
✅ Can selectively logout from specific devices

### For System

✅ Better notification delivery (redundancy)
✅ Automatic invalid token cleanup
✅ Device tracking for analytics
✅ Selective push notification targeting

### For Developers

✅ Simple API - no breaking changes
✅ Automatic device management
✅ Built-in error handling
✅ Easy testing and debugging

## Monitoring

### Query Active Devices

```javascript
// Get all devices for a user
const devices = await prisma.fCMToken.findMany({
  where: { userId: 5, isActive: true },
  select: {
    deviceType: true,
    deviceName: true,
    lastUsedAt: true,
  },
});

console.log("Active devices:", devices);
```

### Push Notification Stats

```javascript
// sendPushToAllUserDevices returns stats
const result = await sendPushToAllUserDevices(userId, notification, data);

console.log("Sent to:", result.sentCount, "devices");
console.log("Failed:", result.failedCount, "devices");
console.log("Total devices:", result.totalDevices);
```

## Support

**Documentation:**

- [MOBILE_PUSH_INTEGRATION.md](MOBILE_PUSH_INTEGRATION.md)
- [PUSH_NOTIFICATIONS_FIX_DEC17.md](PUSH_NOTIFICATIONS_FIX_DEC17.md)

**Postman Collection:**

- FSM-API.postman_collection.json (updated Dec 18, 2025)

**Test Files:**

- `test-multi-device-fcm.js` - Multi-device support test
- `test-push-notifications.js` - Push notification flow test

---

**Last Updated:** December 18, 2025  
**Version:** 2.0.0 - Multi-Device Support  
**Status:** ✅ Production Ready
