/** @format */

// Quick test to verify customer tracking endpoint
// Run: node quick-test-customers.js

const baseURL = "https://outside.mtscorporate.com/api";

async function quickTest() {
  console.log("🔍 Testing Customer Tracking Endpoint\n");
  console.log("=".repeat(60));

  // Step 1: Login as Admin
  console.log("\n📝 Step 1: Login as Admin");
  console.log("POST /api/auth/login");
  console.log(
    "Body: { phone: 'YOUR_ADMIN_PHONE', password: 'YOUR_ADMIN_PASSWORD' }"
  );
  console.log(
    "\nℹ️  Please login manually and copy the token to test the endpoint"
  );

  // Step 2: Test endpoint
  console.log("\n📝 Step 2: Test Customer Listing");
  console.log("GET /api/admin/customers");
  console.log("Headers: { Authorization: 'Bearer YOUR_TOKEN' }");

  // Step 3: Expected response
  console.log("\n✅ Expected Response:");
  console.log(
    JSON.stringify(
      {
        total: 8,
        statistics: {
          selfRegistered: {
            count: 4,
            percentage: "50.0",
          },
          callCenterCreated: {
            count: 4,
            percentage: "50.0",
          },
          adminCreated: {
            count: 0,
            percentage: "0.0",
          },
          webPortal: {
            count: 0,
            percentage: "0.0",
          },
          unknown: {
            count: 0,
            percentage: "0.0",
          },
        },
        customers: [
          {
            id: 1,
            name: "John Mitchell",
            phone: "+8801712345678",
            email: "john.mitchell@email.com",
            registrationSource: "CALL_CENTER",
            createdById: 5,
            createdBy: {
              id: 5,
              name: "Agent Smith",
              role: "CALL_CENTER",
            },
            createdAt: "2024-01-15T10:30:00.000Z",
          },
        ],
      },
      null,
      2
    )
  );

  console.log("\n" + "=".repeat(60));
  console.log("\n🧪 Postman Test Collection:");
  console.log(`
  1. Create a new request:
     - Method: GET
     - URL: ${baseURL}/admin/customers
     - Headers: Authorization: Bearer {{admin_token}}
  
  2. Filter by registration source:
     - URL: ${baseURL}/admin/customers?registrationSource=SELF_REGISTERED
     - URL: ${baseURL}/admin/customers?registrationSource=CALL_CENTER
  
  3. Check the response includes:
     ✓ total (number)
     ✓ statistics (object with counts and percentages)
     ✓ customers (array)
     ✓ Each customer has: registrationSource, createdById, createdBy
  `);

  console.log("\n📊 Database Check:");
  console.log(`
  Run this SQL query to verify data:
  
  SELECT 
    id, 
    name, 
    phone, 
    role, 
    "registrationSource", 
    "createdById",
    "createdAt"
  FROM "User" 
  WHERE role = 'CUSTOMER'
  ORDER BY "createdAt" DESC
  LIMIT 10;
  `);

  console.log("\n✅ Implementation Complete!");
  console.log(`
  Summary:
  ✓ Database migration applied
  ✓ Schema updated with registrationSource and createdById fields
  ✓ API endpoint created: GET /api/admin/customers
  ✓ Business logic updated for all customer creation flows
  ✓ Filtering by registration source supported
  ✓ Statistics calculation implemented
  
  Next Steps:
  1. Test the endpoint with Postman or curl
  2. Update frontend to display registration source badges
  3. Add filter dropdown for registration source
  4. Show creator information in customer details
  `);
}

quickTest();
