// src/controllers/sr.controller.js
import { prisma } from '../prisma.js';

const generateSRNumber = () => 'SR-' + Date.now();

export const createSR = async (req, res, next) => {
  try {
    const {
      name,
      phone,
      address,
      categoryId,
      subserviceId,
      serviceId,
      description,
      paymentType,
      priority,
    } = req.body;

    if (!phone || !address || !categoryId || !subserviceId) {
      return res.status(400).json({ message: 'Phone, address, categoryId, and subserviceId are required' });
    }

    let customerId = req.user?.id;
    let createdById = req.user?.id;
    let isGuest = false;
    let source = 'CUSTOMER_APP';

    if (!customerId) {
      // Guest user
      let guestUser = await prisma.user.findUnique({ where: { phone } });

      if (!guestUser) {
        guestUser = await prisma.user.create({
          data: {
            phone,
            name,
            passwordHash: '',
            role: 'CUSTOMER',
          },
        });
      }

      customerId = guestUser.id;
      isGuest = true;
      source = 'WEB_PORTAL';
    }

    if (req.user?.role === 'CALL_CENTER') {
      source = 'CALL_CENTER';
      createdById = req.user.id;
    }

    const sr = await prisma.serviceRequest.create({
      data: {
        srNumber: generateSRNumber(),
        customerId,
        createdById,
        categoryId: Number(categoryId),
        subserviceId: Number(subserviceId),
        serviceId: serviceId ? Number(serviceId) : null,
        description,
        priority: priority || 'MEDIUM',
        address,
        paymentType: paymentType || 'CASH',
        status: 'NEW',
        source,
        isGuest,
      },
      include: {
        category: true,
        subservice: true,
        service: true,
        customer: {
          select: { name: true, phone: true }
        }
      },
    });

    // Real-time notification for new service request
    const { notifyNewServiceRequest } = await import('../services/notification.service.js');
    await notifyNewServiceRequest(sr);

    return res.status(201).json(sr);
  } catch (err) {
    next(err);
  }
};

export const listSR = async (req, res, next) => {
  try {
    const { status, priority, customerId } = req.query;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (customerId) {
      where.customerId = Number(customerId);
    }

    const srs = await prisma.serviceRequest.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        category: true,
        subservice: true,
        service: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(srs);
  } catch (err) {
    next(err);
  }
};
