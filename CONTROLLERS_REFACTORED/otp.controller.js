// COMPLETE: src/controllers/otp.controller.js
import * as otpService from '../services/otp.service.js';

export const sendOTP = async (req, res, next) => {
  try {
    const { phone, type } = req.body;

    if (!phone || !type) {
      return res.status(400).json({ message: 'Phone and type are required' });
    }

    const result = await otpService.sendOTP(phone, type);
    return res.json(result);
  } catch (err) {
    next(err);
  }
};

export const verifyOTP = async (req, res, next) => {
  try {
    const { phone, code, type } = req.body;

    if (!phone || !code || !type) {
      return res.status(400).json({ message: 'Phone, code, and type are required' });
    }

    const result = await otpService.verifyOTP(phone, code, type);
    return res.json(result);
  } catch (err) {
    if (err.message === 'Invalid or expired OTP') {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
};
