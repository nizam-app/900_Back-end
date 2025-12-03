/** @format */

import prisma from "../prisma.js";

/**
 * Get technician dashboard statistics
 */
export const getTechnicianDashboard = async (technicianId) => {
  const now = new Date();

  // Calculate date ranges
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  // Get all statistics in parallel
  const [
    jobsToday,
    activeJobs,
    completedThisMonth,
    inProgress,
    readyToStart,
    thisWeekCommissions,
    totalEarned,
  ] = await Promise.all([
    // Jobs Today
    prisma.workOrder.count({
      where: {
        technicianId,
        scheduledAt: {
          gte: startOfDay,
        },
      },
    }),

    // Active Jobs (Assigned + In Progress)
    prisma.workOrder.count({
      where: {
        technicianId,
        status: {
          in: ["ASSIGNED", "IN_PROGRESS"],
        },
      },
    }),

    // Completed This Month
    prisma.workOrder.count({
      where: {
        technicianId,
        status: "PAID_VERIFIED",
        completedAt: {
          gte: startOfMonth,
        },
      },
    }),

    // In Progress
    prisma.workOrder.count({
      where: {
        technicianId,
        status: "IN_PROGRESS",
      },
    }),

    // Ready to Start
    prisma.workOrder.count({
      where: {
        technicianId,
        status: "ASSIGNED",
      },
    }),

    // This Week's Bonus/Commission
    prisma.commission.aggregate({
      where: {
        technicianId,
        createdAt: {
          gte: startOfWeek,
        },
        status: {
          in: ["BOOKED", "PAID_OUT"],
        },
      },
      _sum: {
        amount: true,
      },
    }),

    // Total Earned (all time)
    prisma.commission.aggregate({
      where: {
        technicianId,
        status: {
          in: ["BOOKED", "PAID_OUT"],
        },
      },
      _sum: {
        amount: true,
      },
    }),
  ]);

  return {
    thisWeekBonus: thisWeekCommissions._sum.amount || 0,
    jobsToday,
    thisWeekEarned: thisWeekCommissions._sum.amount || 0,
    totalEarned: totalEarned._sum.amount || 0,
    activeJobs,
    completedThisMonth,
    inProgress,
    readyToStart,
  };
};

/**
 * Get technician's work orders by status
 */
export const getTechnicianJobs = async (technicianId, statusFilter) => {
  const where = {
    technicianId,
  };

  // Map UI status to database statuses
  if (statusFilter === "incoming") {
    // Incoming: Newly assigned jobs that haven't been accepted yet
    where.status = "ASSIGNED";
  } else if (statusFilter === "active") {
    // Active: Jobs that are accepted or in progress
    where.status = { in: ["ACCEPTED", "IN_PROGRESS"] };
  } else if (statusFilter === "done") {
    // Done: Completed jobs (all completion statuses)
    where.status = {
      in: ["COMPLETED_PENDING_PAYMENT", "PAID_VERIFIED"],
    };
  }

  const workOrders = await prisma.workOrder.findMany({
    where,
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          phone: true,
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
          baseRate: true,
        },
      },
      technician: {
        select: {
          technicianProfile: {
            select: {
              commissionRate: true,
              bonusRate: true,
            },
          },
          role: true,
        },
      },
    },
    orderBy: {
      scheduledAt: "asc",
    },
  });

  // Calculate bonus for each work order
  const jobsWithBonus = workOrders.map((wo) => {
    const basePayment = wo.service?.baseRate || 0;
    const rate =
      wo.technician?.role === "TECH_FREELANCER"
        ? wo.technician?.technicianProfile?.commissionRate || 0
        : wo.technician?.technicianProfile?.bonusRate || 0;

    const bonusAmount = basePayment * rate;

    return {
      ...wo,
      jobPayment: basePayment,
      bonusRate: rate * 100, // Convert to percentage
      yourBonus: bonusAmount,
    };
  });

  return jobsWithBonus;
};

/**
 * Get technician's active work orders
 */
