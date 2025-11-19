# New API Endpoints - Chat & Device Management

## 📲 Device Management

### Register Device (FCM Token)
```http
POST {{baseUrl}}/api/device/register
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "fcmToken": "device-fcm-token-from-firebase",
  "deviceInfo": {
    "platform": "android",
    "model": "Samsung Galaxy S21"
  }
}
```

### Unregister Device
```http
POST {{baseUrl}}/api/device/unregister
Authorization: Bearer {{token}}
```

### Test Push Notification
```http
POST {{baseUrl}}/api/device/test-notification
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "title": "Test Notification",
  "body": "This is a test push notification"
}
```

## 💬 Chat API

### Get Chat Messages for Work Order
```http
GET {{baseUrl}}/api/chat/wo/1?limit=50&offset=0
Authorization: Bearer {{token}}
```

### Send Chat Message
```http
POST {{baseUrl}}/api/chat/wo/1
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "message": "Hello! I'm on my way to the job site.",
  "recipientId": 5
}
```

### Mark Messages as Read
```http
PATCH {{baseUrl}}/api/chat/wo/1/read
Authorization: Bearer {{token}}
```

### Get Unread Message Count
```http
GET {{baseUrl}}/api/chat/unread-count
Authorization: Bearer {{token}}
```

## 🔌 Socket.IO Connection

### JavaScript/Node.js Example
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:4000', {
  auth: {
    token: 'your-jwt-token-here'
  }
});

// Connection events
socket.on('connect', () => {
  console.log('✅ Connected to Socket.IO server');
  
  // Join a work order room
  socket.emit('join:workorder', 123);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from server');
});

// Listen for chat messages
socket.on('chat:message', (message) => {
  console.log('New message:', message);
});

// Send a chat message
socket.emit('chat:message', {
  woId: 123,
  message: 'Hello via Socket.IO!',
  recipientId: 5
});

// Listen for typing indicators
socket.on('chat:typing', (data) => {
  console.log(`User ${data.userId} is typing:`, data.isTyping);
});

// Send typing indicator
socket.emit('chat:typing', {
  woId: 123,
  isTyping: true
});

// Update location (for technicians)
socket.emit('location:update', {
  latitude: 23.8103,
  longitude: 90.4125,
  status: 'ONLINE'
});

// Listen for location updates (dispatchers/admins)
socket.on('technician:location', (data) => {
  console.log('Tech location update:', data);
});
```

### React/React Native Example
```jsx
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

function Chat({ woId, token }) {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const newSocket = io('http://localhost:4000', {
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('Connected!');
      newSocket.emit('join:workorder', woId);
    });

    newSocket.on('chat:message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, [woId, token]);

  const sendMessage = (text) => {
    socket?.emit('chat:message', {
      woId,
      message: text
    });
  };

  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>{msg.sender.name}: {msg.message}</div>
      ))}
    </div>
  );
}
```

### Flutter/Dart Example
```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;

class SocketService {
  late IO.Socket socket;

  void connect(String token, int woId) {
    socket = IO.io('http://localhost:4000', 
      IO.OptionBuilder()
        .setAuth({'token': token})
        .setTransports(['websocket'])
        .build()
    );

    socket.onConnect((_) {
      print('Connected!');
      socket.emit('join:workorder', woId);
    });

    socket.on('chat:message', (data) {
      print('New message: $data');
      // Update UI with new message
    });

    socket.onDisconnect((_) {
      print('Disconnected');
    });
  }

  void sendMessage(int woId, String message) {
    socket.emit('chat:message', {
      'woId': woId,
      'message': message
    });
  }

  void disconnect() {
    socket.disconnect();
  }
}
```

## 📊 Socket.IO Events Reference

### Events You Can Emit (Client → Server)

| Event | Data | Description |
|-------|------|-------------|
| `join:workorder` | `woId` | Join a work order chat room |
| `leave:workorder` | `woId` | Leave a work order chat room |
| `chat:message` | `{woId, message, recipientId?}` | Send a chat message |
| `chat:typing` | `{woId, isTyping}` | Send typing indicator |
| `location:update` | `{latitude, longitude, status}` | Update location (techs only) |
| `wo:status` | `{woId, status}` | Broadcast WO status change |

### Events You Can Listen For (Server → Client)

| Event | Data | Description |
|-------|------|-------------|
| `user:online` | `{userId}` | User came online |
| `user:offline` | `{userId}` | User went offline |
| `chat:message` | Message object | New chat message received |
| `chat:typing` | `{userId, isTyping}` | Someone is typing |
| `chat:error` | `{message}` | Error occurred |
| `technician:location` | Location data | Tech location update (dispatchers/admins only) |
| `wo:status` | `{woId, status, updatedBy, timestamp}` | WO status changed |

## 🔔 Firebase Topics

Users are automatically subscribed to:
- `role_admin`
- `role_dispatcher`
- `role_customer`
- `role_tech_internal`
- `role_tech_freelancer`
- `role_call_center`
- `user_{userId}` (personal topic)

## 🧪 Testing with Postman

1. **Get your JWT token**: Login via `/api/auth/login` and save the token
2. **Register device**: Use `/api/device/register` endpoint
3. **Send message**: Use `/api/chat/wo/:woId` endpoint
4. **Test notification**: Use `/api/device/test-notification` endpoint

## 📱 Mobile App Integration

### Android (Firebase)
1. Add Firebase to your Android app
2. Get FCM token in your app
3. Send token to `/api/device/register`
4. Handle incoming notifications

### iOS (Firebase)
1. Add Firebase to your iOS app
2. Get FCM token (APNS)
3. Send token to `/api/device/register`
4. Handle incoming notifications

## ⚙️ Production Checklist

- [ ] Configure Firebase credentials in `.env`
- [ ] Update Socket.IO CORS settings in `socket.service.js`
- [ ] Use HTTPS for Socket.IO in production
- [ ] Set up Firebase Cloud Messaging in mobile apps
- [ ] Test push notifications on real devices
- [ ] Monitor Socket.IO connections
- [ ] Set up notification channels (Android 8+)
