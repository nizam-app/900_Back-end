/** @format */

// Test profile-related endpoints
const BASE_URL = "http://localhost:4000";

// Test endpoints that match the profile screen mockup
async function testProfileEndpoints() {
  console.log("🧪 Testing Profile Screen Endpoints...\n");

  const techToken = "YOUR_TECH_TOKEN_HERE"; // Replace with actual token

  console.log("1. GET /api/commissions/my-payout-requests");
  console.log("   → Time Off Requests section (2 pending)");
  console.log("   Shows: status, amount, created date, review status\n");

  console.log("2. GET /api/technician/work-history");
  console.log("   → Work History section");
  console.log(
    "   Shows: completed jobs, total earnings, ratings, job details\n"
  );

  console.log("✅ Endpoints created:");
  console.log("   - /api/commissions/my-payout-requests");
  console.log("   - /api/technician/work-history");
  console.log("\n📖 Use Postman collection to test with authentication");
}

testProfileEndpoints();
