/** @format */

// Simple OTP test
const testPhone = "01718981009";
const serverUrl = "http://localhost:4000";

console.log("\n🧪 Testing OTP for:", testPhone);
console.log("=".repeat(50));

async function testOTP() {
  try {
    // Send OTP
    console.log("\n1️⃣  Sending OTP...");
    const sendResponse = await fetch(`${serverUrl}/api/otp/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: testPhone,
        type: "REGISTRATION",
      }),
    });

    const sendResult = await sendResponse.json();
    console.log("✅ Response:", JSON.stringify(sendResult, null, 2));

    if (sendResult.code) {
      console.log("\n🔢 OTP Code:", sendResult.code);
      console.log("📱 SMS Status:", sendResult.smsStatus);

      // Wait 2 seconds
      console.log("\n⏳ Waiting 2 seconds...");
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Verify OTP
      console.log("\n2️⃣  Verifying OTP...");
      const verifyResponse = await fetch(`${serverUrl}/api/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: testPhone,
          code: sendResult.code,
          type: "REGISTRATION",
        }),
      });

      const verifyResult = await verifyResponse.json();
      console.log("✅ Verification:", JSON.stringify(verifyResult, null, 2));

      console.log("\n" + "=".repeat(50));
      console.log("📊 SUMMARY");
      console.log("=".repeat(50));
      console.log("Phone:", testPhone);
      console.log("OTP Send:", sendResponse.ok ? "✅ SUCCESS" : "❌ FAILED");
      console.log("SMS Status:", sendResult.smsStatus);
      console.log(
        "OTP Verify:",
        verifyResponse.ok ? "✅ SUCCESS" : "❌ FAILED"
      );
      console.log(
        "\n🎉 OTP System is",
        sendResponse.ok && verifyResponse.ok ? "WORKING" : "NOT WORKING"
      );
    }
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.log("\n⚠️  Make sure the server is running on port 4000");
  }
}

testOTP();
