/** @format */

// src/controllers/admin.controller.js
import { prisma } from "../prisma.js";
import * as adminService from "../services/admin.service.js";

export const getDashboard = async (req, res, next) => {
  try {
    const stats = await adminService.getDashboardStats();
    return res.json(stats);
  } catch (err) {
    next(err);
  }
};

export const listUsers = async (req, res, next) => {
  try {
    const users = await adminService.findUsers(req.query);
    return res.json(users);
  } catch (err) {
    next(err);
  }
};

// Get all customers with registration source information
export const listCustomers = async (req, res, next) => {
  try {
    const { registrationSource } = req.query;

    const where = { role: "CUSTOMER" };

    // Filter by registration source if provided
    if (registrationSource) {
      where.registrationSource = registrationSource;
    }

    const customers = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        homeAddress: true,
        latitude: true,
        longitude: true,
        registrationSource: true,
        createdById: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            phone: true,
            role: true,
          },
        },
        createdAt: true,
        updatedAt: true,
        isBlocked: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate statistics
    const totalCustomers = customers.length;
    const selfRegistered = customers.filter(
      (c) => c.registrationSource === "SELF_REGISTERED"
    ).length;
    const callCenterCreated = customers.filter(
      (c) => c.registrationSource === "CALL_CENTER"
    ).length;
    const adminCreated = customers.filter(
      (c) => c.registrationSource === "ADMIN"
    ).length;
    const webPortal = customers.filter(
      (c) => c.registrationSource === "WEB_PORTAL"
    ).length;
    const unknown = customers.filter((c) => !c.registrationSource).length;

    return res.json({
      total: totalCustomers,
      statistics: {
        selfRegistered: {
          count: selfRegistered,
          percentage:
            totalCustomers > 0
              ? ((selfRegistered / totalCustomers) * 100).toFixed(1)
              : 0,
        },
        callCenterCreated: {
          count: callCenterCreated,
          percentage:
            totalCustomers > 0
              ? ((callCenterCreated / totalCustomers) * 100).toFixed(1)
              : 0,
        },
        adminCreated: {
          count: adminCreated,
          percentage:
            totalCustomers > 0
              ? ((adminCreated / totalCustomers) * 100).toFixed(1)
              : 0,
        },
        webPortal: {
          count: webPortal,
          percentage:
            totalCustomers > 0
              ? ((webPortal / totalCustomers) * 100).toFixed(1)
              : 0,
        },
        unknown: {
          count: unknown,
          percentage:
            totalCustomers > 0
              ? ((unknown / totalCustomers) * 100).toFixed(1)
              : 0,
        },
      },
      customers,
    });
  } catch (err) {
    next(err);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { name, phone, email, password, role, technicianProfile } = req.body;

    if (!phone || !password || !role) {
      return res
        .status(400)
        .json({ message: "Phone, password, and role are required" });
    }

    const user = await adminService.createUserWithProfile(
      req.body,
      req.user.id
    );
    return res.status(201).json(user);
  } catch (err) {
    if (err.message === "Phone already exists") {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    const { name, email, role } = req.body;

    const user = await adminService.updateUserById(
      userId,
      { name, email, role },
      req.user.id
    );
    return res.json(user);
  } catch (err) {
    next(err);
  }
};

export const blockTechnician = async (req, res, next) => {
  try {
    const technicianId = Number(req.params.id);
    const { isBlocked, blockedReason } = req.body;

    if (isBlocked && !blockedReason) {
      return res.status(400).json({
        message: "Blocked reason is required when blocking a technician",
      });
    }

    const user = await adminService.setTechnicianBlockStatus(
      technicianId,
      isBlocked,
      blockedReason,
      req.user.id
    );
    return res.json(user);
  } catch (err) {
    next(err);
  }
};

