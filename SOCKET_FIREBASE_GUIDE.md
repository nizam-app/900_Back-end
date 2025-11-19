# Socket.IO & Firebase Push Notifications Integration

## ✅ Installed Packages
- `socket.io` - Real-time bidirectional communication
- `firebase-admin` - Firebase Cloud Messaging for push notifications

## 🔧 Configuration

### 1. Environment Variables (.env)
```env
# Firebase Push Notification Configuration
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com"
```

### 2. Get Firebase Credentials
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Go to **Project Settings** > **Service Accounts**
4. Click **Generate New Private Key**
5. Download the JSON file
6. Extract the values for `.env`:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `private_key` → `FIREBASE_PRIVATE_KEY`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`

## 📊 Database Changes

### New Fields in User Model
- `fcmToken` - Firebase Cloud Messaging token for push notifications

### New ChatMessage Model
```prisma
model ChatMessage {
  id          Int       @id @default(autoincrement())
  woId        Int       // Work Order ID
  senderId    Int       // Message sender
  recipientId Int?      // Optional recipient (null = group chat)
  message     String
  isRead      Boolean   @default(false)
  readAt      DateTime?
  createdAt   DateTime
  updatedAt   DateTime
}
```

Migration already applied: `20251119040305_add_chat_and_fcm_token`

## 🔌 Socket.IO Features

### Server Setup
- Socket.IO integrated with HTTP server
- JWT authentication for WebSocket connections
- Real-time events for messaging, location, and work order updates

### Socket.IO Events

#### Client → Server
```javascript
// Connect (with authentication)
socket.connect({
  auth: { token: 'your-jwt-token' }
});

// Join work order room
socket.emit('join:workorder', woId);

// Leave work order room
socket.emit('leave:workorder', woId);

// Send chat message
socket.emit('chat:message', {
  woId: 123,
  message: 'Hello!',
  recipientId: 5 // optional
});

// Send typing indicator
socket.emit('chat:typing', {
  woId: 123,
  isTyping: true
});

// Update location (technicians only)
socket.emit('location:update', {
  latitude: 23.8103,
  longitude: 90.4125,
  status: 'ONLINE'
});

// Update work order status
socket.emit('wo:status', {
  woId: 123,
  status: 'IN_PROGRESS'
});
```

#### Server → Client
```javascript
// User came online
socket.on('user:online', (data) => {
  console.log('User online:', data.userId);
});

// User went offline
socket.on('user:offline', (data) => {
  console.log('User offline:', data.userId);
});

// New chat message
socket.on('chat:message', (message) => {
  console.log('New message:', message);
});

// Someone is typing
socket.on('chat:typing', (data) => {
  console.log('Typing:', data.userId, data.isTyping);
});

// Technician location update (dispatchers/admins only)
socket.on('technician:location', (data) => {
  console.log('Tech location:', data);
});

// Work order status update
socket.on('wo:status', (data) => {
  console.log('WO status:', data);
});

// Chat error
socket.on('chat:error', (error) => {
  console.error('Chat error:', error);
});
```

### Room Structure
- `user:{userId}` - Personal room for each user
- `role:{ROLE}` - Room for each role (ADMIN, DISPATCHER, etc.)
- `wo:{woId}` - Room for each work order

## 📱 Push Notification Features

### Device Management API

#### Register Device
```http
POST /api/device/register
Authorization: Bearer <token>
Content-Type: application/json

{
  "fcmToken": "device-fcm-token-here",
  "deviceInfo": {
    "platform": "android",
    "model": "Pixel 6"
  }
}
```

#### Unregister Device
```http
POST /api/device/unregister
Authorization: Bearer <token>
```

#### Test Notification
```http
POST /api/device/test-notification
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Test Title",
  "body": "Test message"
}
```

### Firebase Service Functions

```javascript
import {
  sendPushNotification,
  sendMulticastNotification,
  sendTopicNotification,
  sendWOPushNotification,
  sendPaymentPushNotification
} from './services/firebase.service.js';

