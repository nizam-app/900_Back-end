// src/services/location.service.js
import { prisma } from '../prisma.js';

// ✅ Update technician location
export const updateTechnicianLocation = async (technicianId, locationData) => {
  const { latitude, longitude, status } = locationData;

  const user = await prisma.user.update({
    where: { id: technicianId },
    data: {
      lastLatitude: Number(latitude),
      lastLongitude: Number(longitude),
      locationStatus: status || 'ONLINE',
      locationUpdatedAt: new Date(),
    },
  });

  return {
    message: 'Location updated successfully',
    location: {
      latitude: user.lastLatitude,
      longitude: user.lastLongitude,
      status: user.locationStatus,
    },
  };
};

// ✅ Get nearby technicians
export const findNearbyTechnicians = async (latitude, longitude, radius) => {
  // Simple query - in production, use PostGIS or similar for proper geo queries
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
      technicianProfile: true,
    },
  });

  // Filter by radius if provided (simple distance calculation)
  let filtered = technicians;
  if (radius) {
    const rad = Number(radius);
    filtered = technicians.filter((tech) => {
      const distance = calculateDistance(
        Number(latitude),
        Number(longitude),
        tech.lastLatitude,
        tech.lastLongitude
      );
      return distance <= rad;
    });
  }

  return filtered;
};

// Simple distance calculation (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return (degrees * Math.PI) / 180;
}
