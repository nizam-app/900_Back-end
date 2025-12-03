/** @format */

// src/services/auth.service.js
import bcrypt from "bcryptjs";
import { prisma } from "../prisma.js";
import { signToken } from "../utils/jwt.js";
import { normalizePhoneForDB } from "../utils/phone.js";

// ✅ Set password after OTP verification (new registration/password reset flow)
export const setPasswordAfterOTP = async (userData) => {
  const { phone, password, name, email, tempToken } = userData;

  // Normalize phone number
  const normalizedPhone = normalizePhoneForDB(phone);

  // Verify temporary token
  const otpRecord = await prisma.oTP.findFirst({
    where: {
      phone: normalizedPhone,
      tempToken,
      tempTokenExpiry: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!otpRecord) {
    throw new Error("Invalid or expired temporary token");
  }

  const existing = await prisma.user.findUnique({
    where: { phone: normalizedPhone },
  });

  // If user exists and has a password, they're already registered
  if (existing && existing.passwordHash && existing.passwordHash !== "") {
    throw new Error("Phone already registered");
  }

  const hash = await bcrypt.hash(password, 10);

  let user;

  // If guest user exists (no password), upgrade them to registered user
  if (existing && (!existing.passwordHash || existing.passwordHash === "")) {
    user = await prisma.user.update({
      where: { id: existing.id },
      data: {
        phone: normalizedPhone,
        passwordHash: hash,
        name: name || existing.name,
        email: email || existing.email,
        role: "CUSTOMER",
      },
    });

    console.log(`👤 Guest user upgraded to registered: ${phone}`);
  } else {
    // Create new user
    user = await prisma.user.create({
      data: {
        phone: normalizedPhone,
        passwordHash: hash,
        name: name || null,
        email: email || null,
        role: "CUSTOMER",
      },
    });

    console.log(`👤 New user registered: ${phone}`);
  }

  // Clear temp token
  await prisma.oTP.update({
    where: { id: otpRecord.id },
    data: { tempToken: null, tempTokenExpiry: null },
  });

  const token = signToken({
    id: user.id,
    role: user.role,
    phone: user.phone,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
    },
    message: "Password set successfully. You are now logged in.",
  };
};
export const registerUser = async (userData) => {
  const { phone, password, name, email, role, otp, tempToken } = userData;

  // Normalize phone number
  const normalizedPhone = normalizePhoneForDB(phone);

  // If tempToken provided, use new flow (OTP already verified)
  if (tempToken) {
    // Verify temp token
    const otpRecord = await prisma.oTP.findFirst({
      where: {
        phone: normalizedPhone,
        tempToken,
        tempTokenExpiry: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!otpRecord) {
      throw new Error("Invalid or expired temporary token. Please verify OTP again.");
    }

    // Clear temp token
    await prisma.oTP.update({
      where: { id: otpRecord.id },
      data: { tempToken: null, tempTokenExpiry: null },
    });

    // Proceed with registration using tempToken flow
    const existing = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });

    // If user exists and has a password, they're already registered
    if (existing && existing.passwordHash && existing.passwordHash !== "") {
      throw new Error("Phone already registered");
    }

    const hash = await bcrypt.hash(password, 10);
    let user;

    // If guest user exists (no password), upgrade them to registered user
    if (existing && (!existing.passwordHash || existing.passwordHash === "")) {
      user = await prisma.user.update({
        where: { id: existing.id },
        data: {
          phone: normalizedPhone,
          passwordHash: hash,
          name: name || existing.name,
          email: email || existing.email,
          role: role || "CUSTOMER",
        },
      });

      console.log(`👤 Guest user upgraded to registered: ${normalizedPhone}`);
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          phone: normalizedPhone,
          passwordHash: hash,
          name: name || null,
          email: email || null,
          role: role || "CUSTOMER",
        },
      });

      console.log(`👤 New user registered: ${normalizedPhone}`);
    }

    const token = signToken({
      id: user.id,
      role: user.role,
      phone: user.phone,
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
      },
      message: "Registration successful",
    };
  }

  // Legacy flow: If OTP code provided directly
  if (otp) {
    const existing = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });

    // If user exists and has a password, they're already registered
    if (existing && existing.passwordHash && existing.passwordHash !== "") {
      throw new Error("Phone already registered");
    }

    // Verify OTP before registration
    const otpRecord = await prisma.oTP.findFirst({
      where: {
        phone: normalizedPhone,
        code: otp,
        type: "REGISTRATION",
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!otpRecord) {
      throw new Error("Invalid or expired OTP");
    }

    // Mark OTP as used
    await prisma.oTP.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });

    const hash = await bcrypt.hash(password, 10);
    let user;

    // If guest user exists (no password), upgrade them to registered user
    if (existing && (!existing.passwordHash || existing.passwordHash === "")) {
      user = await prisma.user.update({
        where: { id: existing.id },
        data: {
          phone: normalizedPhone,
          passwordHash: hash,
          name: name || existing.name,
          email: email || existing.email,
          role: role || "CUSTOMER",
        },
      });

      console.log(`👤 Guest user upgraded to registered: ${normalizedPhone}`);
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          phone: normalizedPhone,
          passwordHash: hash,
          name: name || null,
          email: email || null,
          role: role || "CUSTOMER",
        },
      });

      console.log(`👤 New user registered: ${normalizedPhone}`);
    }

    const token = signToken({
      id: user.id,
      role: user.role,
      phone: user.phone,
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
      },
      message: "Registration successful",
    };
  }

  // Neither tempToken nor OTP provided
  throw new Error("OTP verification is required before registration");
};

