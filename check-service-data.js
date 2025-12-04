/** @format */

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function checkData() {
  try {
    const categories = await prisma.category.findMany();
    console.log("\n=== CATEGORIES ===");
    console.log(JSON.stringify(categories, null, 2));

    const subservices = await prisma.subservice.findMany();
    console.log("\n=== SUBSERVICES ===");
    console.log(JSON.stringify(subservices, null, 2));

    const services = await prisma.service.findMany();
    console.log("\n=== SERVICES ===");
    console.log(JSON.stringify(services, null, 2));

    console.log("\n=== SUMMARY ===");
    console.log(`Categories: ${categories.length}`);
    console.log(`Subservices: ${subservices.length}`);
    console.log(`Services: ${services.length}`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
