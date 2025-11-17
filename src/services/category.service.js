// src/services/category.service.js
import { prisma } from '../prisma.js';

// ✅ List all categories with subservices and services
export const listCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        subservices: {
          include: {
            services: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return res.json(categories);
  } catch (err) {
    next(err);
  }
};

// ✅ Create category (Admin only)
export const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const category = await prisma.category.create({
      data: {
        name,
        description: description || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'CATEGORY_CREATED',
        entityType: 'CATEGORY',
        entityId: category.id,
      },
    });

    return res.status(201).json(category);
  } catch (err) {
    next(err);
  }
};

// ✅ Update category (Admin only)
export const updateCategory = async (req, res, next) => {
  try {
    const categoryId = Number(req.params.id);
    const { name, description } = req.body;

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: {
        name,
        description,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'CATEGORY_UPDATED',
        entityType: 'CATEGORY',
        entityId: category.id,
      },
    });

    return res.json(category);
  } catch (err) {
    next(err);
  }
};

// ✅ Delete category (Admin only)
export const deleteCategory = async (req, res, next) => {
  try {
    const categoryId = Number(req.params.id);

    await prisma.category.delete({
      where: { id: categoryId },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'CATEGORY_DELETED',
        entityType: 'CATEGORY',
        entityId: categoryId,
      },
    });

    return res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// ✅ Create subservice (Admin only)
export const createSubservice = async (req, res, next) => {
  try {
    const { categoryId, name, description } = req.body;

    if (!categoryId || !name) {
      return res.status(400).json({ message: 'categoryId and name are required' });
    }

    const subservice = await prisma.subservice.create({
      data: {
        categoryId: Number(categoryId),
        name,
        description: description || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'SUBSERVICE_CREATED',
        entityType: 'SUBSERVICE',
        entityId: subservice.id,
      },
    });

    return res.status(201).json(subservice);
  } catch (err) {
    next(err);
  }
};

// ✅ Update subservice (Admin only)
export const updateSubservice = async (req, res, next) => {
  try {
    const subserviceId = Number(req.params.id);
    const { name, description } = req.body;

    const subservice = await prisma.subservice.update({
      where: { id: subserviceId },
      data: {
        name,
        description,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'SUBSERVICE_UPDATED',
        entityType: 'SUBSERVICE',
        entityId: subservice.id,
      },
    });

    return res.json(subservice);
  } catch (err) {
    next(err);
  }
};

// ✅ Delete subservice (Admin only)
export const deleteSubservice = async (req, res, next) => {
  try {
    const subserviceId = Number(req.params.id);

    await prisma.subservice.delete({
      where: { id: subserviceId },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'SUBSERVICE_DELETED',
        entityType: 'SUBSERVICE',
        entityId: subserviceId,
      },
    });

    return res.json({ message: 'Subservice deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// ✅ Create service (Admin only)
export const createService = async (req, res, next) => {
  try {
    const { categoryId, subserviceId, name, description, baseRate } = req.body;

    if (!categoryId || !subserviceId || !name) {
      return res.status(400).json({ message: 'categoryId, subserviceId, and name are required' });
    }

    const service = await prisma.service.create({
      data: {
        categoryId: Number(categoryId),
        subserviceId: Number(subserviceId),
        name,
        description: description || null,
        baseRate: baseRate ? Number(baseRate) : null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'SERVICE_CREATED',
        entityType: 'SERVICE',
        entityId: service.id,
      },
    });

    return res.status(201).json(service);
  } catch (err) {
    next(err);
  }
};

// ✅ Update service (Admin only)
export const updateService = async (req, res, next) => {
  try {
    const serviceId = Number(req.params.id);
    const { name, description, baseRate } = req.body;

    const service = await prisma.service.update({
      where: { id: serviceId },
      data: {
        name,
        description,
        baseRate: baseRate ? Number(baseRate) : undefined,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'SERVICE_UPDATED',
        entityType: 'SERVICE',
        entityId: service.id,
      },
    });

    return res.json(service);
  } catch (err) {
    next(err);
  }
};

// ✅ Delete service (Admin only)
export const deleteService = async (req, res, next) => {
  try {
    const serviceId = Number(req.params.id);

    await prisma.service.delete({
      where: { id: serviceId },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'SERVICE_DELETED',
        entityType: 'SERVICE',
        entityId: serviceId,
      },
    });

    return res.json({ message: 'Service deleted successfully' });
  } catch (err) {
    next(err);
  }
};
