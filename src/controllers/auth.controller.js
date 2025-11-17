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
