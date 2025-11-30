/** @format */

// src/controllers/otp.controller.js
import * as otpService from "../services/otp.service.js";

export const sendOTP = async (req, res, next) => {
  try {
    const { phone, type } = req.body;

    if (!phone || !type) {
      return res.status(400).json({ message: "Phone and type are required" });
    }

    // Validate phone format (10-15 digits)
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        message:
          "Invalid phone format. Use format: +8801712345678 or 8801712345678",
      });
    }

    // Validate type
    const validTypes = [
      "LOGIN",
      "REGISTRATION",
      "PASSWORD_RESET",
      "VERIFICATION",
    ];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        message: `Invalid type. Must be one of: ${validTypes.join(", ")}`,
      });
    }

    const result = await otpService.sendOTP(phone, type);

    return res.json(result);
  } catch (err) {
    console.error("Error in sendOTP controller:", err);
    next(err);
  }
};

export const verifyOTP = async (req, res, next) => {
  try {
    const { code, type } = req.body;

    if (!code || !type) {
      return res.status(400).json({ message: "Code and type are required" });
    }

    // Validate OTP code format (6 digits)
    const codeRegex = /^[0-9]{6}$/;
    if (!codeRegex.test(code)) {
      return res.status(400).json({
        message: "Invalid OTP format. OTP must be 6 digits",
      });
    }

    const result = await otpService.verifyOTPByCode(code, type);

    return res.json(result);
  } catch (err) {
    if (err.message === "Invalid or expired OTP") {
      return res.status(400).json({ message: err.message });
    }
    console.error("Error in verifyOTP controller:", err);
    next(err);
  }
};
