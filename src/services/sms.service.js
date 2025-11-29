/** @format */

// src/services/sms.service.js
// Using built-in fetch API (Node.js 18+)
import dotenv from "dotenv";
dotenv.config();

// ========================================
// 🔑 BulkGate API Credentials
// ========================================

// HTTP API - For normal SMS (notifications, alerts, updates)
const HTTP_SMS_CONFIG = {
  APPLICATION_ID: process.env.BULKGATE_SMS_APP_ID || "36014",
  APPLICATION_TOKEN:
    process.env.BULKGATE_SMS_APP_TOKEN ||
    "mS6UavzDJQ8KoJ2NZlSGmFaiPSNhsdBML1wq2ngi8rXvoTw0Qv",
  BASE_URL: "https://portal.bulkgate.com/api/1.0/simple",
};

// OTP API - For verification codes only
const OTP_API_CONFIG = {
  APPLICATION_ID: process.env.BULKGATE_OTP_APP_ID || "36013",
  APPLICATION_TOKEN:
    process.env.BULKGATE_OTP_APP_TOKEN ||
    "7ohN0WzblPga1tugpwCXiHiQweVB3GImpmCanFNZSLsyhL87yR",
  BASE_URL: "https://portal.bulkgate.com/api/1.0/otp",
};

// ========================================
// 📱 1. HTTP SMS API Functions (Normal SMS)
// ========================================

/**
 * Send normal SMS using HTTP API
 * Use cases: Notifications, alerts, order updates, promotional messages
 *
 * @param {string} phone - Phone number (with country code, e.g., +8801712345678)
 * @param {string} text - Message text
 * @param {object} options - Additional options
 * @returns {Promise<object>} API response
 */
export const sendSMS = async (phone, text, options = {}) => {
  try {
    const {
      senderId = "FSM-System", // Sender ID (max 11 characters)
      unicode = 1, // 1 if message contains special characters/Bengali
      messageType = "transactional", // 'transactional' or 'promotional'
    } = options;

    // Format phone number (remove spaces and special characters)
    const formattedPhone = phone.replace(/[\s\-\(\)]/g, "");

    // Determine endpoint based on message type
    const endpoint =
      messageType === "promotional"
        ? `${HTTP_SMS_CONFIG.BASE_URL}/promotional`
        : `${HTTP_SMS_CONFIG.BASE_URL}/transactional`;

    // Prepare request payload
    const payload = {
      application_id: HTTP_SMS_CONFIG.APPLICATION_ID,
      application_token: HTTP_SMS_CONFIG.APPLICATION_TOKEN,
      number: formattedPhone,
      text: text,
      unicode: unicode,
      sender_id: senderId,
      sender_id_value: senderId,
    };

    console.log(`📤 Sending SMS to ${formattedPhone} via BulkGate HTTP API...`);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    // BulkGate returns status "accepted" or "sent"
    if (
      response.ok &&
      result.data &&
      (result.data.status === "sent" || result.data.status === "accepted")
    ) {
      // Check if account has credits
      if (result.data.price === 0 && result.data.credit === 0) {
        console.warn(
          `⚠️ SMS accepted but NO CREDITS! Add credits at https://portal.bulkgate.com`
        );
        console.log(`   Message ID: ${result.data.sms_id}`);
        console.log(`   Status: ${result.data.status}`);
      } else {
        console.log(`✅ SMS sent successfully to ${formattedPhone}`);
        console.log(
          `   Price: ${result.data.price}, Credit remaining: ${result.data.credit}`
        );
      }

      return {
        success: true,
        messageId: result.data.sms_id,
        status: result.data.status,
        price: result.data.price,
        credit: result.data.credit,
        message:
          result.data.price === 0
            ? "SMS accepted but account has no credits. Please add credits."
            : "SMS sent successfully",
      };
    } else {
      console.error(`❌ Failed to send SMS to ${formattedPhone}:`, result);
      return {
        success: false,
        error: result.error || "Failed to send SMS",
        message: result.error || "SMS sending failed",
      };
    }
  } catch (error) {
    console.error("❌ Error sending SMS via BulkGate:", error);
    return {
      success: false,
      error: error.message,
      message: "SMS service error",
    };
  }
};

/**
 * Send SMS to multiple recipients
 * @param {Array<string>} phoneNumbers - Array of phone numbers
 * @param {string} text - Message text
 * @param {object} options - Additional options
 * @returns {Promise<object>} Results for all recipients
 */
