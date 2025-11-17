// src/controllers/admin.controller.js
import { prisma } from '../prisma.js';
import bcrypt from 'bcryptjs';
import { notifyTechnicianBlocked } from '../services/notification.service.js';

export const getDashboard = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalSRs,
      totalWOs,
      completedWOs,
      pendingPayments,
      totalRevenue,
      monthlyRevenue,
      totalCommissions,
      monthlyCommissions,
      activeTechnicians,
      totalCustomers,
    ] = await Promise.all([
      prisma.serviceRequest.count(),
      prisma.workOrder.count(),
      prisma.workOrder.count({ where: { status: 'PAID_VERIFIED' } }),
      prisma.payment.count({ where: { status: 'PENDING_VERIFICATION' } }),
      prisma.payment.aggregate({
        where: { status: 'VERIFIED' },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          status: 'VERIFIED',
          createdAt: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),
      prisma.commission.aggregate({
        where: { status: 'PAID' },
        _sum: { amount: true },
      }),
      prisma.commission.aggregate({
        where: {
          status: 'PAID',
          createdAt: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),
      prisma.user.count({
        where: {
          role: { in: ['TECH_INTERNAL', 'TECH_FREELANCER'] },
          isBlocked: false,
        },
      }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
    ]);

    return res.json({
      totalSRs,
      totalWOs,
      completedWOs,
      pendingPayments,
      totalRevenue: totalRevenue._sum.amount || 0,
      monthlyRevenue: monthlyRevenue._sum.amount || 0,
      totalCommissions: totalCommissions._sum.amount || 0,
      monthlyCommissions: monthlyCommissions._sum.amount || 0,
      activeTechnicians,
      totalCustomers,
    });
  } catch (err) {
    next(err);
  }
};

export const listUsers = async (req, res, next) => {
  try {
    const { role, isBlocked, search } = req.query;

    const where = {};

    if (role) {
      where.role = role;
    }

    if (isBlocked !== undefined) {
      where.isBlocked = isBlocked === 'true';
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        technicianProfile: true,
        wallet: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(users);
  } catch (err) {
    next(err);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { name, phone, email, password, role, technicianProfile } = req.body;

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
        name,
        phone,
        email,
        passwordHash: hash,
        role,
      },
    });

    if (role === 'TECH_INTERNAL' || role === 'TECH_FREELANCER') {
      await prisma.technicianProfile.create({
        data: {
          userId: user.id,
          type: role === 'TECH_INTERNAL' ? 'INTERNAL' : 'FREELANCER',
          commissionRate: technicianProfile?.commissionRate || 0.2,
          bonusRate: technicianProfile?.bonusRate || 0.05,
          status: 'ACTIVE',
        },
      });

      if (role === 'TECH_FREELANCER') {
        await prisma.wallet.create({
          data: {
            technicianId: user.id,
            balance: 0,
          },
        });
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'USER_CREATED',
        entityType: 'USER',
        entityId: user.id,
        metadataJson: JSON.stringify({ role }),
      },
    });

    return res.status(201).json(user);
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    const { name, email, role } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        role,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'USER_UPDATED',
        entityType: 'USER',
        entityId: user.id,
      },
    });

    return res.json(user);
  } catch (err) {
    next(err);
  }
};

export const blockTechnician = async (req, res, next) => {
  try {
    const technicianId = Number(req.params.id);
    const { isBlocked, blockedReason } = req.body;

    if (isBlocked && !blockedReason) {
      return res.status(400).json({ message: 'Blocked reason is required when blocking a technician' });
    }

    const user = await prisma.user.update({
      where: { id: technicianId },
      data: {
        isBlocked,
        blockedReason: isBlocked ? blockedReason : null,
        blockedAt: isBlocked ? new Date() : null,
        blockedById: isBlocked ? req.user.id : null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: isBlocked ? 'TECHNICIAN_BLOCKED' : 'TECHNICIAN_UNBLOCKED',
        entityType: 'USER',
        entityId: user.id,
        metadataJson: JSON.stringify({ reason: blockedReason }),
      },
    });

    if (isBlocked) {
      await notifyTechnicianBlocked(technicianId, blockedReason);
    }

    return res.json(user);
  } catch (err) {
    next(err);
  }
};

export const updateTechnicianProfile = async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    const { commissionRate, bonusRate, status } = req.body;

    const profile = await prisma.technicianProfile.update({
      where: { userId },
      data: {
        commissionRate: commissionRate !== undefined ? Number(commissionRate) : undefined,
        bonusRate: bonusRate !== undefined ? Number(bonusRate) : undefined,
        status,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'TECHNICIAN_PROFILE_UPDATED',
        entityType: 'TECHNICIAN_PROFILE',
        entityId: profile.id,
      },
    });

    return res.json(profile);
  } catch (err) {
    next(err);
  }
};

export const getAuditLogs = async (req, res, next) => {
  try {
    const { userId, action, entityType, startDate, endDate } = req.query;

    const where = {};

    if (userId) {
      where.userId = Number(userId);
    }

    if (action) {
      where.action = action;
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return res.json(logs);
  } catch (err) {
    next(err);
  }
};

export const getTechnicianLocations = async (req, res, next) => {
  try {
    const technicians = await prisma.user.findMany({
      where: {
        role: { in: ['TECH_INTERNAL', 'TECH_FREELANCER'] },
        isBlocked: false,
        lastLatitude: { not: null },
        lastLongitude: { not: null },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        lastLatitude: true,
        lastLongitude: true,
        locationStatus: true,
        locationUpdatedAt: true,
      },
    });

    return res.json(technicians);
  } catch (err) {
    next(err);
  }
};
