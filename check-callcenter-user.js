/** @format */

import { prisma } from "./src/prisma.js";

async function main() {
  const callCenterUser = await prisma.user.findUnique({
    where: { phone: "3333333333" },
  });

  console.log("Call Center User:");
  console.log(JSON.stringify(callCenterUser, null, 2));

  if (callCenterUser) {
    console.log("\n✅ User exists with role:", callCenterUser.role);
    console.log("Password should be: callcenter123");
  } else {
    console.log("\n❌ Call center user not found! Run: npm run seed");
  }

  await prisma.$disconnect();
}

main().catch(console.error);
