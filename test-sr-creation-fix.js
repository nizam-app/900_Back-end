/** @format */
// test-sr-creation-fix.js - Test the SR creation fixes
import axios from "axios";

const BASE_URL = process.env.BASE_URL || "http://147.93.107.217:3027";

console.log("🧪 Testing SR Creation Fixes (Dec 4, 2025)\n");

// Test 1: Guest SR creation WITH name (should succeed)
async function testGuestSRWithName() {
  console.log("📋 Test 1: Guest SR creation WITH name");
  try {
    const response = await axios.post(`${BASE_URL}/api/sr`, {
      name: "Test Guest User",
      phone: `070${Math.floor(1000000 + Math.random() * 9000000)}`,
      address: "123 Test Street, Nairobi",
      latitude: -1.286389,
      longitude: 36.817223,
      categoryId: 1,
      subserviceId: 1,
      description: "Test service request",
      paymentType: "CASH",
      priority: "MEDIUM",
      preferredDate: "2025-12-10T10:00:00Z",
      preferredTime: "Morning",
    });

    console.log("✅ SUCCESS - Status:", response.status);
    console.log("   SR Number:", response.data.srNumber);
    console.log("   Customer Name:", response.data.customerName);
    console.log(
      "   Preferred Date:",
      response.data.preferredAppointmentDate || response.data.preferredDate
    );
    console.log(
      "   Preferred Time:",
      response.data.preferredAppointmentTime || response.data.preferredTime
    );
    console.log("   Is Guest:", response.data.isGuest);
    return response.data;
  } catch (error) {
    console.log("❌ FAILED:", error.response?.data?.message || error.message);
    return null;
  }
}

// Test 2: Guest SR creation WITHOUT name (should fail)
async function testGuestSRWithoutName() {
  console.log("\n📋 Test 2: Guest SR creation WITHOUT name (should fail)");
  try {
    const response = await axios.post(`${BASE_URL}/api/sr`, {
      phone: `070${Math.floor(1000000 + Math.random() * 9000000)}`,
      address: "123 Test Street, Nairobi",
      categoryId: 1,
      subserviceId: 1,
      description: "Test service request",
    });

    console.log("❌ UNEXPECTED SUCCESS - This should have failed!");
    console.log("   Response:", response.data);
  } catch (error) {
    if (
      error.response?.status === 400 &&
      error.response?.data?.message?.includes("Name is required")
    ) {
      console.log("✅ CORRECTLY REJECTED");
      console.log("   Error:", error.response.data.message);
    } else {
      console.log(
        "⚠️  Failed with unexpected error:",
        error.response?.data?.message || error.message
      );
    }
  }
}

// Test 3: Update existing guest user's name
async function testUpdateGuestName() {
  console.log("\n📋 Test 3: Update existing guest user's name");

  const testPhone = `070${Math.floor(1000000 + Math.random() * 9000000)}`;

  try {
    // Create first SR with original name
    console.log("   Creating first SR with name 'Original Name'...");
    const first = await axios.post(`${BASE_URL}/api/sr`, {
      name: "Original Name",
      phone: testPhone,
      address: "123 Test Street",
      categoryId: 1,
      subserviceId: 1,
    });
    console.log(
      "   ✓ First SR created, customer name:",
      first.data.customerName
    );

    // Wait a moment
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Create second SR with updated name
    console.log("   Creating second SR with name 'Updated Name'...");
    const second = await axios.post(`${BASE_URL}/api/sr`, {
      name: "Updated Name",
      phone: testPhone,
      address: "456 Test Avenue",
      categoryId: 1,
      subserviceId: 1,
    });

    if (second.data.customerName === "Updated Name") {
      console.log("✅ SUCCESS - Name updated correctly");
      console.log("   New customer name:", second.data.customerName);
    } else {
      console.log("❌ FAILED - Name not updated");
      console.log("   Expected: 'Updated Name'");
      console.log("   Got:", second.data.customerName);
    }
  } catch (error) {
    console.log("❌ FAILED:", error.response?.data?.message || error.message);
  }
}

// Test 4: Verify response includes all required fields
async function testResponseFields() {
  console.log("\n📋 Test 4: Verify response includes all required fields");
  try {
    const response = await axios.post(`${BASE_URL}/api/sr`, {
      name: "Field Test User",
      phone: `070${Math.floor(1000000 + Math.random() * 9000000)}`,
      address: "123 Test Street",
      categoryId: 1,
      subserviceId: 1,
      preferredDate: "2025-12-15T14:00:00Z",
      preferredTime: "Afternoon",
    });

    const requiredFields = [
      "srId",
      "srNumber",
      "status",
      "isGuest",
      "customerName",
      "preferredAppointmentDate",
      "preferredAppointmentTime",
    ];

    let allFieldsPresent = true;
    for (const field of requiredFields) {
      // Check both direct field and nested fields
      const hasField =
        response.data[field] !== undefined ||
        (field === "preferredAppointmentDate" && response.data.preferredDate) ||
        (field === "preferredAppointmentTime" && response.data.preferredTime);

      if (!hasField) {
        console.log(`   ❌ Missing field: ${field}`);
        allFieldsPresent = false;
      }
    }

    if (allFieldsPresent) {
      console.log("✅ SUCCESS - All required fields present");
      console.log("   Fields:", Object.keys(response.data).join(", "));
    } else {
      console.log("❌ FAILED - Some fields missing");
    }
  } catch (error) {
    console.log("❌ FAILED:", error.response?.data?.message || error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log("🚀 Starting tests...\n");
  console.log("=".repeat(60));

  await testGuestSRWithName();
  await testGuestSRWithoutName();
  await testUpdateGuestName();
  await testResponseFields();

  console.log("\n" + "=".repeat(60));
  console.log("\n✅ All tests completed!\n");
}

runAllTests().catch((error) => {
  console.error("❌ Test suite failed:", error.message);
  process.exit(1);
});
