/** @format */

// seed-rates.js - Seed initial commission and bonus rate structures
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedRates() {
  console.log("\n🌱 Seeding Rate Structures...\n");

  // Check if rates already exist
  const existingRates = await prisma.rateStructure.count();
  if (existingRates > 0) {
    console.log(`ℹ️  ${existingRates} rate structures already exist.`);
    console.log("   Skipping seed to avoid duplicates.\n");
    return;
  }

  // Commission Rates (Freelancers)
  const commissionRates = [
    {
      rateId: "RATE001",
      name: "Standard commission for freelance technicians",
      type: "COMMISSION",
      techType: "FREELANCER",
      rate: 0.10, // 10%
      isDefault: true,
      description: "Default commission rate for new freelance technicians",
    },
    {
      rateId: "RATE002",
      name: "Premium commission for senior freelance technicians",
      type: "COMMISSION",
      techType: "FREELANCER",
      rate: 0.12, // 12%
      isDefault: false,
      description: "Higher commission for experienced freelancers with excellent ratings",
    },
  ];

  // Bonus Rates (Internal Employees)
  const bonusRates = [
    {
      rateId: "RATE003",
      name: "Performance bonus for junior employees",
      type: "BONUS",
      techType: "INTERNAL",
      rate: 0.05, // 5%
      isDefault: true,
      description: "Default bonus rate for new internal employees",
    },
    {
      rateId: "RATE004",
      name: "Performance bonus for senior employees",
      type: "BONUS",
      techType: "INTERNAL",
      rate: 0.06, // 6%
      isDefault: false,
      description: "Higher bonus for senior internal employees",
    },
  ];

  // Create all rates
  for (const rate of [...commissionRates, ...bonusRates]) {
    const created = await prisma.rateStructure.create({ data: rate });
    console.log(`✓ Created ${created.rateId}: ${created.name}`);
    console.log(`   Type: ${created.type} | TechType: ${created.techType} | Rate: ${created.rate * 100}%`);
    if (created.isDefault) {
      console.log(`   ⭐ Default rate for ${created.techType}`);
    }
    console.log();
  }

  console.log("📊 Summary:");
  console.log(`   Commission Rates: ${commissionRates.length}`);
  console.log(`   Bonus Rates: ${bonusRates.length}`);
  console.log("\n✅ Rate structures seeded successfully!\n");
}

seedRates()
  .catch((e) => {
    console.error("❌ Error seeding rates:", e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
