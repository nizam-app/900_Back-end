/** @format */

// src/services/otp.service.js
import { prisma } from "../prisma.js";
import { sendSMS } from "./sms.service.js";
import { normalizePhoneForDB, formatPhoneForSMS } from "../utils/phone.js";
import { signToken } from "../utils/jwt.js";

// Generate a random 6-digit OTP
const generateOTPCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Format phone number to international format with + prefix
const formatPhoneNumber = (phone) => {
  // Remove spaces, dashes, parentheses
  let cleaned = phone.replace(/[\s\-\(\)]/g, "");

  // If already has + prefix, just clean it up
  if (cleaned.startsWith("+")) {
    return cleaned;
  }

  // Remove the + sign if present to get just digits
  cleaned = cleaned.replace(/^\+/, "");

  // If starts with 0, replace with 880 (Bangladesh country code)
  if (cleaned.startsWith("0")) {
    cleaned = "880" + cleaned.substring(1);
  }

  // If starts with 88 but not 880, make it 880
  if (cleaned.startsWith("88") && !cleaned.startsWith("880")) {
    cleaned = "880" + cleaned.substring(2);
  }

  // If doesn't start with 880, add it
  if (!cleaned.startsWith("880")) {
    cleaned = "880" + cleaned;
  }

  // Return with + prefix for international format (required by BulkGate)
  return "+" + cleaned;
};

// ✅ Send OTP to phone number
export const sendOTP = async (phone, type) => {
  try {
    // Generate OTP code
    const code = generateOTPCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Normalize phone for database (without country code)
    const normalizedPhone = normalizePhoneForDB(phone);

    // Format phone number with country code for SMS
    const formattedPhone = formatPhoneForSMS(phone);

    console.log(`📱 Original phone: ${phone}`);
    console.log(`📱 Normalized phone (DB): ${normalizedPhone}`);
    console.log(`📱 Formatted phone (SMS): ${formattedPhone}`);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });

    // Generate JWT token if user exists (for LOGIN type)
    let jwtToken = null;
    if (user && type === 'LOGIN') {
      jwtToken = signToken({
        id: user.id,
        role: user.role,
        phone: user.phone,
      }, '7d'); // 7 days expiry
      console.log(`🔑 Generated JWT token for user ${user.id}`);
    }

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

    // Generate temporary token (valid for 10 minutes) for immediate use
    const tempToken = `temp_${Date.now()}_${Math.random()
      .toString(36)
      .substring(7)}`;
    const tempTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to database with normalized phone and temp token
    const otpRecord = await prisma.oTP.create({
      data: {
        phone: normalizedPhone,
        code,
        type,
        expiresAt,
        userId: user?.id,
        tempToken,
        tempTokenExpiry,
      },
    });

    // Always log OTP code for debugging
    console.log(`📱 OTP for ${normalizedPhone}: ${code}`);
    console.log(`🔑 Temp token: ${tempToken}`);

    // Build response
    const response = {
      message: smsResult.success
        ? "OTP sent successfully"
        : "OTP generated but SMS not sent (no credits)",
      code: code, // Always return OTP code so client can see it
      expiresAt: expiresAt,
      tempToken: tempToken, // Include temp token in response
      tempTokenExpiry: tempTokenExpiry,
      smsStatus: smsResult.success ? "sent" : "failed",
    };

    // Add JWT token if user exists and it's a LOGIN request
    if (jwtToken) {
      response.token = jwtToken;
      response.user = {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
      };
    }

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

// ✅ Verify OTP by phone, code, and type - returns temp token
export const verifyOTPByCode = async (phone, code, type) => {
  try {
    // Normalize phone number
    const normalizedPhone = normalizePhoneForDB(phone);

    // Verify OTP from database
    const otp = await prisma.oTP.findFirst({
      where: {
        phone: normalizedPhone,
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

    console.log(`✅ OTP verified successfully: ${code}`);

    // Get or create user for JWT token generation
    let user = await prisma.user.findUnique({
      where: { phone: otp.phone },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
      },
    });

    // If user doesn't exist and it's a LOGIN or REGISTRATION type, create a basic user account
    if (!user && (type === 'LOGIN' || type === 'REGISTRATION')) {
      console.log(`👤 Creating new user account for ${otp.phone}`);
      user = await prisma.user.create({
        data: {
          phone: otp.phone,
          passwordHash: '', // Empty password, user can set it later
          role: 'CUSTOMER',
          name: otp.phone, // Use phone as default name
        },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          role: true,
        },
      });
      console.log(`✅ Created new user account with ID: ${user.id}`);
    }

    // Generate JWT token for authenticated session
    let jwtToken = null;
    if (user) {
      jwtToken = signToken({
        id: user.id,
        role: user.role,
        phone: user.phone,
      }, '7d'); // 7 days expiry
      console.log(`🔑 Generated JWT token for user ${user.id}`);
    }

    // Generate temporary token (valid for 10 minutes)
    const tempToken = `temp_${Date.now()}_${Math.random()
      .toString(36)
      .substring(7)}`;
    const tempTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store temp token in OTP record
    await prisma.oTP.update({
      where: { id: otp.id },
      data: {
        tempToken,
        tempTokenExpiry,
      },
    });

    const response = {
      message: "OTP verified successfully. You can now set your password.",
      verified: true,
      phone: otp.phone,
      tempToken,
      tempTokenExpiry,
    };

    // Add JWT token and user info if user exists
    if (jwtToken && user) {
      response.token = jwtToken;
      response.user = {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
      };
    }

    return response;
  } catch (error) {
    console.error("❌ Error verifying OTP:", error);
    throw error;
  }
};

// ✅ Verify OTP (legacy - with phone)
export const verifyOTP = async (phone, code, type) => {
  try {
    // Normalize phone number
    const normalizedPhone = normalizePhoneForDB(phone);

    // Verify OTP from database
    const otp = await prisma.oTP.findFirst({
      where: {
        phone: normalizedPhone,
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
