// src/server.js
import { createServer } from 'http';
import app from './app.js';
import { PORT } from './config/env.js';
import { initializeSocketIO } from './services/socket.service.js';

const httpServer = createServer(app);

// Initialize Socket.IO
initializeSocketIO(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO server is ready`);
});
