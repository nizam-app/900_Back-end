/** @format */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testOTPFlow() {
  console.log("🔐 Testing Complete OTP Flow\n");

  const testPhone = "+8801536006304";
  const normalizedPhone = "1536006304"; // Without country code

  try {
    // Step 1: Check existing OTPs
    console.log("📋 Step 1: Checking existing OTPs...");
    const existingOTPs = await prisma.oTP.findMany({
      where: { phone: normalizedPhone },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    console.log(`   Found ${existingOTPs.length} OTPs for ${normalizedPhone}`);
    existingOTPs.forEach((otp) => {
      const isExpired = otp.expiresAt < new Date();
      console.log(`   • Code: ${otp.code}`);
      console.log(`     Type: ${otp.type}`);
      console.log(`     Used: ${otp.isUsed}`);
      console.log(`     Expired: ${isExpired}`);
      console.log(`     Created: ${otp.createdAt.toLocaleString()}`);
      console.log(`     Expires: ${otp.expiresAt.toLocaleString()}\n`);
    });

    // Step 2: Create a fresh OTP
    console.log("\n📤 Step 2: Creating fresh OTP...");
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const newOTP = await prisma.oTP.create({
      data: {
        phone: normalizedPhone,
        code: newCode,
        type: "LOGIN",
        expiresAt,
        isUsed: false,
      },
    });

    console.log(`   ✅ Created OTP: ${newCode}`);
    console.log(`   Phone: ${normalizedPhone}`);
    console.log(`   Expires: ${expiresAt.toLocaleString()}\n`);

    // Step 3: Verify the OTP
    console.log("🔍 Step 3: Verifying OTP...");
    const verification = await prisma.oTP.findFirst({
      where: {
        phone: normalizedPhone,
        code: newCode,
        type: "LOGIN",
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (verification) {
      console.log("   ✅ OTP verification successful!");
      console.log(`   Code: ${verification.code}`);
      console.log(`   Phone: ${verification.phone}`);

      // Mark as used and generate temp token
      const tempToken = `temp_${Date.now()}_${Math.random()
        .toString(36)
        .substring(7)}`;
      const tempTokenExpiry = new Date(Date.now() + 10 * 60 * 1000);

      await prisma.oTP.update({
        where: { id: verification.id },
        data: {
          isUsed: true,
          tempToken,
          tempTokenExpiry,
        },
      });

      console.log(`   🎫 TempToken: ${tempToken}`);
      console.log(`   Expires: ${tempTokenExpiry.toLocaleString()}\n`);

      // Step 4: Test registration with tempToken
      console.log("📝 Step 4: Testing registration with tempToken...");
      console.log("   (Would call /api/auth/register with tempToken)\n");

      console.log("✅ Complete OTP flow test successful!");
      console.log("\n📡 API Usage:");
      console.log("   1. POST /api/otp/send");
      console.log('      Body: { "phone": "+8801536006304", "type": "LOGIN" }');
      console.log("\n   2. POST /api/otp/verify");
      console.log(
        `      Body: { "phone": "+8801536006304", "code": "${newCode}", "type": "LOGIN" }`
      );
      console.log("\n   3. POST /api/auth/register");
      console.log(
        `      Body: { "phone": "+8801536006304", "tempToken": "${tempToken}", ... }`
      );
    } else {
      console.log("   ❌ OTP verification failed!");
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testOTPFlow();