export const updateTechnicianProfile = async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    const userRole = req.user.role;

    // Dispatcher cannot update images/documents - Admin only
    if (userRole === "DISPATCHER") {
      const restrictedFields = [
        "photoUrl",
        "idCardUrl",
        "residencePermitUrl",
        "degreesUrl",
        "baseSalary",
      ];
      const hasRestrictedField = restrictedFields.some(
        (field) => req.body[field] !== undefined
      );
      const hasUploadedFiles = req.files && Object.keys(req.files).length > 0;

      if (hasRestrictedField || hasUploadedFiles) {
        return res.status(403).json({
          message:
            "Dispatcher cannot update profile images, documents, or salary. Admin access required.",
        });
      }
    }

    // Process uploaded files
    const updateData = { ...req.body };

    if (req.files) {
      if (req.files.photoUrl && req.files.photoUrl[0]) {
        updateData.photoUrl = `/uploads/${req.files.photoUrl[0].filename}`;
      }
      if (req.files.idCardUrl && req.files.idCardUrl[0]) {
        updateData.idCardUrl = `/uploads/${req.files.idCardUrl[0].filename}`;
      }
      if (req.files.residencePermitUrl && req.files.residencePermitUrl[0]) {
        updateData.residencePermitUrl = `/uploads/${req.files.residencePermitUrl[0].filename}`;
      }
      if (req.files.degreesUrl && req.files.degreesUrl.length > 0) {
        updateData.degreesUrl = JSON.stringify(
          req.files.degreesUrl.map((file) => `/uploads/${file.filename}`)
        );
      }
    }

    const profile = await adminService.updateTechProfile(
      userId,
      updateData,
      req.user.id
    );
    return res.json(profile);
  } catch (err) {
    next(err);
  }
};

export const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await adminService.fetchAuditLogs(req.query);
    return res.json(logs);
  } catch (err) {
    next(err);
  }
};

/**
 * Get Technician Locations for Map View
 * Returns technician locations with online/offline status
 */
export const getTechnicianLocations = async (req, res, next) => {
  try {
    // Get all technicians with their profiles and current work orders
    const technicians = await prisma.user.findMany({
      where: {
        role: {
          in: ["TECH_FREELANCER", "TECH_INTERNAL"],
        },
      },
      include: {
        technicianProfile: true,
        technicianWOs: {
          where: {
            status: {
              in: ["ASSIGNED", "IN_PROGRESS"],
            },
          },
          include: {
            serviceRequest: {
              include: {
                subservice: {
                  select: {
                    id: true,
                    name: true,
                    baseRate: true,
                  },
                },
              },
            },
          },
          orderBy: {
            updatedAt: "desc",
          },
          take: 1,
        },
      },
    });

    // Calculate online/offline status based on last activity
    const now = new Date();
    const ONLINE_THRESHOLD_MINUTES = 15; // Consider online if active in last 15 minutes

    const technicianLocations = technicians
      .filter((tech) => tech.technicianProfile) // Only include technicians with profiles
      .map((tech) => {
        const profile = tech.technicianProfile;
        const currentJob = tech.technicianWOs?.[0];

        // Use user's location if available, otherwise use profile location
        const latitude = tech.latitude || profile.latitude || null;
        const longitude = tech.longitude || profile.longitude || null;

        // Skip if no location data
        if (!latitude || !longitude) {
          return null;
        }

        // Logic: Display technician if:
        // 1. They have set mobile app to online (profile.status === "ACTIVE")
        // 2. OR they have an active order (regardless of mobile app status)
        const hasActiveJob = currentJob !== null && currentJob !== undefined;
        const isMobileAppOnline = profile.status === "ACTIVE";

        // Skip if technician is not online AND doesn't have active job
        if (!isMobileAppOnline && !hasActiveJob) {
          return null;
        }

        // Determine online status for display
        const lastActivity = currentJob?.updatedAt || tech.updatedAt;
        const minutesSinceActivity = (now - new Date(lastActivity)) / 1000 / 60;
        const isRecentlyActive =
          minutesSinceActivity < ONLINE_THRESHOLD_MINUTES;

        const isOnline = isMobileAppOnline && isRecentlyActive;

        return {
          id: tech.id,
          name: tech.name,
          phone: tech.phone,
          email: tech.email,
          photoUrl: profile.photoUrl,
          location: {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
          },
          status: {
            isOnline,
            profileStatus: profile.status, // ACTIVE, INACTIVE, ON_BREAK
            lastActivity: lastActivity,
            minutesSinceActivity: Math.round(minutesSinceActivity),
          },
          type: profile.type, // FREELANCER or INTERNAL
          specialization: profile.specialization,
          currentJob: currentJob
            ? {
                workOrderId: currentJob.id,
                serviceRequestId: currentJob.serviceRequestId,
                status: currentJob.status,
                priority: currentJob.priority,
                serviceName: currentJob.serviceRequest?.subservice?.name,
                customerLocation: {
                  address: currentJob.serviceRequest?.address,
                  latitude: currentJob.serviceRequest?.latitude,
                  longitude: currentJob.serviceRequest?.longitude,
                },
                scheduledDate: currentJob.scheduledDate,
              }
            : null,
          // Additional info for map markers
          rating: profile.rating || 0,
          completedJobs: profile.totalJobsCompleted || 0,
        };
      })
      .filter((tech) => tech !== null); // Remove technicians without location

    // Summary statistics
    const summary = {
      total: technicianLocations.length,
      online: technicianLocations.filter((t) => t.status.isOnline).length,
      offline: technicianLocations.filter((t) => !t.status.isOnline).length,
      withActiveJobs: technicianLocations.filter((t) => t.currentJob).length,
      available: technicianLocations.filter(
        (t) => t.status.isOnline && !t.currentJob
      ).length,
    };

    return res.json({
      success: true,
      summary,
      technicians: technicianLocations,
      mapConfig: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
        defaultCenter: {
          latitude: 23.8103, // Dhaka, Bangladesh
          longitude: 90.4125,
        },
        defaultZoom: 12,
      },
    });
  } catch (err) {
    console.error("Error fetching technician locations:", err);
    next(err);
  }
};