export const getActiveWorkOrders = async (technicianId, status) => {
  const where = {
    technicianId,
  };

  if (status === "active") {
    where.status = { in: ["ASSIGNED", "IN_PROGRESS"] };
  } else if (status === "in_progress") {
    where.status = "IN_PROGRESS";
  } else if (status === "completed") {
    where.status = "PAID_VERIFIED";
  } else if (status === "ready") {
    where.status = "ASSIGNED";
  }

  const workOrders = await prisma.workOrder.findMany({
    where,
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
      category: {
        select: {
          name: true,
        },
      },
      subservice: {
        select: {
          name: true,
        },
      },
      service: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      scheduledAt: "asc",
    },
  });

  return workOrders;
};

/**
 * Get technician's wallet balance
 */
export const getTechnicianWallet = async (technicianId) => {
  const wallet = await prisma.wallet.findUnique({
    where: { technicianId },
    include: {
      transactions: {
        orderBy: {
          createdAt: "desc",
        },
        take: 20,
      },
    },
  });

  if (!wallet) {
    throw new Error("Wallet not found for this technician");
  }

  return wallet;
};

/**
 * Get technician's earnings summary
 */
export const getTechnicianEarnings = async (technicianId) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Get technician profile
  const technician = await prisma.user.findUnique({
    where: { id: technicianId },
    include: {
      technicianProfile: {
        select: {
          type: true,
          commissionRate: true,
          bonusRate: true,
          baseSalary: true,
        },
      },
    },
  });

  if (!technician || !technician.technicianProfile) {
    throw new Error("Technician profile not found");
  }

  const profile = technician.technicianProfile;
  const isFreelancer = technician.role === "TECH_FREELANCER";

  // Get this month's commissions/bonuses
  const thisMonthCommissions = await prisma.commission.aggregate({
    where: {
      technicianId,
      createdAt: {
        gte: startOfMonth,
      },
      status: {
        in: ["BOOKED", "PAID_OUT"],
      },
    },
    _sum: {
      amount: true,
    },
  });

  const thisMonthBonus = thisMonthCommissions._sum.amount || 0;

  // Get recent bonuses (last 10)
  const recentBonuses = await prisma.commission.findMany({
    where: {
      technicianId,
      status: {
        in: ["BOOKED", "PAID_OUT"],
      },
    },
    include: {
      workOrder: {
        include: {
          customer: {
            select: {
              name: true,
            },
          },
          category: {
            select: {
              name: true,
            },
          },
          service: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });

  // Format recent bonuses
  const formattedBonuses = recentBonuses.map((commission) => ({
    id: commission.id,
    jobName:
      commission.workOrder?.service?.name ||
      commission.workOrder?.category?.name ||
      "Service",
    customerName: commission.workOrder?.customer?.name || "Customer",
    date: commission.createdAt,
    jobPayment: commission.workOrder?.service?.baseRate || 0,
    bonus: commission.amount,
    status: commission.status,
    woNumber: commission.workOrder?.woNumber,
  }));

  // Build response
  const earnings = {
    bonusRate: {
      rate: isFreelancer ? profile.commissionRate : profile.bonusRate,
      ratePercentage:
        (isFreelancer ? profile.commissionRate : profile.bonusRate) * 100,
      type: isFreelancer ? "Commission" : "Bonus",
      description: isFreelancer
        ? `Earn ${(profile.commissionRate * 100).toFixed(
            0
          )}% commission on every verified job completion. Commissions are paid every Monday, with early payout available during the week for urgent needs.`
        : `Earn ${(profile.bonusRate * 100).toFixed(
            0
          )}% bonus on every verified job completion. Bonuses are paid every Monday, with early payout available during the week for urgent needs.`,
    },
    monthlySalary: {
      baseSalary: profile.baseSalary || 0,
      thisMonthBonus: thisMonthBonus,
      total: (profile.baseSalary || 0) + thisMonthBonus,
      isFreelancer,
    },
    recentBonuses: formattedBonuses,
  };

  return earnings;
};
