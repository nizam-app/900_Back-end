/** @format */

// src/controllers/commission.controller.js
import { prisma } from "../prisma.js";

export const getWalletBalance = async (req, res, next) => {
  try {
    const technicianId = req.user.id;

    const wallet = await prisma.wallet.findUnique({
      where: { technicianId },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!wallet) {
      return res.status(404).json({
        message:
          "Wallet not found. Complete your first work order to activate wallet.",
        balance: 0,
      });
    }

    const response = {
      id: wallet.id,
      technicianId: wallet.technicianId,
      balance: wallet.balance < 0 ? 0 : wallet.balance,
      actualBalance: wallet.balance,
      recentTransactions: wallet.transactions,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    };

    if (wallet.balance < 0) {
      response.warning = {
        message: "Wallet balance adjustment needed. Please contact support.",
        error: "NEGATIVE_BALANCE_DETECTED",
      };
    }

    return res.json(response);
  } catch (err) {
    next(err);
  }
};

export const getMyCommissions = async (req, res, next) => {
  try {
    const technicianId = req.user.id;
    const { status, startDate, endDate } = req.query;

    const where = { technicianId };

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const commissions = await prisma.commission.findMany({
      where,
      include: {
        workOrder: {
          select: {
            woNumber: true,
            completedAt: true,
            customer: {
              select: {
                name: true,
                phone: true,
              },
            },
            category: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json(commissions);
  } catch (err) {
    next(err);
  }
};

export const getTechnicianDashboard = async (req, res, next) => {
  try {
    const technicianId = req.user.id;

    const [wallet, totalEarned, totalPaid, allCommissions, totalJobsCompleted] =
      await Promise.all([
        prisma.wallet.findUnique({ where: { technicianId } }),
        prisma.commission.aggregate({
          where: { technicianId, status: "EARNED" },
          _sum: { amount: true },
        }),
        prisma.commission.aggregate({
          where: { technicianId, status: "PAID" },
          _sum: { amount: true },
        }),
        prisma.commission.aggregate({
          where: { technicianId },
          _sum: { amount: true },
        }),
        prisma.workOrder.count({
          where: { technicianId, status: "COMPLETED" },
        }),
      ]);

    // Handle wallet balance validation
    const currentBalance = wallet?.balance || 0;
    let walletBalance = currentBalance;
    let hasNegativeBalance = false;

    if (currentBalance < 0) {
      walletBalance = 0; // Always show 0 or positive
      hasNegativeBalance = true;
    }

    const earnedAmount = totalEarned._sum.amount || 0;
    const paidAmount = totalPaid._sum.amount || 0;
    const totalAmount = allCommissions._sum.amount || 0;

    const response = {
      walletBalance,
      totalEarned: earnedAmount,
      totalPaid: paidAmount,
      pendingPayout: earnedAmount, // Only earned commissions are pending
      totalAllTimeEarnings: totalAmount,
      totalJobsCompleted,
    };

    // Add warning for negative balance
    if (hasNegativeBalance) {
      response.warning = {
        message: "Wallet balance adjustment needed. Please contact support.",
        actualBalance: currentBalance,
        error: "NEGATIVE_BALANCE_DETECTED",
      };
    }

    // Add validation message if no wallet exists
    if (!wallet) {
      response.info = {
        message:
          "Wallet not initialized. Complete your first work order to activate wallet.",
        error: "WALLET_NOT_FOUND",
      };
    }

    return res.json(response);
  } catch (err) {
    next(err);
  }
};

export const requestPayout = async (req, res, next) => {
  try {
    const technicianId = req.user.id;
    const { amount, reason } = req.body;

    if (!amount) {
      return res.status(400).json({ message: "Amount is required" });
    }

    const wallet = await prisma.wallet.findUnique({
      where: { technicianId },
    });

    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ message: "Insufficient wallet balance" });
    }

    const payoutRequest = await prisma.payoutRequest.create({
      data: {
        technicianId,
        amount: Number(amount),
        status: "PENDING",
        reason,
      },
    });

    return res.status(201).json(payoutRequest);
  } catch (err) {
    next(err);
  }
};

export const getPayoutRequests = async (req, res, next) => {
  try {
    const { status, technicianId } = req.query;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (technicianId) {
      where.technicianId = Number(technicianId);
    }

    const requests = await prisma.payoutRequest.findMany({
      where,
      include: {
        technician: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        reviewedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json(requests);
  } catch (err) {
    next(err);
  }
};

export const reviewPayoutRequest = async (req, res, next) => {
  try {
    const requestId = Number(req.params.id);
    const { action, reason } = req.body;
    const reviewerId = req.user.id;

    if (!action || !["APPROVE", "REJECT"].includes(action)) {
      return res
        .status(400)
        .json({ message: "Action must be APPROVE or REJECT" });
    }

    const payoutRequest = await prisma.payoutRequest.findUnique({
      where: { id: requestId },
    });

    if (!payoutRequest) {
      return res.status(404).json({ message: "Payout request not found" });
    }

    if (payoutRequest.status !== "PENDING") {
      return res
        .status(400)
        .json({ message: "Payout request already reviewed" });
    }

    if (action === "APPROVE") {
      await prisma.$transaction(async (tx) => {
        await tx.payoutRequest.update({
          where: { id: requestId },
          data: {
            status: "APPROVED",
            reviewedById: reviewerId,
            reviewedAt: new Date(),
          },
        });

        const wallet = await tx.wallet.findUnique({
          where: { technicianId: payoutRequest.technicianId },
        });

        if (wallet.balance < payoutRequest.amount) {
          throw new Error("Insufficient wallet balance");
        }

        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: { decrement: payoutRequest.amount },
          },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            technicianId: payoutRequest.technicianId,
            type: "DEBIT",
            sourceType: "PAYOUT",
            sourceId: requestId,
            amount: payoutRequest.amount,
            description: `Payout request #${requestId}`,
          },
        });

        const earnedCommissions = await tx.commission.findMany({
          where: {
            technicianId: payoutRequest.technicianId,
            status: "EARNED",
          },
          orderBy: { createdAt: "asc" },
        });

        let remaining = payoutRequest.amount;
        const commissionIds = [];

        for (const commission of earnedCommissions) {
          if (remaining <= 0) break;
          if (commission.amount <= remaining) {
            commissionIds.push(commission.id);
            remaining -= commission.amount;
          }
        }

        if (commissionIds.length > 0) {
          await tx.commission.updateMany({
            where: { id: { in: commissionIds } },
            data: { status: "PAID" },
          });
        }
      });

      const updated = await prisma.payoutRequest.findUnique({
        where: { id: requestId },
      });

      return res.json(updated);
    } else {
      const updated = await prisma.payoutRequest.update({
        where: { id: requestId },
        data: {
          status: "REJECTED",
          reviewedById: reviewerId,
          reviewedAt: new Date(),
          reason,
        },
      });

      return res.json(updated);
    }
  } catch (err) {
    next(err);
  }
};

export const runWeeklyPayout = async (req, res, next) => {
  try {
    const freelancers = await prisma.user.findMany({
      where: {
        role: "TECH_FREELANCER",
        technicianProfile: {
          status: "ACTIVE",
        },
      },
      include: {
        wallet: true,
      },
    });

    const payouts = [];

    for (const freelancer of freelancers) {
      const earnedCommissions = await prisma.commission.findMany({
        where: {
          technicianId: freelancer.id,
          status: "EARNED",
        },
      });

      if (earnedCommissions.length === 0) continue;

      const totalAmount = earnedCommissions.reduce(
        (sum, c) => sum + c.amount,
        0
      );

      const payout = await prisma.payout.create({
        data: {
          technicianId: freelancer.id,
          totalAmount,
          type: "WEEKLY",
          status: "PAID",
          processedAt: new Date(),
          createdById: req.user.id,
        },
      });

      await prisma.commission.updateMany({
        where: {
          id: { in: earnedCommissions.map((c) => c.id) },
        },
        data: {
          status: "PAID",
          payoutId: payout.id,
        },
      });

      if (freelancer.wallet) {
        await prisma.wallet.update({
          where: { id: freelancer.wallet.id },
          data: {
            balance: { decrement: totalAmount },
          },
        });

        await prisma.walletTransaction.create({
          data: {
            walletId: freelancer.wallet.id,
            technicianId: freelancer.id,
            type: "DEBIT",
            sourceType: "PAYOUT",
            sourceId: payout.id,
            amount: totalAmount,
            description: `Weekly payout`,
          },
        });
      }

      payouts.push(payout);
    }

    return res.json({
      message: "Weekly payout completed",
      count: payouts.length,
      payouts,
    });
  } catch (err) {
    next(err);
  }
};
