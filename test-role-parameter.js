/** @format */

// Test Role Parameter Fix
const fetch = require("node-fetch");

const BASE_URL = "https://outside-project-backend-production.up.railway.app";

async function testRoleParameter() {
  console.log("🧪 Testing Role Parameter Fix...\n");

  const testPhone = `+880171898${Math.floor(1000 + Math.random() * 9000)}`; // Random phone

  try {
    // Step 1: Send OTP with TECH_FREELANCER role
    console.log("📤 Step 1: Sending OTP with role=TECH_FREELANCER...");
    const otpResponse = await fetch(`${BASE_URL}/api/otp/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: testPhone,
        name: "Test Freelancer",
        type: "REGISTRATION",
        role: "TECH_FREELANCER",
      }),
    });

    const otpData = await otpResponse.json();
    console.log("✅ OTP sent:", {
      phone: testPhone,
      code: otpData.code,
      tempToken: otpData.tempToken?.substring(0, 20) + "...",
    });

    if (!otpData.code || !otpData.tempToken) {
      throw new Error("Missing OTP code or tempToken");
    }

    // Step 2: Verify OTP
    console.log("\n📤 Step 2: Verifying OTP...");
    const verifyResponse = await fetch(`${BASE_URL}/api/otp/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: testPhone,
        code: otpData.code,
        type: "REGISTRATION",
      }),
    });

    const verifyData = await verifyResponse.json();
    console.log("✅ OTP verified:", {
      verified: verifyData.verified,
      tempToken: verifyData.tempToken?.substring(0, 20) + "...",
      userCreated: !!verifyData.user,
    });

    // Check if user was incorrectly created (BUG)
    if (verifyData.user) {
      console.log(
        "⚠️  WARNING: User was created during verify (should NOT happen!)"
      );
      console.log("   User role:", verifyData.user.role);
    } else {
      console.log("✅ GOOD: No user created yet (waiting for Step 3)");
    }

    // Step 3: Set Password
    console.log("\n📤 Step 3: Setting password...");
    const setPasswordResponse = await fetch(
      `${BASE_URL}/api/auth/set-password`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: testPhone,
          password: "test123",
          tempToken: verifyData.tempToken,
        }),
      }
    );

    const userData = await setPasswordResponse.json();
    console.log("✅ User created:", {
      id: userData.user?.id,
      name: userData.user?.name,
      phone: userData.user?.phone,
      role: userData.user?.role,
      token: userData.token?.substring(0, 20) + "...",
    });

    // Final Check
    console.log("\n" + "=".repeat(60));
    if (userData.user?.role === "TECH_FREELANCER") {
      console.log("✅ SUCCESS! User created with TECH_FREELANCER role");
      console.log("✅ Role parameter is working correctly!");
    } else {
      console.log("❌ FAILED! User role is:", userData.user?.role);
      console.log("❌ Expected: TECH_FREELANCER");
    }
    console.log("=".repeat(60));
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Test with different roles
async function testAllRoles() {
  const roles = ["CUSTOMER", "TECH_FREELANCER", "TECH_INTERNAL", "DISPATCHER"];

  for (const role of roles) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`Testing role: ${role}`);
    console.log("=".repeat(60));

    const testPhone = `+880171898${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      // Send OTP
      const otpResponse = await fetch(`${BASE_URL}/api/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: testPhone,
          name: `Test ${role}`,
          type: "REGISTRATION",
          role: role,
        }),
      });

      const otpData = await otpResponse.json();

      // Verify OTP
      const verifyResponse = await fetch(`${BASE_URL}/api/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: testPhone,
          code: otpData.code,
          type: "REGISTRATION",
        }),
      });

      const verifyData = await verifyResponse.json();

      // Set Password
      const setPasswordResponse = await fetch(
        `${BASE_URL}/api/auth/set-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: testPhone,
            password: "test123",
            tempToken: verifyData.tempToken,
          }),
        }
      );

      const userData = await setPasswordResponse.json();

      if (userData.user?.role === role) {
        console.log(`✅ ${role}: SUCCESS`);
      } else {
        console.log(`❌ ${role}: FAILED (got ${userData.user?.role})`);
      }

      // Small delay between tests
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.log(`❌ ${role}: ERROR - ${error.message}`);
    }
  }
}

// Run tests
console.log("Starting Role Parameter Tests...\n");
testRoleParameter()
  .then(() => {
    console.log("\n\nTesting all roles...");
    return testAllRoles();
  })
  .then(() => {
    console.log("\n\n✅ All tests completed!");
  })
  .catch((err) => {
    console.error("Test suite error:", err);
  });
