/** @format */

// add-earned-commissions.js
// Add test commissions with EARNED status

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function addEarnedCommissions() {
  console.log("🌱 Adding EARNED commissions...\n");

  try {
    // Get existing work orders with payments
    const workOrders = await prisma.workOrder.findMany({
      where: {
        status: "PAID_VERIFIED",
        technicianId: { not: null },
      },
      include: {
        payments: {
          where: { status: "VERIFIED" },
        },
        technician: {
          include: {
            technicianProfile: true,
          },
        },
      },
      take: 5,
    });

    if (workOrders.length === 0) {
      console.log("❌ No verified work orders found. Run seed script first.");
      return;
    }

    let created = 0;

    for (const wo of workOrders) {
      if (!wo.payments || wo.payments.length === 0) continue;
      if (!wo.technician || !wo.technician.technicianProfile) continue;

      const payment = wo.payments[0];
      const profile = wo.technician.technicianProfile;

      // Check if commission already exists
      const existing = await prisma.commission.findFirst({
        where: {
          woId: wo.id,
          status: "EARNED",
        },
      });

      if (existing) {
        console.log(`⏭️  Skipping WO-${wo.id} - commission already exists`);
        continue;
      }

      const rate = profile.type === "FREELANCER" ? profile.commissionRate : profile.bonusRate;
      const amount = payment.amount * rate;
      const type = profile.type === "FREELANCER" ? "COMMISSION" : "BONUS";

      const commission = await prisma.commission.create({
        data: {
          woId: wo.id,
          technicianId: wo.technicianId,
          paymentId: payment.id,
          type,
          rate,
          amount,
          status: "EARNED", // This is what the endpoint needs!
        },
      });

      console.log(
        `✅ Created ${type}: WO-${wo.id} | ${wo.technician.name} | $${amount.toFixed(2)} | Status: EARNED`
      );
      created++;
    }

    console.log(`\n🎉 Successfully created ${created} EARNED commissions!`);
    console.log("\n📊 Now test the endpoint:");
    console.log("   GET /api/payouts/pending-commissions");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

addEarnedCommissions();
