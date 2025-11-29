/** @format */

// Direct OTP test to debug SMS delivery issue

const testOTP = async () => {
  const phone = "8801718981009"; // Without +
  const text = "Test OTP: 123456. This is a test message from FSM System.";

  const HTTP_SMS_CONFIG = {
    APPLICATION_ID: "36014",
    APPLICATION_TOKEN: "mS6UavzDJQ8KoJ2NZlSGmFaiPSNhsdBML1wq2ngi8rXvoTw0Qv",
    BASE_URL: "https://portal.bulkgate.com/api/1.0/simple",
  };

  const payload = {
    application_id: HTTP_SMS_CONFIG.APPLICATION_ID,
    application_token: HTTP_SMS_CONFIG.APPLICATION_TOKEN,
    number: phone,
    text: text,
    unicode: 0,
    sender_id: "gText",
    sender_id_value: "gText",
  };

  console.log("📤 Sending test SMS...");
  console.log("📱 Phone:", phone);
  console.log("📝 Payload:", JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(`${HTTP_SMS_CONFIG.BASE_URL}/transactional`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    console.log("\n📊 Response Status:", response.status);
    console.log("📊 Response:", JSON.stringify(result, null, 2));

    if (result.data) {
      console.log("\n✅ SMS Status:", result.data.status);
      console.log("💰 Price:", result.data.price);
      console.log("💳 Credit:", result.data.credit);
      console.log("🆔 SMS ID:", result.data.sms_id);
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
};

testOTP();
