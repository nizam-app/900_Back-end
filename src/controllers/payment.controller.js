/** @format */

// src/controllers/payment.controller.js
import { prisma } from "../prisma.js";
import { notifyPaymentVerified } from "../services/notification.service.js";
import { uploadImageToService } from "../utils/imageUpload.js";

export const getAllPayments = async (req, res, next) => {
  try {
    const {
      status,
      woId,
      technicianId,
      method,
      page = 1,
      limit = 10,
    } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (woId) where.woId = Number(woId);
    if (technicianId) where.technicianId = Number(technicianId);
    if (method) where.method = method;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          workOrder: {
            select: {
              id: true,
              woNumber: true,
              status: true,
              customer: {
                select: { id: true, name: true, phone: true },
              },
            },
          },
          technician: {
            select: { id: true, name: true, phone: true },
          },
          verifiedBy: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: Number(offset),
        take: Number(limit),
      }),
      prisma.payment.count({ where }),
    ]);

    return res.json({
      payments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getPaymentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id: Number(id) },
      include: {
        workOrder: {
          include: {
            customer: {
              select: { id: true, name: true, phone: true, email: true },
            },
            technician: {
              select: { id: true, name: true, phone: true },
            },
            category: true,
            service: true,
            subservice: {
              select: {
                id: true,
                name: true,
                baseRate: true,
              },
            },
          },
        },
        technician: {
          select: { id: true, name: true, phone: true },
        },
        verifiedBy: {
          select: { id: true, name: true, phone: true },
        },
        commissions: {
          select: {
            id: true,
            type: true,
            amount: true,
            status: true,
          },
        },
      },
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    return res.json(payment);
  } catch (err) {
    next(err);
  }
};

export const uploadPaymentProof = async (req, res, next) => {
  try {
    const { woId, method, transactionRef, amount: manualAmount } = req.body;
    const technicianId = req.user.id;

    if (!woId || !method) {
      return res.status(400).json({ message: "woId and method are required" });
    }

    // Fetch work order with service pricing details
    const wo = await prisma.workOrder.findUnique({
      where: { id: Number(woId) },
      include: {
        service: true, // Get service pricing
        category: true,
        subservice: {
          select: {
            id: true,
            name: true,
            baseRate: true,
          },
        },
      },
    });

    if (!wo) {
      return res.status(404).json({ message: "Work Order not found" });
    }

    if (wo.status !== "COMPLETED_PENDING_PAYMENT") {
      return res
        .status(400)
        .json({ message: "Work Order is not completed yet" });
    }

    // Auto-fetch amount from service pricing or use manual override
    let finalAmount;

    if (manualAmount) {
      // Manual amount provided (for custom pricing)
      finalAmount = Number(manualAmount);
      console.log(
        `💰 Using manual amount: ₹${finalAmount} for WO ${wo.woNumber}`
      );
    } else if (wo.subservice?.baseRate) {
      // Auto-fetch from subservice base rate
      finalAmount = wo.subservice.baseRate;
      console.log(
        `💰 Auto-fetched amount from subservice: ₹${finalAmount} for ${wo.subservice.name}`
      );
    } else {
      return res.status(400).json({
        message: "No service pricing found. Please provide amount manually.",
        serviceInfo: {
          category: wo.category?.name,
          subservice: wo.subservice?.name,
          service: wo.service?.name,
        },
      });
    }

    // Upload image to external service (optional)
    let proofUrl = null;
    if (req.file) {
      proofUrl = await uploadImageToService(req.file);
    }

    const payment = await prisma.payment.create({
      data: {
        woId: Number(woId),
        technicianId,
        amount: finalAmount,
        method,
        transactionRef,
        ...(proofUrl && { proofUrl }),
        status: "PENDING_VERIFICATION",
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: technicianId,
        action: "PAYMENT_UPLOADED",
        entityType: "PAYMENT",
        entityId: payment.id,
      },
    });

    return res.status(201).json(payment);
  } catch (err) {
    next(err);
  }
};

