// src/services/payment.service.js
import { prisma } from '../prisma.js';
import { createCommissionForWO } from './commission.service.js';

export const createPayment = async (req, res, next) => {
  try {
    const technicianId = req.user.id;

    // form-data theke asbe (all are strings!)
    const { woId, amount, method, transactionRef } = req.body;

    const file = req.file; // multer upload.single('proof') theke
    // for now: save local path as proofUrl
    const proofUrl = file ? `/uploads/${file.filename}` : null;

    const wo = await prisma.workOrder.findUnique({
      where: { id: Number(woId) },
    });
    if (!wo) return res.status(404).json({ message: 'WO not found' });
    if (wo.technicianId !== technicianId)
      return res.status(403).json({ message: 'Not your WO' });
    if (wo.status !== 'COMPLETED_PENDING_PAYMENT')
      return res.status(400).json({ message: 'Invalid WO status' });

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
        action: 'PAYMENT_PROOF_UPLOADED',
        entityType: 'PAYMENT',
        entityId: payment.id,
      },
    });

    res.status(201).json(payment);
  } catch (e) {
    next(e);
  }
};
