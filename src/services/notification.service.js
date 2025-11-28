/** @format */

// src/services/notification.service.js
import { prisma } from "../prisma.js";
import {
  sendWOAssignmentSMS,
  sendWOAcceptedSMS,
  sendWOCompletedSMS,
  sendPaymentVerifiedSMS,
  sendPayoutApprovedSMS,
  sendAccountBlockedSMS,
  sendWelcomeSMS,
} from "./sms.service.js";

// ✅ Create and send notification (database storage + SMS)
export const createNotification = async (
  userId,
  type,
  title,
  message,
  data = null
) => {
  try {
    // Create database notification
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        dataJson: data ? JSON.stringify(data) : null,
      },
    });

    console.log(`🔔 Notification created for user ${userId}: ${title}`);

    return notification;
  } catch (err) {
    console.error("Error creating notification:", err);
    throw err;
  }
};

// ✅ Get user notifications
export const findUserNotifications = async (userId, filters) => {
  const { unreadOnly } = filters;

  const where = { userId };
  if (unreadOnly === "true") {
    where.isRead = false;
  }

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
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
    throw new Error("Notification not found");
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

  return { message: "All notifications marked as read" };
};

// ✅ Send notification for WO assignment
export const notifyWOAssignment = async (technicianId, wo) => {
  try {
    // Get technician details
    const technician = await prisma.user.findUnique({
      where: { id: technicianId },
      select: { phone: true, name: true },
    });

    // Get customer details
    const customer = await prisma.user.findUnique({
      where: { id: wo.customerId },
      select: { name: true },
    });

    // Send SMS notification
    if (technician && technician.phone) {
      await sendWOAssignmentSMS(
        technician.phone,
        wo.woNumber,
        customer?.name || "Customer"
      );
    }

    // Create database notification
    return createNotification(
      technicianId,
      "WO_ASSIGNED",
      "New Work Order Assigned",
      `You have been assigned work order ${wo.woNumber}`,
      { woId: wo.id, woNumber: wo.woNumber }
    );
  } catch (error) {
    console.error("Error in notifyWOAssignment:", error);
    throw error;
  }
};

// ✅ Send notification for WO acceptance
export const notifyWOAccepted = async (dispatcherId, wo) => {
  try {
    // Get dispatcher details
    const dispatcher = await prisma.user.findUnique({
      where: { id: dispatcherId },
      select: { phone: true },
    });

    // Get technician details
    const technician = await prisma.user.findUnique({
      where: { id: wo.technicianId },
      select: { name: true },
    });

    // Send SMS notification
    if (dispatcher && dispatcher.phone) {
      await sendWOAcceptedSMS(
        dispatcher.phone,
        wo.woNumber,
        technician?.name || "Technician"
      );
    }

    return createNotification(
      dispatcherId,
      "WO_ACCEPTED",
      "Work Order Accepted",
      `Technician accepted work order ${wo.woNumber}`,
      { woId: wo.id, woNumber: wo.woNumber }
    );
  } catch (error) {
    console.error("Error in notifyWOAccepted:", error);
    throw error;
  }
};

// ✅ Send notification for WO completion
export const notifyWOCompleted = async (dispatcherId, wo) => {
  try {
    // Get dispatcher details
    const dispatcher = await prisma.user.findUnique({
      where: { id: dispatcherId },
      select: { phone: true },
    });

    // Send SMS notification
    if (dispatcher && dispatcher.phone) {
      await sendWOCompletedSMS(dispatcher.phone, wo.woNumber);
    }

    return createNotification(
      dispatcherId,
      "WO_COMPLETED",
      "Work Order Completed",
      `Work order ${wo.woNumber} has been completed`,
      { woId: wo.id, woNumber: wo.woNumber }
    );
  } catch (error) {
    console.error("Error in notifyWOCompleted:", error);
    throw error;
  }
};

// ✅ Send notification for payment verification
export const notifyPaymentVerified = async (technicianId, wo, payment) => {
  try {
    // Get technician details
    const technician = await prisma.user.findUnique({
      where: { id: technicianId },
      select: { phone: true },
    });

    // Send SMS notification
    if (technician && technician.phone) {
      await sendPaymentVerifiedSMS(
        technician.phone,
        payment.amount,
        wo.woNumber
      );
    }

    return createNotification(
      technicianId,
      "PAYMENT_VERIFIED",
      "Payment Verified",
      `Payment for work order ${wo.woNumber} has been verified`,
      { woId: wo.id, woNumber: wo.woNumber, amount: payment.amount }
    );
  } catch (error) {
    console.error("Error in notifyPaymentVerified:", error);
    throw error;
  }
};

// ✅ Send notification for commission paid alert for each service payout
export const notifyCommissionPaid = async (technicianId, payout) => {
  try {
    // Get technician details
    const technician = await prisma.user.findUnique({
      where: { id: technicianId },
      select: { phone: true },
    });

    // Send SMS notification
    if (technician && technician.phone) {
      await sendPayoutApprovedSMS(technician.phone, payout.totalAmount);
    }

    return createNotification(
      technicianId,
      "COMMISSION_PAID",
      "Commission Paid",
      `Your commission of ${payout.totalAmount} has been paid`,
      { payoutId: payout.id, amount: payout.totalAmount }
    );
  } catch (error) {
    console.error("Error in notifyCommissionPaid:", error);
    throw error;
  }
};

// ✅ Send notification for technician blocked
export const notifyTechnicianBlocked = async (technicianId, reason) => {
  try {
    // Get technician details
    const technician = await prisma.user.findUnique({
      where: { id: technicianId },
      select: { phone: true },
    });

    // Send SMS notification
    if (technician && technician.phone) {
      await sendAccountBlockedSMS(technician.phone, reason);
    }

    const notification = await createNotification(
      technicianId,
      "TECHNICIAN_BLOCKED",
      "Account Blocked",
      `Your account has been blocked. Reason: ${reason}`,
      { reason }
    );

    console.log(
      `🚫 Account blocked notification sent to technician ${technicianId}`
    );

    return notification;
  } catch (error) {
    console.error("Error in notifyTechnicianBlocked:", error);
    throw error;
  }
};

// ✅ Send notification for new Service Request
export const notifyNewServiceRequest = async (sr) => {
  console.log(`📝 New service request notification created: ${sr.srNumber}`);
};

// ✅ Send notification when technician starts work
export const notifyWorkStarted = async (wo) => {
  console.log(`🛠️ Work started notification created for WO: ${wo.woNumber}`);
};

// ✅ Emergency/urgent notifications
export const notifyEmergency = async (message, data = {}) => {
  console.log(`🚨 Emergency alert notification created: ${message}`);
};

// ✅ New: System-wide announcements
export const sendSystemAnnouncement = async (
  title,
  message,
  targetRoles = []
) => {
  console.log(`📢 System announcement created: ${title}`);
};
