/** @format */

// src/services/otp.service.js
import { prisma } from "../prisma.js";
import { sendSMS } from "./sms.service.js";

// Generate a random 6-digit OTP
const generateOTPCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Format phone number - keep as is if already has country code
const formatPhoneNumber = (phone) => {
  // Remove spaces, dashes, parentheses, but keep the + if present
  let cleaned = phone.replace(/[\s\-\(\)]/g, "");

  // Remove the + sign to get just digits
  cleaned = cleaned.replace(/^\+/, "");

  // If starts with 0, replace with 88 (Bangladesh country code)
  if (cleaned.startsWith("0")) {
    cleaned = "88" + cleaned.substring(1);
  }

  // If doesn't start with 88, add it
  if (!cleaned.startsWith("88")) {
    cleaned = "88" + cleaned;
  }

  return cleaned;
};

// ✅ Send OTP to phone number
export const sendOTP = async (phone, type) => {
  try {
    // Generate OTP code
    const code = generateOTPCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Format phone number with country code
    const formattedPhone = formatPhoneNumber(phone);

    console.log(`📱 Original phone: ${phone}`);
    console.log(`📱 Formatted phone: ${formattedPhone}`);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { phone },
    });

    // Create OTP message
    const otpMessage = `Your FSM verification code is: ${code}. Valid for 5 minutes. Do not share this code with anyone.`;

    // Send OTP via BulkGate SMS API
    console.log(`📤 Sending OTP SMS to ${formattedPhone}...`);
    const smsResult = await sendSMS(formattedPhone, otpMessage, {
      unicode: 0,
      messageType: "transactional",
    });

    console.log(`📊 SMS Result:`, JSON.stringify(smsResult, null, 2));

    if (!smsResult.success) {
      console.warn(`⚠️ SMS sending failed: ${smsResult.error}`);
    } else {
      console.log(`✅ OTP SMS sent successfully to ${formattedPhone}`);
    }

    // Save OTP to database
    const otpRecord = await prisma.oTP.create({
      data: {
        phone,
        code,
        type,
        expiresAt,
        userId: user?.id,
      },
    });

    // Always log OTP code for debugging
    console.log(`📱 OTP for ${phone}: ${code}`);

    // Build response
    const response = {
      message: smsResult.success
        ? "OTP sent successfully"
        : "OTP generated but SMS not sent (no credits)",
      code: code, // Always return OTP code so client can see it
      expiresAt: expiresAt,
      smsStatus: smsResult.success ? "sent" : "failed",
    };

    // Add SMS details if needed
    if (!smsResult.success && smsResult.message) {
      response.smsError = smsResult.message;
    }

    return response;
  } catch (error) {
    console.error("❌ Error in sendOTP service:", error);
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
        createdAt: "desc",
      },
    });

    if (!otp) {
      throw new Error("Invalid or expired OTP");
    }

    // Mark OTP as used
    await prisma.oTP.update({
      where: { id: otp.id },
      data: { isUsed: true },
    });

    console.log(`✅ OTP verified successfully for ${phone}`);

    return {
      message: "OTP verified successfully",
      verified: true,
    };
  } catch (error) {
    console.error("❌ Error verifying OTP:", error);
    throw error;
  }
};
