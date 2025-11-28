/** @format */

// Test OTP endpoint with purchased credits

const testOTPEndpoint = async () => {
  const phone = "+8801718981009";
  const type = "REGISTRATION";

  console.log("🧪 Testing OTP endpoint...");
  console.log("📱 Phone:", phone);
  console.log("📝 Type:", type);
  console.log("");

  try {
    // Test sending OTP
    console.log("📤 1. Sending OTP...");
    const sendResponse = await fetch("http://localhost:4000/api/otp/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: phone,
        type: type,
      }),
    });

    const sendResult = await sendResponse.json();
    console.log("📊 Response Status:", sendResponse.status);
    console.log("📊 Response:", JSON.stringify(sendResult, null, 2));

    if (sendResponse.ok) {
      console.log("\n✅ OTP sent successfully!");

      if (sendResult.code) {
        console.log("🔢 OTP Code:", sendResult.code);
        console.log("\n📱 Please check your phone for the SMS!");

        // Wait a bit then test verification
        console.log("\n⏳ Waiting 3 seconds before testing verification...");
        await new Promise((resolve) => setTimeout(resolve, 3000));

        console.log("\n📤 2. Testing OTP verification...");
        const verifyResponse = await fetch(
          "http://localhost:4000/api/otp/verify",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              phone: phone,
              code: sendResult.code,
              type: type,
            }),
          }
        );

        const verifyResult = await verifyResponse.json();
        console.log("📊 Verify Response Status:", verifyResponse.status);
        console.log(
          "📊 Verify Response:",
          JSON.stringify(verifyResult, null, 2)
        );

        if (verifyResponse.ok && verifyResult.verified) {
          console.log("\n✅ OTP verification successful!");
        } else {
          console.log("\n❌ OTP verification failed");
        }
      }
    } else {
      console.log("\n❌ Failed to send OTP");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
};

testOTPEndpoint();
