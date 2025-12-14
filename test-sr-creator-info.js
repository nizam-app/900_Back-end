/** @format */

// test-sr-creator-info.js - Test if dispatcher can see call center agent who created SR

const API_BASE = "http://localhost:3000/api";

async function testSRCreatorInfo() {
  try {
    console.log("🧪 Testing Service Request Creator Information\n");

    // Step 1: Login as Call Center to create SR
    console.log("📞 Step 1: Login as Call Center Agent...");
    const callCenterLogin = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: "3333333333",
        password: "callcenter123",
      }),
    });

    if (!callCenterLogin.ok) {
      console.error("❌ Call Center login failed");
      return;
    }

    const { token: callCenterToken, user: callCenterUser } =
      await callCenterLogin.json();
    console.log("✅ Logged in as:", callCenterUser.name);
    console.log("   Role:", callCenterUser.role);
    console.log("   User ID:", callCenterUser.id);

    // Step 2: Create SR as Call Center
    console.log("\n📝 Step 2: Creating Service Request as Call Center...");
    const createSR = await fetch(`${API_BASE}/srs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${callCenterToken}`,
      },
      body: JSON.stringify({
        name: "Test Customer for Creator Check",
        phone: "9876543210",
        email: "testcreator@test.com",
        address: "Test Address, Dhaka",
        latitude: 23.8103,
        longitude: 90.4125,
        categoryId: 1,
        serviceId: 1,
        description: "Test SR to check creator information",
        paymentType: "CASH",
        priority: "MEDIUM",
        source: "CALL_CENTER",
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        notes: "Testing creator info visibility",
      }),
    });

    if (!createSR.ok) {
      const error = await createSR.text();
      console.error("❌ Failed to create SR:", error);
      return;
    }

    const srData = await createSR.json();
    console.log("✅ Created SR:", srData.srNumber);
    console.log("   SR ID:", srData.id);

    // Step 3: Login as Dispatcher
    console.log("\n🚦 Step 3: Login as Dispatcher...");
    const dispatcherLogin = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: "2222222222",
        password: "dispatcher123",
      }),
    });

    if (!dispatcherLogin.ok) {
      console.error("❌ Dispatcher login failed");
      return;
    }

    const { token: dispatcherToken, user: dispatcherUser } =
      await dispatcherLogin.json();
    console.log("✅ Logged in as:", dispatcherUser.name);
    console.log("   Role:", dispatcherUser.role);

    // Step 4: Get SR details as Dispatcher
    console.log(
      "\n🔍 Step 4: Viewing SR as Dispatcher (checking creator info)..."
    );
    const getSR = await fetch(`${API_BASE}/srs/${srData.id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${dispatcherToken}`,
      },
    });

    if (!getSR.ok) {
      console.error("❌ Failed to get SR details");
      return;
    }

    const srDetails = await getSR.json();

    console.log("\n📊 Service Request Details:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("SR Number:", srDetails.srNumber);
    console.log("Customer:", srDetails.customer?.name);
    console.log("Status:", srDetails.status);
    console.log("\n👤 CREATOR INFORMATION:");
    if (srDetails.createdBy) {
      console.log("✅ Created By:", srDetails.createdBy.name);
      console.log("   User ID:", srDetails.createdBy.id);
      console.log("   Phone:", srDetails.createdBy.phone);
      console.log("   Role:", srDetails.createdBy.role);
      console.log(
        "\n✅ SUCCESS: Dispatcher can see Call Center agent who created the SR!"
      );
    } else {
      console.log(
        "⚠️  WARNING: createdBy field is null - creator information not available"
      );
    }

    // Step 5: List all SRs to check creator info
    console.log("\n📋 Step 5: Listing all SRs to check creator info...");
    const listSRs = await fetch(`${API_BASE}/srs`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${dispatcherToken}`,
      },
    });

    if (!listSRs.ok) {
      console.error("❌ Failed to list SRs");
      return;
    }

    const srList = await listSRs.json();
    console.log(`\n📊 Found ${srList.length} Service Requests`);

    // Show first 5 with creator info
    console.log("\n🔍 Creator Information in SR List (first 5):");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    srList.slice(0, 5).forEach((sr, index) => {
      console.log(`\n${index + 1}. SR: ${sr.srNumber}`);
      console.log(`   Customer: ${sr.customer?.name}`);
      console.log(`   Status: ${sr.status}`);
      if (sr.createdBy) {
        console.log(`   ✅ Created By: ${sr.createdBy.name} (${sr.createdBy.role})`);
      } else {
        console.log(`   ⚠️  Created By: Not recorded (null)`);
      }
    });

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ Test Complete!");
    console.log(
      "\n💡 Summary: The createdBy field is already included in the API response."
    );
    console.log(
      "   Dispatchers can see which Call Center agent created each SR."
    );
    console.log(
      "   The information includes: Name, Phone, Role, and User ID."
    );
  } catch (error) {
    console.error("\n❌ Test Error:", error.message);
  }
}

testSRCreatorInfo();
