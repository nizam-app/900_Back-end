/** @format */

// Check BulkGate account balance

const checkBalance = async () => {
  const HTTP_SMS_CONFIG = {
    APPLICATION_ID: "36014",
    APPLICATION_TOKEN: "mS6UavzDJQ8KoJ2NZlSGmFaiPSNhsdBML1wq2ngi8rXvoTw0Qv",
  };

  const payload = {
    application_id: HTTP_SMS_CONFIG.APPLICATION_ID,
    application_token: HTTP_SMS_CONFIG.APPLICATION_TOKEN,
  };

  console.log("💳 Checking BulkGate account balance...\n");

  try {
    const response = await fetch(
      "https://portal.bulkgate.com/api/1.0/info/balance",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();
    console.log("📊 Response:", JSON.stringify(result, null, 2));

    if (result.data) {
      console.log("\n💰 Account Balance:", result.data.credit, "credits");
      console.log("💵 Currency:", result.data.currency);

      if (result.data.credit <= 0) {
        console.log("\n⚠️  WARNING: Your account has NO credits!");
        console.log("📝 This is why SMS messages are not being delivered.");
        console.log("🔗 Please add credits at: https://portal.bulkgate.com");
      }
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
};

checkBalance();
