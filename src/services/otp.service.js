// src/services/otp.service.js
import { prisma } from '../prisma.js';

// Generate a random 6-digit OTP
const generateOTPCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ✅ Send OTP to phone number
export const sendOTP = async (req, res, next) => {
  try {
    const { phone, type } = req.body;

    if (!phone || !type) {
      return res.status(400).json({ message: 'Phone and type are required' });
    }

    // Generate OTP code
    const code = generateOTPCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { phone },
    });

    // Create OTP record
    const otp = await prisma.oTP.create({
      data: {
        phone,
        code,
        type, // REGISTRATION, LOGIN, PASSWORD_RESET
        expiresAt,
        userId: user?.id || null,
      },
    });

    // TODO: Integrate with SMS provider (Twilio, Africa's Talking, etc.)
    // For now, we'll return the OTP in development mode
    console.log(`📱 OTP for ${phone}: ${code}`);

    return res.json({
      message: 'OTP sent successfully',
      // Remove this in production!
      debug: process.env.NODE_ENV === 'development' ? { code } : undefined,
    });
  } catch (err) {
    next(err);
  }
};

// ✅ Verify OTP
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
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!otp) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Mark OTP as used
    await prisma.oTP.update({
      where: { id: otp.id },
      data: { isUsed: true },
    });

    return res.json({
      message: 'OTP verified successfully',
      verified: true,
    });
  } catch (err) {
    next(err);
  }
};
