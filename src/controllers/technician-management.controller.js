/** @format */

// src/controllers/technician-management.controller.js
import { prisma } from "../prisma.js";
import bcrypt from "bcryptjs";

/**
 * Get Technician Overview
 * Returns statistics and breakdown by specialization and employment type
 */
export const getTechnicianOverview = async (req, res, next) => {
  try {
    const { specialization } = req.query; // Filter: Electrical, General, HVAC, Plumbing

    const where = {
      role: { in: ["TECH_INTERNAL", "TECH_FREELANCER"] },
      isBlocked: false,
    };

    if (specialization && specialization !== "All") {
      where.technicianProfile = {
        specialization: specialization.toUpperCase(),
      };
    }

    const technicians = await prisma.user.findMany({
      where,
      include: {
        technicianProfile: {
          select: {
            type: true,
            specialization: true,
            status: true,
            commissionRate: true,
            bonusRate: true,
            baseSalary: true,
          },
        },
        workOrders: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    // Count totals
    const total = technicians.length;
    const bySpecialization = {};
    const byType = { FREELANCER: 0, INTERNAL: 0 };

    technicians.forEach((tech) => {
      const profile = tech.technicianProfile;
      if (profile) {
        // Count by specialization
        const spec = profile.specialization || "GENERAL";
        bySpecialization[spec] = (bySpecialization[spec] || 0) + 1;

        // Count by type
        if (profile.type === "FREELANCER") {
          byType.FREELANCER++;
        } else if (profile.type === "INTERNAL") {
          byType.INTERNAL++;
        }
      }
    });

    // Calculate percentages for pie chart
    const specializationPercentages = {};
    Object.keys(bySpecialization).forEach((spec) => {
      specializationPercentages[spec] = {
        count: bySpecialization[spec],
        percentage: Math.round((bySpecialization[spec] / total) * 100),
      };
    });

    return res.json({
      total,
      bySpecialization,
      byType,
      specializationPercentages,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get Technicians Directory
 * Returns paginated list of technicians with full details
 */
export const getTechniciansDirectory = async (req, res, next) => {
  try {
    const { search, specialization, type, status } = req.query;

    const where = {
      role: { in: ["TECH_INTERNAL", "TECH_FREELANCER"] },
    };

    // Build filters
    const profileFilters = {};
    if (specialization && specialization !== "All") {
      profileFilters.specialization = specialization.toUpperCase();
    }
    if (type && type !== "All") {
      profileFilters.type = type.toUpperCase();
    }
    if (status) {
      profileFilters.status = status.toUpperCase();
    }

    if (Object.keys(profileFilters).length > 0) {
      where.technicianProfile = profileFilters;
    }

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const technicians = await prisma.user.findMany({
      where,
      include: {
        technicianProfile: true,
        workOrders: {
          where: {
            status: { in: ["ASSIGNED", "IN_PROGRESS", "ON_HOLD"] },
          },
          select: { id: true },
        },
        _count: {
          select: {
            workOrders: {
              where: {
                status: "PAID_VERIFIED",
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formatted = technicians.map((tech) => {
      const profile = tech.technicianProfile;
      const isEmployee = tech.role === "TECH_INTERNAL";

      return {
        id: tech.id,
        techId: `TECH-${String(tech.id).padStart(3, "0")}`,
        name: tech.name,
        phone: tech.phone,
        email: tech.email,
        specialization: profile?.specialization || "GENERAL",
        type: profile?.type || (isEmployee ? "INTERNAL" : "FREELANCER"),
        employmentType: isEmployee ? "Employee" : "Freelancer",
        status: profile?.status || "ACTIVE",
        isActive: profile?.status === "ACTIVE",
        isBlocked: tech.isBlocked,
        // Compensation
        commissionRate: profile?.commissionRate
          ? `${(profile.commissionRate * 100).toFixed(0)}%`
          : null,
        bonusRate: profile?.bonusRate
          ? `${(profile.bonusRate * 100).toFixed(0)}%`
          : null,
        monthlySalary: profile?.baseSalary || null,
        // Work statistics
        activeWorkOrders: tech.workOrders.length,
        completedJobs: tech._count.workOrders,
        openWorkOrders: tech.workOrders.filter(
          (wo) => wo.status === "ASSIGNED" || wo.status === "ON_HOLD"
        ).length,
        // Additional info
        joinDate: tech.createdAt,
        homeAddress: tech.homeAddress,
      };
    });

    return res.json({
      total: formatted.length,
      technicians: formatted,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get Single Technician Details
 */
export const getTechnicianDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const technician = await prisma.user.findUnique({
      where: { id: Number(id) },
      include: {
        technicianProfile: true,
        workOrders: {
          include: {
            service: { select: { name: true } },
            category: { select: { name: true } },
            customer: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        commissions: {
          include: {
            workOrder: {
              select: {
                woNumber: true,
                service: { select: { name: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!technician) {
      return res.status(404).json({ message: "Technician not found" });
    }

    const profile = technician.technicianProfile;
    const isEmployee = technician.role === "TECH_INTERNAL";

    return res.json({
      id: technician.id,
      techId: `TECH-${String(technician.id).padStart(3, "0")}`,
      name: technician.name,
      phone: technician.phone,
      email: technician.email,
      role: technician.role,
      isBlocked: technician.isBlocked,
      blockedReason: technician.blockedReason,
      // Profile
      specialization: profile?.specialization,
      type: profile?.type,
      status: profile?.status,
      photoUrl: profile?.photoUrl,
      idCardUrl: profile?.idCardUrl,
      residencePermitUrl: profile?.residencePermitUrl,
      degreesUrl: profile?.degreesUrl,
      isForeigner: profile?.isForeigner,
      homeAddress: technician.homeAddress,
      academicTitle: profile?.academicTitle,
      // Compensation
      commissionRate: profile?.commissionRate,
      bonusRate: profile?.bonusRate,
      baseSalary: profile?.baseSalary,
      // Statistics
      totalWorkOrders: technician.workOrders.length,
      activeWorkOrders: technician.workOrders.filter((wo) =>
        ["ASSIGNED", "IN_PROGRESS", "ON_HOLD"].includes(wo.status)
      ).length,
      completedWorkOrders: technician.workOrders.filter(
        (wo) => wo.status === "PAID_VERIFIED"
      ).length,
      // Recent activity
      recentWorkOrders: technician.workOrders.slice(0, 5).map((wo) => ({
        id: wo.id,
        woNumber: wo.woNumber,
        service: wo.service?.name || wo.category?.name,
        customer: wo.customer?.name,
        status: wo.status,
        createdAt: wo.createdAt,
      })),
      recentCommissions: technician.commissions.slice(0, 5).map((c) => ({
        id: c.id,
        amount: c.amount,
        type: c.type,
        workOrder: c.workOrder?.woNumber,
        status: c.status,
        createdAt: c.createdAt,
      })),
      // Dates
      joinDate: technician.createdAt,
      lastActive: technician.locationUpdatedAt,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Create New Technician
 */
export const createTechnician = async (req, res, next) => {
  try {
    const {
      name,
      phone,
      email,
      joinDate,
      specialization,
      type, // FREELANCER or INTERNAL
      commissionRate,
      bonusRate,
      baseSalary,
      homeAddress,
      academicTitle,
      isForeigner,
    } = req.body;

    // Validation
    if (!name || !phone || !specialization) {
      return res.status(400).json({
        message: "Name, phone, and specialization are required",
      });
    }

    if (!type || !["FREELANCER", "INTERNAL"].includes(type.toUpperCase())) {
      return res.status(400).json({
        message: "Valid employment type (FREELANCER or INTERNAL) is required",
      });
    }

    // Check if phone exists
    const existing = await prisma.user.findUnique({
      where: { phone },
    });

    if (existing) {
      return res.status(400).json({
        message: "Phone number already exists",
      });
    }

    // Determine role based on type
    const role =
      type.toUpperCase() === "INTERNAL" ? "TECH_INTERNAL" : "TECH_FREELANCER";

    // Generate temporary password
    const tempPassword = `Tech${Math.random().toString(36).slice(-8)}`;
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Create user and profile in transaction
    const technician = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          phone,
          email,
          passwordHash,
          role,
          homeAddress,
          createdAt: joinDate ? new Date(joinDate) : undefined,
        },
      });

      // Get global rates
      const globalSettings = await tx.globalSetting.findFirst();
      const defaultCommissionRate = globalSettings?.commissionRate || 0.1;
      const defaultBonusRate = globalSettings?.bonusRate || 0.05;

      const profile = await tx.technicianProfile.create({
        data: {
          userId: user.id,
          type: type.toUpperCase(),
          specialization: specialization.toUpperCase(),
          status: "ACTIVE",
          commissionRate:
            commissionRate !== undefined
              ? parseFloat(commissionRate)
              : defaultCommissionRate,
          bonusRate:
            bonusRate !== undefined ? parseFloat(bonusRate) : defaultBonusRate,
          baseSalary: baseSalary ? parseFloat(baseSalary) : 0,
          academicTitle,
          isForeigner: isForeigner || false,
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: "TECHNICIAN_CREATED",
          entityType: "USER",
          entityId: user.id,
        },
      });

      return { ...user, technicianProfile: profile, tempPassword };
    });

    return res.status(201).json({
      message: "Technician created successfully",
      technician: {
        id: technician.id,
        techId: `TECH-${String(technician.id).padStart(3, "0")}`,
        name: technician.name,
        phone: technician.phone,
        email: technician.email,
        role: technician.role,
        specialization: technician.technicianProfile.specialization,
        type: technician.technicianProfile.type,
        tempPassword: technician.tempPassword,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update Technician
 */
export const updateTechnician = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      specialization,
      commissionRate,
      bonusRate,
      baseSalary,
      homeAddress,
      academicTitle,
      status,
    } = req.body;

    const updateData = {};
    const profileUpdateData = {};

    // User fields
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (homeAddress !== undefined) updateData.homeAddress = homeAddress;

    // Profile fields
    if (specialization !== undefined)
      profileUpdateData.specialization = specialization.toUpperCase();
    if (commissionRate !== undefined)
      profileUpdateData.commissionRate = parseFloat(commissionRate);
    if (bonusRate !== undefined)
      profileUpdateData.bonusRate = parseFloat(bonusRate);
    if (baseSalary !== undefined)
      profileUpdateData.baseSalary = parseFloat(baseSalary);
    if (academicTitle !== undefined)
      profileUpdateData.academicTitle = academicTitle;
    if (status !== undefined) profileUpdateData.status = status.toUpperCase();

    const updated = await prisma.$transaction(async (tx) => {
      // Update user
      if (Object.keys(updateData).length > 0) {
        await tx.user.update({
          where: { id: Number(id) },
          data: updateData,
        });
      }

      // Update profile
      if (Object.keys(profileUpdateData).length > 0) {
        await tx.technicianProfile.update({
          where: { userId: Number(id) },
          data: profileUpdateData,
        });
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: "TECHNICIAN_UPDATED",
          entityType: "USER",
          entityId: Number(id),
        },
      });

      return await tx.user.findUnique({
        where: { id: Number(id) },
        include: { technicianProfile: true },
      });
    });

    return res.json({
      message: "Technician updated successfully",
      technician: updated,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Block/Unblock Technician
 */
export const toggleBlockTechnician = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isBlocked, reason } = req.body;

    if (isBlocked && !reason) {
      return res.status(400).json({
        message: "Reason is required when blocking a technician",
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: Number(id) },
        data: {
          isBlocked,
          blockedReason: isBlocked ? reason : null,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: isBlocked ? "TECHNICIAN_BLOCKED" : "TECHNICIAN_UNBLOCKED",
          entityType: "USER",
          entityId: Number(id),
        },
      });

      return user;
    });

    return res.json({
      message: `Technician ${isBlocked ? "blocked" : "unblocked"} successfully`,
      technician: updated,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Upload Technician Documents
 */
export const uploadTechnicianDocuments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = {};

    // Process uploaded files
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

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const updated = await prisma.technicianProfile.update({
      where: { userId: Number(id) },
      data: updateData,
    });

    return res.json({
      message: "Documents uploaded successfully",
      profile: updated,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Export Technicians to CSV
 */
export const exportTechniciansCSV = async (req, res, next) => {
  try {
    const { specialization, type } = req.query;

    const where = {
      role: { in: ["TECH_INTERNAL", "TECH_FREELANCER"] },
    };

    if (specialization && specialization !== "All") {
      where.technicianProfile = {
        specialization: specialization.toUpperCase(),
      };
    }

    const technicians = await prisma.user.findMany({
      where,
      include: {
        technicianProfile: true,
        _count: {
          select: {
            workOrders: true,
          },
        },
      },
    });

    // Generate CSV
    const csvRows = [
      [
        "ID",
        "Name",
        "Phone",
        "Email",
        "Specialization",
        "Type",
        "Status",
        "Commission Rate",
        "Bonus Rate",
        "Base Salary",
        "Total Jobs",
        "Join Date",
      ].join(","),
    ];

    technicians.forEach((tech) => {
      const profile = tech.technicianProfile;
      csvRows.push(
        [
          `TECH-${String(tech.id).padStart(3, "0")}`,
          tech.name,
          tech.phone,
          tech.email || "",
          profile?.specialization || "",
          profile?.type || "",
          profile?.status || "",
          profile?.commissionRate
            ? `${(profile.commissionRate * 100).toFixed(0)}%`
            : "",
          profile?.bonusRate ? `${(profile.bonusRate * 100).toFixed(0)}%` : "",
          profile?.baseSalary || "",
          tech._count.workOrders,
          new Date(tech.createdAt).toLocaleDateString(),
        ].join(",")
      );
    });

    const csv = csvRows.join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=technicians-${Date.now()}.csv`
    );
    return res.send(csv);
  } catch (err) {
    next(err);
  }
};
