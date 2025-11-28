/** @format */

// src/services/otp.service.js
import { prisma } from '../prisma.js';
import { sendOTPViaBulkGate } from './sms.service.js';

// Generate a random 6-digit OTP
const generateOTPCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ✅ Send OTP to phone number
export const sendOTP = async (phone, type) => {
  try {
    // Generate OTP code
    const code = generateOTPCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { phone },
    });

    // Send OTP via BulkGate OTP API
    const smsResult = await sendOTPViaBulkGate(phone, {
      length: 6,
      expire: 5,
      channel: 'sms',
      senderId: 'FSM-OTP',
    });

    // If BulkGate API fails, we still save to database for backup verification
    if (!smsResult.success) {
      console.warn(`⚠️ BulkGate OTP API failed, using database OTP as fallback`);
    }

    // Save OTP to database (for backup verification and tracking)
    const otpRecord = await prisma.oTP.create({
      data: {
        phone,
        code,
        type,
        expiresAt,
        userId: user?.id,
      },
    });

    // Log OTP in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log(`📱 OTP for ${phone}: ${code}`);
    }

    return {
      message: 'OTP sent successfully',
      otpId: smsResult.otpId || null, // BulkGate OTP ID for verification
      smsStatus: smsResult.success ? 'sent' : 'failed',
      // Return OTP code only in development mode
      debug: process.env.NODE_ENV === 'development' ? { code } : undefined,
    };
  } catch (error) {
    console.error('❌ Error in sendOTP service:', error);
    throw error;
  }
};

// ✅ Verify OTP
export const verifyOTP = async (phone, code, type) => {
  try {
    // Verify OTP from database
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

    console.log(`✅ OTP verified successfully for ${phone}`);

    return {
      message: 'OTP verified successfully',
      verified: true,
    };
  } catch (error) {
    console.error('❌ Error verifying OTP:', error);
    throw error;
  }
};
