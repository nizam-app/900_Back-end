/** @format */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testTechnicianDashboard() {
  const technicianId = 5; // Mike Freelancer

  console.log("📊 Testing Technician Dashboard Data\n");

  // Get profile data (simulating getUserProfile service)
  const user = await prisma.user.findUnique({
    where: { id: technicianId },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      role: true,
      technicianProfile: {
        select: {
          id: true,
          type: true,
          commissionRate: true,
          bonusRate: true,
          baseSalary: true,
          status: true,
          specialization: true,
          degreesUrl: true,
        },
      },
    },
  });

  // Parse skills
  let skills = [];
  if (user.technicianProfile.specialization) {
    try {
      skills =
        typeof user.technicianProfile.specialization === "string"
          ? JSON.parse(user.technicianProfile.specialization)
          : user.technicianProfile.specialization;
    } catch {
      skills = user.technicianProfile.specialization
        .split(",")
        .map((s) => s.trim());
    }
  }

  // Parse certifications
  let certifications = [];
  if (user.technicianProfile.degreesUrl) {
    try {
      certifications =
        typeof user.technicianProfile.degreesUrl === "string"
          ? JSON.parse(user.technicianProfile.degreesUrl)
          : user.technicianProfile.degreesUrl;
    } catch {
      certifications = [];
    }
  }

  console.log("✅ 8.1 Availability Status:");
  console.log(`   Status: ${user.technicianProfile.status}`);
  console.log(
    `   ${
      user.technicianProfile.status === "ACTIVE" ? "✓" : "✗"
    } Can accept new jobs\n`
  );

  console.log("✅ 8.2 Skills & Specializations:");
  console.log(`   Skills Array: ${JSON.stringify(skills)}`);
  console.log(`   Count: ${skills.length} skills`);
  skills.forEach((skill) => console.log(`   - ${skill}`));
  console.log();

  console.log("✅ 8.3 My Certifications:");
  console.log(`   Certifications Array: ${certifications.length} verified`);
  certifications.forEach((cert, idx) =>
    console.log(`   ${idx + 1}. ${cert.name}`)
  );
  console.log();

  console.log("❌ 8.4 Languages:");
  console.log("   Not yet implemented in schema\n");

  // Get work order statistics
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  // Jobs Today
  const jobsToday = await prisma.workOrder.count({
    where: {
      technicianId,
      scheduledAt: {
        gte: startOfDay,
      },
    },
  });

  // Active Jobs
  const activeJobs = await prisma.workOrder.count({
    where: {
      technicianId,
      status: {
        in: ["ASSIGNED", "IN_PROGRESS"],
      },
    },
  });

  // Completed This Month
  const completedThisMonth = await prisma.workOrder.count({
    where: {
      technicianId,
      status: "PAID_VERIFIED",
      completedAt: {
        gte: startOfMonth,
      },
    },
  });

  // In Progress
  const inProgress = await prisma.workOrder.count({
    where: {
      technicianId,
      status: "IN_PROGRESS",
    },
  });

  // This Week's Bonus/Commission
  const thisWeekCommissions = await prisma.commission.aggregate({
    where: {
      technicianId,
      createdAt: {
        gte: startOfWeek,
      },
      status: {
        in: ["BOOKED", "PAID_OUT"],
      },
    },
    _sum: {
      amount: true,
    },
  });

  // Total Earned (all time)
  const totalEarned = await prisma.commission.aggregate({
    where: {
      technicianId,
      status: {
        in: ["BOOKED", "PAID_OUT"],
      },
    },
    _sum: {
      amount: true,
    },
  });

  console.log("✅ 9.1 This Week's Bonus and Jobs Today:");
  console.log(`   This Week's Bonus: $${thisWeekCommissions._sum.amount || 0}`);
  console.log(`   Jobs Today: ${jobsToday}\n`);

  console.log("✅ 9.2 Dashboard Stats:");
  console.log(`   This Week Earned: $${thisWeekCommissions._sum.amount || 0}`);
  console.log(`   Total Earned: $${totalEarned._sum.amount || 0}`);
  console.log(`   Active Jobs: ${activeJobs}`);
  console.log(`   Completed (This Month): ${completedThisMonth}`);
  console.log(`   In Progress: ${inProgress}\n`);

  console.log("📝 Profile Response Structure:");
  const profileResponse = {
    ...user,
    technicianProfile: {
      ...user.technicianProfile,
      skills, // Array for UI
      certifications, // Array for UI
    },
  };
  console.log(JSON.stringify(profileResponse, null, 2));

  await prisma.$disconnect();
}

testTechnicianDashboard().catch((error) => {
  console.error("❌ Test failed:", error);
  process.exit(1);
});
