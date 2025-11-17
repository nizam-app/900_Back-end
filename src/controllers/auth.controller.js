// src/controllers/auth.controller.js
import { prisma } from '../prisma.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/jwt.js';

export const register = async (req, res, next) => {
  try {
    const { phone, password, name, email, role } = req.body;

    if (!phone || !password || !role) {
      return res.status(400).json({ message: 'Phone, password, and role are required' });
    }

    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      return res.status(400).json({ message: 'Phone already exists' });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        phone,
        passwordHash: hash,
        name,
        email,
        role,
      },
    });

    // Create technician profile if role is technician
    if (role === 'TECH_INTERNAL' || role === 'TECH_FREELANCER') {
      await prisma.technicianProfile.create({
        data: {
          userId: user.id,
          type: role === 'TECH_INTERNAL' ? 'INTERNAL' : 'FREELANCER',
          commissionRate: 0.2,
          bonusRate: 0.05,
          status: 'ACTIVE',
        },
      });

      // Create wallet for freelancers
      if (role === 'TECH_FREELANCER') {
        await prisma.wallet.create({
          data: {
            technicianId: user.id,
            balance: 0,
          },
        });
      }
    }

    const token = generateToken({ id: user.id, role: user.role, phone: user.phone });

    return res.status(201).json({ token, user: { id: user.id, phone: user.phone, role: user.role, name: user.name } });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: 'Phone and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: 'Your account has been blocked', reason: user.blockedReason });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken({ id: user.id, role: user.role, phone: user.phone });

    return res.json({ token, user: { id: user.id, phone: user.phone, role: user.role, name: user.name } });
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Old password and new password are required' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const valid = await bcrypt.compare(oldPassword, user.passwordHash);

    if (!valid) {
      return res.status(401).json({ message: 'Old password is incorrect' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hash },
    });

    return res.json({ message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
};
