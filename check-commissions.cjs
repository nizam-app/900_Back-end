/** @format */

// Quick script to check commissions and work orders
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkData() {
  console.log("\n🔍 Checking Database...\n");

  // Check work orders
  const workOrders = await prisma.workOrder.findMany({
    where: { status: "COMPLETED" },
    include: {
      technician: { select: { id: true, name: true, role: true } },
      payments: { select: { amount: true, status: true } },
      commissions: { select: { amount: true, status: true } },
    },
  });

  console.log(`📋 Total Completed Work Orders: ${workOrders.length}\n`);

  workOrders.forEach((wo) => {
    console.log(`WO: ${wo.woNumber}`);
    console.log(`  Technician: ${wo.technician?.name} (ID: ${wo.technicianId})`);
    console.log(`  Payment: $${wo.payments[0]?.amount || 0}`);
    console.log(`  Commission: $${wo.commissions[0]?.amount || 0}`);
    console.log(`  Commission Status: ${wo.commissions[0]?.status || "NONE"}`);
    console.log("");
  });

  // Check commissions by technician
  const techIds = [4, 5]; // Internal and Freelancer
  for (const techId of techIds) {
    const tech = await prisma.user.findUnique({
      where: { id: techId },
      select: { id: true, name: true, role: true },
    });

    const commissions = await prisma.commission.findMany({
      where: { technicianId: techId },
      include: {
        workOrder: {
          select: {
            woNumber: true,
            completedAt: true,
            customer: { select: { name: true } },
            category: { select: { name: true } },
          },
        },
      },
    });

    console.log(
      `\n💰 ${tech?.name} (ID: ${techId}) - ${tech?.role}: ${commissions.length} commissions`
    );
    commissions.forEach((c) => {
      console.log(`  ${c.workOrder.category.name} - ${c.workOrder.customer.name}: $${c.amount} (${c.status})`);
    });
  }

  await prisma.$disconnect();
}

checkData().catch((e) => {
  console.error(e);
  process.exit(1);
});
