/** @format */

import bcrypt from "bcryptjs";
import { prisma } from "./src/prisma.js";

async function main() {
  const hash = await bcrypt.hash("password123", 10);

  const user = await prisma.user.upsert({
    where: { phone: "1719912009" },
    update: { passwordHash: hash },
    create: {
      phone: "1719912009",
      name: "Test User Bangladesh",
      email: "test@example.com",
      passwordHash: hash,
      role: "CUSTOMER",
    },
  });

  console.log("✅ Created/Updated user:", user);
  await prisma.$disconnect();
}

main().catch(console.error);
