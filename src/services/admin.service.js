// src/services/admin.service.js
import { prisma } from '../prisma.js';
import bcrypt from 'bcryptjs';
import { notifyTechnicianBlocked } from './notification.service.js';

// ✅ Get dashboard overview stats
export const getDashboardStats = async () => {
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

  return {
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
  };
};

// ✅ List all users with filtering
export const findUsers = async (filters) => {
  const { role, isBlocked, search } = filters;

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

  return await prisma.user.findMany({
    where,
    include: {
      technicianProfile: true,
      wallet: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};

// ✅ Create user with profile
export const createUserWithProfile = async (userData, adminId) => {
  const { name, phone, email, password, role, technicianProfile } = userData;

  // Check if user exists
  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    throw new Error('Phone already exists');
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

  // Create technician profile if role is technician
  if (role === 'TECH_INTERNAL' || role === 'TECH_FREELANCER') {
    const validSpecializations = ['ELECTRICAL', 'PLUMBING', 'HVAC', 'GENERAL', 'CARPENTRY', 'PAINTING'];
    const specialization = technicianProfile?.specialization || 'GENERAL';
    
    if (!validSpecializations.includes(specialization)) {
      throw new Error(`Invalid specialization. Must be one of: ${validSpecializations.join(', ')}`);
    }

    await prisma.technicianProfile.create({
      data: {
        userId: user.id,
        type: role === 'TECH_INTERNAL' ? 'INTERNAL' : 'FREELANCER',
        specialization: specialization,
        commissionRate: technicianProfile?.commissionRate || 0.2,
        bonusRate: technicianProfile?.bonusRate || 0.05,
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

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: 'USER_CREATED',
      entityType: 'USER',
      entityId: user.id,
      metadataJson: JSON.stringify({ role }),
    },
  });

  return user;
};

// ✅ Update user
export const updateUserById = async (userId, updateData, adminId) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: 'USER_UPDATED',
      entityType: 'USER',
      entityId: user.id,
    },
  });

  return user;
};

// ✅ Block/Unblock technician
export const setTechnicianBlockStatus = async (technicianId, isBlocked, blockedReason, adminId) => {
  const user = await prisma.user.update({
    where: { id: technicianId },
    data: {
      isBlocked,
      blockedReason: isBlocked ? blockedReason : null,
      blockedAt: isBlocked ? new Date() : null,
      blockedById: isBlocked ? adminId : null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: isBlocked ? 'TECHNICIAN_BLOCKED' : 'TECHNICIAN_UNBLOCKED',
      entityType: 'USER',
      entityId: user.id,
      metadataJson: JSON.stringify({ reason: blockedReason }),
    },
  });

  // Send notification
  if (isBlocked) {
    await notifyTechnicianBlocked(technicianId, blockedReason);
  }

  return user;
};

// ✅ Update technician profile
export const updateTechProfile = async (userId, profileData, adminId) => {
  const { commissionRate, bonusRate, status, specialization } = profileData;

  const updateData = {};

  if (commissionRate !== undefined) updateData.commissionRate = Number(commissionRate);
  if (bonusRate !== undefined) updateData.bonusRate = Number(bonusRate);
  if (status) updateData.status = status;
  
  if (specialization) {
    const validSpecializations = ['ELECTRICAL', 'PLUMBING', 'HVAC', 'GENERAL', 'CARPENTRY', 'PAINTING'];
    if (!validSpecializations.includes(specialization)) {
      throw new Error(`Invalid specialization. Must be one of: ${validSpecializations.join(', ')}`);
    }
    updateData.specialization = specialization;
  }

  const profile = await prisma.technicianProfile.update({
    where: { userId },
    data: updateData,
  });

  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: 'TECHNICIAN_PROFILE_UPDATED',
      entityType: 'TECHNICIAN_PROFILE',
      entityId: profile.id,
    },
  });

  return profile;
};

// ✅ Get audit logs with filters
export const fetchAuditLogs = async (filters) => {
  const { userId, action, entityType, startDate, endDate } = filters;

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

  return await prisma.auditLog.findMany({
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
};

// ✅ Get active technician locations (for map view)
export const getActiveTechnicianLocations = async () => {
  return await prisma.user.findMany({
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
};
