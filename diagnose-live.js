/** @format */

// Live Server Diagnostic Script
// Run this on your live server to check OTP configuration

import dotenv from "dotenv";
dotenv.config();

console.log("🔍 FSM API - Live Server Diagnostic\n");
console.log("=" .repeat(50));

// 1. Check Node.js version
console.log("\n1️⃣  Node.js Version:");
console.log(`   ${process.version}`);
if (parseInt(process.version.slice(1)) < 18) {
  console.log("   ⚠️  WARNING: Node.js 18+ required for built-in fetch API");
} else {
  console.log("   ✅ Node.js version is compatible");
}

// 2. Check Environment
console.log("\n2️⃣  Environment Configuration:");
console.log(`   NODE_ENV: ${process.env.NODE_ENV || "not set"}`);
console.log(`   PORT: ${process.env.PORT || "not set"}`);

// 3. Check BulkGate Credentials
console.log("\n3️⃣  BulkGate SMS API Credentials:");
const smsAppId = process.env.BULKGATE_SMS_APP_ID;
const smsToken = process.env.BULKGATE_SMS_APP_TOKEN;

if (smsAppId && smsToken) {
  console.log(`   Application ID: ${smsAppId}`);
  console.log(`   Token: ${smsToken.substring(0, 10)}...${smsToken.substring(smsToken.length - 5)}`);
  console.log("   ✅ SMS API credentials found");
} else {
  console.log("   ❌ ERROR: SMS API credentials missing!");
  console.log("   Missing:");
  if (!smsAppId) console.log("   - BULKGATE_SMS_APP_ID");
  if (!smsToken) console.log("   - BULKGATE_SMS_APP_TOKEN");
}

console.log("\n4️⃣  BulkGate OTP API Credentials:");
const otpAppId = process.env.BULKGATE_OTP_APP_ID;
const otpToken = process.env.BULKGATE_OTP_APP_TOKEN;

if (otpAppId && otpToken) {
  console.log(`   Application ID: ${otpAppId}`);
  console.log(`   Token: ${otpToken.substring(0, 10)}...${otpToken.substring(otpToken.length - 5)}`);
  console.log("   ✅ OTP API credentials found");
} else {
  console.log("   ❌ ERROR: OTP API credentials missing!");
  console.log("   Missing:");
  if (!otpAppId) console.log("   - BULKGATE_OTP_APP_ID");
  if (!otpToken) console.log("   - BULKGATE_OTP_APP_TOKEN");
}

// 4. Check Database Connection
console.log("\n5️⃣  Database Configuration:");
const dbUrl = process.env.DATABASE_URL;
if (dbUrl) {
  // Mask password in connection string
  const maskedUrl = dbUrl.replace(/:([^@]+)@/, ":****@");
  console.log(`   Database URL: ${maskedUrl}`);
  console.log("   ✅ Database URL configured");
} else {
  console.log("   ❌ ERROR: DATABASE_URL not set");
}

// 5. Test BulkGate API Connection
console.log("\n6️⃣  Testing BulkGate API Connection...");

const testConnection = async () => {
  if (!smsAppId || !smsToken) {
    console.log("   ⏭️  Skipping - credentials missing");
    return;
  }

  try {
    console.log("   📡 Connecting to portal.bulkgate.com...");
    
    const response = await fetch(
      "https://portal.bulkgate.com/api/1.0/simple/transactional",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          application_id: smsAppId,
          application_token: smsToken,
          number: "8801700000000", // Test number
          text: "Test connection",
          unicode: 0,
          sender_id: "gText",
          sender_id_value: "gText",
        }),
      }
    );

    const result = await response.json();

    if (response.ok) {
      console.log("   ✅ API connection successful");
      console.log(`   Status: ${response.status}`);
      
      if (result.data) {
        console.log(`   Response: ${result.data.status}`);
        console.log(`   Price: ${result.data.price}`);
        console.log(`   Credit: ${result.data.credit}`);
        
        if (result.data.price === 0 && result.data.credit === 0) {
          console.log("\n   ⚠️  WARNING: Account has NO CREDITS!");
          console.log("   🔗 Add credits at: https://portal.bulkgate.com");
        } else {
          console.log("   ✅ Account has sufficient credits");
        }
      }
    } else {
      console.log("   ❌ API connection failed");
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${JSON.stringify(result)}`);
    }
  } catch (error) {
    console.log("   ❌ Network error:");
    console.log(`   ${error.message}`);
    console.log("\n   Possible causes:");
    console.log("   - Firewall blocking outbound connections");
    console.log("   - DNS resolution issues");
    console.log("   - Network connectivity problems");
  }
};

await testConnection();

// 6. Summary
console.log("\n" + "=".repeat(50));
console.log("📊 DIAGNOSTIC SUMMARY\n");

const issues = [];
if (!smsAppId || !smsToken) issues.push("Missing SMS API credentials");
if (!otpAppId || !otpToken) issues.push("Missing OTP API credentials");
if (!dbUrl) issues.push("Missing database configuration");
if (!process.env.NODE_ENV) issues.push("NODE_ENV not set");

if (issues.length === 0) {
  console.log("✅ All configurations look good!");
  console.log("\nIf OTP still doesn't work, check:");
  console.log("1. BulkGate account has credits");
  console.log("2. Server can reach portal.bulkgate.com");
  console.log("3. Phone number format is correct (+8801XXXXXXXXX)");
  console.log("4. Check server logs for errors");
} else {
  console.log("❌ Issues found:\n");
  issues.forEach((issue, index) => {
    console.log(`   ${index + 1}. ${issue}`);
  });
  console.log("\n🔧 Fix these issues and run the diagnostic again.");
}

console.log("\n" + "=".repeat(50));
console.log("\n💡 Next Steps:");
console.log("1. Fix any issues listed above");
console.log("2. Restart your server");
console.log("3. Test OTP endpoint: POST /api/otp/send");
console.log("4. Check server logs for detailed error messages\n");
