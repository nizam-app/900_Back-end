/** @format */

import fetch from "node-fetch";

const BASE_URL = process.env.BASE_URL || "http://localhost:4000";

async function testCallCenter() {
  console.log("🧪 Testing Call Center Authentication\n");

  // Step 1: Login
  console.log("1️⃣ Logging in as Call Center...");
  const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phone: "3333333333",
      password: "callcenter123",
    }),
  });

  const loginData = await loginResponse.json();
  console.log("Status:", loginResponse.status);
  console.log("Response:", JSON.stringify(loginData, null, 2));

  if (!loginResponse.ok) {
    console.log("\n❌ Login failed!");
    return;
  }

  const token = loginData.token;
  console.log("\n✅ Login successful!");
  console.log("Token:", token.substring(0, 50) + "...");
  console.log("User role:", loginData.user.role);

  // Step 2: Test Dashboard Stats
  console.log("\n2️⃣ Testing Dashboard Stats endpoint...");
  const statsResponse = await fetch(`${BASE_URL}/api/call-center/stats`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const statsData = await statsResponse.json();
  console.log("Status:", statsResponse.status);
  console.log("Response:", JSON.stringify(statsData, null, 2));

  if (!statsResponse.ok) {
    console.log("\n❌ Dashboard stats failed!");
    console.log("Error:", statsData.message);
  } else {
    console.log("\n✅ Dashboard stats successful!");
  }

  // Step 3: Test Create Customer
  console.log("\n3️⃣ Testing Create Customer endpoint...");
  const customerResponse = await fetch(`${BASE_URL}/api/callcenter/customers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: "Test Customer",
      phone: "+8801900000999",
      email: "test@example.com",
      latitude: 23.8103,
      longitude: 90.4125,
      address: "Test Address, Dhaka",
    }),
  });

  const customerData = await customerResponse.json();
  console.log("Status:", customerResponse.status);
  console.log("Response:", JSON.stringify(customerData, null, 2));

  if (!customerResponse.ok) {
    console.log("\n❌ Create customer failed!");
    console.log("Error:", customerData.message);
  } else {
    console.log("\n✅ Create customer successful!");
  }
}

testCallCenter().catch(console.error);
