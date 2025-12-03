/** @format */

// src/utils/phone.js

/**
 * Normalize phone number to database format (without country code prefix)
 * Examples:
 *   +8801719912009 -> 1719912009
 *   8801719912009 -> 1719912009
 *   01719912009 -> 1719912009
 *   1719912009 -> 1719912009
 */
export const normalizePhoneForDB = (phone) => {
  if (!phone) return phone;

  // Remove spaces, dashes, parentheses
  let cleaned = phone.replace(/[\s\-\(\)]/g, "");

  // Remove + prefix
  cleaned = cleaned.replace(/^\+/, "");

  // Remove country code 880
  if (cleaned.startsWith("880")) {
    cleaned = cleaned.substring(3);
  }

  // Remove leading 0
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.substring(1);
  }

  return cleaned;
};

/**
 * Format phone number for SMS (international format with +880)
 * Examples:
 *   1719912009 -> +8801719912009
 *   01719912009 -> +8801719912009
 *   8801719912009 -> +8801719912009
 *   +8801719912009 -> +8801719912009
 */
export const formatPhoneForSMS = (phone) => {
  if (!phone) return phone;

  // Remove spaces, dashes, parentheses
  let cleaned = phone.replace(/[\s\-\(\)]/g, "");

  // Remove + prefix temporarily
  cleaned = cleaned.replace(/^\+/, "");

  // If starts with 0, remove it
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.substring(1);
  }

  // If already has 880, just add + and return
  if (cleaned.startsWith("880")) {
    return "+" + cleaned;
  }

  // Otherwise add 880 prefix
  return "+880" + cleaned;
};

/**
 * Validate phone number format
 * Accepts: 10-11 digit Bangladesh phone numbers with or without country code
 */
export const isValidPhone = (phone) => {
  if (!phone) return false;

  const normalized = normalizePhoneForDB(phone);
  
  // Bangladesh mobile numbers are 10 digits (without country code)
  // Example: 1719912009, 1512345678
  return /^[0-9]{10}$/.test(normalized);
};
