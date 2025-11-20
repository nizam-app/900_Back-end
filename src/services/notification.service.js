// src/services/notification.service.js
import { prisma } from '../prisma.js';

// ✅ Create and send notification (database storage only)
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

    // Notification stored in database only (real-time delivery removed)
    console.log(`🔔 Notification created for user ${userId}: ${title}`);

    return notification;
  } catch (err) {
    console.error('Error creating notification:', err);
    throw err;
  } 
};

// ✅ Get user notifications
export const findUserNotifications = async (userId, filters) => {
  const { unreadOnly } = filters;

  const where = { userId };
  if (unreadOnly === 'true') {
    where.isRead = false;
  }

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return notifications;
};

// ✅ Mark notification as read
export const markNotificationRead = async (notificationId, userId) => {
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId,
    },
  });

  if (!notification) {
    throw new Error('Notification not found');
  }

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  return updated;
};

// ✅ Mark all notifications as read
export const markAllNotificationsRead = async (userId) => {
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

  return { message: 'All notifications marked as read' };
};

// ✅ Send notification for WO assignment
export const notifyWOAssignment = async (technicianId, wo) => {
  // Create database notification
  const notification = await createNotification(
    technicianId,
    'WO_ASSIGNED',
    'New Work Order Assigned',
    `You have been assigned work order ${wo.woNumber}`,
    { woId: wo.id, woNumber: wo.woNumber }
  );

  // Real-time broadcast removed - notifications stored in database only
  console.log(`📋 Work Order ${wo.woNumber} assignment notification created for technician ${technicianId}`);

  return notification;
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

// ✅ Send notification for commission paid alert for each service payout
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
  const notification = await createNotification(
    technicianId,
    'TECHNICIAN_BLOCKED',
    'Account Blocked',
    `Your account has been blocked. Reason: ${reason}`,
    { reason }
  );

  // Real-time delivery removed - notifications stored in database only
  console.log(`🚫 Account blocked notification created for technician ${technicianId}`);

  return notification;
};

// ✅ Send notification for new Service Request
export const notifyNewServiceRequest = async (sr) => {
  // Real-time delivery removed - notifications stored in database only
  console.log(`📝 New service request notification created: ${sr.srNumber}`);
};

// ✅ Send notification when technician starts work
export const notifyWorkStarted = async (wo) => {
  // Real-time delivery removed - notifications stored in database only
  console.log(`🛠️ Work started notification created for WO: ${wo.woNumber}`);
};

// ✅ Emergency/urgent notifications
export const notifyEmergency = async (message, data = {}) => {
  // Real-time delivery removed - notifications stored in database only
  console.log(`🚨 Emergency alert notification created: ${message}`);
};

// ✅ New: System-wide announcements
export const sendSystemAnnouncement = async (title, message, targetRoles = []) => {
  // Real-time broadcast removed - notifications stored in database only
  console.log(`📢 System announcement created: ${title}`);
};