// ✅ Login existing user (phone + password only)
export const loginUser = async (credentials) => {
  const { phone, password } = credentials;

  // Normalize phone number
  const normalizedPhone = normalizePhoneForDB(phone);

  // Find user by phone
  const user = await prisma.user.findUnique({
    where: { phone: normalizedPhone },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.isBlocked) {
    throw new Error(
      `Your account has been blocked. Reason: ${
        user.blockedReason || "No reason provided"
      }`
    );
  }

  // Verify password
  if (!user.passwordHash) {
    throw new Error(
      "Password not set for this account. Please complete registration."
    );
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new Error("Invalid password");
  }

  // Generate JWT token
  const token = signToken({
    id: user.id,
    role: user.role,
    phone: user.phone,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      isBlocked: user.isBlocked,
      createdAt: user.createdAt,
    },
  };
};

// ✅ Change user password
export const changeUserPassword = async (userId, oldPassword, newPassword) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || !user.passwordHash) {
    throw new Error("User not found");
  }

  const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!isMatch) {
    throw new Error("Invalid old password");
  }

  const hash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hash },
  });

  return { message: "Password changed successfully" };
};

// ✅ Logout user
export const logoutUser = async (userId) => {
  // Create audit log for logout action
  await prisma.auditLog.create({
    data: {
      userId,
      action: "USER_LOGOUT",
      entityType: "USER",
      entityId: userId,
    },
  });

  return { success: true };
};

// ✅ Get user profile
export const getUserProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      role: true,
      isBlocked: true,
      blockedReason: true,
      homeAddress: true,
      latitude: true,
      longitude: true,
      createdAt: true,
      updatedAt: true,
      technicianProfile: {
        select: {
          id: true,
          type: true,
          commissionRate: true,
          bonusRate: true,
          baseSalary: true,
          status: true,
          specialization: true,
          academicTitle: true,
          photoUrl: true,
          idCardUrl: true,
          residencePermitUrl: true,
          residencePermitFrom: true,
          residencePermitTo: true,
          degreesUrl: true,
          bankName: true,
          bankAccountNumber: true,
          bankAccountHolder: true,
          mobileBankingType: true,
          mobileBankingNumber: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // If customer, add statistics
  if (user.role === "CUSTOMER") {
    // Get total COMPLETED bookings count (SRs that have at least one PAID_VERIFIED work order)
    const completedSRs = await prisma.serviceRequest.findMany({
      where: {
        customerId: userId,
        workOrders: {
          some: {
            status: "PAID_VERIFIED",
          },
        },
      },
      select: {
        id: true,
      },
    });

    const totalBookings = completedSRs.length;

    // Get total spent (sum of all verified payments for this customer)
    const payments = await prisma.payment.aggregate({
      where: {
        workOrder: {
          customerId: userId,
        },
        status: "VERIFIED",
      },
      _sum: {
        amount: true,
      },
    });

    const totalSpent = payments._sum.amount || 0;

    // Business hours (default company hours - can be made configurable later)
    const businessHours = {
      monday: "9:00 AM - 6:00 PM",
      tuesday: "9:00 AM - 6:00 PM",
      wednesday: "9:00 AM - 6:00 PM",
      thursday: "9:00 AM - 6:00 PM",
      friday: "9:00 AM - 6:00 PM",
      saturday: "10:00 AM - 4:00 PM",
      sunday: "Closed",
    };

    return {
      ...user,
      totalBookings,
      totalSpent,
      businessHours,
    };
  }

  // If technician, parse specialization and degrees
  if (
    (user.role === "TECH_INTERNAL" || user.role === "TECH_FREELANCER") &&
    user.technicianProfile
  ) {
    // Parse specialization from string to array
    let skills = [];
    if (user.technicianProfile.specialization) {
      try {
        skills =
          typeof user.technicianProfile.specialization === "string"
            ? JSON.parse(user.technicianProfile.specialization)
            : user.technicianProfile.specialization;
      } catch {
        skills = user.technicianProfile.specialization
          .split(",")
          .map((s) => s.trim());
      }
    }

    // Parse degrees/certifications from JSON
    let certifications = [];
    if (user.technicianProfile.degreesUrl) {
      try {
        certifications =
          typeof user.technicianProfile.degreesUrl === "string"
            ? JSON.parse(user.technicianProfile.degreesUrl)
            : user.technicianProfile.degreesUrl;
      } catch {
        certifications = [];
      }
    }

    return {
      ...user,
      technicianProfile: {
        ...user.technicianProfile,
        skills, // Array of skills for UI
        certifications, // Array of certifications for UI
      },
    };
  }

  return user;
};

// ✅ Update user profile
export const updateUserProfile = async (userId, updates) => {
  // If email is being updated, check if it's already in use
  if (updates.email) {
    const existingEmail = await prisma.user.findFirst({
      where: {
        email: updates.email,
        NOT: { id: userId },
      },
    });

    if (existingEmail) {
      throw new Error("Email already in use");
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updates,
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      role: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};
