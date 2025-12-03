/** @format */

import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

async function testTechnicianJobs() {
  console.log("📋 Testing Technician Jobs API\n");

  try {
    // Get technician user
    const technician = await prisma.user.findUnique({
      where: { phone: "5555555555" },
      include: {
        technicianProfile: true,
      },
    });

    if (!technician) {
      console.log("❌ Technician not found");
      return;
    }

    console.log(`✅ Testing for: ${technician.name} (${technician.phone})\n`);

    // Get all work orders for this technician
    const allJobs = await prisma.workOrder.findMany({
      where: { technicianId: technician.id },
      include: {
        customer: true,
        category: true,
        service: true,
      },
    });

    console.log(`📊 Total Work Orders: ${allJobs.length}\n`);

    // Count by status
    const incoming = allJobs.filter((wo) => wo.status === "ASSIGNED");
    const active = allJobs.filter((wo) =>
      ["ACCEPTED", "IN_PROGRESS"].includes(wo.status)
    );
    const done = allJobs.filter((wo) =>
      ["COMPLETED_PENDING_PAYMENT", "PAID_VERIFIED"].includes(wo.status)
    );

    console.log("📍 Status Breakdown:");
    console.log(`   Incoming (ASSIGNED): ${incoming.length}`);
    console.log(`   Active (ACCEPTED/IN_PROGRESS): ${active.length}`);
    console.log(
      `   Done (COMPLETED_PENDING_PAYMENT/PAID_VERIFIED): ${done.length}\n`
    );

    // Show incoming jobs
    if (incoming.length > 0) {
      console.log("🔔 INCOMING JOBS:");
      incoming.forEach((wo) => {
        const baseRate = wo.service?.baseRate || 0;
        const rate =
          technician.role === "TECH_FREELANCER"
            ? technician.technicianProfile.commissionRate
            : technician.technicianProfile.bonusRate;
        const bonus = baseRate * rate;

        console.log(`   • ${wo.woNumber}`);
        console.log(`     Customer: ${wo.customer?.name}`);
        console.log(`     Category: ${wo.category?.name}`);
        console.log(`     Payment: $${baseRate}`);
        console.log(`     Your Bonus: $${bonus.toFixed(2)}`);
        console.log(`     Status: ${wo.status}`);
        console.log(
          `     Scheduled: ${
            wo.scheduledAt ? wo.scheduledAt.toLocaleString() : "Not scheduled"
          }\n`
        );
      });
    }

    // Show active jobs
    if (active.length > 0) {
      console.log("⚡ ACTIVE JOBS:");
      active.forEach((wo) => {
        const baseRate = wo.service?.baseRate || 0;
        const rate =
          technician.role === "TECH_FREELANCER"
            ? technician.technicianProfile.commissionRate
            : technician.technicianProfile.bonusRate;
        const bonus = baseRate * rate;

        console.log(`   • ${wo.woNumber}`);
        console.log(`     Customer: ${wo.customer?.name}`);
        console.log(`     Category: ${wo.category?.name}`);
        console.log(`     Payment: $${baseRate}`);
        console.log(`     Your Bonus: $${bonus.toFixed(2)}`);
        console.log(`     Status: ${wo.status}`);
        console.log(`     Started: ${wo.startedAt || "Not started"}\n`);
      });
    }

    // Show done jobs
    if (done.length > 0) {
      console.log("✅ DONE JOBS:");
      done.forEach((wo) => {
        const baseRate = wo.service?.baseRate || 0;
        const rate =
          technician.role === "TECH_FREELANCER"
            ? technician.technicianProfile.commissionRate
            : technician.technicianProfile.bonusRate;
        const bonus = baseRate * rate;

        console.log(`   • ${wo.woNumber}`);
        console.log(`     Customer: ${wo.customer?.name}`);
        console.log(`     Category: ${wo.category?.name}`);
        console.log(`     Payment: $${baseRate}`);
        console.log(`     Your Bonus: $${bonus.toFixed(2)}`);
        console.log(`     Status: ${wo.status}`);
        console.log(
          `     Completed: ${
            wo.completedAt ? wo.completedAt.toLocaleString() : "Pending"
          }\n`
        );
      });
    }

    console.log("\n📡 API Endpoint URLs:");
    console.log("   GET /api/technician/jobs?status=incoming");
    console.log("   GET /api/technician/jobs?status=active");
    console.log("   GET /api/technician/jobs?status=done");
    console.log("   GET /api/technician/jobs (all jobs)\n");

    console.log("✅ Test completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testTechnicianJobs();
