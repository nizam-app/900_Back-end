/** @format */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedTechnicianDashboardData() {
  console.log("🌱 Seeding Technician Dashboard Data...\n");

  try {
    const technicianId = 5; // Adama Ba
    const customerId = 1; // ali Customer
    const dispatcherId = 3; // Admin user
    const categoryId = 1; // HVAC Services
    const serviceId = 1;
    const subserviceId = 1;

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    // 1. Create TODAY'S JOBS (3 jobs scheduled for today)
    console.log("📅 Creating TODAY'S jobs...");
    
    const todayJob1 = await prisma.workOrder.create({
      data: {
        woNumber: `WO-TODAY-${Date.now()}-1`,
        srId: 1,
        customerId,
        technicianId,
        dispatcherId,
        categoryId,
        serviceId,
        subserviceId,
        address: "123 Today Street",
        latitude: 23.8103,
        longitude: 90.4125,
        paymentType: "CASH",
        priority: "HIGH",
        status: "ASSIGNED",
        scheduledAt: today, // SCHEDULED FOR TODAY
      },
    });
    console.log(`  ✅ Created TODAY job: ${todayJob1.woNumber} (ASSIGNED - Ready to start)`);

    const todayJob2 = await prisma.workOrder.create({
      data: {
        woNumber: `WO-TODAY-${Date.now()}-2`,
        srId: 1,
        customerId,
        technicianId,
        dispatcherId,
        categoryId,
        serviceId,
        subserviceId,
        address: "456 Morning Avenue",
        latitude: 23.8150,
        longitude: 90.4200,
        paymentType: "MOBILE_MONEY",
        priority: "NORMAL",
        status: "IN_PROGRESS", // IN PROGRESS
        scheduledAt: today,
        acceptedAt: new Date(today.getTime() - 2 * 60 * 60 * 1000), // Accepted 2 hours ago
        startedAt: new Date(today.getTime() - 1 * 60 * 60 * 1000), // Started 1 hour ago
      },
    });
    console.log(`  ✅ Created TODAY job: ${todayJob2.woNumber} (IN_PROGRESS)`);

    const todayJob3 = await prisma.workOrder.create({
      data: {
        woNumber: `WO-TODAY-${Date.now()}-3`,
        srId: 1,
        customerId,
        technicianId,
        dispatcherId,
        categoryId,
        serviceId,
        subserviceId,
        address: "789 Afternoon Lane",
        latitude: 23.8200,
        longitude: 90.4300,
        paymentType: "CASH",
        priority: "HIGH",
        status: "ASSIGNED",
        scheduledAt: new Date(today.getTime() + 3 * 60 * 60 * 1000), // Scheduled for later today
      },
    });
    console.log(`  ✅ Created TODAY job: ${todayJob3.woNumber} (ASSIGNED - scheduled for later)`);

    // 2. Create READY TO START jobs (ASSIGNED status, ready now)
    console.log("\n🎯 Creating READY TO START jobs...");
    
    const readyJob1 = await prisma.workOrder.create({
      data: {
        woNumber: `WO-READY-${Date.now()}-1`,
        srId: 1,
        customerId,
        technicianId,
        dispatcherId,
        categoryId,
        serviceId,
        subserviceId,
        address: "111 Ready Street",
        latitude: 23.8250,
        longitude: 90.4350,
        paymentType: "CASH",
        priority: "HIGH",
        status: "ASSIGNED",
        scheduledAt: yesterday, // Should have been done yesterday (overdue)
      },
    });
    console.log(`  ✅ Created READY job: ${readyJob1.woNumber} (OVERDUE)`);

    const readyJob2 = await prisma.workOrder.create({
      data: {
        woNumber: `WO-READY-${Date.now()}-2`,
        srId: 1,
        customerId,
        technicianId,
        dispatcherId,
        categoryId,
        serviceId,
        subserviceId,
        address: "222 Urgent Plaza",
        latitude: 23.8300,
        longitude: 90.4400,
        paymentType: "MOBILE_MONEY",
        priority: "URGENT",
        status: "ASSIGNED",
        scheduledAt: today,
      },
    });
    console.log(`  ✅ Created READY job: ${readyJob2.woNumber} (URGENT)`);

    // 3. Create more IN PROGRESS jobs
    console.log("\n⚡ Creating more IN PROGRESS jobs...");
    
    const inProgressJob = await prisma.workOrder.create({
      data: {
        woNumber: `WO-PROGRESS-${Date.now()}`,
        srId: 1,
        customerId,
        technicianId,
        dispatcherId,
        categoryId,
        serviceId,
        subserviceId,
        address: "333 Progress Road",
        latitude: 23.8350,
        longitude: 90.4450,
        paymentType: "CASH",
        priority: "NORMAL",
        status: "IN_PROGRESS",
        scheduledAt: today,
        acceptedAt: new Date(today.getTime() - 3 * 60 * 60 * 1000),
        startedAt: new Date(today.getTime() - 30 * 60 * 1000), // Started 30 mins ago
      },
    });
    console.log(`  ✅ Created IN PROGRESS job: ${inProgressJob.woNumber}`);

    // 4. Create COMPLETED THIS MONTH jobs with payments
    console.log("\n✅ Creating COMPLETED jobs for this month...");
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    for (let i = 1; i <= 5; i++) {
      const completedDate = new Date(startOfMonth.getTime() + i * 24 * 60 * 60 * 1000);
      
      const completedWO = await prisma.workOrder.create({
        data: {
          woNumber: `WO-COMPLETED-${Date.now()}-${i}`,
          srId: 1,
          customerId,
          technicianId,
          dispatcherId,
          categoryId,
          serviceId,
          subserviceId,
          address: `${100 + i} Completed Street`,
          latitude: 23.8100 + i * 0.001,
          longitude: 90.4100 + i * 0.001,
          paymentType: i % 2 === 0 ? "CASH" : "MOBILE_MONEY",
          priority: "NORMAL",
          status: "PAID_VERIFIED",
          scheduledAt: completedDate,
          acceptedAt: completedDate,
          startedAt: new Date(completedDate.getTime() + 1 * 60 * 60 * 1000),
          completedAt: new Date(completedDate.getTime() + 3 * 60 * 60 * 1000),
          paidVerifiedAt: new Date(completedDate.getTime() + 4 * 60 * 60 * 1000),
        },
      });

      // Create payment
      const amount = 500 + i * 100;
      const payment = await prisma.payment.create({
        data: {
          woId: completedWO.id,
          technicianId,
          amount,
          method: i % 2 === 0 ? "CASH" : "MOBILE_MONEY",
          status: "VERIFIED",
          verifiedById: dispatcherId,
          verifiedAt: new Date(completedDate.getTime() + 4 * 60 * 60 * 1000),
        },
      });

      // Create commission (EARNED status for dashboard)
      const commission = await prisma.commission.create({
        data: {
          woId: completedWO.id,
          technicianId,
          paymentId: payment.id,
          type: "COMMISSION",
          rate: 0.40, // 40%
          amount: amount * 0.40,
          status: "EARNED", // THIS WEEK'S EARNINGS
        },
      });

      console.log(`  ✅ WO ${i}: ${completedWO.woNumber} | $${amount} | Commission: $${commission.amount} (EARNED)`);
    }

    // 5. Create additional THIS WEEK commissions
    console.log("\n💰 Creating additional THIS WEEK commissions...");
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Add bonuses for internal employee work
    const bonusWO = await prisma.workOrder.findFirst({
      where: { 
        technicianId: 4, // Update 12-12 John (INTERNAL)
        status: "PAID_VERIFIED" 
      },
    });

    if (bonusWO) {
      const bonusPayment = await prisma.payment.findFirst({
        where: { woId: bonusWO.id, status: "VERIFIED" }
      });

      if (bonusPayment) {
        const bonus = await prisma.commission.create({
          data: {
            woId: bonusWO.id,
            technicianId: 4,
            paymentId: bonusPayment.id,
            type: "BONUS",
            rate: 0.05, // 5%
            amount: bonusPayment.amount * 0.05,
            status: "EARNED",
            createdAt: new Date(startOfWeek.getTime() + 2 * 24 * 60 * 60 * 1000),
          },
        });
        console.log(`  ✅ Created BONUS: $${bonus.amount} for internal employee`);
      }
    }

    // 6. Get final dashboard stats
    console.log("\n📊 DASHBOARD SUMMARY:");
    
    const stats = await prisma.workOrder.groupBy({
      by: ["status"],
      where: { technicianId },
      _count: true,
    });

    console.log("\nWork Order Status:");
    stats.forEach(stat => {
      console.log(`  ${stat.status}: ${stat._count}`);
    });

    const thisWeekCommissions = await prisma.commission.aggregate({
      where: {
        technicianId,
        status: { in: ["EARNED", "PAID"] },
        createdAt: { gte: startOfWeek },
      },
      _sum: { amount: true },
      _count: true,
    });

    console.log(`\n💰 This Week's Earnings:`);
    console.log(`  Commissions: ${thisWeekCommissions._count}`);
    console.log(`  Total: $${(thisWeekCommissions._sum.amount || 0).toFixed(2)}`);

    const jobsToday = await prisma.workOrder.count({
      where: {
        technicianId,
        scheduledAt: {
          gte: new Date(today.setHours(0, 0, 0, 0)),
          lt: new Date(today.setHours(23, 59, 59, 999)),
        },
      },
    });

    const activeJobs = await prisma.workOrder.count({
      where: {
        technicianId,
        status: { in: ["ASSIGNED", "IN_PROGRESS"] },
      },
    });

    const inProgressCount = await prisma.workOrder.count({
      where: {
        technicianId,
        status: "IN_PROGRESS",
      },
    });

    const readyToStartCount = await prisma.workOrder.count({
      where: {
        technicianId,
        status: "ASSIGNED",
      },
    });

    const completedThisMonth = await prisma.workOrder.count({
      where: {
        technicianId,
        status: "PAID_VERIFIED",
        completedAt: { gte: startOfMonth },
      },
    });

    console.log(`\n📈 Dashboard Stats:`);
    console.log(`  Jobs Today: ${jobsToday}`);
    console.log(`  Active Jobs: ${activeJobs}`);
    console.log(`  In Progress: ${inProgressCount}`);
    console.log(`  Ready to Start: ${readyToStartCount}`);
    console.log(`  Completed This Month: ${completedThisMonth}`);

    console.log("\n✅ Technician dashboard data seeded successfully!");
    console.log("\n🧪 Now test: GET /api/technician/dashboard");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTechnicianDashboardData();
