/** @format */

// test-sms.js - Test BulkGate SMS and OTP APIs
import "dotenv/config";

// BulkGate API Configuration
const HTTP_SMS_CONFIG = {
  APPLICATION_ID: process.env.BULKGATE_SMS_APP_ID || "36014",
  APPLICATION_TOKEN:
    process.env.BULKGATE_SMS_APP_TOKEN ||
    "mS6UavzDJQ8KoJ2NZlSGmFaiPSNhsdBML1wq2ngi8rXvoTw0Qv",
  BASE_URL: "https://portal.bulkgate.com/api/1.0/simple",
};

const OTP_API_CONFIG = {
  APPLICATION_ID: process.env.BULKGATE_OTP_APP_ID || "36013",
  APPLICATION_TOKEN:
    process.env.BULKGATE_OTP_APP_TOKEN ||
    "7ohN0WzblPga1tugpwCXiHiQweVB3GImpmCanFNZSLsyhL87yR",
  BASE_URL: "https://portal.bulkgate.com/api/1.0/otp",
};

console.log("========================================");
console.log("🔧 BulkGate API Configuration Test");
console.log("========================================\n");

// 1. Check Environment Variables
console.log("📋 1. Environment Variables Check:");
console.log("----------------------------------------");
console.log(`SMS APP ID: ${HTTP_SMS_CONFIG.APPLICATION_ID}`);
console.log(
  `SMS Token: ${
    HTTP_SMS_CONFIG.APPLICATION_TOKEN
      ? HTTP_SMS_CONFIG.APPLICATION_TOKEN.substring(0, 10) + "..."
      : "NOT SET"
  }`
);
console.log(`OTP APP ID: ${OTP_API_CONFIG.APPLICATION_ID}`);
console.log(
  `OTP Token: ${
    OTP_API_CONFIG.APPLICATION_TOKEN
      ? OTP_API_CONFIG.APPLICATION_TOKEN.substring(0, 10) + "..."
      : "NOT SET"
  }`
);
console.log("");

// 2. Test SMS API Connection
async function testSMSAPI() {
  console.log("📱 2. Testing SMS API Connection:");
  console.log("----------------------------------------");

  try {
    // Test with GET request to check credentials
    const testPayload = {
      application_id: HTTP_SMS_CONFIG.APPLICATION_ID,
      application_token: HTTP_SMS_CONFIG.APPLICATION_TOKEN,
      number: "8801700000000", // Test number (won't actually send)
      text: "Test message - API check",
    };

    const response = await fetch(`${HTTP_SMS_CONFIG.BASE_URL}/transactional`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testPayload),
    });

    const result = await response.json();

    if (result.error) {
      console.log(`⚠️  API Response: ${JSON.stringify(result.error)}`);
      if (result.error.type === "invalid_number") {
        console.log(
          "✅ SMS API credentials are VALID! (Test number is invalid, but API works)"
        );
        return true;
      }
      console.log(`❌ SMS API Error: ${result.error.type || result.error}`);
      return false;
    } else {
      console.log("✅ SMS API is working!");
      console.log(`   Response: ${JSON.stringify(result.data || result)}`);
      return true;
    }
  } catch (error) {
    console.log(`❌ SMS API Error: ${error.message}`);
    return false;
  }
}

// 3. Test OTP API Connection
async function testOTPAPI() {
  console.log("\n🔐 3. Testing OTP API Connection:");
  console.log("----------------------------------------");

  try {
    const testPayload = {
      application_id: OTP_API_CONFIG.APPLICATION_ID,
      application_token: OTP_API_CONFIG.APPLICATION_TOKEN,
      number: "8801700000000", // Test number
      country: "bd",
      language: "en",
      code_type: "int",
      code_length: 6,
      request_quota_number: 1,
      request_quota_identification: "127.0.0.1", // Required field
      expiration: 300, // 5 minutes in seconds
      channel: {
        sms: {
          sender_id: "gText",
          sender_id_value: "FSM-OTP",
        },
      },
    };

    const response = await fetch(`${OTP_API_CONFIG.BASE_URL}/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testPayload),
    });

    const result = await response.json();

    if (result.error) {
      console.log(`⚠️  API Response: ${JSON.stringify(result.error)}`);
      if (
        result.error.type === "invalid_number" ||
        result.error.type === "low_credit"
      ) {
        console.log(
          "✅ OTP API credentials are VALID! (Test failed due to number/credit, but API works)"
        );
        return true;
      }
      console.log(`❌ OTP API Error: ${result.error.type || result.error}`);
      return false;
    } else {
      console.log("✅ OTP API is working!");
      console.log(`   Response: ${JSON.stringify(result.data || result)}`);
      return true;
    }
  } catch (error) {
    console.log(`❌ OTP API Error: ${error.message}`);
    return false;
  }
}

// Run tests
async function runTests() {
  const smsResult = await testSMSAPI();
  const otpResult = await testOTPAPI();

  console.log("\n========================================");
  console.log("📊 TEST SUMMARY");
  console.log("========================================");
  console.log(`SMS API: ${smsResult ? "✅ WORKING" : "❌ FAILED"}`);
  console.log(`OTP API: ${otpResult ? "✅ WORKING" : "❌ FAILED"}`);
  console.log("========================================\n");

  if (smsResult && otpResult) {
    console.log("🎉 All BulkGate APIs are properly configured!");
  } else {
    console.log("⚠️  Some APIs need attention. Check the errors above.");
  }
}

runTests();