// Send to single device
await sendPushNotification(
  'fcm-token',
  { title: 'Title', body: 'Message' },
  { key: 'value' }
);

// Send to multiple devices
await sendMulticastNotification(
  ['token1', 'token2'],
  { title: 'Title', body: 'Message' },
  { key: 'value' }
);

// Send to topic
await sendTopicNotification(
  'role_dispatcher',
  { title: 'Title', body: 'Message' },
  { key: 'value' }
);

// Send work order notification
await sendWOPushNotification(
  userId,
  'WO-12345',
  'Work Order Assigned',
  'You have been assigned a new work order'
);

// Send payment notification
await sendPaymentPushNotification(
  userId,
  500,
  'Payment Verified',
  'Your payment of $500 has been verified'
);
```

## 💬 Chat API (HTTP Alternative)

### Get Chat Messages
```http
GET /api/chat/wo/:woId?limit=50&offset=0
Authorization: Bearer <token>
```

### Send Message
```http
POST /api/chat/wo/:woId
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "Hello!",
  "recipientId": 5
}
```

### Mark Messages as Read
```http
PATCH /api/chat/wo/:woId/read
Authorization: Bearer <token>
```

### Get Unread Count
```http
GET /api/chat/unread-count
Authorization: Bearer <token>
```

## 📲 Client Integration Examples

### React/React Native
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:4000', {
  auth: {
    token: 'your-jwt-token'
  }
});

socket.on('connect', () => {
  console.log('Connected!');
  
  // Join work order room
  socket.emit('join:workorder', 123);
});

socket.on('chat:message', (message) => {
  // Handle new message
  console.log('New message:', message);
});

// Send message
socket.emit('chat:message', {
  woId: 123,
  message: 'Hello from React!'
});
```

### Flutter/Dart
```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;

final socket = IO.io('http://localhost:4000', 
  IO.OptionBuilder()
    .setAuth({'token': 'your-jwt-token'})
    .build()
);

socket.onConnect((_) {
  print('Connected!');
  socket.emit('join:workorder', 123);
});

socket.on('chat:message', (data) {
  print('New message: $data');
});

// Send message
socket.emit('chat:message', {
  'woId': 123,
  'message': 'Hello from Flutter!'
});
```

## 🔔 Push Notification Topics

Users are automatically subscribed to:
- `role_{role}` - Based on user role (e.g., `role_dispatcher`, `role_tech_internal`)
- `user_{userId}` - Personal topic for each user

## 🧪 Testing

### Test Socket.IO Connection
```bash
# Install socket.io-client globally
npm install -g socket.io-client

# Use curl for HTTP requests
curl -X POST http://localhost:4000/api/device/register \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fcmToken": "test-token"}'
```

### Test Chat
```bash
# Send message via HTTP
curl -X POST http://localhost:4000/api/chat/wo/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Test message"}'

# Get messages
curl http://localhost:4000/api/chat/wo/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📝 Important Notes

1. **Firebase Setup**: Push notifications will be disabled if Firebase credentials are not configured. The app will still work without them.

2. **Socket.IO Authentication**: All WebSocket connections require a valid JWT token.

3. **Chat Persistence**: All chat messages are stored in the database for history.

4. **Location Updates**: Only technicians (TECH_INTERNAL, TECH_FREELANCER) can send location updates.

5. **CORS**: Configure CORS properly in production in `socket.service.js`

6. **Topics**: Users are automatically subscribed to role-based and user-specific topics for targeted notifications.

## 🚀 Next Steps

1. Set up Firebase project and add credentials to `.env`
2. Configure FCM in your mobile apps
3. Implement Socket.IO client in your frontend
4. Test real-time messaging
5. Test push notifications on actual devices

## 🛡️ Security

- JWT authentication for all Socket.IO connections
- Users can only access work orders they're associated with
- Role-based access control for location updates
- Message validation and sanitization
