// src/services/sr.service.js
import { prisma } from '../prisma.js';

// simple SR number generator
const generateSRNumber = () => 'SR-' + Date.now();

// ✅ Customer / Guest create Service Request
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
      source,
    } = req.body;

    if (!phone || !address || !categoryId || !subserviceId || !paymentType) {
      return res.status(400).json({
        message: 'phone, address, categoryId, subserviceId, paymentType are required',
      });
    }

    // find or create customer by phone
    let customer = await prisma.user.findUnique({ where: { phone } });
    let isGuest = false;

    if (!customer) {
      customer = await prisma.user.create({
        data: {
          phone,
          name: name || null,
          passwordHash: '', // guest (no real login yet)
          role: 'CUSTOMER',
        },
      });
      isGuest = true;
    }

    const sr = await prisma.serviceRequest.create({
      data: {
        srNumber: generateSRNumber(),
        customerId: customer.id,
        createdById: null,     // guest/customer, no agent
        categoryId: Number(categoryId),
        subserviceId: Number(subserviceId),
        serviceId: serviceId ? Number(serviceId) : null,
        description: description || null,
        priority: priority || 'MEDIUM',
        address,
        paymentType,           // CASH / MOBILE_MONEY
        status: 'NEW',
        source: source || 'CUSTOMER_APP',
        isGuest,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: customer.id,
        action: 'SR_CREATED',
        entityType: 'SERVICE_REQUEST',
        entityId: sr.id,
      },
    });

    return res.status(201).json(sr);
  } catch (err) {
    next(err);
  }
};

// ✅ Dispatcher / Call Center / Admin list SRs
export const listSR = async (req, res, next) => {
  try {
    const { status, phone } = req.query;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (phone) {
      where.customer = {
        phone,
      };
    }

    const srs = await prisma.serviceRequest.findMany({
      where,
      include: {
        customer: true,
        category: true,
        subservice: true,
        service: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.json(srs);
  } catch (err) {
    next(err);
  }
};
