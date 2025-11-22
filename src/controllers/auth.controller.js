// src/controllers/auth.controller.js
import * as authService from '../services/auth.service.js';

export const register = async (req, res, next) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: 'Phone and password are required' });
    }

    const result = await authService.registerUser(req.body);
    return res.status(201).json(result);
  } catch (err) {
    if (err.message === 'Phone already registered') {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: 'Phone and password are required' });
    }

    const result = await authService.loginUser(req.body);
    return res.json(result);
  } catch (err) {
    if (err.message === 'Invalid credentials') {
      return res.status(401).json({ message: err.message });
    }
    if (err.message.includes('blocked')) {
      return res.status(403).json({ message: err.message });
    }
    next(err);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Old password and new password are required' });
    }

    const result = await authService.changeUserPassword(req.user.id, oldPassword, newPassword);
    return res.json(result);
  } catch (err) {
    if (err.message === 'Invalid old password') {
      return res.status(401).json({ message: err.message });
    }
    next(err);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const profile = await authService.getUserProfile(req.user.id);
    return res.json(profile);
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ['name', 'email'];
    const updates = {};
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    const updatedProfile = await authService.updateUserProfile(req.user.id, updates);
    return res.json(updatedProfile);
  } catch (err) {
    if (err.message === 'Email already in use') {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
};

export const updateCustomerProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const allowedFields = ['name', 'email'];
    const updates = {};
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    const updatedProfile = await authService.updateUserProfile(parseInt(userId), updates);
    return res.json(updatedProfile);
  } catch (err) {
    if (err.message === 'Email already in use') {
      return res.status(400).json({ message: err.message });
    }
    if (err.message === 'User not found') {
      return res.status(404).json({ message: err.message });
    }
    next(err);
  }
};
