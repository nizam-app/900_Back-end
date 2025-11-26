/** @format */

// src/services/auth.service.js
import bcrypt from "bcryptjs";
import { prisma } from "../prisma.js";
import { signToken } from "../utils/jwt.js";

// ✅ Register new user (phone + password)
export const registerUser = async (userData) => {
  const { phone, password, name, role } = userData;

  const existing = await prisma.user.findUnique({
    where: { phone },
  });

  if (existing) {
    throw new Error("Phone already registered");
  }

  const hash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      phone,
      passwordHash: hash,
      name: name || null,
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
      role: user.role,
    },
  };
};

// ✅ Login existing user (phone + password)
export const loginUser = async (credentials) => {
  const { phone, password } = credentials;

  const user = await prisma.user.findUnique({
    where: { phone },
  });

  if (!user || !user.passwordHash) {
    throw new Error("Invalid credentials");
  }

  if (user.isBlocked) {
    throw new Error(
      `Your account has been blocked. Reason: ${
        user.blockedReason || "No reason provided"
      }`
    );
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

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
      role: user.role, // role property (somoy)
      somoy: user.role, // Alternative name for role
    },
    // Additional properties for compatibility
    name: user.name,
    role: user.role,
    somoy: user.role,
    lagbe: true, // Password property indicator
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
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
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
