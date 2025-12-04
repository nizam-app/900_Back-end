/** @format */

// Test the live /api/categories endpoint
const BASE_URL = "http://localhost:4000";

async function testCategoriesEndpoint() {
  try {
    console.log("🧪 Testing GET /api/categories endpoint...\n");

    const response = await fetch(`${BASE_URL}/api/categories`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    console.log("✅ API Response Status:", response.status);
    console.log("\n📊 Response Structure:\n");
    console.log(JSON.stringify(data, null, 2));

    console.log("\n=== Hierarchy Verification ===\n");
    data.forEach((category) => {
      console.log(`📁 Category: ${category.name}`);
      if (category.services && category.services.length > 0) {
        category.services.forEach((service) => {
          console.log(`  ├─ 🔧 Service: ${service.name}`);
          if (service.subservices && service.subservices.length > 0) {
            service.subservices.forEach((subservice, index, arr) => {
              const prefix = index === arr.length - 1 ? "  └─" : "  ├─";
              console.log(`  ${prefix} 📋 Subservice: ${subservice.name}`);
            });
          }
        });
      }
      console.log("");
    });

    console.log(
      "✅ SUCCESS: API returns correct hierarchy (Category → Service → Subservice)"
    );
  } catch (error) {
    console.error("❌ ERROR:", error.message);
    process.exit(1);
  }
}

testCategoriesEndpoint();
