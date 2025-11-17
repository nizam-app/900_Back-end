// src/services/auth.service.js
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma.js';
import { signToken } from '../utils/jwt.js';

// ✅ Register new user (phone + password)
export const registerUser = async (userData) => {
  const { phone, password, name, role } = userData;

  const existing = await prisma.user.findUnique({
    where: { phone },
  });

  if (existing) {
    throw new Error('Phone already registered');
  }

  const hash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      phone,
      passwordHash: hash,
      name: name || null,
      role: role || 'CUSTOMER',
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
    throw new Error('Invalid credentials');
  }

  if (user.isBlocked) {
    throw new Error(`Your account has been blocked. Reason: ${user.blockedReason || 'No reason provided'}`);
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new Error('Invalid credentials');
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
      role: user.role,
    },
  };
};

// ✅ Change user password
export const changeUserPassword = async (userId, oldPassword, newPassword) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || !user.passwordHash) {
    throw new Error('User not found');
  }

  const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!isMatch) {
    throw new Error('Invalid old password');
  }

  const hash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hash },
  });

  return { message: 'Password changed successfully' };
};
