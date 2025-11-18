// src/services/notification.service.js
import { prisma } from '../prisma.js';

// ✅ Create and send notification
export const createNotification = async (userId, type, title, message, data = null) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        dataJson: data ? JSON.stringify(data) : null,
      },
    });

    // TODO: Integrate push notification service (Firebase, OneSignal, etc.)
    console.log(`🔔 Notification sent to user ${userId}: ${title}`);

    return notification;
  } catch (err) {
    console.error('Error creating notification:', err);
    throw err;
  } 
};

// ✅ Get user notifications
export const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { unreadOnly } = req.query;

    const where = { userId };
    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return res.json(notifications);
  } catch (err) {
    next(err);
  }
};

// ✅ Mark notification as read
export const markAsRead = async (req, res, next) => {
  try {
    const notificationId = Number(req.params.id);
    const userId = req.user.id;

    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return res.json(updated);
  } catch (err) {
    next(err);
  }
};

// ✅ Mark all notifications as read
export const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
};

// ✅ Send notification for WO assignment
export const notifyWOAssignment = async (technicianId, wo) => {
  return createNotification(
    technicianId,
    'WO_ASSIGNED',
    'New Work Order Assigned',
    `You have been assigned work order ${wo.woNumber}`,
    { woId: wo.id, woNumber: wo.woNumber }
  );
};

// ✅ Send notification for WO acceptance
export const notifyWOAccepted = async (dispatcherId, wo) => {
  return createNotification(
    dispatcherId,
    'WO_ACCEPTED',
    'Work Order Accepted',
    `Technician accepted work order ${wo.woNumber}`,
    { woId: wo.id, woNumber: wo.woNumber }
  );
};

// ✅ Send notification for WO completion
export const notifyWOCompleted = async (dispatcherId, wo) => {
  return createNotification(
    dispatcherId,
    'WO_COMPLETED',
    'Work Order Completed',
    `Work order ${wo.woNumber} has been completed`,
    { woId: wo.id, woNumber: wo.woNumber }
  );
};

// ✅ Send notification for payment verification
export const notifyPaymentVerified = async (technicianId, wo, payment) => {
  return createNotification(
    technicianId,
    'PAYMENT_VERIFIED',
    'Payment Verified',
    `Payment for work order ${wo.woNumber} has been verified`,
    { woId: wo.id, woNumber: wo.woNumber, amount: payment.amount }
  );
};

// ✅ Send notification for commission paid
export const notifyCommissionPaid = async (technicianId, payout) => {
  return createNotification(
    technicianId,
    'COMMISSION_PAID',
    'Commission Paid',
    `Your commission of ${payout.totalAmount} has been paid`,
    { payoutId: payout.id, amount: payout.totalAmount }
  );
};

// ✅ Send notification for technician blocked
export const notifyTechnicianBlocked = async (technicianId, reason) => {
  return createNotification(
    technicianId,
    'TECHNICIAN_BLOCKED',
    'Account Blocked',
    `Your account has been blocked. Reason: ${reason}`,
    { reason }
  );
};
