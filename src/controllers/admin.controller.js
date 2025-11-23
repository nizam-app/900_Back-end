// src/controllers/admin.controller.js
import { prisma } from '../prisma.js';
import * as adminService from '../services/admin.service.js';

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

export const createUser = async (req, res, next) => {
  try {
    const { name, phone, email, password, role, technicianProfile } = req.body;

    if (!phone || !password || !role) {
      return res.status(400).json({ message: 'Phone, password, and role are required' });
    }

    const user = await adminService.createUserWithProfile(req.body, req.user.id);
    return res.status(201).json(user);
  } catch (err) {
    if (err.message === 'Phone already exists') {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    const { name, email, role } = req.body;

    const user = await adminService.updateUserById(userId, { name, email, role }, req.user.id);
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
      return res.status(400).json({ message: 'Blocked reason is required when blocking a technician' });
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
    if (userRole === 'DISPATCHER') {
      const restrictedFields = ['photoUrl', 'idCardUrl', 'residencePermitUrl', 'degreesUrl', 'baseSalary'];
      const hasRestrictedField = restrictedFields.some(field => req.body[field] !== undefined);
      const hasUploadedFiles = req.files && Object.keys(req.files).length > 0;
      
      if (hasRestrictedField || hasUploadedFiles) {
        return res.status(403).json({ 
          message: 'Dispatcher cannot update profile images, documents, or salary. Admin access required.' 
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
          req.files.degreesUrl.map(file => `/uploads/${file.filename}`)
        );
      }
    }
    
    const profile = await adminService.updateTechProfile(userId, updateData, req.user.id);
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

export const getTechnicianLocations = async (req, res, next) => {
  try {
    const { includeLocationName, centerLat, centerLng } = req.query;
    
    const technicians = await prisma.user.findMany({
      where: {
        role: { in: ['TECH_INTERNAL', 'TECH_FREELANCER'] },
        isBlocked: false,
        lastLatitude: { not: null },
        lastLongitude: { not: null },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        lastLatitude: true,
        lastLongitude: true,
        locationStatus: true,
        locationUpdatedAt: true,
        technicianProfile: {
          select: {
            type: true,
            status: true
          }
        }
      },
    });

    // Enhanced response with location names and distances
    let enhancedTechnicians = technicians;
    
    if (includeLocationName === 'true' || (centerLat && centerLng)) {
      const { getLocationName, calculateDistance } = await import('../utils/location.js');
      
      enhancedTechnicians = await Promise.all(
        technicians.map(async (tech) => {
          let locationName = null;
          let distanceFromCenter = null;
          
          // Get location name if requested
          if (includeLocationName === 'true') {
            try {
              locationName = await getLocationName(tech.lastLatitude, tech.lastLongitude);
            } catch (error) {
              console.error(`Error getting location for technician ${tech.id}:`, error);
              locationName = 'Location unavailable';
            }
          }
          
          // Calculate distance from center point if provided
          if (centerLat && centerLng) {
            distanceFromCenter = calculateDistance(
              Number(centerLat),
              Number(centerLng),
              tech.lastLatitude,
              tech.lastLongitude
            );
          }
          
          return {
            ...tech,
            locationName,
            distanceFromCenter,
            coordinates: `${tech.lastLatitude}, ${tech.lastLongitude}`,
            isOnline: tech.locationStatus === 'ONLINE',
            lastSeenMinutesAgo: tech.locationUpdatedAt ? 
              Math.floor((new Date() - new Date(tech.locationUpdatedAt)) / 60000) : null
          };
        })
      );
      
      // Sort by distance if center point provided
      if (centerLat && centerLng) {
        enhancedTechnicians.sort((a, b) => a.distanceFromCenter - b.distanceFromCenter);
      }
    }

    return res.json({
      count: enhancedTechnicians.length,
      onlineCount: enhancedTechnicians.filter(t => t.locationStatus === 'ONLINE').length,
      technicians: enhancedTechnicians
    });
  } catch (err) {
    next(err);
  }
};

// Get top 5 technicians by rating
export const getTop5Technicians = async (req, res, next) => {
  try {
    const { timeframe = '30days', startDate, endDate } = req.query;

    let dateFilter = {};
    if (timeframe === '7days') {
      dateFilter = {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      };
    } else if (timeframe === '30days') {
      dateFilter = {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      };
    } else if (timeframe === 'custom' && startDate && endDate) {
      dateFilter = {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      };
    }

    // Get all technicians with their reviews
    const technicians = await prisma.user.findMany({
      where: {
        role: { in: ['TECH_INTERNAL', 'TECH_FREELANCER'] },
        isBlocked: false
      },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        technicianProfile: {
          select: {
            type: true,
            specialization: true
          }
        },
        technicianReviews: {
          where: dateFilter,
          select: {
            rating: true,
            createdAt: true
          }
        },
        technicianWOs: {
          where: {
            status: 'PAID_VERIFIED',
            ...dateFilter
          },
          select: {
            id: true,
            payments: {
              select: { amount: true }
            }
          }
        }
      }
    });

    // Calculate stats for each technician
    const techWithStats = technicians.map(tech => {
      const reviews = tech.technicianReviews;
      const avgRating = reviews.length > 0
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
        totalRevenue: parseFloat(totalRevenue.toFixed(2))
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
      top5Technicians: top5
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
      by: ['technicianId'],
      where: {
        status: 'BOOKED'
      },
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    });

    if (techsWithCommissions.length === 0) {
      return res.status(400).json({ message: 'No pending commissions to payout' });
    }

    const payouts = [];

    // Create payout for each technician
    for (const tech of techsWithCommissions) {
      const commissions = await prisma.commission.findMany({
        where: {
          technicianId: tech.technicianId,
          status: 'BOOKED'
        }
      });

      const payout = await prisma.payout.create({
        data: {
          technicianId: tech.technicianId,
          totalAmount: tech._sum.amount,
          type: 'WEEKLY',
          status: 'PROCESSED',
          processedAt: new Date(),
          createdById: adminId
        }
      });

      // Update commissions to PAID_OUT status
      await prisma.commission.updateMany({
        where: {
          id: { in: commissions.map(c => c.id) }
        },
        data: {
          status: 'PAID_OUT',
          payoutId: payout.id
        }
      });

      // Deduct from wallet
      await prisma.wallet.update({
        where: { technicianId: tech.technicianId },
        data: {
          balance: {
            decrement: tech._sum.amount
          }
        }
      });

      // Log wallet transaction
      const wallet = await prisma.wallet.findUnique({
        where: { technicianId: tech.technicianId }
      });

      await prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          technicianId: tech.technicianId,
          type: 'PAYOUT',
          sourceType: 'PAYOUT',
          sourceId: payout.id,
          amount: -tech._sum.amount,
          description: 'Weekly payout batch'
        }
      });

      payouts.push({
        technicianId: tech.technicianId,
        payoutId: payout.id,
        amount: tech._sum.amount,
        commissionsCount: tech._count.id
      });
    }

    // Update system config next payout date (add 7 days)
    await prisma.systemConfig.updateMany({
      data: {
        nextPayoutDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    return res.json({
      message: 'Weekly payout batch created successfully',
      totalPayouts: payouts.length,
      totalAmount: payouts.reduce((sum, p) => sum + p.amount, 0),
      payouts
    });
  } catch (err) {
    next(err);
  }
};
