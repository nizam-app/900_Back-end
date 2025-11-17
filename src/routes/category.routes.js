// src/routes/category.routes.js
import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  createSubservice,
  updateSubservice,
  deleteSubservice,
  createService,
  updateService,
  deleteService,
} from '../controllers/category.controller.js';

const router = Router();

// Public routes
router.get('/', listCategories);

// Admin only routes
router.post('/', authMiddleware, requireRole('ADMIN'), createCategory);
router.patch('/:id', authMiddleware, requireRole('ADMIN'), updateCategory);
router.delete('/:id', authMiddleware, requireRole('ADMIN'), deleteCategory);

router.post('/subservices', authMiddleware, requireRole('ADMIN'), createSubservice);
router.patch('/subservices/:id', authMiddleware, requireRole('ADMIN'), updateSubservice);
router.delete('/subservices/:id', authMiddleware, requireRole('ADMIN'), deleteSubservice);

router.post('/services', authMiddleware, requireRole('ADMIN'), createService);
router.patch('/services/:id', authMiddleware, requireRole('ADMIN'), updateService);
router.delete('/services/:id', authMiddleware, requireRole('ADMIN'), deleteService);

export default router;
