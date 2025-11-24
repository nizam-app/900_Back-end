// src/controllers/sr.controller.js
import { prisma } from '../prisma.js';

const generateSRNumber = () => 'SR-' + Date.now();

export const createSR = async (req, res, next) => {
  try {
    const {
      name,
      phone,
      address,
      latitude,
      longitude,
      categoryId,
      subserviceId,
      serviceId,
      description,
      paymentType,
      priority,
      source,
    } = req.body;

    // Validate required fields
    if (!phone || !address || !categoryId || !subserviceId) {
      return res.status(400).json({ message: 'Phone, address, categoryId, and subserviceId are required' });
    }

    // Validate phone format (10 digits)
    if (!/^\d{10,15}$/.test(phone)) {
      return res.status(400).json({ message: 'Phone must be 10-15 digits' });
    }

    // Validate GPS coordinates if provided
    if (latitude !== undefined || longitude !== undefined) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      
      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ message: 'Invalid latitude or longitude values' });
      }

      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({ 
          message: 'Latitude must be between -90 and 90, longitude between -180 and 180' 
        });
      }
    }

    // Validate paymentType
    const validPaymentTypes = ['CASH', 'MOBILE_MONEY'];
    const finalPaymentType = paymentType || 'CASH';
    if (!validPaymentTypes.includes(finalPaymentType)) {
      return res.status(400).json({ 
        message: `Invalid paymentType. Must be one of: ${validPaymentTypes.join(', ')}` 
      });
    }

    // Validate priority
    const validPriorities = ['LOW', 'MEDIUM', 'HIGH'];
    const finalPriority = priority || 'MEDIUM';
    if (!validPriorities.includes(finalPriority)) {
      return res.status(400).json({ 
        message: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` 
      });
    }

    // Validate source
    const validSources = ['CUSTOMER_APP', 'WEB_PORTAL', 'CALL_CENTER'];
    if (source && !validSources.includes(source)) {
      return res.status(400).json({ 
        message: `Invalid source. Must be one of: ${validSources.join(', ')}` 
      });
    }

    // Verify category, subservice, and service exist
    const category = await prisma.category.findUnique({ where: { id: Number(categoryId) } });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const subservice = await prisma.subservice.findUnique({ where: { id: Number(subserviceId) } });
    if (!subservice) {
      return res.status(404).json({ message: 'Subservice not found' });
    }

    if (serviceId) {
      const service = await prisma.service.findUnique({ where: { id: Number(serviceId) } });
      if (!service) {
        return res.status(404).json({ message: 'Service not found' });
      }
    }

    let customerId = req.user?.id;
    let createdById = req.user?.id;
    let isGuest = false;
    let finalSource = source || 'CUSTOMER_APP';

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
      finalSource = 'WEB_PORTAL';
    }

    if (req.user?.role === 'CALL_CENTER') {
      finalSource = 'CALL_CENTER';
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
        priority: finalPriority,
        address,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        paymentType: finalPaymentType,
        status: 'PENDING',
        source: finalSource,
        isGuest,
      },
      include: {
        category: true,
        subservice: true,
        service: true,
        customer: {
          select: { 
            id: true,
            name: true, 
            phone: true 
          }
        }
      },
    });

    // Also save GPS coordinates to customer profile if provided
    if (latitude && longitude && customerId) {
      await prisma.user.update({
        where: { id: customerId },
        data: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        },
      });
    }

    // Return SR with status and srId properties
    const response = {
      ...sr,
      srId: sr.id, // Include srId property
      status: sr.status, // Explicitly include status
    };

    // Real-time notification for new service request
    const { notifyNewServiceRequest } = await import('../services/notification.service.js');
    await notifyNewServiceRequest(sr);

    return res.status(201).json(response);
  } catch (err) {
    next(err);
  }
};

export const listSR = async (req, res, next) => {
  try {
    const { status, priority, customerId } = req.query;
    const userRole = req.user.role;
    const userId = req.user.id;

    const where = {};

    // Customers can only see their own SRs
    if (userRole === 'CUSTOMER') {
      where.customerId = userId;
    }

    // Apply filters only for dispatcher/admin/call center roles
    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (customerId && ['DISPATCHER', 'ADMIN', 'CALL_CENTER'].includes(userRole)) {
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
        workOrders: {
          select: {
            id: true,
            woNumber: true,
            status: true,
            technician: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1, // Get the latest work order
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Add WO status to each SR
    const srsWithWOStatus = srs.map(sr => ({
      ...sr,
      woStatus: sr.workOrders && sr.workOrders.length > 0 ? sr.workOrders[0].status : null,
      assignedTechnician: sr.workOrders && sr.workOrders.length > 0 && sr.workOrders[0].technician 
        ? sr.workOrders[0].technician.name 
        : 'Unassigned',
      latestWO: sr.workOrders && sr.workOrders.length > 0 ? sr.workOrders[0] : null,
    }));

    return res.json(srsWithWOStatus);
  } catch (err) {
    next(err);
  }
};

export const getSRById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;
    const userId = req.user.id;

    const sr = await prisma.serviceRequest.findUnique({
      where: { 
        srNumber: id 
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        category: true,
        subservice: true,
        service: true,
        workOrders: {
          include: {
            technician: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!sr) {
      return res.status(404).json({ message: 'Service Request not found' });
    }

    // Customers can only view their own SRs
    if (userRole === 'CUSTOMER' && sr.customerId !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    return res.json(sr);
  } catch (err) {
    next(err);
  }
};
