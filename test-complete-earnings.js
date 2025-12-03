/** @format */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testCompleteEarnings() {
  console.log("💰 Testing Complete Earnings Screen Data\n");

  try {
    const freelancer = await prisma.user.findUnique({
      where: { phone: "5555555555" },
      include: {
        technicianProfile: true,
      },
    });

    if (!freelancer) {
      console.log("❌ Freelancer not found");
      return;
    }

    console.log(`✅ Testing for: ${freelancer.name}\n`);

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59
    );

    // Get all metrics
    const [today, week, month, lastMonth, total, weekJobs] = await Promise.all([
      prisma.commission.aggregate({
        where: {
          technicianId: freelancer.id,
          createdAt: { gte: startOfDay },
          status: { in: ["BOOKED", "PAID_OUT"] },
        },
        _sum: { amount: true },
      }),
      prisma.commission.aggregate({
        where: {
          technicianId: freelancer.id,
          createdAt: { gte: startOfWeek },
          status: { in: ["BOOKED", "PAID_OUT"] },
        },
        _sum: { amount: true },
      }),
      prisma.commission.aggregate({
        where: {
          technicianId: freelancer.id,
          createdAt: { gte: startOfMonth },
          status: { in: ["BOOKED", "PAID_OUT"] },
        },
        _sum: { amount: true },
      }),
      prisma.commission.aggregate({
        where: {
          technicianId: freelancer.id,
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
          status: { in: ["BOOKED", "PAID_OUT"] },
        },
        _sum: { amount: true },
      }),
      prisma.commission.aggregate({
        where: {
          technicianId: freelancer.id,
          status: { in: ["BOOKED", "PAID_OUT"] },
        },
        _sum: { amount: true },
      }),
      prisma.commission.count({
        where: {
          technicianId: freelancer.id,
          createdAt: { gte: startOfWeek },
          status: { in: ["BOOKED", "PAID_OUT"] },
        },
      }),
    ]);

    const todayAmount = today._sum.amount || 0;
    const weekAmount = week._sum.amount || 0;
    const monthAmount = month._sum.amount || 0;
    const lastMonthAmount = lastMonth._sum.amount || 0;
    const totalAmount = total._sum.amount || 0;

    // Calculate increase rate
    let increaseRate = 0;
    if (lastMonthAmount > 0) {
      increaseRate = ((monthAmount - lastMonthAmount) / lastMonthAmount) * 100;
    } else if (monthAmount > 0) {
      increaseRate = 100;
    }

    console.log("📊 EARNINGS SCREEN DATA:\n");

    console.log("1️⃣  Total Bonuses (All Time)");
    console.log(`   Amount: $${totalAmount.toFixed(2)}`);
    console.log(
      `   Increase Rate: ${increaseRate >= 0 ? "+" : ""}${increaseRate.toFixed(
        1
      )}% from last month`
    );
    console.log(
      `   (Last Month: $${lastMonthAmount}, This Month: $${monthAmount})\n`
    );

    console.log("2️⃣  Breakdown Cards:");
    console.log(`   Today: $${todayAmount.toFixed(2)}`);
    console.log(
      `   This Week (${
        freelancer.technicianProfile.commissionRate * 100
      }%): $${weekAmount.toFixed(2)}`
    );
    console.log(`   This Month: $${monthAmount.toFixed(2)}\n`);

    console.log("3️⃣  Available Bonus (This Week's Earnings):");
    console.log(`   Amount: $${weekAmount.toFixed(2)}`);
    console.log(`   Jobs: ${weekJobs} job${weekJobs !== 1 ? "s" : ""}`);
    console.log(
      `   Rate: ${freelancer.technicianProfile.commissionRate * 100}% bonus`
    );
    console.log(`   Payout: Regular payout: Every Monday\n`);

    console.log("✅ API Response Structure:");
    console.log(`{
  "totalBonuses": {
    "amount": ${totalAmount},
    "increaseRate": ${increaseRate.toFixed(1)},
    "increaseText": "${increaseRate >= 0 ? "+" : ""}${increaseRate.toFixed(
      1
    )}% from last month"
  },
  "breakdown": {
    "today": ${todayAmount},
    "thisWeek": ${weekAmount},
    "thisWeekPercentage": ${freelancer.technicianProfile.commissionRate * 100},
    "thisMonth": ${monthAmount}
  },
  "availableBonus": {
    "amount": ${weekAmount},
    "jobsCount": ${weekJobs},
    "jobsText": "${weekJobs} job${weekJobs !== 1 ? "s" : ""}",
    "bonusText": "${freelancer.technicianProfile.commissionRate * 100}% bonus",
    "payoutInfo": "Regular payout: Every Monday"
  }
}`);

    console.log("\n📡 Endpoint: GET /api/technician/earnings");
    console.log("✅ All metrics implemented!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testCompleteEarnings();
