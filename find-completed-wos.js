/** @format */

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function findCompletedWOs() {
  const wos = await prisma.workOrder.findMany({
    where: {
      status: "COMPLETED_PENDING_PAYMENT",
      technicianId: 5, // Technician Adama Ba
    },
    select: {
      id: true,
      woNumber: true,
      status: true,
      subservice: {
        select: {
          name: true,
          baseRate: true,
        },
      },
    },
    take: 5,
  });

  console.log("\n📋 Available Work Orders for payment upload:\n");
  wos.forEach((wo) => {
    console.log(
      `✅ ID: ${wo.id} | WO#: ${wo.woNumber} | Service: ${
        wo.subservice?.name
      } | Amount: $${wo.subservice?.baseRate || "N/A"}`
    );
  });
  console.log(
    `\n💡 Replace {{woId}} in Postman with one of these IDs (e.g., ${wos[0]?.id})`
  );

  await prisma.$disconnect();
}

findCompletedWOs();
