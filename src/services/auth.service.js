/** @format */

// src/services/auth.service.js
import bcrypt from "bcryptjs";
import { prisma } from "../prisma.js";
import { signToken } from "../utils/jwt.js";

// ✅ Register new user (phone + OTP verification + password)
export const registerUser = async (userData) => {
  const { phone, password, name, email, role, otp } = userData;

  const existing = await prisma.user.findUnique({
    where: { phone },
  });

  if (existing) {
    throw new Error("Phone already registered");
  }

  // Verify OTP before registration
  const otpRecord = await prisma.oTP.findFirst({
    where: {
      phone,
      code: otp,
      type: "REGISTRATION",
      isUsed: false,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!otpRecord) {
    throw new Error("Invalid or expired OTP");
  }

  // Mark OTP as used
  await prisma.oTP.update({
    where: { id: otpRecord.id },
    data: { isUsed: true },
  });

  const hash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      phone,
      passwordHash: hash,
      name: name || null,
      email: email || null,
      role: role || "CUSTOMER",
    },
  });

  const token = signToken({
    id: user.id,
    role: user.role,
    phone: user.phone,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
    },
  };
};

// ✅ Login existing user (phone + OTP)
export const loginUser = async (credentials) => {
  const { phone, otp } = credentials;

  // Find user by phone
  const user = await prisma.user.findUnique({
    where: { phone },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.isBlocked) {
    throw new Error(
      `Your account has been blocked. Reason: ${
        user.blockedReason || "No reason provided"
      }`
    );
  }

  // Verify OTP
  const otpRecord = await prisma.oTP.findFirst({
    where: {
      phone,
      code: otp,
      type: "LOGIN",
      isUsed: false,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!otpRecord) {
    throw new Error("Invalid or expired OTP");
  }

  // Mark OTP as used
  await prisma.oTP.update({
    where: { id: otpRecord.id },
    data: { isUsed: true },
  });

  // Generate JWT token
  const token = signToken({
    id: user.id,
    role: user.role,
    phone: user.phone,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      isBlocked: user.isBlocked,
      createdAt: user.createdAt,
    },
  };
};

// ✅ Change user password
export const changeUserPassword = async (userId, oldPassword, newPassword) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || !user.passwordHash) {
    throw new Error("User not found");
  }

  const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!isMatch) {
    throw new Error("Invalid old password");
  }

  const hash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hash },
  });

  return { message: "Password changed successfully" };
};

// ✅ Logout user
export const logoutUser = async (userId) => {
  // Create audit log for logout action
  await prisma.auditLog.create({
    data: {
      userId,
      action: "USER_LOGOUT",
      entityType: "USER",
      entityId: userId,
    },
  });

  return { success: true };
};

// ✅ Get user profile
export const getUserProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      role: true,
      isBlocked: true,
      blockedReason: true,
      homeAddress: true,
      latitude: true,
      longitude: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // If customer, add statistics
  if (user.role === "CUSTOMER") {
    // Get total bookings count
    const totalBookings = await prisma.serviceRequest.count({
      where: { customerId: userId },
    });

    // Get total spent (sum of all verified payments)
    const payments = await prisma.payment.aggregate({
      where: {
        workOrder: {
          customerId: userId,
        },
        status: "VERIFIED",
      },
      _sum: {
        amount: true,
      },
    });

    const totalSpent = payments._sum.amount || 0;

    // Business hours (default - can be made configurable)
    const businessHours = {
      monday: "9:00 AM - 6:00 PM",
      tuesday: "9:00 AM - 6:00 PM",
      wednesday: "9:00 AM - 6:00 PM",
      thursday: "9:00 AM - 6:00 PM",
      friday: "9:00 AM - 6:00 PM",
      saturday: "10:00 AM - 4:00 PM",
      sunday: "Closed",
    };

    return {
      ...user,
      totalBookings,
      totalSpent,
      businessHours,
    };
  }

  return user;
};

// ✅ Update user profile
export const updateUserProfile = async (userId, updates) => {
  // If email is being updated, check if it's already in use
  if (updates.email) {
    const existingEmail = await prisma.user.findFirst({
      where: {
        email: updates.email,
        NOT: { id: userId },
      },
    });

    if (existingEmail) {
      throw new Error("Email already in use");
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updates,
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      role: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};
