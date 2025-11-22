// src/controllers/admin.controller.js
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
    const profile = await adminService.updateTechProfile(userId, req.body, req.user.id);
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