// Get top 5 technicians by rating
export const getTop5Technicians = async (req, res, next) => {
  try {
    const { timeframe = "30days", startDate, endDate } = req.query;

    let dateFilter = {};
    if (timeframe === "7days") {
      dateFilter = {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      };
    } else if (timeframe === "30days") {
      dateFilter = {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      };
    } else if (timeframe === "custom" && startDate && endDate) {
      dateFilter = {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      };
    }

    // Get all technicians with their reviews
    const technicians = await prisma.user.findMany({
      where: {
        role: { in: ["TECH_INTERNAL", "TECH_FREELANCER"] },
        isBlocked: false,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        technicianProfile: {
          select: {
            type: true,
            specialization: true,
          },
        },
        technicianReviews: {
          where: dateFilter,
          select: {
            rating: true,
            createdAt: true,
          },
        },
        technicianWOs: {
          where: {
            status: "PAID_VERIFIED",
            ...dateFilter,
          },
          select: {
            id: true,
            payments: {
              select: { amount: true },
            },
          },
        },
      },
    });

    // Calculate stats for each technician
    const techWithStats = technicians.map((tech) => {
      const reviews = tech.technicianReviews;
      const avgRating =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;

      const totalRevenue = tech.technicianWOs.reduce((sum, wo) => {
        const woRevenue = wo.payments.reduce((s, p) => s + p.amount, 0);
        return sum + woRevenue;
      }, 0);

      return {
        id: tech.id,
        name: tech.name,
        phone: tech.phone,
        role: tech.role,
        type: tech.technicianProfile?.type,
        specialization: tech.technicianProfile?.specialization,
        averageRating: parseFloat(avgRating.toFixed(2)),
        totalReviews: reviews.length,
        completedJobs: tech.technicianWOs.length,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      };
    });

    // Sort by rating first, then by completed jobs, then by revenue
    const top5 = techWithStats
      .sort((a, b) => {
        if (b.averageRating !== a.averageRating) {
          return b.averageRating - a.averageRating;
        }
        if (b.completedJobs !== a.completedJobs) {
          return b.completedJobs - a.completedJobs;
        }
        return b.totalRevenue - a.totalRevenue;
      })
      .slice(0, 5);

    return res.json({
      timeframe,
      startDate: dateFilter.createdAt?.gte || null,
      endDate: dateFilter.createdAt?.lte || null,
      top5Technicians: top5,
    });
  } catch (err) {
    next(err);
  }
};

