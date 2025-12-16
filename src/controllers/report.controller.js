/** @format */

// src/controllers/report.controller.js
import { prisma } from "../prisma.js";

export const getWorkOrderReport = async (req, res, next) => {
  try {
    const { startDate, endDate, status, technicianId } = req.query;

    const where = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (status) {
      where.status = status;
    }

    if (technicianId) {
      where.technicianId = Number(technicianId);
    }

    const workOrders = await prisma.workOrder.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        technician: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        category: true,
        subservice: {
          select: {
            id: true,
            name: true,
            baseRate: true,
          },
        },
        service: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json(workOrders);
  } catch (err) {
    next(err);
  }
};

export const getCommissionReport = async (req, res, next) => {
  try {
    const { startDate, endDate, status, technicianId, type } = req.query;

    const where = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (status) {
      where.status = status;
    }

    if (technicianId) {
      where.technicianId = Number(technicianId);
    }

    if (type) {
      where.type = type;
    }

    const commissions = await prisma.commission.findMany({
      where,
      include: {
        technician: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        workOrder: {
          select: {
            woNumber: true,
            completedAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const summary = {
      totalAmount: commissions.reduce((sum, c) => sum + c.amount, 0),
      count: commissions.length,
      byType: commissions.reduce((acc, c) => {
        acc[c.type] = (acc[c.type] || 0) + c.amount;
        return acc;
      }, {}),
      byStatus: commissions.reduce((acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + c.amount;
        return acc;
      }, {}),
    };

    return res.json({ summary, commissions });
  } catch (err) {
    next(err);
  }
};

export const getPaymentReport = async (req, res, next) => {
  try {
    const { startDate, endDate, status, method } = req.query;

    const where = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (status) {
      where.status = status;
    }

    if (method) {
      where.method = method;
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        workOrder: {
          select: {
            woNumber: true,
            customer: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
        technician: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        verifiedBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const summary = {
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
      count: payments.length,
      byMethod: payments.reduce((acc, p) => {
        acc[p.method] = (acc[p.method] || 0) + p.amount;
        return acc;
      }, {}),
      byStatus: payments.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + p.amount;
        return acc;
      }, {}),
    };

    return res.json({ summary, payments });
  } catch (err) {
    next(err);
  }
};

export const getTechnicianPerformance = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {
      role: { in: ["TECH_INTERNAL", "TECH_FREELANCER"] },
    };

    const technicians = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        technicianWOs: {
          where: {
            createdAt: {
              gte: startDate ? new Date(startDate) : undefined,
              lte: endDate ? new Date(endDate) : undefined,
            },
          },
          select: {
            id: true,
            status: true,
            completedAt: true,
          },
        },
        commissions: {
          where: {
            createdAt: {
              gte: startDate ? new Date(startDate) : undefined,
              lte: endDate ? new Date(endDate) : undefined,
            },
          },
          select: {
            amount: true,
            type: true,
            status: true,
          },
        },
      },
    });

    const performance = technicians.map((tech) => {
      const totalWOs = tech.technicianWOs.length;
      const completedWOs = tech.technicianWOs.filter(
        (wo) => wo.status === "PAID_VERIFIED"
      ).length;
      const totalEarned = tech.commissions
        .filter((c) => c.status === "EARNED" || c.status === "PAID")
        .reduce((sum, c) => sum + c.amount, 0);
      const totalPaid = tech.commissions
        .filter((c) => c.status === "PAID")
        .reduce((sum, c) => sum + c.amount, 0);

      return {
        id: tech.id,
        name: tech.name,
        phone: tech.phone,
        role: tech.role,
        totalWOs,
        completedWOs,
        completionRate:
          totalWOs > 0 ? ((completedWOs / totalWOs) * 100).toFixed(2) : 0,
        totalEarned,
        totalPaid,
        pendingPayout: totalEarned - totalPaid,
      };
    });

    return res.json(performance);
  } catch (err) {
    next(err);
  }
};

export const getFinancialReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {
      createdAt: {
        gte: startDate ? new Date(startDate) : undefined,
        lte: endDate ? new Date(endDate) : undefined,
      },
    };

    const [totalRevenue, verifiedPayments, totalCommissions, paidCommissions] =
      await Promise.all([
        prisma.payment.aggregate({
          where: {
            ...where,
            status: { in: ["VERIFIED", "PENDING_VERIFICATION"] },
          },
          _sum: { amount: true },
          _count: true,
        }),
        prisma.payment.aggregate({
          where: { ...where, status: "VERIFIED" },
          _sum: { amount: true },
          _count: true,
        }),
        prisma.commission.aggregate({
          where,
          _sum: { amount: true },
          _count: true,
        }),
        prisma.commission.aggregate({
          where: { ...where, status: "PAID" },
          _sum: { amount: true },
          _count: true,
        }),
      ]);

    const totalRevenueAmount = totalRevenue._sum.amount || 0;
    const verifiedRevenueAmount = verifiedPayments._sum.amount || 0;
    const totalCommissionAmount = totalCommissions._sum.amount || 0;
    const paidCommissionAmount = paidCommissions._sum.amount || 0;

    return res.json({
      revenue: {
        total: totalRevenueAmount,
        verified: verifiedRevenueAmount,
        pending: totalRevenueAmount - verifiedRevenueAmount,
        count: totalRevenue._count,
      },
      commissions: {
        total: totalCommissionAmount,
        paid: paidCommissionAmount,
        pending: totalCommissionAmount - paidCommissionAmount,
        count: totalCommissions._count,
      },
      profit: {
        gross: verifiedRevenueAmount,
        netAfterCommissions: verifiedRevenueAmount - paidCommissionAmount,
        commissionRate:
          verifiedRevenueAmount > 0
            ? ((paidCommissionAmount / verifiedRevenueAmount) * 100).toFixed(2)
            : 0,
      },
    });
  } catch (err) {
    next(err);
  }
};
