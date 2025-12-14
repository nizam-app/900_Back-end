/** @format */

import { prisma } from "./src/prisma.js";

async function setAllTechniciansOnline() {
  console.log("🔄 Setting all technicians to ONLINE for testing...\n");

  const result = await prisma.user.updateMany({
    where: {
      role: { in: ["TECH_INTERNAL", "TECH_FREELANCER"] },
      isBlocked: false,
    },
    data: {
      locationStatus: "ONLINE",
      lastLatitude: 23.8103, // Default to Mohakhali, Dhaka
      lastLongitude: 90.4125,
      locationUpdatedAt: new Date(),
    },
  });

  console.log(`✅ Updated ${result.count} technicians to ONLINE status`);
  console.log(`📍 Default location: Mohakhali, Dhaka (23.8103, 90.4125)`);
  console.log(`⏰ Updated at: ${new Date().toLocaleString()}`);
  console.log("");
  console.log("Now run: node check-technician-status.js to verify");

  await prisma.$disconnect();
}

setAllTechniciansOnline().catch(console.error);
