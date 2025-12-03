import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testTechnicianEarnings() {
  console.log("💰 Testing Technician Earnings API\n");

  try {
    // Test Internal Technician
    const internalTech = await prisma.user.findUnique({
      where: { phone: "4444444444" },
      include: {
        technicianProfile: true,
      },
    });

    if (internalTech) {
      console.log(
        `\n👤 Internal Technician: ${internalTech.name} (${internalTech.phone})`
      );
      console.log(`   Role: ${internalTech.role}`);
      console.log(
        `   Bonus Rate: ${(internalTech.technicianProfile.bonusRate * 100).toFixed(0)}%`
      );
      console.log(
        `   Base Salary: $${internalTech.technicianProfile.baseSalary}`
      );

      // Get this month's commissions
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const thisMonth = await prisma.commission.aggregate({
        where: {
          technicianId: internalTech.id,
          createdAt: { gte: startOfMonth },
          status: { in: ["BOOKED", "PAID_OUT"] },
        },
        _sum: { amount: true },
      });

      const monthlyBonus = thisMonth._sum.amount || 0;
      const totalSalary =
        internalTech.technicianProfile.baseSalary + monthlyBonus;

      console.log(`   This Month Bonus: $${monthlyBonus.toFixed(2)}`);
      console.log(`   Total This Month: $${totalSalary.toFixed(2)}`);

      // Get recent bonuses
      const recentBonuses = await prisma.commission.findMany({
        where: {
          technicianId: internalTech.id,
          status: { in: ["BOOKED", "PAID_OUT"] },
        },
        include: {
          workOrder: {
            include: {
              customer: { select: { name: true } },
              service: { select: { name: true, baseRate: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      });

      if (recentBonuses.length > 0) {
        console.log(`\n   Recent Bonuses:`);
        recentBonuses.forEach((bonus) => {
          console.log(
            `   • ${bonus.workOrder?.service?.name || "Service"} - ${bonus.workOrder?.customer?.name || "Customer"}`
          );
          console.log(
            `     Job Payment: $${bonus.workOrder?.service?.baseRate || 0}`
          );
          console.log(`     Your Bonus: +$${bonus.amount.toFixed(2)}`);
          console.log(
            `     Date: ${bonus.createdAt.toLocaleDateString()}\n`
          );
        });
      }
    }

    // Test Freelancer
    const freelancer = await prisma.user.findUnique({
      where: { phone: "5555555555" },
      include: {
        technicianProfile: true,
      },
    });

    if (freelancer) {
      console.log(
        `\n👤 Freelancer: ${freelancer.name} (${freelancer.phone})`
      );
      console.log(`   Role: ${freelancer.role}`);
      console.log(
        `   Commission Rate: ${(freelancer.technicianProfile.commissionRate * 100).toFixed(0)}%`
      );

      // Get this month's commissions
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const thisMonth = await prisma.commission.aggregate({
        where: {
          technicianId: freelancer.id,
          createdAt: { gte: startOfMonth },
          status: { in: ["BOOKED", "PAID_OUT"] },
        },
        _sum: { amount: true },
      });

      const monthlyEarnings = thisMonth._sum.amount || 0;

      console.log(`   This Month Earnings: $${monthlyEarnings.toFixed(2)}`);

      // Get recent commissions
      const recentCommissions = await prisma.commission.findMany({
        where: {
          technicianId: freelancer.id,
          status: { in: ["BOOKED", "PAID_OUT"] },
        },
        include: {
          workOrder: {
            include: {
              customer: { select: { name: true } },
              service: { select: { name: true, baseRate: true } },
              category: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      });

      if (recentCommissions.length > 0) {
        console.log(`\n   Recent Commissions:`);
        recentCommissions.forEach((commission) => {
          console.log(
            `   • ${commission.workOrder?.service?.name || commission.workOrder?.category?.name || "Service"} - ${commission.workOrder?.customer?.name || "Customer"}`
          );
          console.log(
            `     Job Payment: $${commission.workOrder?.service?.baseRate || 0}`
          );
          console.log(
            `     Your Commission: +$${commission.amount.toFixed(2)}`
          );
          console.log(
            `     Date: ${commission.createdAt.toLocaleDateString()}\n`
          );
        });
      }
    }

    console.log("\n📡 API Endpoint:");
    console.log("   GET /api/technician/earnings");
    console.log("\n✅ Test completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testTechnicianEarnings();
