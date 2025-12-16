// src/server.js
import app from './app.js';
import { PORT } from './config/env.js';
import { initializeFirebase } from './utils/firebase.js';

// Initialize Firebase Admin SDK for push notifications
try {
  initializeFirebase();
} catch (error) {
  console.error('❌ Failed to initialize Firebase:', error);
}

app.listen(PORT, () => {
  console.log(`🚀 FSM Server running on port ${PORT}`);
});
