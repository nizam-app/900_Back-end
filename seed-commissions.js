/** @format */

// Seed commission data for testing
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedCommissions() {
  console.log("\n🌱 Seeding Commission Data...\n");

  // Find completed work orders without commissions
  const completedWOs = await prisma.workOrder.findMany({
    where: {
      status: "COMPLETED",
      technicianId: { not: null },
    },
    include: {
      commissions: true,
      payments: true,
      technician: {
        include: {
          technicianProfile: true,
        },
      },
      customer: { select: { name: true } },
      category: { select: { name: true } },
    },
  });

  console.log(`Found ${completedWOs.length} completed work orders\n`);

  for (const wo of completedWOs) {
    // Skip if already has commission
    if (wo.commissions.length > 0) {
      console.log(`✓ ${wo.woNumber} already has commission`);
      continue;
    }

    // Calculate commission (15% default rate)
    const payment = wo.payments[0];
    if (!payment) {
      console.log(`⚠ ${wo.woNumber} has no payment`);
      continue;
    }

    const commissionRate = wo.technician?.technicianProfile?.commissionRate || 0.15;
    const commissionAmount = payment.amount * commissionRate;

    // Create commission record
    const commission = await prisma.commission.create({
      data: {
        type: "COMMISSION",
        amount: commissionAmount,
        status: "EARNED",
        technicianId: wo.technicianId,
        workOrderId: wo.id,
      },
    });

    console.log(`✓ Created commission for ${wo.woNumber}`);
    console.log(`  ${wo.category.name} - ${wo.customer.name}`);
    console.log(`  Payment: $${payment.amount} × ${commissionRate * 100}% = $${commissionAmount}\n`);

    // Update or create wallet
    const wallet = await prisma.wallet.upsert({
      where: { technicianId: wo.technicianId },
      create: {
        technicianId: wo.technicianId,
        balance: commissionAmount,
      },
      update: {
        balance: { increment: commissionAmount },
      },
    });

    // Create wallet transaction
    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "CREDIT",
        amount: commissionAmount,
        description: `Commission from ${wo.woNumber}`,
        balanceBefore: wallet.balance - commissionAmount,
        balanceAfter: wallet.balance,
      },
    });
  }

  console.log("\n✅ Commission seeding complete!\n");
  await prisma.$disconnect();
}

seedCommissions().catch((e) => {
  console.error("❌ Error:", e);
  process.exit(1);
});
