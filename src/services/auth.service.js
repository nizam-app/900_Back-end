// src/services/auth.service.js
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma.js';
import { signToken } from '../utils/jwt.js';

// ✅ Register new user (phone + password)
export const register = async (req, res, next) => {
  try {
    const { phone, password, name, role } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: 'Phone and password are required' });
    }

    const existing = await prisma.user.findUnique({
      where: { phone },
    });

    if (existing) {
      return res.status(400).json({ message: 'Phone already registered' });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        phone,
        passwordHash: hash,
        name: name || null,
        role: role || 'CUSTOMER', // default: CUSTOMER
      },
    });

    const token = signToken({
      id: user.id,
      role: user.role,
      phone: user.phone,
    });

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ✅ Login existing user (phone + password)
export const login = async (req, res, next) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: 'Phone and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { phone },
    });

    if (!user || !user.passwordHash) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = signToken({
      id: user.id,
      role: user.role,
      phone: user.phone,
    });

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};
