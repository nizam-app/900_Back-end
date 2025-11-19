// src/services/socket.service.js
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';
import { prisma } from '../prisma.js';

let io;

// Store connected users: { userId: socketId }
const connectedUsers = new Map();

export const initializeSocketIO = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*', // Configure this properly in production
      methods: ['GET', 'POST'],
    },
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId} (${socket.userRole})`);
    
    // Store connected user
    connectedUsers.set(socket.userId, socket.id);

    // Join user to their personal room
    socket.join(`user:${socket.userId}`);
    
    // Join role-based rooms
    socket.join(`role:${socket.userRole}`);

    // Emit online status
    socket.broadcast.emit('user:online', { userId: socket.userId });

    // Handle joining specific rooms (e.g., work order room)
    socket.on('join:workorder', (woId) => {
      socket.join(`wo:${woId}`);
      console.log(`User ${socket.userId} joined work order room: ${woId}`);
    });

    socket.on('leave:workorder', (woId) => {
      socket.leave(`wo:${woId}`);
      console.log(`User ${socket.userId} left work order room: ${woId}`);
    });

    // Handle chat messages
    socket.on('chat:message', async (data) => {
      try {
        const { woId, message, recipientId } = data;

        // Save message to database
        const chatMessage = await prisma.chatMessage.create({
          data: {
            woId: Number(woId),
            senderId: socket.userId,
            recipientId: recipientId ? Number(recipientId) : null,
            message,
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        });

        // Send to work order room
        io.to(`wo:${woId}`).emit('chat:message', chatMessage);

        // Also send to recipient's personal room if specified
        if (recipientId) {
          io.to(`user:${recipientId}`).emit('chat:message', chatMessage);
        }
      } catch (error) {
        console.error('Chat message error:', error);
        socket.emit('chat:error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicator
    socket.on('chat:typing', (data) => {
      const { woId, isTyping } = data;
      socket.to(`wo:${woId}`).emit('chat:typing', {
        userId: socket.userId,
        isTyping,
      });
    });

    // Handle location updates (for technicians)
    socket.on('location:update', async (data) => {
      try {
        const { latitude, longitude, status } = data;
        
        if (socket.userRole === 'TECH_INTERNAL' || socket.userRole === 'TECH_FREELANCER') {
          await prisma.user.update({
            where: { id: socket.userId },
            data: {
              lastLatitude: latitude,
              lastLongitude: longitude,
              locationStatus: status || 'ONLINE',
              locationUpdatedAt: new Date(),
            },
          });

          // Broadcast to dispatchers/admins
          io.to('role:DISPATCHER').to('role:ADMIN').emit('technician:location', {
            technicianId: socket.userId,
            latitude,
            longitude,
            status,
            timestamp: new Date(),
          });
        }
      } catch (error) {
        console.error('Location update error:', error);
      }
    });

    // Handle work order status updates
    socket.on('wo:status', (data) => {
      const { woId, status } = data;
      io.to(`wo:${woId}`).emit('wo:status', {
        woId,
        status,
        updatedBy: socket.userId,
        timestamp: new Date(),
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
      connectedUsers.delete(socket.userId);
      socket.broadcast.emit('user:offline', { userId: socket.userId });
    });
  });

  console.log('Socket.IO initialized');
  return io;
};

// Helper function to get Socket.IO instance
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

// Helper function to send notification to specific user
export const sendSocketNotification = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

// Helper function to send notification to work order room
export const sendWONotification = (woId, event, data) => {
  if (io) {
    io.to(`wo:${woId}`).emit(event, data);
  }
};

// Helper function to send notification to role
export const sendRoleNotification = (role, event, data) => {
  if (io) {
    io.to(`role:${role}`).emit(event, data);
  }
};

// Check if user is online
export const isUserOnline = (userId) => {
  return connectedUsers.has(userId);
};

// Get all online users
export const getOnlineUsers = () => {
  return Array.from(connectedUsers.keys());
};
