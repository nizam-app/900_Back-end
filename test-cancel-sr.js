/** @format */

// Test Cancel SR endpoint

import dotenv from "dotenv";
import { prisma } from "./src/prisma.js";
dotenv.config();

console.log("🔍 Testing Cancel SR Endpoint\n");
console.log("=".repeat(60));

const testEndpoint = async () => {
  try {
    // Check for available SRs that can be cancelled
    console.log("\n1️⃣  Checking Service Requests that can be cancelled:");

    const cancelableSRs = await prisma.serviceRequest.findMany({
      where: {
        status: {
          in: ["NEW", "OPEN"],
        },
      },
      take: 5,
      select: {
        id: true,
        srNumber: true,
        status: true,
        customerId: true,
        description: true,
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (cancelableSRs.length === 0) {
      console.log("   ❌ No cancelable Service Requests found");
      console.log(
        "   💡 All SRs are either already cancelled or converted to WO"
      );
      return;
    }

    console.log(
      `   ✅ Found ${cancelableSRs.length} cancelable Service Request(s):\n`
    );
    cancelableSRs.forEach((sr) => {
      console.log(`   - SR ID: ${sr.id}`);
      console.log(`     SR Number: ${sr.srNumber}`);
      console.log(`     Status: ${sr.status}`);
      console.log(
        `     Customer: ${sr.customer.name || "N/A"} (ID: ${sr.customerId})`
      );
      console.log(`     Description: ${sr.description || "N/A"}`);
      console.log("");
    });

    // Check for users who can cancel SRs
    console.log("\n2️⃣  Checking users who can cancel SRs:");

    const authorizedUsers = await prisma.user.findMany({
      where: {
        role: {
          in: ["CUSTOMER", "DISPATCHER", "CALL_CENTER", "ADMIN"],
        },
      },
      take: 5,
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
      },
    });

    console.log(`   ✅ Found ${authorizedUsers.length} authorized user(s):\n`);
    authorizedUsers.forEach((user) => {
      console.log(`   - User ID: ${user.id}`);
      console.log(`     Name: ${user.name || "N/A"}`);
      console.log(`     Phone: ${user.phone}`);
      console.log(`     Role: ${user.role}`);
      console.log("");
    });

    // Show example requests
    if (cancelableSRs.length > 0) {
      const exampleSR = cancelableSRs[0];

      console.log("\n" + "=".repeat(60));
      console.log("📋 EXAMPLE POSTMAN REQUEST:\n");

      // Example 1: Cancel by SR ID (numeric)
      console.log("Option 1: Cancel by SR ID (numeric)");
      console.log(`PATCH http://localhost:4000/api/sr/${exampleSR.id}/cancel`);
      console.log("\nHeaders:");
      console.log(`Authorization: Bearer <your-auth-token>`);
      console.log(`Content-Type: application/json`);
      console.log("\nBody (JSON):");
      console.log(
        JSON.stringify(
          {
            reason: "Changed my mind",
          },
          null,
          2
        )
      );

      console.log("\n" + "-".repeat(60));

      // Example 2: Cancel by SR Number (string)
      console.log("\nOption 2: Cancel by SR Number (string)");
      console.log(
        `PATCH http://localhost:4000/api/sr/${exampleSR.srNumber}/cancel`
      );
      console.log("\nHeaders:");
      console.log(`Authorization: Bearer <your-auth-token>`);
      console.log(`Content-Type: application/json`);
      console.log("\nBody (JSON):");
      console.log(
        JSON.stringify(
          {
            reason: "Changed my mind",
          },
          null,
          2
        )
      );

      console.log("\n💡 Important Notes:");
      console.log(
        `   1. You can use either SR ID (${exampleSR.id}) or SR Number (${exampleSR.srNumber})`
      );
      console.log(`   2. Customers can only cancel their own SRs`);
      console.log(`   3. Dispatcher/Admin/Call Center can cancel any SR`);
      console.log(`   4. Cannot cancel SR that's already converted to WO`);
      console.log(`   5. Body field is 'reason' not 'cancelReason'`);

      console.log("\n📝 To Test:");
      console.log("   1. Login as customer/dispatcher/admin");
      console.log("   2. Copy the auth token");
      console.log(`   3. Use URL: /api/sr/${exampleSR.id}/cancel`);
      console.log(`      OR: /api/sr/${exampleSR.srNumber}/cancel`);
      console.log(`   4. Send JSON body: {"reason": "Your reason here"}`);
    }
  } catch (error) {
    console.error("\n❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }

  console.log("\n" + "=".repeat(60) + "\n");
};

testEndpoint();
