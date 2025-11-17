// src/controllers/wo.controller.js
import { prisma } from '../prisma.js';
import {
  notifyWOAssignment,
  notifyWOAccepted,
  notifyWOCompleted,
} from '../services/notification.service.js';

const generateWONumber = () => 'WO-' + Date.now();

export const createWOFromSR = async (req, res, next) => {
  try {
    const srId = Number(req.params.srId);
    const { technicianId, scheduledAt, notes } = req.body;
    const dispatcherId = req.user.id;

    const sr = await prisma.serviceRequest.findUnique({
      where: { id: srId },
    });

    if (!sr) {
      return res.status(404).json({ message: 'Service Request not found' });
    }

    if (sr.status === 'CONVERTED_TO_WO') {
      return res.status(400).json({ message: 'SR already converted to WO' });
    }

    const wo = await prisma.workOrder.create({
      data: {
        woNumber: generateWONumber(),
        srId: sr.id,
        customerId: sr.customerId,
        technicianId: technicianId ? Number(technicianId) : null,
        dispatcherId,
        categoryId: sr.categoryId,
        subserviceId: sr.subserviceId,
        serviceId: sr.serviceId,
        address: sr.address,
        paymentType: sr.paymentType,
        priority: sr.priority,
        status: technicianId ? 'ASSIGNED' : 'UNASSIGNED',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        notes: notes || null,
      },
    });

    await prisma.serviceRequest.update({
      where: { id: sr.id },
      data: { status: 'CONVERTED_TO_WO' },
    });

    await prisma.auditLog.create({
      data: {
        userId: dispatcherId,
        action: 'WO_CREATED_FROM_SR',
        entityType: 'WORK_ORDER',
        entityId: wo.id,
      },
    });

    if (technicianId) {
      await notifyWOAssignment(Number(technicianId), wo);
    }

    return res.status(201).json(wo);
  } catch (err) {
    next(err);
  }
};

export const assignWO = async (req, res, next) => {
  try {
    const woId = Number(req.params.id);
    const { technicianId } = req.body;

    if (!technicianId) {
      return res.status(400).json({ message: 'technicianId is required' });
    }

    const tech = await prisma.user.findUnique({
      where: { id: Number(technicianId) },
    });

    if (!tech) {
      return res.status(404).json({ message: 'Technician not found' });
    }

    if (tech.isBlocked) {
      return res.status(400).json({ message: 'Technician is blocked' });
    }

    const wo = await prisma.workOrder.update({
      where: { id: woId },
      data: {
        technicianId: Number(technicianId),
        status: 'ASSIGNED',
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'WO_ASSIGNED',
        entityType: 'WORK_ORDER',
        entityId: wo.id,
        metadataJson: JSON.stringify({ technicianId }),
      },
    });

    await notifyWOAssignment(Number(technicianId), wo);

    return res.json(wo);
  } catch (err) {
    next(err);
  }
};

export const respondWO = async (req, res, next) => {
  try {
    const woId = Number(req.params.id);
    const { action } = req.body;
    const techId = req.user.id;

    const wo = await prisma.workOrder.findUnique({
      where: { id: woId },
    });

    if (!wo) {
      return res.status(404).json({ message: 'Work Order not found' });
    }

    if (wo.technicianId !== techId) {
      return res.status(403).json({ message: 'This WO does not belong to you' });
    }

    if (wo.status !== 'ASSIGNED') {
      return res.status(400).json({ message: 'WO is not in ASSIGNED status' });
    }

    let updated;

    if (action === 'ACCEPT') {
      updated = await prisma.workOrder.update({
        where: { id: woId },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
      });
    } else if (action === 'DECLINE') {
      updated = await prisma.workOrder.update({
        where: { id: woId },
        data: {
          status: 'UNASSIGNED',
          technicianId: null,
        },
      });
    } else {
      return res.status(400).json({ message: 'Invalid action, use ACCEPT or DECLINE' });
    }

    await prisma.auditLog.create({
      data: {
        userId: techId,
        action: 'WO_RESPOND',
        entityType: 'WORK_ORDER',
        entityId: wo.id,
        metadataJson: JSON.stringify({ action }),
      },
    });

    if (action === 'ACCEPT' && wo.dispatcherId) {
      await notifyWOAccepted(wo.dispatcherId, updated);
    }

    return res.json(updated);
  } catch (err) {
    next(err);
  }
};

export const startWO = async (req, res, next) => {
  try {
    const woId = Number(req.params.id);
    const techId = req.user.id;
    const { lat, lng } = req.body;

    const wo = await prisma.workOrder.findUnique({
      where: { id: woId },
    });

    if (!wo) {
      return res.status(404).json({ message: 'Work Order not found' });
    }

    if (wo.technicianId !== techId) {
      return res.status(403).json({ message: 'This WO does not belong to you' });
    }

    if (wo.status !== 'ACCEPTED') {
      return res.status(400).json({ message: 'WO is not in ACCEPTED status' });
    }

    await prisma.workOrder.update({
      where: { id: woId },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
    });

    await prisma.technicianCheckin.create({
      data: {
        woId,
        technicianId: techId,
        latitude: Number(lat),
        longitude: Number(lng),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: techId,
        action: 'WO_START',
        entityType: 'WORK_ORDER',
        entityId: wo.id,
      },
    });

    return res.json({ message: 'Work started' });
  } catch (err) {
    next(err);
  }
};

export const completeWO = async (req, res, next) => {
  try {
    const woId = Number(req.params.id);
    const techId = req.user.id;
    const { completionNotes, materialsUsed } = req.body;

    const wo = await prisma.workOrder.findUnique({
      where: { id: woId },
    });

    if (!wo) {
      return res.status(404).json({ message: 'Work Order not found' });
    }

    if (wo.technicianId !== techId) {
      return res.status(403).json({ message: 'This WO does not belong to you' });
    }

    if (wo.status !== 'IN_PROGRESS') {
      return res.status(400).json({ message: 'WO is not in IN_PROGRESS status' });
    }

    const photoUrls = req.files ? req.files.map(file => `/uploads/wo-completion/${file.filename}`) : [];

    let parsedMaterials = null;
    if (materialsUsed) {
      try {
        parsedMaterials = typeof materialsUsed === 'string' ? JSON.parse(materialsUsed) : materialsUsed;
      } catch (err) {
        return res.status(400).json({ message: 'Invalid materialsUsed format. Expected JSON array.' });
      }
    }

    const updated = await prisma.workOrder.update({
      where: { id: woId },
      data: {
        status: 'COMPLETED_PENDING_PAYMENT',
        completedAt: new Date(),
        completionNotes: completionNotes || null,
        completionPhotos: photoUrls.length > 0 ? JSON.stringify(photoUrls) : null,
        materialsUsed: parsedMaterials ? JSON.stringify(parsedMaterials) : null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: techId,
        action: 'WO_COMPLETE',
        entityType: 'WORK_ORDER',
        entityId: wo.id,
      },
    });

    if (wo.dispatcherId) {
      await notifyWOCompleted(wo.dispatcherId, updated);
    }

    return res.json(updated);
  } catch (err) {
    next(err);
  }
};
