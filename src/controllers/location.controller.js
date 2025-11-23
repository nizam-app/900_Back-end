// src/controllers/location.controller.js
import { prisma } from '../prisma.js';

export const updateLocation = async (req, res, next) => {
  try {
    const technicianId = req.user.id;
    const { latitude, longitude, status } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    await prisma.user.update({
      where: { id: technicianId },
      data: {
        lastLatitude: Number(latitude),
        lastLongitude: Number(longitude),
        locationStatus: status || 'ONLINE',
        locationUpdatedAt: new Date(),
      },
    });

    return res.json({ message: 'Location updated successfully' });
  } catch (err) {
    next(err); 
  }
};

export const getNearbyTechnicians = async (req, res, next) => {
  try {
    const { latitude, longitude, radius } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const lat = Number(latitude);
    const lng = Number(longitude);
    const rad = radius ? Number(radius) : 10; // Default 10km

    const technicians = await prisma.user.findMany({
      where: {
        role: { in: ['TECH_INTERNAL', 'TECH_FREELANCER'] },
        isBlocked: false,
        locationStatus: { in: ['ONLINE', 'BUSY'] },
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
            status: true,
          },
        },
      },
    });

    // Calculate distance using Haversine formula
    const nearby = technicians
      .map((tech) => {
        const techLat = tech.lastLatitude;
        const techLng = tech.lastLongitude;

        const R = 6371; // Earth's radius in km
        const dLat = ((techLat - lat) * Math.PI) / 180;
        const dLon = ((techLng - lng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) + 
          Math.cos((lat * Math.PI) / 180) *
            Math.cos((techLat * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return {
          ...tech,
          distance: parseFloat(distance.toFixed(2)),
        };
      })
      .filter((tech) => tech.distance <= rad)
      .sort((a, b) => a.distance - b.distance);

    return res.json(nearby);
  } catch (err) {
    next(err);
  }
};

export const getTechnicianLocation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const technician = await prisma.user.findUnique({
      where: { id: Number(id) },
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
            status: true,
          },
        },
      },
    });

    if (!technician) {
      return res.status(404).json({ message: 'Technician not found' });
    }

    if (!['TECH_INTERNAL', 'TECH_FREELANCER'].includes(technician.role)) {
      return res.status(400).json({ message: 'User is not a technician' });
    }

    if (!technician.lastLatitude || !technician.lastLongitude) {
      return res.status(404).json({ 
        message: 'Location not available',
        technician: {
          id: technician.id,
          name: technician.name,
          locationStatus: 'OFFLINE'
        }
      });
    }

    return res.json({
      id: technician.id,
      name: technician.name,
      phone: technician.phone,
      role: technician.role,
      latitude: technician.lastLatitude,
      longitude: technician.lastLongitude,
      status: technician.locationStatus || 'ONLINE',
      lastUpdated: technician.locationUpdatedAt,
      technicianProfile: technician.technicianProfile
    });
  } catch (err) {
    next(err);
  }
};

export const getLocationHistory = async (req, res, next) => {
  try {
    const { technicianId } = req.params;
    const { startDate, endDate, limit = 100 } = req.query;
    
    if (!technicianId) {
      return res.status(400).json({ message: 'Technician ID is required' });
    }

    const where = {
      technicianId: Number(technicianId)
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Get check-in history (from work orders)
    const checkins = await prisma.technicianCheckin.findMany({
      where,
      include: {
        workOrder: {
          select: {
            id: true,
            woNumber: true,
            address: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit)
    });

    return res.json({
      count: checkins.length,
      history: checkins
    });
  } catch (err) {
    next(err);
  }
};

export const getETA = async (req, res, next) => {
  try {
    const { technicianId, destinationLat, destinationLng } = req.query;

    if (!technicianId || !destinationLat || !destinationLng) {
      return res.status(400).json({ 
        message: 'technicianId, destinationLat, and destinationLng are required' 
      });
    }

    const technician = await prisma.user.findUnique({
      where: { id: Number(technicianId) },
      select: {
        id: true,
        name: true,
        lastLatitude: true,
        lastLongitude: true,
        locationStatus: true,
        locationUpdatedAt: true
      }
    });

    if (!technician) {
      return res.status(404).json({ message: 'Technician not found' });
    }

    if (!technician.lastLatitude || !technician.lastLongitude) {
      return res.status(404).json({ 
        message: 'Technician location not available' 
      });
    }

    // Calculate distance using Haversine formula
    const lat1 = technician.lastLatitude;
    const lng1 = technician.lastLongitude;
    const lat2 = Number(destinationLat);
    const lng2 = Number(destinationLng);

    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km

    // Estimate time (assuming average speed of 30 km/h in city traffic)
    const averageSpeed = 30; // km/h
    const estimatedTimeHours = distance / averageSpeed;
    const estimatedTimeMinutes = Math.round(estimatedTimeHours * 60);

    return res.json({
      technician: {
        id: technician.id,
        name: technician.name,
        currentLocation: {
          latitude: technician.lastLatitude,
          longitude: technician.lastLongitude
        },
        locationStatus: technician.locationStatus,
        lastUpdated: technician.locationUpdatedAt
      },
      destination: {
        latitude: lat2,
        longitude: lng2
      },
      distance: parseFloat(distance.toFixed(2)), // km
      estimatedTime: {
        minutes: estimatedTimeMinutes,
        formatted: estimatedTimeMinutes < 60 
          ? `${estimatedTimeMinutes} minutes`
          : `${Math.floor(estimatedTimeMinutes / 60)} hours ${estimatedTimeMinutes % 60} minutes`
      }
    });
  } catch (err) {
    next(err);
  }
};
