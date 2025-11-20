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
