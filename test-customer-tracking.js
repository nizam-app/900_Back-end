// Test the new customer listing endpoint with registration source tracking

const baseURL = "https://outside.mtscorporate.com/api";

async function testCustomerTracking() {
  console.log("🧪 Testing Customer Registration Source Tracking\n");

  // You'll need to replace this with a valid admin/dispatcher token
  const adminToken = "YOUR_ADMIN_TOKEN_HERE";

  try {
    // Test 1: Get all customers
    console.log("📋 Test 1: Get all customers");
    const response1 = await fetch(`${baseURL}/admin/customers`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    const data1 = await response1.json();
    console.log("✅ Response:", JSON.stringify(data1, null, 2));
    console.log(
      `\n📊 Statistics:
      - Total: ${data1.total}
      - Self-Registered: ${data1.statistics.selfRegistered.count} (${data1.statistics.selfRegistered.percentage}%)
      - Call Center: ${data1.statistics.callCenterCreated.count} (${data1.statistics.callCenterCreated.percentage}%)
      - Admin: ${data1.statistics.adminCreated.count} (${data1.statistics.adminCreated.percentage}%)
      `
    );

    // Test 2: Filter by self-registered
    console.log("\n📋 Test 2: Get only self-registered customers");
    const response2 = await fetch(
      `${baseURL}/admin/customers?registrationSource=SELF_REGISTERED`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      }
    );
    const data2 = await response2.json();
    console.log(`✅ Found ${data2.customers.length} self-registered customers`);

    // Test 3: Filter by call center created
    console.log("\n📋 Test 3: Get only call center created customers");
    const response3 = await fetch(
      `${baseURL}/admin/customers?registrationSource=CALL_CENTER`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      }
    );
    const data3 = await response3.json();
    console.log(`✅ Found ${data3.customers.length} call center customers`);

    // Display sample customers
    if (data1.customers.length > 0) {
      console.log("\n👥 Sample Customers:");
      data1.customers.slice(0, 3).forEach((customer) => {
        console.log(`
        - ${customer.name} (${customer.phone})
          Source: ${customer.registrationSource || "Not set"}
          Created by: ${customer.createdBy ? `${customer.createdBy.name} (${customer.createdBy.role})` : "Self"}
          Created: ${new Date(customer.createdAt).toLocaleDateString()}
        `);
      });
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

// Run if this is a Node.js environment
if (typeof window === "undefined") {
  testCustomerTracking();
}

console.log(`
📝 Manual Testing Steps:

1. Get Admin Token:
   POST ${baseURL}/auth/login
   {
     "phone": "+8801798888888",
     "password": "your-admin-password"
   }

2. Get All Customers:
   GET ${baseURL}/admin/customers
   Headers: { "Authorization": "Bearer YOUR_TOKEN" }

3. Filter by Registration Source:
   GET ${baseURL}/admin/customers?registrationSource=SELF_REGISTERED
   GET ${baseURL}/admin/customers?registrationSource=CALL_CENTER
   GET ${baseURL}/admin/customers?registrationSource=ADMIN

4. Expected Response:
   {
     "total": 8,
     "statistics": {
       "selfRegistered": { "count": 4, "percentage": "50.0" },
       "callCenterCreated": { "count": 4, "percentage": "50.0" },
       "adminCreated": { "count": 0, "percentage": "0.0" },
       "webPortal": { "count": 0, "percentage": "0.0" },
       "unknown": { "count": 0, "percentage": "0.0" }
     },
     "customers": [
       {
         "id": 1,
         "name": "John Mitchell",
         "phone": "+8801712345678",
         "registrationSource": "CALL_CENTER",
         "createdBy": {
           "id": 5,
           "name": "Agent Smith",
           "role": "CALL_CENTER"
         },
         "createdAt": "2024-01-15T10:30:00.000Z"
       }
     ]
   }
`);
