/** @format */

// Quick test of OTP endpoint on localhost

const testLocalhost = async () => {
  const phone = "+8801718981009";
  
  console.log("🧪 Testing localhost OTP endpoint...\n");
  
  try {
    const response = await fetch("http://localhost:4000/api/otp/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: phone,
        type: "REGISTRATION",
      }),
    });

    console.log(`📊 Response Status: ${response.status}`);
    
    const result = await response.json();
    console.log(`📊 Response Body:`, JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log("\n✅ Localhost is working!");
      if (result.code) {
        console.log(`🔢 OTP Code: ${result.code}`);
      }
      if (result.message && result.message.includes("no credits")) {
        console.log("\n⚠️  Note: BulkGate account has no credits");
        console.log("💳 Add credits at: https://portal.bulkgate.com");
      }
    } else {
      console.log("\n❌ Localhost endpoint returned error");
    }
  } catch (error) {
    console.error("\n❌ Error connecting to localhost:");
    console.error(`   ${error.message}`);
    console.error("\n💡 Make sure server is running: npm start");
  }
};

testLocalhost();
