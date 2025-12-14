/** @format */

// check-sr-creator-field.js - Check if createdBy field is populated in database

import { prisma } from "./src/prisma.js";

async function checkSRCreatorField() {
  try {
    console.log("🔍 Checking Service Request Creator Information\n");

    // Get all service requests with creator info
    const srs = await prisma.serviceRequest.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            phone: true,
            role: true,
          },
        },
      },
    });

    console.log(`📊 Found ${srs.length} Service Requests (showing last 10)\n`);

    if (srs.length === 0) {
      console.log("⚠️  No service requests found in database");
      return;
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    srs.forEach((sr, index) => {
      console.log(`\n${index + 1}. SR Number: ${sr.srNumber}`);
      console.log(
        `   Customer: ${sr.customer?.name || "N/A"} (ID: ${sr.customerId})`
      );
      console.log(`   Status: ${sr.status}`);
      console.log(`   Source: ${sr.source || "N/A"}`);
      console.log(`   Created At: ${sr.createdAt.toLocaleString()}`);

      if (sr.createdBy) {
        console.log(`   ✅ Created By: ${sr.createdBy.name}`);
        console.log(`      - User ID: ${sr.createdBy.id}`);
        console.log(`      - Phone: ${sr.createdBy.phone}`);
        console.log(`      - Role: ${sr.createdBy.role}`);
      } else if (sr.createdById) {
        console.log(
          `   ⚠️  Created By ID: ${sr.createdById} (User data not found)`
        );
      } else {
        console.log(`   ⚠️  Created By: Not recorded (createdById is null)`);
      }
    });

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Summary statistics
    const withCreator = srs.filter((sr) => sr.createdBy).length;
    const withCreatorId = srs.filter(
      (sr) => sr.createdById && !sr.createdBy
    ).length;
    const withoutCreator = srs.filter((sr) => !sr.createdById).length;

    console.log("\n📈 Summary:");
    console.log(`   ✅ With Creator Info: ${withCreator}/${srs.length}`);
    console.log(
      `   ⚠️  With Creator ID (but no user): ${withCreatorId}/${srs.length}`
    );
    console.log(`   ❌ Without Creator: ${withoutCreator}/${srs.length}`);

    // Check Call Center created SRs specifically
    const callCenterSRs = srs.filter(
      (sr) => sr.createdBy?.role === "CALL_CENTER"
    );
    console.log(
      `   📞 Created by Call Center: ${callCenterSRs.length}/${srs.length}`
    );

    console.log("\n💡 Analysis:");
    if (withCreator === srs.length) {
      console.log(
        "   ✅ Perfect! All service requests have creator information."
      );
      console.log(
        "   ✅ Dispatchers can already see which Call Center agent created each SR."
      );
    } else if (withCreator > 0) {
      console.log(
        `   ⚠️  ${withCreator} out of ${srs.length} SRs have creator information.`
      );
      console.log(
        "   ⚠️  Some older SRs might not have this data (created before tracking was added)."
      );
    } else {
      console.log(
        "   ❌ No service requests have creator information recorded."
      );
      console.log(
        "   ❌ The createdById field might not be set during SR creation."
      );
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    await prisma.$disconnect();
  }
}

checkSRCreatorField();