export const verifyPayment = async (req, res, next) => {
  try {
    const paymentId = Number(req.params.id);
    const { action, reason } = req.body;
    const verifierId = req.user.id;

    if (!action || !["APPROVE", "REJECT"].includes(action)) {
      return res
        .status(400)
        .json({ message: "Action must be APPROVE or REJECT" });
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { workOrder: true },
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    if (payment.status !== "PENDING_VERIFICATION") {
      return res.status(400).json({ message: "Payment already verified" });
    }

    if (action === "APPROVE") {
      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: "VERIFIED",
          verifiedById: verifierId,
          verifiedAt: new Date(),
        },
      });

      await prisma.workOrder.update({
        where: { id: payment.woId },
        data: {
          status: "PAID_VERIFIED",
          paidVerifiedAt: new Date(),
        },
      });

      const wo = payment.workOrder;

      // Validate payment amount exists
      if (!payment.amount || payment.amount <= 0) {
        return res.status(400).json({
          message: "Payment amount is invalid or missing",
          paymentId: payment.id,
          amount: payment.amount,
        });
      }

      const techProfile = await prisma.technicianProfile.findUnique({
        where: { userId: wo.technicianId },
      });

      // Get system config for global rates (5% fixed, admin configurable)
      const systemConfig = await prisma.systemConfig.findFirst({
        where: { id: 1 },
      });

      // Determine if technician is freelancer or internal
      const isFreelancer = techProfile?.type === "FREELANCER";

      // Use system config rate (default 5%)
      const rate = isFreelancer
        ? systemConfig?.freelancerCommissionRate || 0.05
        : systemConfig?.internalEmployeeBonusRate || 0.05;

      const earnedAmount = Number(payment.amount) * rate;

      // Validate calculated amount
      if (isNaN(earnedAmount)) {
        return res.status(400).json({
          message: "Error calculating commission/bonus amount",
          paymentAmount: payment.amount,
          rate: rate,
        });
      }

      if (techProfile) {
        // Create only ONE commission record based on technician type
        // Freelancers get COMMISSION, Internal employees get BONUS
        await prisma.commission.create({
          data: {
            woId: wo.id,
            technicianId: wo.technicianId,
            type: isFreelancer ? "COMMISSION" : "BONUS",
            rate: rate,
            amount: earnedAmount,
            status: "EARNED",
            paymentId: payment.id,
          },
        });

        // Update wallet for both INTERNAL and FREELANCER technicians
        let wallet = await prisma.wallet.findUnique({
          where: { technicianId: wo.technicianId },
        });

        // Create wallet if doesn't exist (for TECH_INTERNAL)
        if (!wallet) {
          wallet = await prisma.wallet.create({
            data: {
              technicianId: wo.technicianId,
              balance: 0,
            },
          });
        }

        // Update wallet balance
        await prisma.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: { increment: earnedAmount },
          },
        });

        // Create single wallet transaction
        await prisma.walletTransaction.create({
          data: {
            walletId: wallet.id,
            technicianId: wo.technicianId,
            type: "CREDIT",
            sourceType: isFreelancer ? "COMMISSION" : "BONUS",
            sourceId: wo.id,
            amount: earnedAmount,
            description: `${isFreelancer ? "Commission" : "Bonus"} for WO ${
              wo.woNumber
            }`,
          },
        });

        console.log(
          `💰 Added ₹${earnedAmount} ${
            isFreelancer ? "commission" : "bonus"
          } to ${techProfile.type} technician wallet (ID: ${wo.technicianId})`
        );
      }

      await prisma.auditLog.create({
        data: {
          userId: verifierId,
          action: "PAYMENT_VERIFIED",
          entityType: "PAYMENT",
          entityId: payment.id,
        },
      });

      // Send notification (handle errors gracefully)
      try {
        await notifyPaymentVerified(wo.technicianId, wo, updatedPayment);
      } catch (notificationError) {
        console.log(
          "Notification failed (non-critical):",
          notificationError.message
        );
      }

      return res.json({
        success: true,
        message: "Payment verified successfully",
        payment: updatedPayment,
        earnings: {
          type: isFreelancer ? "COMMISSION" : "BONUS",
          rate: rate,
          ratePercentage: rate * 100,
          amount: earnedAmount,
        },
      });
    } else {
      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: "REJECTED",
          rejectedReason: reason,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: verifierId,
          action: "PAYMENT_REJECTED",
          entityType: "PAYMENT",
          entityId: payment.id,
          metadataJson: JSON.stringify({ reason }),
        },
      });

      return res.json(updatedPayment);
    }
  } catch (err) {
    next(err);
  }
};

export const getPaymentStats = async (req, res, next) => {
  try {
    const [
      pendingUpload,
      awaitingVerification,
      verified,
      rejected,
      totalCommissions,
    ] = await Promise.all([
      // Pending Upload - payments without proof
      prisma.payment.count({
        where: {
          proofUrl: null,
          status: { in: ["PENDING_UPLOAD", "PENDING"] },
        },
      }),

      // Awaiting Verification - proof uploaded but not verified
      prisma.payment.count({
        where: {
          proofUrl: { not: null },
          status: "PENDING_VERIFICATION",
        },
      }),

      // Verified - payments that are verified
      prisma.payment.count({
        where: {
          status: "VERIFIED",
        },
      }),

      // Rejected - payments that are rejected
      prisma.payment.count({
        where: {
          status: "REJECTED",
        },
      }),

      // Total Commissions (from verified payments)
      prisma.commission.aggregate({
        where: {
          status: "PAID",
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    return res.json({
      pendingUpload,
      awaitingVerification,
      verified,
      rejected,
      totalCommissions: totalCommissions._sum.amount || 0,
    });
  } catch (err) {
    next(err);
  }
};
