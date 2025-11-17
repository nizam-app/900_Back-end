// src/routes/category.routes.js
import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
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
} from '../services/category.service.js';

const router = express.Router();

// Public routes
router.get('/', listCategories);

// Admin only routes
router.post('/', authenticate, authorize(['ADMIN']), createCategory);
router.patch('/:id', authenticate, authorize(['ADMIN']), updateCategory);
router.delete('/:id', authenticate, authorize(['ADMIN']), deleteCategory);

router.post('/subservices', authenticate, authorize(['ADMIN']), createSubservice);
router.patch('/subservices/:id', authenticate, authorize(['ADMIN']), updateSubservice);
router.delete('/subservices/:id', authenticate, authorize(['ADMIN']), deleteSubservice);

router.post('/services', authenticate, authorize(['ADMIN']), createService);
router.patch('/services/:id', authenticate, authorize(['ADMIN']), updateService);
router.delete('/services/:id', authenticate, authorize(['ADMIN']), deleteService);

export default router;
