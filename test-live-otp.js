/** @format */

// Direct OTP Test for Live Server
// Usage: node test-live-otp.js [phone_number] [server_url]

const args = process.argv.slice(2);
const phone = args[0] || "+8801718981009";
const serverUrl = args[1] || "http://localhost:4000";

console.log("🧪 Testing OTP on Live Server\n");
console.log("=" .repeat(50));
console.log(`📱 Phone: ${phone}`);
console.log(`🌐 Server: ${serverUrl}`);
console.log("=" .repeat(50) + "\n");

const testOTP = async () => {
  try {
    // Step 1: Send OTP
    console.log("1️⃣  Sending OTP request...\n");
    
    const sendResponse = await fetch(`${serverUrl}/api/otp/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: phone,
        type: "REGISTRATION",
      }),
    });

    console.log(`   Status: ${sendResponse.status} ${sendResponse.statusText}`);
    
    const sendResult = await sendResponse.json();
    console.log(`   Response:`, JSON.stringify(sendResult, null, 2));

    if (!sendResponse.ok) {
      console.log("\n❌ Failed to send OTP");
      console.log("   Check server logs for details");
      return;
    }

    console.log("\n✅ OTP sent successfully!");
    
    if (sendResult.code) {
      console.log(`\n🔢 OTP Code: ${sendResult.code}`);
      console.log("\n📱 Check your phone for SMS!");
      
      // Ask user to verify
      console.log("\n" + "=".repeat(50));
      console.log("2️⃣  To test verification:");
      console.log("\nRun this command with the OTP code you received:\n");
      console.log(`curl -X POST ${serverUrl}/api/otp/verify \\`);
      console.log(`  -H "Content-Type: application/json" \\`);
      console.log(`  -d '{"phone": "${phone}", "code": "${sendResult.code}", "type": "REGISTRATION"}'`);
      console.log("\nOr test it now? (You have 5 minutes to verify)");
      
      // Wait 5 seconds, then test verification
      console.log("\n⏳ Waiting 5 seconds before auto-testing verification...");
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      console.log("\n3️⃣  Testing OTP verification...\n");
      
      const verifyResponse = await fetch(`${serverUrl}/api/otp/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: phone,
          code: sendResult.code,
          type: "REGISTRATION",
        }),
      });

      console.log(`   Status: ${verifyResponse.status} ${verifyResponse.statusText}`);
      
      const verifyResult = await verifyResponse.json();
      console.log(`   Response:`, JSON.stringify(verifyResult, null, 2));

      if (verifyResponse.ok && verifyResult.verified) {
        console.log("\n✅ OTP verification successful!");
        console.log("\n🎉 All tests passed! Your OTP system is working correctly.");
      } else {
        console.log("\n❌ OTP verification failed");
        console.log("   This is normal if the OTP was already used or expired");
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("\n📊 Test Summary:");
    console.log(`   Server URL: ${serverUrl}`);
    console.log(`   Phone: ${phone}`);
    console.log(`   OTP Send: ${sendResponse.ok ? "✅ Success" : "❌ Failed"}`);
    console.log(`   SMS Delivered: Check your phone`);
    
  } catch (error) {
    console.error("\n❌ Error during test:");
    console.error(`   ${error.message}`);
    console.error("\nPossible causes:");
    console.error("   - Server is not running");
    console.error("   - Incorrect server URL");
    console.error("   - Network connectivity issues");
    console.error("   - Firewall blocking the connection");
  }
};

console.log("Starting test in 2 seconds...\n");
setTimeout(() => {
  testOTP().then(() => {
    console.log("\n✅ Test completed\n");
  });
}, 2000);