export const sendBulkSMS = async (phoneNumbers, text, options = {}) => {
  try {
    const results = await Promise.all(
      phoneNumbers.map((phone) => sendSMS(phone, text, options))
    );

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return {
      success: true,
      total: phoneNumbers.length,
      successful,
      failed,
      results,
    };
  } catch (error) {
    console.error("❌ Error sending bulk SMS:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ========================================
// 🔐 2. OTP API Functions (Verification Codes)
// ========================================

/**
 * Send OTP code using BulkGate OTP API
 * Use cases: Login, signup, password reset, 2FA
 *
 * @param {string} phone - Phone number (with country code)
 * @param {object} options - OTP configuration options
 * @returns {Promise<object>} API response
 */
export const sendOTPViaBulkGate = async (phone, options = {}) => {
  try {
    const {
      codeLength = 6, // OTP length (4-100 digits)
      expiration = 300, // Expiration time in seconds (default 5 minutes)
      country = "bd", // Country code (ISO 3166-1 alpha-2)
      language = "en", // Language for OTP message
      codeType = "int", // 'int', 'string', or 'combined'
      clientIp = "127.0.0.1", // Client IP for rate limiting
      senderId = "FSM-OTP", // Sender ID
    } = options;

    // Format phone number
    const formattedPhone = phone.replace(/[\s\-\(\)\+]/g, "");

    // Prepare request payload according to BulkGate OTP API v1.0
    const payload = {
      application_id: OTP_API_CONFIG.APPLICATION_ID,
      application_token: OTP_API_CONFIG.APPLICATION_TOKEN,
      number: formattedPhone,
      country: country,
      language: language,
      code_type: codeType,
      code_length: codeLength,
      request_quota_number: 1,
      request_quota_identification: clientIp, // Required for rate limiting
      expiration: expiration,
      channel: {
        sms: {
          sender_id: "gText",
          sender_id_value: senderId,
        },
      },
    };

    console.log(`🔐 Sending OTP to ${formattedPhone} via BulkGate OTP API...`);

    const response = await fetch(`${OTP_API_CONFIG.BASE_URL}/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (response.ok && result.data) {
      console.log(`✅ OTP sent successfully to ${formattedPhone}`);
      return {
        success: true,
        otpId: result.data.id, // Important: Save this to verify OTP later
        messageId: result.data.message?.message_id,
        status: result.data.message?.status,
        channel: result.data.message?.channel,
        expiration: expiration,
        message: "OTP sent successfully",
      };
    } else {
      console.error(`❌ Failed to send OTP to ${formattedPhone}:`, result);
      return {
        success: false,
        error: result.error || result.type || "Failed to send OTP",
        message: result.error || "OTP sending failed",
      };
    }
  } catch (error) {
    console.error("❌ Error sending OTP via BulkGate:", error);
    return {
      success: false,
      error: error.message,
      message: "OTP service error",
    };
  }
};

/**
 * Verify OTP code using BulkGate OTP API
 *
 * @param {string} otpId - OTP ID received from sendOTPViaBulkGate (e.g., "opt-xxxxx")
 * @param {string} code - OTP code entered by user
 * @returns {Promise<object>} Verification result
 */
export const verifyOTPViaBulkGate = async (otpId, code) => {
  try {
    const payload = {
      application_id: OTP_API_CONFIG.APPLICATION_ID,
      application_token: OTP_API_CONFIG.APPLICATION_TOKEN,
      id: otpId, // The ID received from send OTP response
      code: String(code), // OTP code as string
    };

    console.log(`🔍 Verifying OTP code for ID: ${otpId}...`);

    const response = await fetch(`${OTP_API_CONFIG.BASE_URL}/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (response.ok && result.data) {
      const isVerified = result.data.verified === true;
      console.log(
        `${isVerified ? "✅" : "❌"} OTP verification: ${
          isVerified ? "SUCCESS" : "FAILED"
        }`
      );
      return {
        success: true,
        verified: isVerified,
        otpId: result.data.id,
        message: isVerified ? "OTP verified successfully" : "Invalid OTP code",
      };
    } else {
      console.error(`❌ OTP verification error:`, result);
      return {
        success: false,
        verified: false,
        error: result.error || result.type || "Verification failed",
        message: result.error || "OTP verification failed",
      };
    }
  } catch (error) {
    console.error("❌ Error verifying OTP via BulkGate:", error);
    return {
      success: false,
      verified: false,
      error: error.message,
      message: "OTP verification service error",
    };
  }
};

// ========================================
// 📧 3. Notification Templates (Pre-defined Messages)
// ========================================

/**
 * Send work order assignment notification
 */
export const sendWOAssignmentSMS = async (phone, woNumber, customerName) => {
  const text = `New work order assigned: ${woNumber}\nCustomer: ${customerName}\nPlease accept or decline within 100 minutes.\n- FSM System`;
  return await sendSMS(phone, text, { unicode: 1 });
};

/**
 * Send work order acceptance notification
 */
export const sendWOAcceptedSMS = async (phone, woNumber, technicianName) => {
  const text = `Work order ${woNumber} has been accepted by ${technicianName}.\nTrack progress in the app.\n- FSM System`;
  return await sendSMS(phone, text, { unicode: 1 });
};

/**
 * Send work order completion notification
 */
export const sendWOCompletedSMS = async (phone, woNumber) => {
  const text = `Work order ${woNumber} has been completed.\nPlease verify payment and provide review.\n- FSM System`;
  return await sendSMS(phone, text, { unicode: 1 });
};

/**
 * Send payment verification notification
 */
export const sendPaymentVerifiedSMS = async (phone, amount, woNumber) => {
  const text = `Payment verified! Amount: ${amount} BDT\nWork order: ${woNumber}\nCommission added to your wallet.\n- FSM System`;
  return await sendSMS(phone, text, { unicode: 1 });
};

/**
 * Send commission payout notification
 */
export const sendPayoutApprovedSMS = async (phone, amount) => {
  const text = `Payout approved! Amount: ${amount} BDT has been processed.\nCheck your payment method.\n- FSM System`;
  return await sendSMS(phone, text, { unicode: 1 });
};

/**
 * Send account blocked notification
 */
export const sendAccountBlockedSMS = async (phone, reason) => {
  const text = `Your account has been blocked.\nReason: ${reason}\nContact support for assistance.\n- FSM System`;
  return await sendSMS(phone, text, { unicode: 1 });
};

/**
 * Send welcome SMS for new users
 */
export const sendWelcomeSMS = async (phone, name) => {
  const text = `Welcome to FSM System, ${name}!\nYour account has been created successfully.\nLogin to get started.\n- FSM System`;
  return await sendSMS(phone, text, { unicode: 1 });
};

// ========================================
// 📊 4. SMS Status & Delivery Reports
// ========================================

/**
 * Check SMS delivery status
 * @param {string} messageId - Message ID received from sendSMS
 * @returns {Promise<object>} Delivery status
 */
export const checkSMSStatus = async (messageId) => {
  try {
    const payload = {
      application_id: HTTP_SMS_CONFIG.APPLICATION_ID,
      application_token: HTTP_SMS_CONFIG.APPLICATION_TOKEN,
      sms_id: messageId,
    };

    const response = await fetch(`${HTTP_SMS_CONFIG.BASE_URL}/info`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (response.ok && result.data) {
      return {
        success: true,
        status: result.data.status,
        deliveredAt: result.data.delivered_at,
        data: result.data,
      };
    } else {
      return {
        success: false,
        error: result.error || "Failed to get status",
      };
    }
  } catch (error) {
    console.error("❌ Error checking SMS status:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ========================================
// 🧪 5. Test Functions
// ========================================

/**
 * Test BulkGate HTTP SMS API
 */
export const testHTTPSMS = async (phone) => {
  console.log("🧪 Testing BulkGate HTTP SMS API...");
  const result = await sendSMS(
    phone,
    "Test message from FSM System. HTTP SMS API is working!",
    { unicode: 1 }
  );
  console.log("📊 Test Result:", result);
  return result;
};

/**
 * Test BulkGate OTP API
 */
export const testOTPAPI = async (phone) => {
  console.log("🧪 Testing BulkGate OTP API...");
  const result = await sendOTPViaBulkGate(phone, {
    length: 6,
    expire: 5,
    channel: "sms",
  });
  console.log("📊 Test Result:", result);
  return result;
};

// Export configuration for external use
export const SMS_CONFIG = {
  HTTP_SMS: {
    APPLICATION_ID: HTTP_SMS_CONFIG.APPLICATION_ID,
    BASE_URL: HTTP_SMS_CONFIG.BASE_URL,
  },
  OTP_API: {
    APPLICATION_ID: OTP_API_CONFIG.APPLICATION_ID,
    BASE_URL: OTP_API_CONFIG.BASE_URL,
  },
};
