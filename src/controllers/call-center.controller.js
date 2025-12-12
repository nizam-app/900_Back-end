/** @format */

import { prisma } from "../prisma.js";

/**
 * Get Call Center Dashboard Stats
 * Returns overview statistics for call center agent dashboard
 */
export const getCallCenterStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get total service requests count
    const totalSRs = await prisma.serviceRequest.count();

    // Get pending SRs (OPEN status)
    const pendingSRs = await prisma.serviceRequest.count({
      where: {
        status: "OPEN",
      },
    });

    // Get in-progress SRs (ASSIGNED or IN_PROGRESS status)
    const inProgressSRs = await prisma.serviceRequest.count({
      where: {
        status: {
          in: ["ASSIGNED", "IN_PROGRESS"],
        },
      },
    });

    // Get resolved SRs (COMPLETED or CLOSED status)
    const resolvedSRs = await prisma.serviceRequest.count({
      where: {
        status: {
          in: ["COMPLETED", "CLOSED"],
        },
      },
    });

    // Get SRs opened today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const openSRsToday = await prisma.serviceRequest.count({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Calculate average time to dispatch (from SR creation to first WO creation)
    const recentSRsWithWO = await prisma.serviceRequest.findMany({
      where: {
        workOrders: {
          some: {},
        },
      },
      include: {
        workOrders: {
          orderBy: {
            createdAt: "asc",
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50, // Calculate from last 50 SRs with work orders
    });

    let avgTimeToDispatch = 0;
    if (recentSRsWithWO.length > 0) {
      const totalDispatchTime = recentSRsWithWO.reduce((sum, sr) => {
        if (sr.workOrders[0]) {
          const dispatchTime =
            (sr.workOrders[0].createdAt - sr.createdAt) / 1000 / 60 / 60; // hours
          return sum + dispatchTime;
        }
        return sum;
      }, 0);

      avgTimeToDispatch = totalDispatchTime / recentSRsWithWO.length;
    }

    return res.status(200).json({
      success: true,
      stats: {
        totalServiceRequests: {
          count: totalSRs,
          label: "All time SRs",
        },
        pending: {
          count: pendingSRs,
          label: "Awaiting action",
        },
        inProgress: {
          count: inProgressSRs,
          label: "Being worked on",
        },
        resolved: {
          count: resolvedSRs,
          label: "Completed SRs",
        },
        openSRsToday: {
          count: openSRsToday,
          label: "Opened today",
        },
        avgTimeToDispatch: {
          hours: parseFloat(avgTimeToDispatch.toFixed(1)),
          label: `${parseFloat(avgTimeToDispatch.toFixed(1))} hrs`,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching call center stats:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch call center stats",
      error: error.message,
    });
  }
};
