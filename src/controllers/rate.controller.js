/** @format */

// src/controllers/rate.controller.js
import { prisma } from "../prisma.js";

/**
 * Get Rate Summary - Dashboard stats
 * Shows: Commission Rates count, Avg Commission, Bonus Rates, Avg Bonus
 */
export const getRateSummary = async (req, res, next) => {
  try {
    // Get all commission rates (freelancers)
    const commissionRates = await prisma.rateStructure.findMany({
      where: { type: "COMMISSION" },
    });

    // Get all bonus rates (internal employees)
    const bonusRates = await prisma.rateStructure.findMany({
      where: { type: "BONUS" },
    });

    // Calculate averages
    const avgCommission =
      commissionRates.length > 0
        ? commissionRates.reduce((sum, r) => sum + r.rate, 0) /
          commissionRates.length
        : 0;

    const avgBonus =
      bonusRates.length > 0
        ? bonusRates.reduce((sum, r) => sum + r.rate, 0) / bonusRates.length
        : 0;

    return res.json({
      commissionRates: {
        count: commissionRates.length,
        avgRate: Math.round(avgCommission * 1000) / 10, // Convert to percentage with 1 decimal
        avgRateDisplay: `${(avgCommission * 100).toFixed(1)}%`,
      },
      bonusRates: {
        count: bonusRates.length,
        avgRate: Math.round(avgBonus * 1000) / 10,
        avgRateDisplay: `${(avgBonus * 100).toFixed(1)}%`,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get All Rate Structures
 * Supports filtering by type (COMMISSION/BONUS) and techType (FREELANCER/INTERNAL)
 */
export const getRateStructures = async (req, res, next) => {
  try {
    const { type, techType } = req.query;

    const where = {};
    if (type) where.type = type;
    if (techType) where.techType = techType;

    const rates = await prisma.rateStructure.findMany({
      where,
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });

    // Format for frontend
    const formattedRates = rates.map((rate) => ({
      id: rate.id,
      rateId: rate.rateId,
      name: rate.name,
      type: rate.type,
      techType: rate.techType,
      rate: rate.rate,
      ratePercentage: Math.round(rate.rate * 100),
      rateDisplay: `${Math.round(rate.rate * 100)}%`,
      isDefault: rate.isDefault,
      description: rate.description,
      createdAt: rate.createdAt,
      updatedAt: rate.updatedAt,
    }));

    return res.json(formattedRates);
  } catch (err) {
    next(err);
  }
};

/**
 * Get Single Rate Structure by ID
 */
export const getRateStructure = async (req, res, next) => {
  try {
    const { id } = req.params;

    const rate = await prisma.rateStructure.findUnique({
      where: { id: parseInt(id) },
    });

    if (!rate) {
      return res.status(404).json({ message: "Rate structure not found" });
    }

    return res.json({
      ...rate,
      ratePercentage: Math.round(rate.rate * 100),
      rateDisplay: `${Math.round(rate.rate * 100)}%`,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Create Rate Structure
 * Body: { name, type, techType, rate, isDefault, description }
 */
export const createRateStructure = async (req, res, next) => {
  try {
    const { name, type, techType, rate, isDefault, description } = req.body;

    // Validate required fields
    if (!name || !type || !techType || rate === undefined) {
      return res.status(400).json({
        message: "Missing required fields: name, type, techType, rate",
      });
    }

    // Validate type
    if (!["COMMISSION", "BONUS"].includes(type)) {
      return res.status(400).json({
        message: "Type must be COMMISSION or BONUS",
      });
    }

    // Validate techType
    if (!["FREELANCER", "INTERNAL"].includes(techType)) {
      return res.status(400).json({
        message: "TechType must be FREELANCER or INTERNAL",
      });
    }

    // Validate rate (0-1)
    if (rate < 0 || rate > 1) {
      return res.status(400).json({
        message: "Rate must be between 0 and 1 (e.g., 0.10 for 10%)",
      });
    }

    // Generate rateId
    const lastRate = await prisma.rateStructure.findFirst({
      orderBy: { id: "desc" },
    });
    const nextNum = lastRate ? lastRate.id + 1 : 1;
    const rateId = `RATE${String(nextNum).padStart(3, "0")}`;

    // If this is set as default, unset other defaults of same type
    if (isDefault) {
      await prisma.rateStructure.updateMany({
        where: { type, techType, isDefault: true },
        data: { isDefault: false },
      });
    }

    const newRate = await prisma.rateStructure.create({
      data: {
        rateId,
        name,
        type,
        techType,
        rate: parseFloat(rate),
        isDefault: isDefault || false,
        description,
      },
    });

    return res.status(201).json({
      message: "Rate structure created successfully",
      rate: {
        ...newRate,
        ratePercentage: Math.round(newRate.rate * 100),
        rateDisplay: `${Math.round(newRate.rate * 100)}%`,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update Rate Structure
 */
export const updateRateStructure = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, rate, isDefault, description } = req.body;

    const existing = await prisma.rateStructure.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existing) {
      return res.status(404).json({ message: "Rate structure not found" });
    }

    // Validate rate if provided
    if (rate !== undefined && (rate < 0 || rate > 1)) {
      return res.status(400).json({
        message: "Rate must be between 0 and 1 (e.g., 0.10 for 10%)",
      });
    }

    // If setting as default, unset other defaults of same type
    if (isDefault && !existing.isDefault) {
      await prisma.rateStructure.updateMany({
        where: {
          type: existing.type,
          techType: existing.techType,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (rate !== undefined) updateData.rate = parseFloat(rate);
    if (isDefault !== undefined) updateData.isDefault = isDefault;
    if (description !== undefined) updateData.description = description;

    const updated = await prisma.rateStructure.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    return res.json({
      message: "Rate structure updated successfully",
      rate: {
        ...updated,
        ratePercentage: Math.round(updated.rate * 100),
        rateDisplay: `${Math.round(updated.rate * 100)}%`,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete Rate Structure
 */
export const deleteRateStructure = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.rateStructure.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existing) {
      return res.status(404).json({ message: "Rate structure not found" });
    }

    // Don't allow deleting if it's the only default
    if (existing.isDefault) {
      const otherRates = await prisma.rateStructure.count({
        where: {
          type: existing.type,
          techType: existing.techType,
          id: { not: parseInt(id) },
        },
      });

      if (otherRates === 0) {
        return res.status(400).json({
          message:
            "Cannot delete the only rate structure for this type. Create another one first.",
        });
      }

      // Set another rate as default
      const nextDefault = await prisma.rateStructure.findFirst({
        where: {
          type: existing.type,
          techType: existing.techType,
          id: { not: parseInt(id) },
        },
      });

      if (nextDefault) {
        await prisma.rateStructure.update({
          where: { id: nextDefault.id },
          data: { isDefault: true },
        });
      }
    }

    await prisma.rateStructure.delete({
      where: { id: parseInt(id) },
    });

    return res.json({ message: "Rate structure deleted successfully" });
  } catch (err) {
    next(err);
  }
};

/**
 * Set Rate as Default
 */
export const setDefaultRate = async (req, res, next) => {
  try {
    const { id } = req.params;

    const rate = await prisma.rateStructure.findUnique({
      where: { id: parseInt(id) },
    });

    if (!rate) {
      return res.status(404).json({ message: "Rate structure not found" });
    }

    // Unset other defaults of same type
    await prisma.rateStructure.updateMany({
      where: {
        type: rate.type,
        techType: rate.techType,
        isDefault: true,
      },
      data: { isDefault: false },
    });

    // Set this one as default
    const updated = await prisma.rateStructure.update({
      where: { id: parseInt(id) },
      data: { isDefault: true },
    });

    return res.json({
      message: `${rate.rateId} is now the default ${rate.type.toLowerCase()} rate for ${rate.techType.toLowerCase()}s`,
      rate: {
        ...updated,
        ratePercentage: Math.round(updated.rate * 100),
        rateDisplay: `${Math.round(updated.rate * 100)}%`,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get Default Rate for a tech type
 * Used when creating new technicians
 */
export const getDefaultRate = async (req, res, next) => {
  try {
    const { techType } = req.params; // FREELANCER or INTERNAL

    if (!["FREELANCER", "INTERNAL"].includes(techType)) {
      return res.status(400).json({
        message: "TechType must be FREELANCER or INTERNAL",
      });
    }

    const type = techType === "FREELANCER" ? "COMMISSION" : "BONUS";

    const defaultRate = await prisma.rateStructure.findFirst({
      where: { techType, type, isDefault: true },
    });

    if (!defaultRate) {
      // Return system default if no rate structure exists
      const systemDefault = techType === "FREELANCER" ? 0.1 : 0.05;
      return res.json({
        rate: systemDefault,
        ratePercentage: systemDefault * 100,
        rateDisplay: `${systemDefault * 100}%`,
        isSystemDefault: true,
        message: "No custom rate structure found, using system default",
      });
    }

    return res.json({
      ...defaultRate,
      ratePercentage: Math.round(defaultRate.rate * 100),
      rateDisplay: `${Math.round(defaultRate.rate * 100)}%`,
      isSystemDefault: false,
    });
  } catch (err) {
    next(err);
  }
};
