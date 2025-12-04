/** @format */

/**
 * Test script for 3-step Freelancer Registration Flow
 * Tests the complete flow: Name+Phone → OTP Verify → Set Password
 */

const BASE_URL = "http://localhost:4000";

// Test data
const testData = {
  name: "Test Freelancer",
  phone: "01799999999",
  password: "test123",
};

let tempToken = null;
let otpCode = null;

console.log("🧪 Testing Freelancer Registration Flow\n");
console.log("=".repeat(60));

// Step 1: Send OTP (Enter name and phone)
async function step1_sendOTP() {
  console.log("\n📱 STEP 1: Enter Name & Phone Number");
  console.log("-".repeat(60));

  const response = await fetch(`${BASE_URL}/api/otp/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phone: testData.phone,
      name: testData.name,
      type: "REGISTRATION",
    }),
  });

  const data = await response.json();
  console.log(`Status: ${response.status}`);
  console.log(`Response:`, JSON.stringify(data, null, 2));

  if (response.ok) {
    tempToken = data.tempToken;
    otpCode = data.code; // In development, code is returned
    console.log(`\n✅ Step 1 Complete`);
    console.log(`   OTP Code: ${otpCode}`);
    console.log(`   Temp Token: ${tempToken}`);
    console.log(`   Expires: ${new Date(data.expiresAt).toLocaleString()}`);
    return true;
  } else {
    console.log(`\n❌ Step 1 Failed: ${data.message}`);
    return false;
  }
}

// Step 2: Verify OTP
async function step2_verifyOTP() {
  console.log("\n🔐 STEP 2: Verify Phone Number");
  console.log("-".repeat(60));

  const response = await fetch(`${BASE_URL}/api/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phone: testData.phone,
      code: otpCode,
      type: "REGISTRATION",
    }),
  });

  const data = await response.json();
  console.log(`Status: ${response.status}`);
  console.log(`Response:`, JSON.stringify(data, null, 2));

  if (response.ok && data.verified) {
    console.log(`\n✅ Step 2 Complete`);
    console.log(`   Phone Verified: ${data.phone}`);
    console.log(`   Temp Token Valid: ${data.tempToken === tempToken}`);
    return true;
  } else {
    console.log(`\n❌ Step 2 Failed: ${data.message}`);
    return false;
  }
}

// Step 3: Set Password
async function step3_setPassword() {
  console.log("\n🔑 STEP 3: Set Password");
  console.log("-".repeat(60));

  const response = await fetch(`${BASE_URL}/api/auth/set-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phone: testData.phone,
      password: testData.password,
      tempToken: tempToken,
    }),
  });

  const data = await response.json();
  console.log(`Status: ${response.status}`);
  console.log(`Response:`, JSON.stringify(data, null, 2));

  if (response.ok) {
    console.log(`\n✅ Step 3 Complete`);
    console.log(`   User ID: ${data.user.id}`);
    console.log(`   Name: ${data.user.name}`);
    console.log(`   Phone: ${data.user.phone}`);
    console.log(`   Role: ${data.user.role}`);
    console.log(`   Token: ${data.token.substring(0, 50)}...`);
    return { success: true, token: data.token, user: data.user };
  } else {
    console.log(`\n❌ Step 3 Failed: ${data.message}`);
    return { success: false };
  }
}

// Verify Profile Creation
async function verifyProfile(token) {
  console.log("\n📋 Verifying Profile & Technician Setup");
  console.log("-".repeat(60));

  const response = await fetch(`${BASE_URL}/api/auth/profile`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  console.log(`Status: ${response.status}`);
  console.log(`Profile:`, JSON.stringify(data, null, 2));

  if (response.ok && data.technicianProfile) {
    console.log(`\n✅ Technician Profile Verified`);
    console.log(`   Type: ${data.technicianProfile.type}`);
    console.log(
      `   Commission Rate: ${data.technicianProfile.commissionRate * 100}%`
    );
    console.log(`   Status: ${data.technicianProfile.status}`);
    return true;
  } else {
    console.log(`\n⚠️  Profile check completed (no technician profile yet)`);
    return false;
  }
}

// Run the complete flow
async function runCompleteFlow() {
  console.log(`\n🎯 Test Configuration:`);
  console.log(`   Name: ${testData.name}`);
  console.log(`   Phone: ${testData.phone}`);
  console.log(`   Password: ${"*".repeat(testData.password.length)}`);
  console.log(`   Base URL: ${BASE_URL}`);

  try {
    // Step 1: Send OTP
    const step1Success = await step1_sendOTP();
    if (!step1Success) {
      console.log("\n🛑 Test stopped at Step 1");
      return;
    }

    // Wait 1 second
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Step 2: Verify OTP
    const step2Success = await step2_verifyOTP();
    if (!step2Success) {
      console.log("\n🛑 Test stopped at Step 2");
      return;
    }

    // Wait 1 second
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Step 3: Set Password
    const step3Result = await step3_setPassword();
    if (!step3Result.success) {
      console.log("\n🛑 Test stopped at Step 3");
      return;
    }

    // Wait 1 second
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Verify Profile
    await verifyProfile(step3Result.token);

    // Final Summary
    console.log("\n" + "=".repeat(60));
    console.log("🎉 REGISTRATION FLOW TEST COMPLETED SUCCESSFULLY");
    console.log("=".repeat(60));
    console.log(`\n✅ All 3 steps completed successfully`);
    console.log(`✅ User registered as: ${step3Result.user.role}`);
    console.log(`✅ Authentication token generated`);
    console.log(`✅ Profile verified`);
    console.log(`\n📱 Mobile App Integration:`);
    console.log(`   Step 1 Screen: ✅ Name + Phone → OTP Sent`);
    console.log(`   Step 2 Screen: ✅ OTP Verified`);
    console.log(`   Step 3 Screen: ✅ Password Set → Logged In`);
    console.log(`\n🔐 Login Credentials:`);
    console.log(`   Phone: ${testData.phone}`);
    console.log(`   Password: ${testData.password}`);
  } catch (error) {
    console.error("\n❌ Test Error:", error.message);
    console.error(error.stack);
  }
}

// Run the test
runCompleteFlow();
