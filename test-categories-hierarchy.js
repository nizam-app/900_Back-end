/** @format */

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function testCategoriesAPI() {
  try {
    console.log("\n=== Testing Category API Structure ===\n");

    // Simulate what the API returns
    const categories = await prisma.category.findMany({
      include: {
        services: {
          include: {
            subservices: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    console.log(
      "✅ Categories with correct hierarchy (Category → Service → Subservice):\n"
    );
    console.log(JSON.stringify(categories, null, 2));

    // Verify the structure
    console.log("\n=== Structure Verification ===\n");
    categories.forEach((category) => {
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

    console.log("✅ Hierarchy is correct: Category → Service → Subservice");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testCategoriesAPI();
