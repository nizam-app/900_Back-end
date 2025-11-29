/** @format */

// Comprehensive OTP Diagnostic Script

import dotenv from "dotenv";
dotenv.config();

console.log("🔍 FSM OTP System - Complete Diagnostic\n");
console.log("=".repeat(60));

// Test 1: Check environment variables
console.log("\n1️⃣  Environment Variables Check:");
console.log("   NODE_ENV:", process.env.NODE_ENV || "not set");
console.log("   PORT:", process.env.PORT || "not set");
console.log(
  "   BULKGATE_SMS_APP_ID:",
  process.env.BULKGATE_SMS_APP_ID || "❌ MISSING"
);
console.log(
  "   BULKGATE_SMS_APP_TOKEN:",
  process.env.BULKGATE_SMS_APP_TOKEN
    ? `${process.env.BULKGATE_SMS_APP_TOKEN.substring(0, 10)}...`
    : "❌ MISSING"
);

// Test 2: Test BulkGate API directly
console.log("\n2️⃣  Testing BulkGate API Connection:");

const testBulkGate = async () => {
  const payload = {
    application_id: process.env.BULKGATE_SMS_APP_ID || "36014",
    application_token:
      process.env.BULKGATE_SMS_APP_TOKEN ||
      "mS6UavzDJQ8KoJ2NZlSGmFaiPSNhsdBML1wq2ngi8rXvoTw0Qv",
    number: "8801718981009",
    text: "Test from diagnostic: Your code is 123456",
    unicode: 0,
    sender_id: "gText",
    sender_id_value: "gText",
  };

  try {
    console.log("   📡 Sending test SMS to BulkGate...");
    const response = await fetch(
      "https://portal.bulkgate.com/api/1.0/simple/transactional",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();

    console.log("   📊 Response Status:", response.status);
    console.log("   📊 Response Data:", JSON.stringify(result, null, 2));

    if (response.ok && result.data) {
      if (result.data.status === "accepted" || result.data.status === "sent") {
        console.log("   ✅ BulkGate API is working");

        if (result.data.price === 0 && result.data.credit === 0) {
          console.log("\n   ⚠️  CRITICAL: Account has NO CREDITS!");
          console.log("   💳 This is why SMS is not being delivered");
          console.log("   🔗 Add credits at: https://portal.bulkgate.com");
          return false;
        } else {
          console.log(`   💰 Price: ${result.data.price}`);
          console.log(`   💳 Credit remaining: ${result.data.credit}`);
          console.log("   ✅ Account has credits - SMS should be delivered");
          return true;
        }
      } else {
        console.log(`   ⚠️  Unexpected status: ${result.data.status}`);
        return false;
      }
    } else {
      console.log("   ❌ BulkGate API returned error");
      return false;
    }
  } catch (error) {
    console.log("   ❌ Error connecting to BulkGate:", error.message);
    return false;
  }
};

// Test 3: Test localhost API
const testLocalhost = async () => {
  console.log("\n3️⃣  Testing Localhost API Endpoint:");

  try {
    console.log("   📡 Connecting to http://localhost:4000/api/otp/send");

    const response = await fetch("http://localhost:4000/api/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: "+8801718981009",
        type: "REGISTRATION",
      }),
    });

    console.log("   📊 Response Status:", response.status);

    const result = await response.json();
    console.log("   📊 Response Body:", JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log("   ✅ Localhost API is working");
      if (result.code) {
        console.log(`   🔢 OTP Code generated: ${result.code}`);
      }
      if (result.message && result.message.includes("no credits")) {
        console.log("   ⚠️  Message indicates no credits");
        return false;
      }
      return true;
    } else {
      console.log("   ❌ Localhost API returned error");
      return false;
    }
  } catch (error) {
    console.log("   ❌ Error connecting to localhost:", error.message);
    console.log("   💡 Make sure server is running: npm start");
    return false;
  }
};

// Run all tests
const runDiagnostics = async () => {
  const bulkGateOk = await testBulkGate();

  console.log("\n⏳ Waiting 2 seconds before testing localhost...");
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const localhostOk = await testLocalhost();

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 DIAGNOSTIC SUMMARY\n");

  console.log("BulkGate API:     ", bulkGateOk ? "✅ Working" : "❌ Issue");
  console.log("Localhost API:    ", localhostOk ? "✅ Working" : "❌ Issue");

  console.log("\n" + "=".repeat(60));
  console.log("\n🎯 CONCLUSION:\n");

  if (!bulkGateOk && !localhostOk) {
    console.log("❌ Main Issue: BulkGate account has NO CREDITS");
    console.log("\n📝 Action Required:");
    console.log("   1. Go to https://portal.bulkgate.com");
    console.log("   2. Login to your account");
    console.log("   3. Add credits ($10-20 recommended)");
    console.log("   4. Test again - SMS will be delivered!");
  } else if (!localhostOk) {
    console.log("⚠️  Localhost server might not be running");
    console.log("\n📝 Action Required:");
    console.log("   1. Start server: npm start");
    console.log("   2. Run diagnostic again: node diagnose-complete.js");
  } else {
    console.log("✅ Everything is working!");
    console.log("   SMS should be delivered to your phone.");
    console.log("   If not received, check:");
    console.log("   1. Phone number is correct");
    console.log("   2. Phone has signal");
    console.log("   3. Check spam/blocked messages");
  }

  console.log("\n" + "=".repeat(60) + "\n");
};

runDiagnostics();
