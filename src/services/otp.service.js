// src/services/otp.service.js
import { prisma } from '../prisma.js';

// Generate a random 6-digit OTP
const generateOTPCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ✅ Send OTP to phone number
export const sendOTP = async (phone, type) => {
  // Generate OTP code
  const code = generateOTPCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { phone },
  });

    // Generate OTP code
    const code = generateOTPCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  // TODO: Integrate with SMS provider (Twilio, Africa's Talking, etc.)
  // For now, we'll return the OTP in development mode
  console.log(`📱 OTP for ${phone}: ${code}`);

  return {
    message: 'OTP sent successfully',
    // Remove this in production!
    debug: process.env.NODE_ENV === 'development' ? { code } : undefined,
  };
};

// ✅ Verify OTP
export const verifyOTP = async (phone, code, type) => {
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
    throw new Error('Invalid or expired OTP');
  }

  // Mark OTP as used
  await prisma.oTP.update({
    where: { id: otp.id },
    data: { isUsed: true },
  });

  return {
    message: 'OTP verified successfully',
    verified: true,
  };
};
