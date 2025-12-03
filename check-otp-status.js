import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkOTP() {
  const phone = "+8801586006804";
  const normalizedPhone = "1586006804"; // Without +880
  const code = "536061";

  console.log("🔍 Checking OTP Status\n");
  console.log(`Phone: ${phone}`);
  console.log(`Normalized: ${normalizedPhone}`);
  console.log(`Code: ${code}\n`);

  try {
    // Check all OTPs for this phone
    const allOTPs = await prisma.oTP.findMany({
      where: {
        phone: normalizedPhone,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`📋 Found ${allOTPs.length} OTPs for this phone:\n`);

    if (allOTPs.length === 0) {
      console.log("❌ No OTPs found. Need to send OTP first!");
      console.log("\n💡 Solution:");
      console.log("   POST /api/otp/send");
      console.log('   { "phone": "+8801586006804", "type": "LOGIN" }');
    } else {
      const now = new Date();
      
      allOTPs.forEach((otp, index) => {
        const isExpired = otp.expiresAt < now;
        const minutesAgo = Math.floor((now - otp.createdAt) / 1000 / 60);
        const isTheRequestedCode = otp.code === code;

        console.log(`${index + 1}. Code: ${otp.code} ${isTheRequestedCode ? "⭐ (REQUESTED CODE)" : ""}`);
        console.log(`   Type: ${otp.type}`);
        console.log(`   Used: ${otp.isUsed ? "✅ Yes" : "❌ No"}`);
        console.log(`   Expired: ${isExpired ? "⏰ Yes" : "✅ No"}`);
        console.log(`   Created: ${minutesAgo} minutes ago`);
        console.log(`   Expires: ${otp.expiresAt.toLocaleString()}`);
        
        if (isTheRequestedCode) {
          console.log("\n   🎯 THIS IS THE CODE YOU'RE TRYING TO USE:");
          if (otp.isUsed) {
            console.log("   ❌ Problem: Already used!");
            console.log("   💡 Solution: Request a new OTP");
          } else if (isExpired) {
            console.log("   ❌ Problem: Expired!");
            console.log("   💡 Solution: Request a new OTP (expires after 5 minutes)");
          } else {
            console.log("   ✅ This OTP should work!");
            console.log("   🤔 If it still fails, check the 'type' field matches");
          }
        }
        console.log("");
      });

      // Check if the specific code exists and is valid
      const validOTP = await prisma.oTP.findFirst({
        where: {
          phone: normalizedPhone,
          code: code,
          type: "LOGIN",
          isUsed: false,
          expiresAt: {
            gt: now,
          },
        },
      });

      if (validOTP) {
        console.log("✅ OTP IS VALID AND READY TO USE!");
      } else {
        console.log("❌ OTP VERIFICATION WILL FAIL");
        console.log("\n💡 Request a fresh OTP:");
        console.log("   POST /api/otp/send");
        console.log('   { "phone": "+8801586006804", "type": "LOGIN" }');
      }
    }
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkOTP();
