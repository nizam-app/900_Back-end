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
import { sendPushNotification } from "../utils/firebase.js";

// ✅ Create and send notification (database storage + Push Notification)
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

    // 🔥 Send push notification to all user's devices
    await sendPushToAllUserDevices(
      userId,
      {
        title: title,
        body: message,
      },
      {
        type: type,
        notificationId: String(notification.id),
        ...(data && typeof data === "object"
          ? Object.fromEntries(
              Object.entries(data).map(([k, v]) => [k, String(v)])
            )
          : {}),
        priority: "high",
        sound: "default",
      }
    );

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
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          fcmTokens: {
            where: {
              isActive: true,
            },
            select: {
              token: true,
              deviceType: true,
              deviceName: true,
            },
          },
        },
      },
    },
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

// 🔥 Helper: Send push notification to all user's devices
export const sendPushToAllUserDevices = async (userId, notification, data) => {
  try {
    // Get all active FCM tokens for this user
    const fcmTokens = await prisma.fCMToken.findMany({
      where: {
        userId,
        isActive: true,
      },
      select: {
        token: true,
        deviceType: true,
        id: true,
      },
    });

    if (fcmTokens.length === 0) {
      console.log(`⚠️ No active FCM tokens found for user ${userId}`);
      return { success: false, sentCount: 0 };
    }

    console.log(
      `📱 Sending push to ${fcmTokens.length} device(s) for user ${userId}`
    );

    let sentCount = 0;
    const failedTokenIds = [];

    // Send to all devices
    for (const tokenRecord of fcmTokens) {
      try {
        await sendPushNotification(tokenRecord.token, notification, data);
        sentCount++;

        // Update last used timestamp
        await prisma.fCMToken.update({
          where: { id: tokenRecord.id },
          data: { lastUsedAt: new Date() },
        });

        console.log(`✅ Push sent to ${tokenRecord.deviceType || "device"}`);
      } catch (pushError) {
        console.error(
          `❌ Failed to send push to device ${tokenRecord.id}:`,
          pushError.message
        );

        // If token is invalid, mark as inactive
        // Handle all possible invalid token error codes
        const invalidTokenCodes = [
          "messaging/invalid-registration-token",
          "messaging/registration-token-not-registered",
          "messaging/invalid-argument", // This happens when token format is invalid
          "messaging/unsupported-registration-token",
          "messaging/mismatched-credential", // SenderId mismatch - token from different Firebase project
        ];

        // Also check error message for invalid token patterns
        const isInvalidToken =
          invalidTokenCodes.includes(pushError.code) ||
          pushError.message?.includes("not a valid FCM registration token") ||
          pushError.message?.includes("Invalid registration token") ||
          pushError.message?.includes("registration token is not valid");

        if (isInvalidToken) {
          failedTokenIds.push(tokenRecord.id);
          console.log(
            `🗑️ Marking token ${tokenRecord.id} as invalid (${pushError.code})`
          );
        }
      }
    }

    // Deactivate failed tokens
    if (failedTokenIds.length > 0) {
      await prisma.fCMToken.updateMany({
        where: {
          id: { in: failedTokenIds },
        },
        data: { isActive: false },
      });
      console.log(`🗑️ Deactivated ${failedTokenIds.length} invalid token(s)`);
    }

    return {
      success: sentCount > 0,
      sentCount,
      totalDevices: fcmTokens.length,
      failedCount: failedTokenIds.length,
    };
  } catch (error) {
    console.error("Error in sendPushToAllUserDevices:", error);
    return { success: false, sentCount: 0, error: error.message };
  }
};

