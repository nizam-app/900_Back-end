// src/controllers/otp.controller.js
import { prisma } from '../prisma.js';

export const sendOTP = async (req, res, next) => {
  try {
    const { phone, type } = req.body;

    if (!phone || !type) {
      return res.status(400).json({ message: 'Phone and type are required' });
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await prisma.oTP.create({
      data: {
        phone,
        code,
        type,
        expiresAt,
      },
    });

    // TODO: Send SMS via Twilio/Africa's Talking
    console.log(`OTP for ${phone}: ${code}`);

    return res.json({ message: 'OTP sent successfully', code }); // Remove code in production
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

    const otp = await prisma.oTP.findFirst({
      where: {
        phone,
        code,
        type,
        isUsed: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    await prisma.oTP.update({
      where: { id: otp.id },
      data: { isUsed: true },
    });

    return res.json({ message: 'OTP verified successfully' });
  } catch (err) {
    next(err);
  }
};
