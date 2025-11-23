// src/controllers/wo.controller.js
import { prisma } from '../prisma.js';
import {
  notifyWOAssignment,
  notifyWOAccepted,
  notifyWOCompleted,
} from '../services/notification.service.js';
import {
  setResponseDeadline,
  clearResponseDeadline,
  isWorkOrderExpired,
  getRemainingTime,
  TIME_CONFIG
} from '../services/timeLimit.service.js';

const generateWONumber = () => 'WO-' + Date.now();

export const getWOById = async (req, res, next) => {
  try {
    const woIdParam = req.params.woId;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Find WO by either numeric ID or woNumber
    const whereClause = isNaN(woIdParam) 
      ? { woNumber: woIdParam } 
      : { id: Number(woIdParam) };

    const workOrder = await prisma.workOrder.findFirst({
      where: whereClause,
      include: {
        customer: {
          select: { id: true, name: true, phone: true, email: true }
        },
        technician: {
          select: { id: true, name: true, phone: true, role: true }
        },
        dispatcher: {
          select: { id: true, name: true, phone: true }
        },
        category: {
          select: { id: true, name: true, description: true }
        },
        service: {
          select: { id: true, name: true, description: true, baseRate: true }
        },
        subservice: {
          select: { id: true, name: true, description: true }
        },
        serviceRequest: {
          select: { id: true, srNumber: true, description: true, priority: true }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            method: true,
            status: true,
            createdAt: true
          }
        },
        commissions: {
          select: {
            id: true,
            type: true,
            amount: true,
            status: true
          }
        }
      }
    });

    if (!workOrder) {
      return res.status(404).json({ message: 'Work Order not found' });
    }

    // Check access permissions
    if (userRole === 'CUSTOMER' && workOrder.customerId !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if ((userRole === 'TECH_INTERNAL' || userRole === 'TECH_FREELANCER') && workOrder.technicianId !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    return res.json(workOrder);
  } catch (err) {
    next(err);
  }
};

export const getAllWorkOrders = async (req, res, next) => {
  try {
    const { status, technicianId, customerId, priority, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (technicianId) where.technicianId = Number(technicianId);
    if (customerId) where.customerId = Number(customerId);
    if (priority) where.priority = priority;

    const [workOrders, total] = await Promise.all([
      prisma.workOrder.findMany({
        where,
        include: {
          customer: {
            // select: { id: true, firstName: true, lastName: true, phone: true }
          },
          technician: {
            // select: { id: true, firstName: true, lastName: true, phone: true }
          },
          dispatcher: {
            // select: { id: true, firstName: true, lastName: true }
          },
          category: {
            select: { id: true, name: true }
          },
          service: {
            select: { id: true, name: true }
          },
          subservice: {
            select: { id: true, name: true }
          },
          serviceRequest: {
            select: { id: true, srNumber: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: Number(offset),
        take: Number(limit),
      }),
      prisma.workOrder.count({ where })
    ]);

    return res.json({
      workOrders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
};

export const createWOFromSR = async (req, res, next) => {
  try {
    // Validate srId parameter
    const srIdParam = req.params.srId;
    if (!srIdParam || isNaN(srIdParam)) {
      return res.status(400).json({ 
        message: 'Valid Service Request ID is required',
        error: 'INVALID_SR_ID' 
      });
    }

    const srId = Number(srIdParam);
    const { technicianId, scheduledAt, notes, estimatedHours } = req.body;
    const dispatcherId = req.user.id;

    // Additional validation for technicianId if provided
    if (technicianId && isNaN(technicianId)) {
      return res.status(400).json({ 
        message: 'Valid Technician ID is required',
        error: 'INVALID_TECHNICIAN_ID' 
      });
    }

    // Validate estimatedHours if provided
    if (estimatedHours && (isNaN(estimatedHours) || estimatedHours < 1)) {
      return res.status(400).json({ 
        message: 'Estimated hours must be a positive number',
        error: 'INVALID_ESTIMATED_HOURS' 
      });
    }

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
        estimatedHours: estimatedHours ? Number(estimatedHours) : null,
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

    // Send notifications
    if (technicianId) {
      await notifyWOAssignment(Number(technicianId), wo);
    }

    // Real-time notification removed - notifications stored in database only
    console.log(`📋 Work Order created: ${wo.woNumber}`);

    return res.status(201).json(wo);
  } catch (err) {
    next(err);
  }
};

export const assignWO = async (req, res, next) => {
  try {
    const woIdParam = req.params.woId;
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

    // Find WO by either numeric ID or woNumber
    const whereClause = isNaN(woIdParam) 
      ? { woNumber: woIdParam } 
      : { id: Number(woIdParam) };

    const wo = await prisma.workOrder.update({
      where: whereClause,
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

    // Set response deadline for technician
    const deadline = await setResponseDeadline(woId, TIME_CONFIG.RESPONSE_TIME_MINUTES);

    return res.json({
      ...wo,
      responseDeadline: deadline,
      timeLimit: {
        responseTimeMinutes: TIME_CONFIG.RESPONSE_TIME_MINUTES,
        warningTimeMinutes: TIME_CONFIG.WARNING_TIME_MINUTES,
        deadline: deadline,
        message: `You have ${TIME_CONFIG.RESPONSE_TIME_MINUTES} minutes to accept or decline this work order`
      }
    });
  } catch (err) {
    next(err);
  }
};

export const respondWO = async (req, res, next) => { 
  try {
    const woIdParam = req.params.woId;
    const whereClause = isNaN(woIdParam) 
      ? { woNumber: woIdParam } 
      : { id: Number(woIdParam) };
    const { action } = req.body;
    const techId = req.user.id;

    // Validate action
    if (!action) {
      return res.status(400).json({ message: 'Action is required' });
    }

    const validActions = ['ACCEPT', 'DECLINE'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ 
        message: `Invalid action. Must be one of: ${validActions.join(', ')}` 
      });
    }

    const wo = await prisma.workOrder.findUnique({
      where: whereClause,
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

    // Check if response time has expired
    if (isWorkOrderExpired(woId)) {
      return res.status(410).json({ 
        message: 'Response time expired. This work order has been automatically unassigned.',
        code: 'RESPONSE_TIMEOUT'
      });
    }

    const remainingTime = getRemainingTime(woId);

    let updated;

    if (action === 'ACCEPT') {
      updated = await prisma.workOrder.update({
        where: whereClause,
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
      });
    } else if (action === 'DECLINE') {
      updated = await prisma.workOrder.update({
        where: whereClause,
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

    // Clear response deadline since technician responded
    clearResponseDeadline(woId);

    if (action === 'ACCEPT' && wo.dispatcherId) {
      await notifyWOAccepted(wo.dispatcherId, updated);
    }

    return res.json({
      ...updated,
      responseTime: remainingTime ? {
        respondedWithMinutesRemaining: remainingTime.minutes,
        respondedInTime: !remainingTime.expired
      } : null,
      message: action === 'ACCEPT' ? 
        'Work order accepted successfully' : 
        'Work order declined successfully'
    });
  } catch (err) {
    next(err);
  }
};

export const startWO = async (req, res, next) => {
  try {
    const woIdParam = req.params.woId;
    const whereClause = isNaN(woIdParam) 
      ? { woNumber: woIdParam } 
      : { id: Number(woIdParam) };
    const techId = req.user.id;
    const { latitude, longitude } = req.body;

    // Validate required fields
    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    // Validate coordinates
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ message: 'Invalid latitude or longitude values' });
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ message: 'Latitude must be between -90 and 90, longitude between -180 and 180' });
    }

    const wo = await prisma.workOrder.findUnique({
      where: whereClause,
    });

    if (!wo) {
      return res.status(404).json({ message: 'Work Order not found' });
    }

    if (wo.technicianId !== techId) {
      return res.status(403).json({ message: 'Not assigned to you' });
    }

    if (wo.status !== 'ACCEPTED') {
      return res.status(400).json({ message: 'WO is not in ACCEPTED status' });
    }

    const updatedWO = await prisma.workOrder.update({
      where: whereClause,
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
      include: {
        customer: true,
        technician: true
      }
    });

    await prisma.technicianCheckin.create({
      data: {
        woId: wo.id,
        technicianId: techId,
        latitude: lat,
        longitude: lng,
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

    // Real-time notification for work started
    const { notifyWorkStarted } = await import('../services/notification.service.js');
    await notifyWorkStarted(updatedWO);

    return res.json({ message: 'Work started', wo: updatedWO });
  } catch (err) {
    next(err);
  }
};

export const completeWO = async (req, res, next) => {
  try {
    const woIdParam = req.params.woId;
    const whereClause = isNaN(woIdParam) 
      ? { woNumber: woIdParam } 
      : { id: Number(woIdParam) };
    const techId = req.user.id;
    const { completionNotes, materialsUsed } = req.body;

    const wo = await prisma.workOrder.findUnique({
      where: whereClause,
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
      where: whereClause,
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