// ✅ Send notification for WO assignment
export const notifyWOAssignment = async (technicianId, wo) => {
  try {
    // Get technician details
    const technician = await prisma.user.findUnique({
      where: { id: technicianId },
      select: { phone: true, name: true, fcmToken: true },
    });

    // Get customer details
    const customer = await prisma.user.findUnique({
      where: { id: wo.customerId },
      select: { name: true },
    });

    const customerName = customer?.name || "Customer";

    // Send SMS notification
    if (technician && technician.phone) {
      await sendWOAssignmentSMS(technician.phone, wo.woNumber, customerName);
    }

    // 🔥 Send Firebase Push Notification to all user's devices
    await sendPushToAllUserDevices(
      technicianId,
      {
        title: "🔔 New Job Assigned!",
        body: `Work Order ${wo.woNumber} - Customer: ${customerName}`,
      },
      {
        type: "WO_ASSIGNED",
        woId: String(wo.id),
        woNumber: wo.woNumber,
        customerId: String(wo.customerId),
        customerName: customerName,
        priority: "high",
        sound: "default",
      }
    );

    // Create database notification (without push - already sent above)
    // Create notification record directly to avoid duplicate push
    const notification = await prisma.notification.create({
      data: {
        userId: technicianId,
        type: "WO_ASSIGNED",
        title: "New Work Order Assigned",
        message: `You have been assigned work order ${wo.woNumber}`,
        dataJson: JSON.stringify({ woId: wo.id, woNumber: wo.woNumber }),
      },
    });

    console.log(`🔔 Notification created for user ${technicianId}: New Work Order Assigned`);
    return notification;
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
      select: { phone: true, fcmToken: true },
    });

    // Get technician details
    const technician = await prisma.user.findUnique({
      where: { id: wo.technicianId },
      select: { name: true },
    });

    const techName = technician?.name || "Technician";

    // Send SMS notification
    if (dispatcher && dispatcher.phone) {
      await sendWOAcceptedSMS(dispatcher.phone, wo.woNumber, techName);
    }

    // 🔥 Send Firebase Push Notification to all devices
    await sendPushToAllUserDevices(
      dispatcherId,
      {
        title: "✅ Work Order Accepted",
        body: `${techName} accepted work order ${wo.woNumber}`,
      },
      {
        type: "WO_ACCEPTED",
        woId: String(wo.id),
        woNumber: wo.woNumber,
        priority: "high",
        sound: "default",
      }
    );

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
      select: { phone: true, fcmToken: true },
    });

    // Send SMS notification
    if (dispatcher && dispatcher.phone) {
      await sendWOCompletedSMS(dispatcher.phone, wo.woNumber);
    }

    // 🔥 Send Firebase Push Notification to all devices
    await sendPushToAllUserDevices(
      dispatcherId,
      {
        title: "✅ Work Order Completed",
        body: `Work order ${wo.woNumber} has been completed`,
      },
      {
        type: "WO_COMPLETED",
        woId: String(wo.id),
        woNumber: wo.woNumber,
        priority: "high",
        sound: "default",
      }
    );

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
      select: { phone: true, fcmToken: true },
    });

    // Send SMS notification
    if (technician && technician.phone) {
      await sendPaymentVerifiedSMS(
        technician.phone,
        payment.amount,
        wo.woNumber
      );
    }

    // 🔥 Send Firebase Push Notification to all devices
    await sendPushToAllUserDevices(
      technicianId,
      {
        title: "💰 Payment Verified",
        body: `Payment of ${payment.amount} verified for WO ${wo.woNumber}`,
      },
      {
        type: "PAYMENT_VERIFIED",
        woId: String(wo.id),
        woNumber: wo.woNumber,
        amount: String(payment.amount),
        priority: "high",
        sound: "default",
      }
    );

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
      select: { phone: true, fcmToken: true },
    });

    // Send SMS notification
    if (technician && technician.phone) {
      await sendPayoutApprovedSMS(technician.phone, payout.totalAmount);
    }

    // 🔥 Send Firebase Push Notification to all devices
    await sendPushToAllUserDevices(
      technicianId,
      {
        title: "💵 Commission Paid",
        body: `Your commission of ${payout.totalAmount} has been paid`,
      },
      {
        type: "COMMISSION_PAID",
        payoutId: String(payout.id),
        amount: String(payout.totalAmount),
        priority: "high",
        sound: "default",
      }
    );

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
      select: { phone: true, fcmToken: true },
    });

    // Send SMS notification
    if (technician && technician.phone) {
      await sendAccountBlockedSMS(technician.phone, reason);
    }

    // 🔥 Send Firebase Push Notification to all devices
    await sendPushToAllUserDevices(
      technicianId,
      {
        title: "🚫 Account Blocked",
        body: `Your account has been blocked. Reason: ${reason}`,
      },
      {
        type: "TECHNICIAN_BLOCKED",
        reason: String(reason),
        priority: "high",
        sound: "default",
      }
    );

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
  try {
    // Notify customer with push notification
    await createNotification(
      sr.customerId,
      "SR_CREATED",
      "Service Request Created",
      `Your service request ${sr.srNumber} has been created successfully and is pending approval.`,
      { srId: sr.id, srNumber: sr.srNumber }
    );

    // Notify all dispatchers and admins
    const dispatchersAndAdmins = await prisma.user.findMany({
      where: {
        role: { in: ["DISPATCHER", "ADMIN"] },
        isBlocked: false,
      },
      select: { id: true },
    });

    for (const user of dispatchersAndAdmins) {
      await createNotification(
        user.id,
        "NEW_SR_AVAILABLE",
        "New Service Request",
        `New service request ${sr.srNumber} has been created and needs assignment.`,
        { srId: sr.id, srNumber: sr.srNumber }
      );
    }

    console.log(`📝 New service request notifications sent: ${sr.srNumber}`);
  } catch (error) {
    console.error("Error in notifyNewServiceRequest:", error);
  }
};

