// src/controllers/payment.controller.js
import { prisma } from '../prisma.js';
import { notifyPaymentVerified } from '../services/notification.service.js';

export const uploadPaymentProof = async (req, res, next) => {
  try {
    const { woId, amount, method, transactionRef } = req.body;
    const technicianId = req.user.id;

    if (!woId || !amount || !method) {
      return res.status(400).json({ message: 'woId, amount, and method are required' });
    }

    const wo = await prisma.workOrder.findUnique({
      where: { id: Number(woId) },
    });

    if (!wo) {
      return res.status(404).json({ message: 'Work Order not found' });
    }

    if (wo.status !== 'COMPLETED_PENDING_PAYMENT') {
      return res.status(400).json({ message: 'Work Order is not completed yet' });
    }

    const proofUrl = req.file ? `/uploads/payments/${req.file.filename}` : null;

    const payment = await prisma.payment.create({
      data: {
        woId: Number(woId),
        technicianId,
        amount: Number(amount),
        method,
        transactionRef,
        proofUrl,
        status: 'PENDING_VERIFICATION',
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: technicianId,
        action: 'PAYMENT_UPLOADED',
        entityType: 'PAYMENT',
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

    if (!action || !['APPROVE', 'REJECT'].includes(action)) {
      return res.status(400).json({ message: 'Action must be APPROVE or REJECT' });
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { workOrder: true },
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.status !== 'PENDING_VERIFICATION') {
      return res.status(400).json({ message: 'Payment already verified' });
    }

    if (action === 'APPROVE') {
      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'VERIFIED',
          verifiedById: verifierId,
          verifiedAt: new Date(),
        },
      });

      await prisma.workOrder.update({
        where: { id: payment.woId },
        data: {
          status: 'PAID_VERIFIED',
          paidVerifiedAt: new Date(),
        },
      });

      const wo = payment.workOrder;
      const techProfile = await prisma.technicianProfile.findUnique({
        where: { userId: wo.technicianId },
      });

      if (techProfile) {
        const commissionAmount = payment.amount * techProfile.commissionRate;
        const bonusAmount = payment.amount * techProfile.bonusRate;

        await prisma.commission.create({
          data: {
            woId: wo.id,
            technicianId: wo.technicianId,
            type: 'COMMISSION',
            rate: techProfile.commissionRate,
            amount: commissionAmount,
            status: 'EARNED',
            paymentId: payment.id,
          },
        });

        await prisma.commission.create({
          data: {
            woId: wo.id,
            technicianId: wo.technicianId,
            type: 'BONUS',
            rate: techProfile.bonusRate,
            amount: bonusAmount,
            status: 'EARNED',
            paymentId: payment.id,
          },
        });

        if (techProfile.type === 'FREELANCER') {
          const wallet = await prisma.wallet.findUnique({
            where: { technicianId: wo.technicianId },
          });

          if (wallet) {
            await prisma.wallet.update({
              where: { id: wallet.id },
              data: {
                balance: { increment: commissionAmount + bonusAmount },
              },
            });

            await prisma.walletTransaction.createMany({
              data: [
                {
                  walletId: wallet.id,
                  technicianId: wo.technicianId,
                  type: 'CREDIT',
                  sourceType: 'COMMISSION',
                  sourceId: wo.id,
                  amount: commissionAmount,
                  description: `Commission for WO ${wo.woNumber}`,
                },
                {
                  walletId: wallet.id,
                  technicianId: wo.technicianId,
                  type: 'CREDIT',
                  sourceType: 'BONUS',
                  sourceId: wo.id,
                  amount: bonusAmount,
                  description: `Bonus for WO ${wo.woNumber}`,
                },
              ],
            });
          }
        }
      }

      await prisma.auditLog.create({
        data: {
          userId: verifierId,
          action: 'PAYMENT_VERIFIED',
          entityType: 'PAYMENT',
          entityId: payment.id,
        },
      });

      await notifyPaymentVerified(wo.technicianId, updatedPayment);

      return res.json(updatedPayment);
    } else {
      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'REJECTED',
          rejectedReason: reason,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: verifierId,
          action: 'PAYMENT_REJECTED',
          entityType: 'PAYMENT',
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
