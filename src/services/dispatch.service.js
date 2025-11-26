/** @format */

// src/services/dispatch.service.js
import { prisma } from "../prisma.js";

/**
 * Get Dispatch Overview Statistics
 * Returns: Total WOs, Assigned WOs, In Progress WOs, Service Requests count
 */
export const getDispatchOverview = async () => {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 7);

  const [
    totalWorkOrders,
    totalWorkOrdersThisWeek,
    assignedWorkOrders,
    inProgressWorkOrders,
    serviceRequests,
    unconvertedSRs,
  ] = await Promise.all([
    // Total Work Orders (all time)
    prisma.workOrder.count(),

    // Work Orders created this week
    prisma.workOrder.count({
      where: {
        createdAt: { gte: startOfWeek },
      },
    }),

    // Assigned Work Orders (waiting for technician to start)
    prisma.workOrder.count({
      where: {
        status: { in: ["ASSIGNED", "ACCEPTED"] },
      },
    }),

    // In Progress Work Orders (active on site)
    prisma.workOrder.count({
      where: {
        status: "IN_PROGRESS",
      },
    }),

    // Total Service Requests
    prisma.serviceRequest.count(),

    // Unconverted Service Requests (not yet converted to WO)
    prisma.serviceRequest.count({
      where: {
        status: { in: ["NEW", "OPEN"] },
      },
    }),
  ]);

  return {
    totalWorkOrders,
    totalWorkOrdersThisWeek,
    assignedWorkOrders,
    inProgressWorkOrders,
    serviceRequests,
    unconvertedSRs,
  };
};

/**
 * Get Technician Status Summary
 * Returns: Active, Busy, and Blocked technicians count
 */
export const getTechnicianStatus = async () => {
  const [
    activeTechnicians,
    busyTechnicians,
    blockedTechnicians,
    allTechnicians,
  ] = await Promise.all([
    // Active Technicians (available for assignment)
    prisma.user.count({
      where: {
        role: { in: ["TECH_INTERNAL", "TECH_FREELANCER"] },
        isBlocked: false,
        locationStatus: "ONLINE",
      },
    }),

    // Busy Technicians (currently on job)
    prisma.user.count({
      where: {
        role: { in: ["TECH_INTERNAL", "TECH_FREELANCER"] },
        isBlocked: false,
        locationStatus: "BUSY",
      },
    }),

    // Blocked Technicians (unavailable)
    prisma.user.count({
      where: {
        role: { in: ["TECH_INTERNAL", "TECH_FREELANCER"] },
        isBlocked: true,
      },
    }),

    // All Technicians
    prisma.user.count({
      where: {
        role: { in: ["TECH_INTERNAL", "TECH_FREELANCER"] },
      },
    }),
  ]);

  return {
    activeTechnicians,
    busyTechnicians,
    blockedTechnicians,
    allTechnicians,
  };
};

/**
 * Get Recent Work Orders
 * Returns: Latest work orders with full details
 */
export const getRecentWorkOrders = async (limit = 10) => {
  const workOrders = await prisma.workOrder.findMany({
    take: limit,
    orderBy: {
      createdAt: "desc",
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
        },
      },
      dispatcher: {
        select: {
          id: true,
          name: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      subservice: {
        select: {
          id: true,
          name: true,
        },
      },
      service: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return workOrders;
};

/**
 * Get Technician Locations for Map View
 * Returns: All active technicians with their GPS coordinates
 */
export const getTechnicianLocations = async () => {
  const technicians = await prisma.user.findMany({
    where: {
      role: { in: ["TECH_INTERNAL", "TECH_FREELANCER"] },
      isBlocked: false,
      lastLatitude: { not: null },
      lastLongitude: { not: null },
    },
    select: {
      id: true,
      name: true,
      phone: true,
      lastLatitude: true,
      lastLongitude: true,
      locationStatus: true,
      locationUpdatedAt: true,
      technicianProfile: {
        select: {
          type: true,
          specialization: true,
          status: true,
        },
      },
    },
  });

  return technicians;
};
