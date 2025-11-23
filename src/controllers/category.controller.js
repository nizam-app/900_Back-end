
import { prisma } from '../prisma.js';

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

export const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const category = await prisma.category.create({
      data: {
        name,
        description,
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

    return res.json({ message: 'Category deleted' });
  } catch (err) {
    next(err);
  }
};

export const createSubservice = async (req, res, next) => {
  try {
    const { categoryId, name, description } = req.body;

    if (!categoryId || !name) {
      return res.status(400).json({ message: 'CategoryId and name are required' });
    }

    const subservice = await prisma.subservice.create({
      data: {
        categoryId: Number(categoryId),
        name,
        description,
      },
    });

    return res.status(201).json(subservice);
  } catch (err) {
    next(err);
  }
};

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

    return res.json(subservice);
  } catch (err) {
    next(err);
  }
};

export const deleteSubservice = async (req, res, next) => {
  try {
    const subserviceId = Number(req.params.id);

    await prisma.subservice.delete({
      where: { id: subserviceId },
    });

    return res.json({ message: 'Subservice deleted' });
  } catch (err) {
    next(err);
  }
};

export const createService = async (req, res, next) => {
  try {
    const { categoryId, subserviceId, name, description, baseRate } = req.body;

    if (!categoryId || !subserviceId || !name) {
      return res.status(400).json({ message: 'CategoryId, subserviceId, and name are required' });
    }

    const service = await prisma.service.create({
      data: {
        categoryId: Number(categoryId),
        subserviceId: Number(subserviceId),
        name,
        description,
        baseRate: baseRate ? Number(baseRate) : null,
      },
    });

    return res.status(201).json(service);
  } catch (err) {
    next(err);
  }
};

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

    return res.json(service);
  } catch (err) {
    next(err);
  }
};

export const deleteService = async (req, res, next) => {
  try {
    const serviceId = Number(req.params.id);

    await prisma.service.delete({
      where: { id: serviceId },
    });

    return res.json({ message: 'Service deleted' });
  } catch (err) {
    next(err);
  }
};

// Activate Category
export const activateCategory = async (req, res, next) => {
  try {
    const categoryId = Number(req.params.id);

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: { isActive: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'CATEGORY_ACTIVATED',
        entityType: 'CATEGORY',
        entityId: category.id,
      },
    });

    return res.json({ 
      message: 'Category activated successfully',
      category 
    });
  } catch (err) {
    next(err);
  }
};

// Deactivate Category
export const deactivateCategory = async (req, res, next) => {
  try {
    const categoryId = Number(req.params.id);

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: { isActive: false },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'CATEGORY_DEACTIVATED',
        entityType: 'CATEGORY',
        entityId: category.id,
      },
    });

    return res.json({ 
      message: 'Category deactivated successfully',
      category 
    });
  } catch (err) {
    next(err);
  }
};
