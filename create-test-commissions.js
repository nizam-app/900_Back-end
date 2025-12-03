/** @format */

// Create test work orders with commissions
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createTestData() {
  console.log("\n🌱 Creating Test Work Orders with Commissions...\n");

  // Get freelancer technician (ID 5)
  const technician = await prisma.user.findUnique({
    where: { id: 5 },
    include: { technicianProfile: true },
  });

  if (!technician) {
    console.error("❌ Technician ID 5 not found!");
    return;
  }

  console.log(`👤 Technician: ${technician.name} (${technician.role})`);
  console.log(`💰 Commission Rate: ${(technician.technicianProfile?.commissionRate || 0.15) * 100}%\n`);

  // Get customer
  const customer = await prisma.user.findFirst({
    where: { role: "CUSTOMER" },
  });

  // Get category
  const category = await prisma.category.findFirst();
  const subservice = await prisma.subservice.findFirst();
  const service = await prisma.service.findFirst();

  const testJobs = [
    { name: "HVAC Maintenance", amount: 633, date: new Date("2025-12-03T14:00:00Z") },
    { name: "Plumbing Repair", amount: 500, date: new Date("2025-11-03T10:00:00Z") },
    { name: "HVAC Installation", amount: 1333, date: new Date("2025-11-02T15:00:00Z") },
    { name: "Electrical Repair", amount: 367, date: new Date("2025-11-01T09:00:00Z") },
  ];

  for (const job of testJobs) {
    const commissionRate = technician.technicianProfile?.commissionRate || 0.15;
    const commissionAmount = job.amount * commissionRate;

    // Create service request first
    const sr = await prisma.serviceRequest.create({
      data: {
        srNumber: `SR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        customerId: customer.id,
        categoryId: category.id,
        subserviceId: subservice.id,
        serviceId: service?.id,
        description: job.name,
        priority: "MEDIUM",
        address: "123 Test Street, Dhaka",
        paymentType: "CASH",
        status: "CONVERTED_TO_WO",
        source: "WEB_PORTAL",
      },
    });

    // Create work order
    const wo = await prisma.workOrder.create({
      data: {
        woNumber: `WO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        srId: sr.id,
        customerId: customer.id,
        technicianId: technician.id,
        categoryId: category.id,
        subserviceId: subservice.id,
        serviceId: service?.id,
        address: "123 Test Street, Dhaka",
        latitude: 23.8103,
        longitude: 90.4125,
        status: "COMPLETED",
        completedAt: job.date,
        scheduledAt: job.date,
        priority: "MEDIUM",
        paymentType: "CASH",
      },
    });

    // Create payment
    await prisma.payment.create({
      data: {
        woId: wo.id,
        amount: job.amount,
        method: "CASH",
        status: "PAID",
      },
    });

    // Create commission
    const commission = await prisma.commission.create({
      data: {
        type: "COMMISSION",
        amount: commissionAmount,
        rate: commissionRate,
        status: "EARNED",
        technician: {
          connect: { id: technician.id },
        },
        workOrder: {
          connect: { id: wo.id },
        },
      },
    });

    console.log(`✓ ${job.name}`);
    console.log(`  WO: ${wo.woNumber}`);
    console.log(`  Payment: $${job.amount}`);
    console.log(`  Commission: $${commissionAmount.toFixed(2)} (${commissionRate * 100}%)`);
    console.log(`  Date: ${job.date.toLocaleDateString()}\n`);

    // Update wallet
    const wallet = await prisma.wallet.upsert({
      where: { technicianId: technician.id },
      create: {
        technicianId: technician.id,
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
        technicianId: technician.id,
        type: "CREDIT",
        sourceType: "COMMISSION",
        sourceId: commission.id,
        amount: commissionAmount,
        description: `Commission from ${wo.woNumber}`,
      },
    });
  }

  // Show summary
  const totalCommissions = await prisma.commission.aggregate({
    where: { technicianId: technician.id },
    _sum: { amount: true },
    _count: true,
  });

  const wallet = await prisma.wallet.findUnique({
    where: { technicianId: technician.id },
  });

  console.log("📊 Summary:");
  console.log(`  Total Jobs: ${totalCommissions._count}`);
  console.log(`  Total Commissions: $${totalCommissions._sum.amount.toFixed(2)}`);
  console.log(`  Wallet Balance: $${wallet.balance.toFixed(2)}`);

  console.log("\n✅ Test data created successfully!\n");
  console.log("🔗 Test the API:");
  console.log(`   GET /api/commissions/my-commissions?status=EARNED`);
  console.log(`   GET /api/commissions/dashboard\n`);

  await prisma.$disconnect();
}

createTestData().catch((e) => {
  console.error("❌ Error:", e);
  process.exit(1);
});
