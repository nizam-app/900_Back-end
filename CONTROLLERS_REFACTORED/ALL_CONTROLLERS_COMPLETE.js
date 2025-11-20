// COMPLETE: All remaining controllers refactored to use service layer

// ============ PAYMENT CONTROLLER ============
// src/controllers/payment.controller.js
import * as paymentService from '../services/payment.service.js';

export const createPayment = async (req, res, next) => {
  try {
    const { woId, amount, method } = req.body;

    if (!woId || !amount || !method) {
      return res.status(400).json({ message: 'woId, amount, and method are required' });
    }

    const payment = await paymentService.uploadPaymentProof(req.body, req.file, req.user.id);
    return res.status(201).json(payment);
  } catch (err) {
    if (err.message === 'Work Order not found') {
      return res.status(404).json({ message: err.message });
    }
    if (err.message.includes('does not belong') || err.message.includes('status')) {
      return res.status(403).json({ message: err.message });
    }
    next(err);
  }
};

export const verifyPayment = async (req, res, next) => {
  try {
    const paymentId = Number(req.params.id);
    const { action, reason } = req.body;

    if (!action) {
      return res.status(400).json({ message: 'action is required (APPROVE or REJECT)' });
    }

    const payment = await paymentService.processPaymentVerification(paymentId, action, reason, req.user.id);
    return res.json(payment);
  } catch (err) {
    if (err.message === 'Payment not found') {
      return res.status(404).json({ message: err.message });
    }
    if (err.message.includes('already processed') || err.message.includes('Invalid action')) {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
};

// ============ COMMISSION CONTROLLER ============
// src/controllers/commission.controller.js
import * as commissionService from '../services/commission.service.js';

export const getMyCommissions = async (req, res, next) => {
  try {
    const result = await commissionService.findTechnicianCommissions(req.user.id, req.query);
    return res.json(result);
  } catch (err) {
    next(err);
  }
};

export const requestPayout = async (req, res, next) => {
  try {
    const { amount, reason } = req.body;

    const payoutRequest = await commissionService.createPayoutRequest(req.user.id, amount, reason);
    return res.status(201).json(payoutRequest);
  } catch (err) {
    if (err.message === 'Valid amount is required' || err.message === 'Insufficient wallet balance') {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
};

export const reviewPayoutRequest = async (req, res, next) => {
  try {
    const requestId = Number(req.params.id);
    const { action, reason } = req.body;

    if (!action) {
      return res.status(400).json({ message: 'action is required (APPROVE or REJECT)' });
    }

    const result = await commissionService.processPayoutRequest(requestId, action, reason, req.user.id);
    return res.json(result);
  } catch (err) {
    if (err.message === 'Payout request not found') {
      return res.status(404).json({ message: err.message });
    }
    if (err.message.includes('already processed') || err.message.includes('Insufficient') || err.message.includes('Invalid action')) {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
};

export const getAllPayoutRequests = async (req, res, next) => {
  try {
    const requests = await commissionService.findAllPayoutRequests(req.query);
    return res.json(requests);
  } catch (err) {
    next(err);
  }
};

export const getTechnicianDashboard = async (req, res, next) => {
  try {
    const dashboard = await commissionService.getTechnicianStats(req.user.id);
    return res.json(dashboard);
  } catch (err) {
    next(err);
  }
};

// ============ CATEGORY CONTROLLER ============
// src/controllers/category.controller.js
import * as categoryService from '../services/category.service.js';

export const listCategories = async (req, res, next) => {
  try {
    const categories = await categoryService.findAllCategories();
    return res.json(categories);
  } catch (err) {
    next(err);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const category = await categoryService.createNewCategory(req.body, req.user.id);
    return res.status(201).json(category);
  } catch (err) {
    next(err);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const categoryId = Number(req.params.id);
    const category = await categoryService.updateCategoryById(categoryId, req.body, req.user.id);
    return res.json(category);
  } catch (err) {
    next(err);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const categoryId = Number(req.params.id);
    const result = await categoryService.deleteCategoryById(categoryId, req.user.id);
    return res.json(result);
  } catch (err) {
    next(err);
  }
};

export const createSubservice = async (req, res, next) => {
  try {
    const { categoryId, name } = req.body;

    if (!categoryId || !name) {
      return res.status(400).json({ message: 'categoryId and name are required' });
    }

    const subservice = await categoryService.createNewSubservice(req.body, req.user.id);
    return res.status(201).json(subservice);
  } catch (err) {
    next(err);
  }
};

export const updateSubservice = async (req, res, next) => {
  try {
    const subserviceId = Number(req.params.id);
    const subservice = await categoryService.updateSubserviceById(subserviceId, req.body, req.user.id);
    return res.json(subservice);
  } catch (err) {
    next(err);
  }
};

export const deleteSubservice = async (req, res, next) => {
  try {
    const subserviceId = Number(req.params.id);
    const result = await categoryService.deleteSubserviceById(subserviceId, req.user.id);
    return res.json(result);
  } catch (err) {
    next(err);
  }
};

export const createService = async (req, res, next) => {
  try {
    const { categoryId, subserviceId, name } = req.body;

    if (!categoryId || !subserviceId || !name) {
      return res.status(400).json({ message: 'categoryId, subserviceId, and name are required' });
    }

    const service = await categoryService.createNewService(req.body, req.user.id);
    return res.status(201).json(service);
  } catch (err) {
    next(err);
  }
};

export const updateService = async (req, res, next) => {
  try {
    const serviceId = Number(req.params.id);
    const service = await categoryService.updateServiceById(serviceId, req.body, req.user.id);
    return res.json(service);
  } catch (err) {
    next(err);
  }
};

export const deleteService = async (req, res, next) => {
  try {
    const serviceId = Number(req.params.id);
    const result = await categoryService.deleteServiceById(serviceId, req.user.id);
    return res.json(result);
  } catch (err) {
    next(err);
  }
};

// ============ NOTIFICATION CONTROLLER ============
// src/controllers/notification.controller.js
import * as notificationService from '../services/notification.service.js';

export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await notificationService.findUserNotifications(req.user.id, req.query);
    return res.json(notifications);
  } catch (err) {
    next(err);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const notificationId = Number(req.params.id);
    const notification = await notificationService.markNotificationRead(notificationId, req.user.id);
    return res.json(notification);
  } catch (err) {
    if (err.message === 'Notification not found') {
      return res.status(404).json({ message: err.message });
    }
    next(err);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAllNotificationsRead(req.user.id);
    return res.json(result);
  } catch (err) {
    next(err);
  }
};

// ============ LOCATION CONTROLLER ============
// src/controllers/location.controller.js
import * as locationService from '../services/location.service.js';

export const updateLocation = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const result = await locationService.updateTechnicianLocation(req.user.id, req.body);
    return res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getNearbyTechnicians = async (req, res, next) => {
  try {
    const { latitude, longitude, radius } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const technicians = await locationService.findNearbyTechnicians(latitude, longitude, radius);
    return res.json(technicians);
  } catch (err) {
    next(err);
  }
};

// ============ REPORT CONTROLLER ============
// src/controllers/report.controller.js
import * as reportService from '../services/report.service.js';

export const getWorkOrderReport = async (req, res, next) => {
  try {
    const report = await reportService.generateWorkOrderReport(req.query);
    return res.json(report);
  } catch (err) {
    next(err);
  }
};

export const getCommissionReport = async (req, res, next) => {
  try {
    const report = await reportService.generateCommissionReport(req.query);
    return res.json(report);
  } catch (err) {
    next(err);
  }
};

export const getPaymentReport = async (req, res, next) => {
  try {
    const report = await reportService.generatePaymentReport(req.query);
    return res.json(report);
  } catch (err) {
    next(err);
  }
};

export const getTechnicianPerformance = async (req, res, next) => {
  try {
    const report = await reportService.generateTechnicianPerformance(req.query);
    return res.json(report);
  } catch (err) {
    next(err);
  }
};

export const getFinancialReport = async (req, res, next) => {
  try {
    const report = await reportService.generateFinancialReport(req.query);
    return res.json(report);
  } catch (err) {
    next(err);
  }
};
