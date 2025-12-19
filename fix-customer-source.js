/** @format */

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function fixCustomerSources() {
  console.log("🔧 Fixing customer registration sources...\n");

  // Get all customers without registrationSource
  const customersWithoutSource = await prisma.user.findMany({
    where: {
      role: "CUSTOMER",
      registrationSource: null,
    },
    select: {
      id: true,
      name: true,
      phone: true,
      passwordHash: true,
      createdById: true,
      serviceRequests: {
        select: {
          source: true,
        },
        take: 1,
      },
    },
  });

  console.log(
    `Found ${customersWithoutSource.length} customers without source\n`
  );

  let selfRegistered = 0;
  let callCenter = 0;
  let webPortal = 0;

  for (const customer of customersWithoutSource) {
    let source = "WEB_PORTAL"; // Default

    // Logic to determine source:
    // 1. If has password hash -> SELF_REGISTERED
    // 2. If createdById set -> CALL_CENTER
    // 3. If first SR is from CALL_CENTER -> CALL_CENTER
    // 4. Otherwise -> WEB_PORTAL (guest)

    if (customer.passwordHash && customer.passwordHash !== "") {
      source = "SELF_REGISTERED";
      selfRegistered++;
    } else if (customer.createdById) {
      source = "CALL_CENTER";
      callCenter++;
    } else if (customer.serviceRequests[0]?.source === "CALL_CENTER") {
      source = "CALL_CENTER";
      callCenter++;
    } else {
      webPortal++;
    }

    await prisma.user.update({
      where: { id: customer.id },
      data: { registrationSource: source },
    });

    console.log(`✅ ${customer.name || customer.phone} → ${source}`);
  }

  console.log(`\n📊 Summary:`);
  console.log(`   SELF_REGISTERED: ${selfRegistered}`);
  console.log(`   CALL_CENTER: ${callCenter}`);
  console.log(`   WEB_PORTAL: ${webPortal}`);
  console.log(`   Total fixed: ${customersWithoutSource.length}`);

  await prisma.$disconnect();
}

fixCustomerSources();