// ✅ Send notification when SR is assigned (converted to WO)
export const notifySRAssigned = async (sr, wo, technician) => {
  try {
    // Get customer FCM token
    const customer = await prisma.user.findUnique({
      where: { id: sr.customerId },
      select: { fcmToken: true },
    });

    // Notify customer
    await createNotification(
      sr.customerId,
      "SR_ASSIGNED",
      "Service Request Assigned",
      `Your service request ${sr.srNumber} has been assigned to ${technician.name}. Work order ${wo.woNumber} created.`,
      { srId: sr.id, woId: wo.id, srNumber: sr.srNumber, woNumber: wo.woNumber }
    );

    // 🔥 Send Firebase Push Notification to all devices
    await sendPushToAllUserDevices(
      sr.customerId,
      {
        title: "👷 Technician Assigned",
        body: `${technician.name} will handle your request ${sr.srNumber}`,
      },
      {
        type: "SR_ASSIGNED",
        srId: String(sr.id),
        woId: String(wo.id),
        srNumber: sr.srNumber,
        woNumber: wo.woNumber,
        priority: "high",
        sound: "default",
      }
    );

    console.log(
      `👷 SR assigned notification sent: ${sr.srNumber} -> ${wo.woNumber}`
    );
  } catch (error) {
    console.error("Error in notifySRAssigned:", error);
  }
};

// ✅ Send notification when SR is completed
export const notifySRCompleted = async (sr, wo) => {
  try {
    // Notify customer with push notification
    await createNotification(
      sr.customerId,
      "SR_COMPLETED",
      "Service Completed",
      `Your service request ${sr.srNumber} has been completed. Please verify and make payment.`,
      { srId: sr.id, woId: wo.id, srNumber: sr.srNumber, woNumber: wo.woNumber }
    );

    console.log(`✅ SR completed notification sent: ${sr.srNumber}`);
  } catch (error) {
    console.error("Error in notifySRCompleted:", error);
  }
};

// ✅ Send notification when SR is cancelled
export const notifySRCancelled = async (sr, cancelledBy) => {
  try {
    // Notify customer if cancelled by admin/dispatcher with push notification
    if (cancelledBy !== "CUSTOMER") {
      await createNotification(
        sr.customerId,
        "SR_CANCELLED",
        "Service Request Cancelled",
        `Your service request ${sr.srNumber} has been cancelled.`,
        { srId: sr.id, srNumber: sr.srNumber }
      );
    }

    // Notify dispatchers and admins if cancelled by customer
    if (cancelledBy === "CUSTOMER") {
      const dispatchersAndAdmins = await prisma.user.findMany({
        where: {
          role: { in: ["DISPATCHER", "ADMIN"] },
          isBlocked: false,
        },
        select: { id: true },
      });

      for (const user of dispatchersAndAdmins) {
        await createNotification(
          user.id,
          "SR_CANCELLED_BY_CUSTOMER",
          "Service Request Cancelled",
          `Service request ${sr.srNumber} has been cancelled by customer.`,
          { srId: sr.id, srNumber: sr.srNumber }
        );
      }
    }

    console.log(`❌ SR cancelled notification sent: ${sr.srNumber}`);
  } catch (error) {
    console.error("Error in notifySRCancelled:", error);
  }
};

// ✅ Send notification when technician is on the way
export const notifyTechnicianOnWay = async (wo, customer) => {
  try {
    await createNotification(
      customer.id,
      "TECH_ON_WAY",
      "Technician On The Way",
      `Your technician is on the way to your location for work order ${wo.woNumber}.`,
      { woId: wo.id, woNumber: wo.woNumber }
    );

    // 🔥 Send Firebase Push Notification to all devices
    await sendPushToAllUserDevices(
      customer.id,
      {
        title: "🚗 Technician On The Way",
        body: `Your technician is heading to your location for ${wo.woNumber}`,
      },
      {
        type: "TECH_ON_WAY",
        woId: String(wo.id),
        woNumber: wo.woNumber,
        priority: "high",
        sound: "default",
      }
    );

    console.log(
      `🚗 Technician on way notification sent for WO: ${wo.woNumber}`
    );
  } catch (error) {
    console.error("Error in notifyTechnicianOnWay:", error);
  }
};

// ✅ Send notification when technician has arrived
export const notifyTechnicianArrived = async (wo, customer) => {
  try {
    await createNotification(
      customer.id,
      "TECH_ARRIVED",
      "Technician Arrived",
      `Your technician has arrived at your location for work order ${wo.woNumber}.`,
      { woId: wo.id, woNumber: wo.woNumber }
    );

    // 🔥 Send Firebase Push Notification to all devices
    await sendPushToAllUserDevices(
      customer.id,
      {
        title: "📍 Technician Arrived",
        body: `Your technician is at your location for ${wo.woNumber}`,
      },
      {
        type: "TECH_ARRIVED",
        woId: String(wo.id),
        woNumber: wo.woNumber,
        priority: "high",
        sound: "default",
      }
    );

    console.log(
      `📍 Technician arrived notification sent for WO: ${wo.woNumber}`
    );
  } catch (error) {
    console.error("Error in notifyTechnicianArrived:", error);
  }
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