// Create weekly payout batch (Admin only)
export const createWeeklyPayoutBatch = async (req, res, next) => {
  try {
    const adminId = req.user.id;

    // Get all technicians with BOOKED commissions
    const techsWithCommissions = await prisma.commission.groupBy({
      by: ["technicianId"],
      where: {
        status: "BOOKED",
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    if (techsWithCommissions.length === 0) {
      return res
        .status(400)
        .json({ message: "No pending commissions to payout" });
    }

    const payouts = [];

    // Create payout for each technician
    for (const tech of techsWithCommissions) {
      const commissions = await prisma.commission.findMany({
        where: {
          technicianId: tech.technicianId,
          status: "BOOKED",
        },
      });

      const payout = await prisma.payout.create({
        data: {
          technicianId: tech.technicianId,
          totalAmount: tech._sum.amount,
          type: "WEEKLY",
          status: "PROCESSED",
          processedAt: new Date(),
          createdById: adminId,
        },
      });

      // Update commissions to PAID_OUT status
      await prisma.commission.updateMany({
        where: {
          id: { in: commissions.map((c) => c.id) },
        },
        data: {
          status: "PAID_OUT",
          payoutId: payout.id,
        },
      });

      // Deduct from wallet
      await prisma.wallet.update({
        where: { technicianId: tech.technicianId },
        data: {
          balance: {
            decrement: tech._sum.amount,
          },
        },
      });

      // Log wallet transaction
      const wallet = await prisma.wallet.findUnique({
        where: { technicianId: tech.technicianId },
      });

      await prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          technicianId: tech.technicianId,
          type: "PAYOUT",
          sourceType: "PAYOUT",
          sourceId: payout.id,
          amount: -tech._sum.amount,
          description: "Weekly payout batch",
        },
      });

      payouts.push({
        technicianId: tech.technicianId,
        payoutId: payout.id,
        amount: tech._sum.amount,
        commissionsCount: tech._count.id,
      });
    }

    // Update system config next payout date (add 7 days)
    await prisma.systemConfig.updateMany({
      data: {
        nextPayoutDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return res.json({
      message: "Weekly payout batch created successfully",
      totalPayouts: payouts.length,
      totalAmount: payouts.reduce((sum, p) => sum + p.amount, 0),
      payouts,
    });
  } catch (err) {
    next(err);
  }
};

// Get all IN_PROGRESS work orders (Admin only)
export const getInProgressWorkOrders = async (req, res, next) => {
  try {
    const workOrders = await prisma.workOrder.findMany({
      where: {
        status: "IN_PROGRESS",
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        technician: {
          select: {
            id: true,
            name: true,
            phone: true,
            locationStatus: true,
            technicianProfile: {
              select: {
                type: true,
                specialization: true,
                status: true,
              },
            },
          },
        },
        category: true,
        subservice: {
          select: {
            id: true,
            name: true,
            baseRate: true,
          },
        },
        service: true,
      },
      orderBy: {
        startedAt: "desc",
      },
    });

    return res.json({
      total: workOrders.length,
      workOrders,
    });
  } catch (err) {
    next(err);
  }
};

// Get technician status summary (Busy/Active/Blocked) - Admin only
export const getTechnicianStatusSummary = async (req, res, next) => {
  try {
    const technicians = await prisma.user.findMany({
      where: {
        role: { in: ["TECH_INTERNAL", "TECH_FREELANCER"] },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        isBlocked: true,
        blockedReason: true,
        blockedAt: true,
        locationStatus: true,
        locationUpdatedAt: true,
        technicianProfile: {
          select: {
            type: true,
            status: true,
            specialization: true,
          },
        },
        technicianWOs: {
          where: {
            status: "IN_PROGRESS",
          },
          select: {
            id: true,
            woNumber: true,
            startedAt: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Categorize technicians
    const summary = {
      total: technicians.length,
      blocked: technicians.filter((t) => t.isBlocked).length,
      active: technicians.filter(
        (t) => !t.isBlocked && t.technicianProfile?.status === "ACTIVE"
      ).length,
      inactive: technicians.filter(
        (t) => !t.isBlocked && t.technicianProfile?.status === "INACTIVE"
      ).length,
      busy: technicians.filter((t) => t.locationStatus === "BUSY").length,
      online: technicians.filter((t) => t.locationStatus === "ONLINE").length,
      offline: technicians.filter(
        (t) => t.locationStatus === "OFFLINE" || !t.locationStatus
      ).length,
      technicians: technicians.map((t) => ({
        id: t.id,
        name: t.name,
        phone: t.phone,
        role: t.role,
        type: t.technicianProfile?.type,
        specialization: t.technicianProfile?.specialization,
        profileStatus: t.technicianProfile?.status,
        locationStatus: t.locationStatus || "OFFLINE",
        isBlocked: t.isBlocked,
        blockedReason: t.blockedReason,
        blockedAt: t.blockedAt,
        activeWorkOrders: t.technicianWOs.length,
        currentWO: t.technicianWOs[0] || null,
        lastLocationUpdate: t.locationUpdatedAt,
      })),
    };

    return res.json(summary);
  } catch (err) {
    next(err);
  }
};

// Get work order audit trail - Full history (Admin only)
export const getWorkOrderAuditTrail = async (req, res, next) => {
  try {
    const woId = Number(req.params.woId);

    // Get work order details
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: woId },
      include: {
        customer: {
          select: { id: true, name: true, phone: true },
        },
        technician: {
          select: { id: true, name: true, phone: true },
        },
        dispatcher: {
          select: { id: true, name: true, phone: true },
        },
        category: true,
        subservice: {
          select: {
            id: true,
            name: true,
            baseRate: true,
          },
        },
        service: true,
        payments: {
          include: {
            verifiedBy: {
              select: { id: true, name: true, phone: true },
            },
          },
        },
        commissions: true,
        review: true,
      },
    });

    if (!workOrder) {
      return res.status(404).json({ message: "Work order not found" });
    }

    // Get audit logs related to this work order
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { entityType: "WORK_ORDER", entityId: woId },
          {
            entityType: "PAYMENT",
            entityId: { in: workOrder.payments.map((p) => p.id) },
          },
          {
            entityType: "COMMISSION",
            entityId: { in: workOrder.commissions.map((c) => c.id) },
          },
        ],
      },
      include: {
        user: {
          select: { id: true, name: true, phone: true, role: true },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Build timeline of events
    const timeline = [
      {
        event: "CREATED",
        timestamp: workOrder.createdAt,
        status: "UNASSIGNED",
        actor: workOrder.dispatcher,
        description: `Work order ${workOrder.woNumber} created`,
      },
    ];

    if (workOrder.dispatcherId) {
      timeline.push({
        event: "DISPATCHED",
        timestamp: workOrder.scheduledAt || workOrder.createdAt,
        status: "ASSIGNED",
        actor: workOrder.dispatcher,
        description: `Dispatched to ${
          workOrder.technician?.name || "technician"
        }`,
      });
    }

    if (workOrder.acceptedAt) {
      timeline.push({
        event: "ACCEPTED",
        timestamp: workOrder.acceptedAt,
        status: "ACCEPTED",
        actor: workOrder.technician,
        description: `Accepted by ${workOrder.technician?.name}`,
      });
    }

    if (workOrder.startedAt) {
      timeline.push({
        event: "STARTED",
        timestamp: workOrder.startedAt,
        status: "IN_PROGRESS",
        actor: workOrder.technician,
        description: `Work started by ${workOrder.technician?.name}`,
      });
    }

    if (workOrder.completedAt) {
      timeline.push({
        event: "COMPLETED",
        timestamp: workOrder.completedAt,
        status: "COMPLETED_PENDING_PAYMENT",
        actor: workOrder.technician,
        description: `Work completed by ${workOrder.technician?.name}`,
      });
    }

    workOrder.payments.forEach((payment) => {
      if (payment.createdAt) {
        timeline.push({
          event: "PAYMENT_UPLOADED",
          timestamp: payment.createdAt,
          status: payment.status,
          actor: workOrder.technician,
          description: `Payment proof uploaded - ${payment.method} ${payment.amount} KES`,
          paymentId: payment.id,
        });
      }

      if (payment.verifiedAt && payment.status === "VERIFIED") {
        timeline.push({
          event: "PAYMENT_VERIFIED",
          timestamp: payment.verifiedAt,
          status: "PAID_VERIFIED",
          actor: payment.verifiedBy,
          description: `Payment verified by ${payment.verifiedBy?.name}`,
          paymentId: payment.id,
        });
      }

      if (payment.verifiedAt && payment.status === "REJECTED") {
        timeline.push({
          event: "PAYMENT_REJECTED",
          timestamp: payment.verifiedAt,
          status: payment.status,
          actor: payment.verifiedBy,
          description: `Payment rejected: ${payment.rejectedReason}`,
          paymentId: payment.id,
        });
      }
    });

    if (workOrder.cancelledAt) {
      timeline.push({
        event: "CANCELLED",
        timestamp: workOrder.cancelledAt,
        status: "CANCELLED",
        description: `Cancelled: ${workOrder.cancelReason}`,
      });
    }

    // Sort timeline by timestamp
    timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    return res.json({
      workOrder: {
        id: workOrder.id,
        woNumber: workOrder.woNumber,
        status: workOrder.status,
        customer: workOrder.customer,
        technician: workOrder.technician,
        dispatcher: workOrder.dispatcher,
        category: workOrder.category,
        address: workOrder.address,
        createdAt: workOrder.createdAt,
        completedAt: workOrder.completedAt,
      },
      timeline,
      auditLogs,
      payments: workOrder.payments,
      commissions: workOrder.commissions,
      review: workOrder.review,
    });
  } catch (err) {
    next(err);
  }
};

// Get technician count by specialization/type - Admin only
export const getTechnicianStats = async (req, res, next) => {
  try {
    const technicians = await prisma.user.findMany({
      where: {
        role: { in: ["TECH_INTERNAL", "TECH_FREELANCER"] },
        isBlocked: false,
      },
      include: {
        technicianProfile: {
          select: {
            type: true,
            specialization: true,
            status: true,
          },
        },
      },
    });

    // Count by specialization
    const specializationCounts = {};
    const typeCounts = { INTERNAL: 0, FREELANCER: 0 };
    const statusCounts = { ACTIVE: 0, INACTIVE: 0 };

    technicians.forEach((tech) => {
      const profile = tech.technicianProfile;

      if (profile) {
        // Count by specialization
        const spec = profile.specialization || "GENERAL";
        specializationCounts[spec] = (specializationCounts[spec] || 0) + 1;

        // Count by type
        if (profile.type) {
          typeCounts[profile.type] = (typeCounts[profile.type] || 0) + 1;
        }

        // Count by status
        if (profile.status) {
          statusCounts[profile.status] =
            (statusCounts[profile.status] || 0) + 1;
        }
      }
    });

    return res.json({
      total: technicians.length,
      bySpecialization: specializationCounts,
      byType: typeCounts,
      byStatus: statusCounts,
      details: Object.keys(specializationCounts).map((spec) => ({
        specialization: spec,
        count: specializationCounts[spec],
        technicians: technicians
          .filter(
            (t) => (t.technicianProfile?.specialization || "GENERAL") === spec
          )
          .map((t) => ({
            id: t.id,
            name: t.name,
            phone: t.phone,
            type: t.technicianProfile?.type,
            status: t.technicianProfile?.status,
          })),
      })),
    });
  } catch (err) {
    next(err);
  }
};
