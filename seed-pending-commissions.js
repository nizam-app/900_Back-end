/** @format */

// seed-pending-commissions.js
// Quick script to create dummy pending commissions for testing

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedPendingCommissions() {
  console.log("🌱 Seeding pending commissions...\n");

  try {
    // Find or create test technicians
    let freelancer = await prisma.user.findFirst({
      where: { role: "TECH_FREELANCER" },
      include: { technicianProfile: true },
    });

    let internal = await prisma.user.findFirst({
      where: { role: "TECH_INTERNAL" },
      include: { technicianProfile: true },
    });

    // Create test technicians if they don't exist
    if (!freelancer) {
      console.log("Creating test freelancer technician...");
      freelancer = await prisma.user.create({
        data: {
          name: "John Smith",
          phone: "+8801712345001",
          email: "john.smith@test.com",
          passwordHash: "$2b$10$test.hash",
          role: "TECH_FREELANCER",
          technicianProfile: {
            create: {
              type: "FREELANCER",
              commissionRate: 0.4,
              bonusRate: 0,
              status: "ACTIVE",
              specialization: "AC Repair",
            },
          },
        },
        include: { technicianProfile: true },
      });
    }

    if (!internal) {
      console.log("Creating test internal technician...");
      internal = await prisma.user.create({
        data: {
          name: "Sarah Johnson",
          phone: "+8801712345002",
          email: "sarah.johnson@test.com",
          passwordHash: "$2b$10$test.hash",
          role: "TECH_INTERNAL",
          technicianProfile: {
            create: {
              type: "INTERNAL",
              commissionRate: 0,
              bonusRate: 0.05,
              baseSalary: 800,
              status: "ACTIVE",
              specialization: "Plumbing",
            },
          },
        },
        include: { technicianProfile: true },
      });
    }

    // Find or create customer
    let customer = await prisma.user.findFirst({
      where: { role: "CUSTOMER" },
    });

    if (!customer) {
      console.log("Creating test customer...");
      customer = await prisma.user.create({
        data: {
          name: "Alice Brown",
          phone: "+8801712345003",
          email: "alice.brown@test.com",
          passwordHash: "$2b$10$test.hash",
          role: "CUSTOMER",
        },
      });
    }

    // Find or create category and service
    let category = await prisma.category.findFirst();
    if (!category) {
      console.log("Creating test category...");
      category = await prisma.category.create({
        data: {
          name: "AC Services",
          description: "Air conditioning services",
        },
      });
    }

    let service = await prisma.service.findFirst({
      where: { categoryId: category.id },
    });
    if (!service) {
      console.log("Creating test service...");
      service = await prisma.service.create({
        data: {
          categoryId: category.id,
          name: "AC Repair",
          description: "AC repair services",
        },
      });
    }

    console.log("\n✅ Prerequisites ready\n");

    // Create 5 dummy work orders with pending commissions
    const dummyData = [
      {
        tech: freelancer,
        payment: 150,
        service: "AC Repair",
        commission: 60,
        type: "COMMISSION",
      },
      {
        tech: freelancer,
        payment: 200,
        service: "AC Installation",
        commission: 80,
        type: "COMMISSION",
      },
      {
        tech: freelancer,
        payment: 120,
        service: "AC Maintenance",
        commission: 48,
        type: "COMMISSION",
      },
      {
        tech: internal,
        payment: 180,
        service: "Plumbing Repair",
        commission: 9,
        type: "BONUS",
      },
      {
        tech: internal,
        payment: 160,
        service: "Pipe Installation",
        commission: 8,
        type: "BONUS",
      },
    ];

    for (let i = 0; i < dummyData.length; i++) {
      const data = dummyData[i];

      // Create service request
      const sr = await prisma.serviceRequest.create({
        data: {
          srNumber: `SR-TEST-${Date.now()}-${i}`,
          customerId: customer.id,
          categoryId: category.id,
          serviceId: service.id,
          description: `Test ${data.service}`,
          priority: "MEDIUM",
          address: "123 Test Street, Dhaka",
          paymentType: "CASH",
          status: "CONVERTED_TO_WO",
          source: "CUSTOMER_APP",
        },
      });

      // Create work order
      const wo = await prisma.workOrder.create({
        data: {
          woNumber: `WO-TEST-${Date.now()}-${i}`,
          srId: sr.id,
          customerId: customer.id,
          technicianId: data.tech.id,
          categoryId: category.id,
          serviceId: service.id,
          address: "123 Test Street, Dhaka",
          paymentType: "CASH",
          priority: "MEDIUM",
          status: "PAID_VERIFIED",
          acceptedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        },
      });

      // Create payment
      const payment = await prisma.payment.create({
        data: {
          woId: wo.id,
          technicianId: data.tech.id,
          amount: data.payment,
          method: "CASH",
          status: "VERIFIED",
          verifiedAt: new Date(),
        },
      });

      // Create pending commission
      const commission = await prisma.commission.create({
        data: {
          woId: wo.id,
          technicianId: data.tech.id,
          paymentId: payment.id,
          type: data.type,
          rate:
            data.type === "COMMISSION"
              ? data.tech.technicianProfile.commissionRate
              : data.tech.technicianProfile.bonusRate,
          amount: data.commission,
          status: "EARNED", // Pending payout
        },
      });

      console.log(
        `✅ Created ${data.type}: WO-TEST-${Date.now()}-${i} - ${
          data.tech.name
        } - $${data.commission}`
      );
    }

    console.log("\n🎉 Successfully seeded 5 pending commissions!");
    console.log("\n📊 Test the endpoint:");
    console.log("   GET /api/payouts/pending-commissions");
    console.log("   GET /api/payouts/pending-commissions?type=COMMISSION");
    console.log("   GET /api/payouts/pending-commissions?type=BONUS");
    console.log("\n💡 Summary:");
    console.log("   - 3 COMMISSION records (Freelancer)");
    console.log("   - 2 BONUS records (Internal Employee)");
    console.log("   - Total Amount: $205");
  } catch (error) {
    console.error("❌ Error seeding commissions:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedPendingCommissions();
