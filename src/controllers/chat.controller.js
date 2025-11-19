// src/controllers/chat.controller.js
import { prisma } from '../prisma.js';
import { sendSocketNotification } from '../services/socket.service.js';
import { sendPushNotification } from '../services/firebase.service.js';

// Get chat messages for a work order
export const getChatMessages = async (req, res, next) => {
  try {
    const { woId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const messages = await prisma.chatMessage.findMany({
      where: {
        woId: Number(woId),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        recipient: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: Number(limit),
      skip: Number(offset),
    });

    return res.json({
      messages: messages.reverse(), // Return in chronological order
      total: messages.length,
    });
  } catch (err) {
    next(err);
  }
};

// Mark messages as read
export const markMessagesAsRead = async (req, res, next) => {
  try {
    const { woId } = req.params;
    const userId = req.user.id;

    await prisma.chatMessage.updateMany({
      where: {
        woId: Number(woId),
        recipientId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return res.json({ message: 'Messages marked as read' });
  } catch (err) {
    next(err);
  }
};

// Get unread message count
export const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const count = await prisma.chatMessage.count({
      where: {
        recipientId: userId,
        isRead: false,
      },
    });

    return res.json({ unreadCount: count });
  } catch (err) {
    next(err);
  }
};

// Send chat message via HTTP (alternative to Socket.IO)
export const sendMessage = async (req, res, next) => {
  try {
    const { woId } = req.params;
    const { message, recipientId } = req.body;
    const senderId = req.user.id;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    // Verify work order exists
    const wo = await prisma.workOrder.findUnique({
      where: { id: Number(woId) },
      select: {
        id: true,
        customerId: true,
        technicianId: true,
        dispatcherId: true,
      },
    });

    if (!wo) {
      return res.status(404).json({ message: 'Work order not found' });
    }

    // Create chat message
    const chatMessage = await prisma.chatMessage.create({
      data: {
        woId: Number(woId),
        senderId,
        recipientId: recipientId ? Number(recipientId) : null,
        message: message.trim(),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        recipient: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    // Send Socket.IO notification
    sendSocketNotification(recipientId || wo.customerId, 'chat:message', chatMessage);
    
    // Send push notification if recipient is offline
    if (recipientId) {
      const recipient = await prisma.user.findUnique({
        where: { id: Number(recipientId) },
        select: { fcmToken: true },
      });

      if (recipient?.fcmToken) {
        await sendPushNotification(
          recipient.fcmToken,
          {
            title: `New message from ${chatMessage.sender.name}`,
            body: message.substring(0, 100),
          },
          {
            type: 'CHAT_MESSAGE',
            woId: woId.toString(),
            senderId: senderId.toString(),
          }
        );
      }
    }

    return res.status(201).json(chatMessage);
  } catch (err) {
    next(err);
  }
};
