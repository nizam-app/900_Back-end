// REFACTORED: src/services/sr.service.js - Pure Business Logic
import { prisma } from '../prisma.js';

const generateSRNumber = () => 'SR-' + Date.now();

// ✅ Create Service Request (guest or customer)
export const createServiceRequest = async (srData) => {
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
  } = srData;

  // find or create customer by phone
  let customer = await prisma.user.findUnique({ where: { phone } });
  let isGuest = false;

  if (!customer) {
    customer = await prisma.user.create({
      data: {
        phone,
        name: name || null,
        passwordHash: '',
        role: 'CUSTOMER',
      },
    });
    isGuest = true;
  }

  const sr = await prisma.serviceRequest.create({
    data: {
      srNumber: generateSRNumber(),
      customerId: customer.id,
      createdById: null,
      categoryId: Number(categoryId),
      subserviceId: Number(subserviceId),
      serviceId: serviceId ? Number(serviceId) : null,
      description: description || null,
      priority: priority || 'MEDIUM',
      address,
      paymentType,
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

  return sr;
};

// ✅ Find Service Requests with filters
export const findServiceRequests = async (filters) => {
  const { status, phone } = filters;

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

  return srs;
};
