/** @format */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function diagnoseDashboard() {
  console.log("🔍 Diagnosing Technician Dashboard...\n");

  const technicianId = 5; // Adama Ba from Postman screenshot
  const now = new Date();

  // Calculate date ranges
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  console.log("📅 Date Ranges:");
  console.log("   Current Time:", now.toISOString());
  console.log("   Start of Week:", startOfWeek.toISOString());
  console.log("   Start of Month:", startOfMonth.toISOString());
  console.log();

  // Get all commissions
  const allCommissions = await prisma.commission.findMany({
    where: {
      technicianId,
    },
    include: {
      workOrder: {
        include: {
          service: true,
          customer: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  console.log(
    `💰 Total Commissions for Technician ${technicianId}: ${allCommissions.length}\n`
  );

  // Group by status
  const byStatus = {};
  allCommissions.forEach((c) => {
    if (!byStatus[c.status]) {
      byStatus[c.status] = [];
    }
    byStatus[c.status].push(c);
  });

  console.log("📊 Commissions by Status:");
  Object.keys(byStatus).forEach((status) => {
    const total = byStatus[status].reduce((sum, c) => sum + c.amount, 0);
    console.log(
      `   ${status}: ${byStatus[status].length} records = $${total.toFixed(2)}`
    );
  });
  console.log();

  // This Week's commissions (EARNED + PAID)
  const thisWeekCommissions = await prisma.commission.findMany({
    where: {
      technicianId,
      createdAt: {
        gte: startOfWeek,
      },
      status: {
        in: ["EARNED", "PAID"],
      },
    },
  });

  console.log("📅 This Week's Commissions (EARNED + PAID):");
  console.log(`   Count: ${thisWeekCommissions.length}`);
  const thisWeekTotal = thisWeekCommissions.reduce(
    (sum, c) => sum + c.amount,
    0
  );
  console.log(`   Total: $${thisWeekTotal.toFixed(2)}`);
  console.log();

  // Show each commission with date
  console.log("📋 Details:");
  thisWeekCommissions.forEach((c) => {
    console.log(
      `   WO-${c.woId} | $${c.amount} | ${
        c.status
      } | Created: ${c.createdAt.toISOString()}`
    );
  });
  console.log();

  // Total Earned (all time) - EARNED + PAID
  const totalEarnedCommissions = await prisma.commission.findMany({
    where: {
      technicianId,
      status: {
        in: ["EARNED", "PAID"],
      },
    },
  });

  console.log("💰 Total Earned (All Time - EARNED + PAID):");
  console.log(`   Count: ${totalEarnedCommissions.length}`);
  const totalEarned = totalEarnedCommissions.reduce(
    (sum, c) => sum + c.amount,
    0
  );
  console.log(`   Total: $${totalEarned.toFixed(2)}`);
  console.log();

  // Check what the dashboard API expects
  console.log("🎯 Expected Dashboard Response:");
  console.log(`   thisWeekBonus: ${thisWeekTotal.toFixed(2)}`);
  console.log(`   thisWeekEarned: ${thisWeekTotal.toFixed(2)}`);
  console.log(`   totalEarned: ${totalEarned.toFixed(2)}`);
  console.log();

  // Show what Postman is showing
  console.log("📱 Postman Shows:");
  console.log("   thisWeekBonus: 11266");
  console.log("   thisWeekEarned: 11269");
  console.log("   totalEarned: 39399.96");
  console.log();

  // Check if there are old PAID commissions
  const allPaidCommissions = await prisma.commission.findMany({
    where: {
      technicianId,
      status: "PAID",
    },
  });

  console.log(`💵 All PAID Commissions: ${allPaidCommissions.length}`);
  const allPaidTotal = allPaidCommissions.reduce((sum, c) => sum + c.amount, 0);
  console.log(`   Total: $${allPaidTotal.toFixed(2)}`);
  console.log();

  // Show all statuses with totals
  console.log("📈 Complete Breakdown:");
  const statusTotals = await prisma.commission.groupBy({
    by: ["status"],
    where: {
      technicianId,
    },
    _sum: {
      amount: true,
    },
    _count: true,
  });

  statusTotals.forEach((s) => {
    console.log(
      `   ${s.status}: ${s._count} records = $${(s._sum.amount || 0).toFixed(
        2
      )}`
    );
  });

  await prisma.$disconnect();
}

diagnoseDashboard().catch(console.error);
