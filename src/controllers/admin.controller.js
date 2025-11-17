// src/controllers/admin.controller.js
import * as adminService from '../services/admin.service.js';

export const getDashboard = async (req, res, next) => {
  try {
    const stats = await adminService.getDashboardStats();
    return res.json(stats);
  } catch (err) {
    next(err);
  }
};

export const listUsers = async (req, res, next) => {
  try {
    const users = await adminService.findUsers(req.query);
    return res.json(users);
  } catch (err) {
    next(err);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { name, phone, email, password, role, technicianProfile } = req.body;

    if (!phone || !password || !role) {
      return res.status(400).json({ message: 'Phone, password, and role are required' });
    }

    const user = await adminService.createUserWithProfile(req.body, req.user.id);
    return res.status(201).json(user);
  } catch (err) {
    if (err.message === 'Phone already exists') {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    const { name, email, role } = req.body;

    const user = await adminService.updateUserById(userId, { name, email, role }, req.user.id);
    return res.json(user);
  } catch (err) {
    next(err);
  }
};

export const blockTechnician = async (req, res, next) => {
  try {
    const technicianId = Number(req.params.id);
    const { isBlocked, blockedReason } = req.body;

    if (isBlocked && !blockedReason) {
      return res.status(400).json({ message: 'Blocked reason is required when blocking a technician' });
    }

    const user = await adminService.setTechnicianBlockStatus(
      technicianId,
      isBlocked,
      blockedReason,
      req.user.id
    );
    return res.json(user);
  } catch (err) {
    next(err);
  }
};

export const updateTechnicianProfile = async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    const profile = await adminService.updateTechProfile(userId, req.body, req.user.id);
    return res.json(profile);
  } catch (err) {
    next(err);
  }
};

export const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await adminService.fetchAuditLogs(req.query);
    return res.json(logs);
  } catch (err) {
    next(err);
  }
};

export const getTechnicianLocations = async (req, res, next) => {
  try {
    const technicians = await adminService.getActiveTechnicianLocations();
    return res.json(technicians);
  } catch (err) {
    next(err);
  }
};
