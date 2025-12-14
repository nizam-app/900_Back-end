/** @format */

import { prisma } from "./src/prisma.js";

async function checkTechnicianStatus() {
  console.log("🔍 Checking Technician Online/Offline Status\n");

  const technicians = await prisma.user.findMany({
    where: {
      role: { in: ["TECH_INTERNAL", "TECH_FREELANCER"] },
    },
    select: {
      id: true,
      name: true,
      phone: true,
      role: true,
      lastLatitude: true,
      lastLongitude: true,
      locationStatus: true,
      locationUpdatedAt: true,
      isBlocked: true,
      technicianProfile: {
        select: {
          type: true,
          status: true,
          specialization: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  console.log(`Found ${technicians.length} technicians:\n`);

  technicians.forEach((tech, index) => {
    const statusEmoji =
      tech.locationStatus === "ONLINE"
        ? "🟢"
        : tech.locationStatus === "BUSY"
        ? "🟡"
        : "⚫";

    console.log(`${index + 1}. ${statusEmoji} ${tech.name}`);
    console.log(`   Phone: ${tech.phone}`);
    console.log(`   Role: ${tech.role}`);
    console.log(
      `   Location Status: ${tech.locationStatus || "NOT SET (OFFLINE)"}`
    );
    console.log(
      `   GPS: ${
        tech.lastLatitude
          ? `${tech.lastLatitude}, ${tech.lastLongitude}`
          : "Not available"
      }`
    );
    console.log(
      `   Last Updated: ${
        tech.locationUpdatedAt
          ? tech.locationUpdatedAt.toLocaleString()
          : "Never"
      }`
    );
    console.log(`   Profile Status: ${tech.technicianProfile?.status}`);
    console.log(`   Blocked: ${tech.isBlocked ? "YES ❌" : "NO ✅"}`);
    console.log(`   Type: ${tech.technicianProfile?.type}`);
    console.log(
      `   Specialization: ${tech.technicianProfile?.specialization || "N/A"}`
    );
    console.log("");
  });

  // Summary
  const online = technicians.filter(
    (t) => t.locationStatus === "ONLINE"
  ).length;
  const busy = technicians.filter((t) => t.locationStatus === "BUSY").length;
  const offline = technicians.filter(
    (t) => !t.locationStatus || t.locationStatus === "OFFLINE"
  ).length;
  const blocked = technicians.filter((t) => t.isBlocked).length;

  console.log("━".repeat(60));
  console.log("📊 SUMMARY");
  console.log("━".repeat(60));
  console.log(`🟢 ONLINE:   ${online} technicians`);
  console.log(`🟡 BUSY:     ${busy} technicians`);
  console.log(`⚫ OFFLINE:  ${offline} technicians`);
  console.log(`❌ BLOCKED:  ${blocked} technicians`);
  console.log(`📋 TOTAL:    ${technicians.length} technicians`);
  console.log("");

  // Available for assignment
  const available = technicians.filter(
    (t) => t.locationStatus === "ONLINE" && !t.isBlocked
  );
  console.log(`✅ Available for assignment: ${available.length} technicians`);
  if (available.length > 0) {
    available.forEach((tech) => {
      console.log(`   - ${tech.name} (${tech.phone})`);
    });
  }

  await prisma.$disconnect();
}

checkTechnicianStatus().catch(console.error);
