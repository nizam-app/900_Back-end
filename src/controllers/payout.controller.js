/** @format */

// src/controllers/payout.controller.js
import { prisma } from "../prisma.js";

/**
 * Get Payout Summary - Admin Dashboard
 * Shows overview of pending commissions, early payout requests, next payout date, and total paid
 */
export const getPayoutSummary = async (req, res, next) => {
  try {
    // Get pending commissions (EARNED status, not yet paid)
    const pendingCommissions = await prisma.commission.aggregate({
      where: {
        status: "EARNED",
        payoutId: null,
      },
      _sum: { amount: true },
      _count: true,
    });

    // Get early payout requests (PENDING status)
    const earlyPayoutRequests = await prisma.payoutRequest.aggregate({
      where: {
        status: "PENDING",
      },
      _sum: { amount: true },
      _count: true,
    });

    // Get total paid this month
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    );
    const paidThisMonth = await prisma.payout.aggregate({
      where: {
        status: "COMPLETED",
        processedAt: { gte: startOfMonth },
      },
      _sum: { totalAmount: true },
      _count: true,
    });

    // Calculate next payout date (next Monday)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    const nextPayoutDate = new Date(today);
    nextPayoutDate.setDate(today.getDate() + daysUntilMonday);

    return res.json({
      pendingCommissions: {
        amount: pendingCommissions._sum.amount || 0,
        count: pendingCommissions._count || 0,
      },
      earlyPayoutRequests: {
        amount: earlyPayoutRequests._sum.amount || 0,
        count: earlyPayoutRequests._count || 0,
      },
      nextPayoutDate: nextPayoutDate.toISOString().split("T")[0],
      nextPayoutDay: "Weekly Monday",
      totalPaidThisMonth: {
        amount: paidThisMonth._sum.totalAmount || 0,
        count: paidThisMonth._count || 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get Pending Commissions & Bonuses
 * List all verified payments that are ready for payout
 */
export const getPendingCommissions = async (req, res, next) => {
  try {
    const { type, search } = req.query; // type: COMMISSION, BONUS, or all

    const where = {
      status: "EARNED",
      payoutId: null,
    };

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
            role: true,
          },
        },
        workOrder: {
          select: {
            woNumber: true,
            service: { select: { name: true } },
            category: { select: { name: true } },
            subservice: { select: { name: true } },
          },
        },
        payment: {
          select: {
            amount: true,
            method: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Filter by search if provided
    let filtered = commissions;
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = commissions.filter(
        (c) =>
          c.technician?.name?.toLowerCase().includes(searchLower) ||
          c.workOrder?.woNumber?.toLowerCase().includes(searchLower)
      );
    }

    const formatted = filtered.map((commission) => ({
      id: commission.id,
      workOrder: commission.workOrder?.woNumber || "N/A",
      technician: commission.technician?.name || "N/A",
      technicianId: commission.technicianId,
      type: commission.type,
      service:
        commission.workOrder?.subservice?.name ||
        commission.workOrder?.service?.name ||
        commission.workOrder?.category?.name ||
        "Service",
      payment: commission.payment?.amount || 0,
      rate: commission.rate,
      amount: commission.amount,
      date: commission.createdAt,
    }));

    return res.json(formatted);
  } catch (err) {
    next(err);
  }
};

/**
 * Get Early Payout Requests
 * List all pending early payout requests from technicians
 */
export const getEarlyPayoutRequests = async (req, res, next) => {
  try {
    const requests = await prisma.payoutRequest.findMany({
      where: {
        status: "PENDING",
      },
      include: {
        technician: {
          select: {
            id: true,
            name: true,
            phone: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formatted = requests.map((req) => ({
      id: req.id,
      technician: req.technician?.name || "N/A",
      technicianId: req.technicianId,
      amount: req.amount,
      reason: req.reason,
      paymentMethod: req.paymentMethod,
      requestedAt: req.createdAt,
    }));

    return res.json(formatted);
  } catch (err) {
    next(err);
  }
};

/**
 * Create Weekly Payout Batch
 * Creates a payout batch for all pending commissions
 */
export const createWeeklyBatch = async (req, res, next) => {
  try {
    const adminId = req.user.id;

    // Get all pending commissions
    const pendingCommissions = await prisma.commission.findMany({
      where: {
        status: "EARNED",
        payoutId: null,
      },
      include: {
        technician: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (pendingCommissions.length === 0) {
      return res.status(400).json({
        message: "No pending commissions to process",
      });
    }

    // Group by technician
    const technicianGroups = {};
    pendingCommissions.forEach((commission) => {
      if (!technicianGroups[commission.technicianId]) {
        technicianGroups[commission.technicianId] = {
          technician: commission.technician,
          commissions: [],
          totalAmount: 0,
        };
      }
      technicianGroups[commission.technicianId].commissions.push(commission);
      technicianGroups[commission.technicianId].totalAmount +=
        commission.amount;
    });

    // Calculate next Monday
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    nextMonday.setHours(0, 0, 0, 0);

    // Create payouts for each technician
    const payouts = [];
    for (const techId in technicianGroups) {
      const group = technicianGroups[techId];

      const payout = await prisma.payout.create({
        data: {
          technicianId: parseInt(techId),
          totalAmount: group.totalAmount,
          type: "WEEKLY",
          status: "SCHEDULED",
          requestedAt: nextMonday,
          createdById: adminId,
        },
      });

      // Update commissions to link to this payout
      await prisma.commission.updateMany({
        where: {
          id: { in: group.commissions.map((c) => c.id) },
        },
        data: {
          payoutId: payout.id,
          status: "PENDING_PAYOUT",
        },
      });

      payouts.push({
        id: payout.id,
        technician: group.technician.name,
        amount: group.totalAmount,
        commissionCount: group.commissions.length,
      });
    }

    return res.status(201).json({
      message: "Weekly payout batch created successfully",
      scheduledFor: nextMonday.toISOString().split("T")[0],
      totalAmount: Object.values(technicianGroups).reduce(
        (sum, g) => sum + g.totalAmount,
        0
      ),
      totalCommissions: pendingCommissions.length,
      payouts,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get Payout Batches
 * List all payout batches with their status
 */
export const getPayoutBatches = async (req, res, next) => {
  try {
    const { status } = req.query; // SCHEDULED, COMPLETED, FAILED

    const where = {};
    if (status) {
      where.status = status;
    }

    const batches = await prisma.payout.findMany({
      where,
      include: {
        technician: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        commissions: {
          select: {
            id: true,
            amount: true,
          },
        },
        createdBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formatted = batches.map((batch) => ({
      id: batch.id,
      technician: batch.technician?.name || "N/A",
      technicianId: batch.technicianId,
      totalAmount: batch.totalAmount,
      commissionsCount: batch.commissions.length,
      type: batch.type,
      status: batch.status,
      scheduledFor: batch.requestedAt,
      processedAt: batch.processedAt,
      createdBy: batch.createdBy?.name || "System",
      createdAt: batch.createdAt,
    }));

    return res.json(formatted);
  } catch (err) {
    next(err);
  }
};

/**
 * Get Payout History
 * List all completed payouts with details
 */
export const getPayoutHistory = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {
      status: "COMPLETED",
    };

    if (startDate || endDate) {
      where.processedAt = {};
      if (startDate) {
        where.processedAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.processedAt.lte = new Date(endDate);
      }
    }

    const history = await prisma.payout.findMany({
      where,
      include: {
        technician: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        commissions: {
          select: {
            id: true,
            amount: true,
            type: true,
          },
        },
      },
      orderBy: {
        processedAt: "desc",
      },
    });

    const formatted = history.map((payout) => ({
      id: payout.id,
      technician: payout.technician?.name || "N/A",
      technicianId: payout.technicianId,
      totalAmount: payout.totalAmount,
      commissionsCount: payout.commissions.length,
      type: payout.type,
      processedAt: payout.processedAt,
      createdAt: payout.createdAt,
    }));

    return res.json(formatted);
  } catch (err) {
    next(err);
  }
};

/**
 * Process Payout Batch
 * Mark a scheduled payout batch as completed
 */
export const processPayoutBatch = async (req, res, next) => {
  try {
    const { id } = req.params;

    const payout = await prisma.payout.findUnique({
      where: { id: Number(id) },
      include: {
        commissions: true,
      },
    });

    if (!payout) {
      return res.status(404).json({ message: "Payout batch not found" });
    }

    if (payout.status === "COMPLETED") {
      return res.status(400).json({ message: "Payout already completed" });
    }

    // Update payout status
    const updated = await prisma.payout.update({
      where: { id: Number(id) },
      data: {
        status: "COMPLETED",
        processedAt: new Date(),
      },
    });

    // Update all commissions to PAID
    await prisma.commission.updateMany({
      where: { payoutId: Number(id) },
      data: { status: "PAID" },
    });

    return res.json({
      message: "Payout batch processed successfully",
      payout: updated,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Approve Early Payout Request
 */
export const approveEarlyPayout = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const request = await prisma.payoutRequest.findUnique({
      where: { id: Number(id) },
    });

    if (!request) {
      return res.status(404).json({ message: "Payout request not found" });
    }

    if (request.status !== "PENDING") {
      return res.status(400).json({ message: "Request already processed" });
    }

    // Get pending commissions for this technician
    const commissions = await prisma.commission.findMany({
      where: {
        technicianId: request.technicianId,
        status: "EARNED",
        payoutId: null,
      },
    });

    const totalAvailable = commissions.reduce((sum, c) => sum + c.amount, 0);

    if (request.amount > totalAvailable) {
      return res.status(400).json({
        message: "Requested amount exceeds available balance",
        requested: request.amount,
        available: totalAvailable,
      });
    }

    // Create early payout
    const payout = await prisma.payout.create({
      data: {
        technicianId: request.technicianId,
        totalAmount: request.amount,
        type: "EARLY",
        status: "COMPLETED",
        processedAt: new Date(),
        createdById: adminId,
      },
    });

    // Link commissions to payout (up to requested amount)
    let remaining = request.amount;
    const commissionsToUpdate = [];

    for (const commission of commissions) {
      if (remaining <= 0) break;

      commissionsToUpdate.push(commission.id);
      remaining -= commission.amount;
    }

    await prisma.commission.updateMany({
      where: { id: { in: commissionsToUpdate } },
      data: {
        payoutId: payout.id,
        status: "PAID",
      },
    });

    // Update request status
    await prisma.payoutRequest.update({
      where: { id: Number(id) },
      data: {
        status: "APPROVED",
        reviewedById: adminId,
        reviewedAt: new Date(),
      },
    });

    return res.json({
      message: "Early payout request approved and processed",
      payout,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Reject Early Payout Request
 */
export const rejectEarlyPayout = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const updated = await prisma.payoutRequest.update({
      where: { id: Number(id) },
      data: {
        status: "REJECTED",
        reviewedById: adminId,
        reviewedAt: new Date(),
      },
    });

    return res.json({
      message: "Early payout request rejected",
      request: updated,
    });
  } catch (err) {
    next(err);
  }
};
