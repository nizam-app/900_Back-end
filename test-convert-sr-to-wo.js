/** @format */

// Test the Convert SR to WO endpoint

import dotenv from "dotenv";
import { prisma } from "./src/prisma.js";
dotenv.config();

console.log("🔍 Testing Convert SR to WO Endpoint\n");
console.log("=".repeat(60));

const testEndpoint = async () => {
  try {
    // Step 1: Check if there are any service requests
    console.log("\n1️⃣  Checking available Service Requests:");
    
    const serviceRequests = await prisma.serviceRequest.findMany({
      where: {
        status: {
          in: ["NEW", "OPEN"]
        }
      },
      take: 5,
      select: {
        id: true,
        srNumber: true,
        status: true,
        customerId: true,
        categoryId: true,
        description: true,
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    if (serviceRequests.length === 0) {
      console.log("   ❌ No available Service Requests found");
      console.log("   💡 Create a Service Request first before converting to WO");
      
      // Check all SRs regardless of status
      const allSRs = await prisma.serviceRequest.findMany({
        take: 5,
        select: {
          id: true,
          srNumber: true,
          status: true,
        },
        orderBy: {
          createdAt: "desc"
        }
      });
      
      if (allSRs.length > 0) {
        console.log("\n   Available SRs (including converted):");
        allSRs.forEach(sr => {
          console.log(`   - SR ID: ${sr.id}, Number: ${sr.srNumber}, Status: ${sr.status}`);
        });
      }
      
      return;
    }

    console.log(`   ✅ Found ${serviceRequests.length} available Service Request(s):\n`);
    serviceRequests.forEach(sr => {
      console.log(`   - SR ID: ${sr.id}`);
      console.log(`     Number: ${sr.srNumber}`);
      console.log(`     Status: ${sr.status}`);
      console.log(`     Customer ID: ${sr.customerId}`);
      console.log(`     Category ID: ${sr.categoryId}`);
      console.log(`     Description: ${sr.description || "N/A"}`);
      console.log("");
    });

    // Step 2: Check for available technicians
    console.log("\n2️⃣  Checking available Technicians:");
    
    const technicians = await prisma.user.findMany({
      where: {
        role: {
          in: ["TECH_INTERNAL", "TECH_FREELANCER"]
        },
        isBlocked: false
      },
      take: 5,
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
      }
    });

    if (technicians.length === 0) {
      console.log("   ⚠️  No available technicians found");
    } else {
      console.log(`   ✅ Found ${technicians.length} available technician(s):\n`);
      technicians.forEach(tech => {
        console.log(`   - Tech ID: ${tech.id}`);
        console.log(`     Name: ${tech.name || "N/A"}`);
        console.log(`     Phone: ${tech.phone}`);
        console.log(`     Role: ${tech.role}`);
        console.log("");
      });
    }

    // Step 3: Check for dispatcher/admin users
    console.log("\n3️⃣  Checking for Dispatcher/Admin users:");
    
    const dispatchers = await prisma.user.findMany({
      where: {
        role: {
          in: ["DISPATCHER", "ADMIN"]
        }
      },
      take: 5,
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
      }
    });

    if (dispatchers.length === 0) {
      console.log("   ❌ No Dispatcher/Admin users found");
      console.log("   💡 You need a DISPATCHER or ADMIN role to convert SR to WO");
    } else {
      console.log(`   ✅ Found ${dispatchers.length} dispatcher(s)/admin(s):\n`);
      dispatchers.forEach(disp => {
        console.log(`   - User ID: ${disp.id}`);
        console.log(`     Name: ${disp.name || "N/A"}`);
        console.log(`     Phone: ${disp.phone}`);
        console.log(`     Role: ${disp.role}`);
        console.log("");
      });
    }

    // Step 4: Show example request
    if (serviceRequests.length > 0 && dispatchers.length > 0) {
      const exampleSR = serviceRequests[0];
      const exampleTech = technicians.length > 0 ? technicians[0] : null;
      const exampleDisp = dispatchers[0];

      console.log("\n" + "=".repeat(60));
      console.log("📋 EXAMPLE POSTMAN REQUEST:\n");
      console.log(`POST http://localhost:4000/api/wos/from-sr/${exampleSR.id}`);
      console.log("\nHeaders:");
      console.log(`Authorization: Bearer <token-for-user-id-${exampleDisp.id}>`);
      console.log(`Content-Type: application/json`);
      console.log("\nBody (JSON):");
      console.log(JSON.stringify({
        technicianId: exampleTech ? exampleTech.id : 4,
        scheduledAt: "2025-11-24T09:00:00Z",
        estimatedDuration: 120,
        notes: "Customer prefers morning. Estimated 2 hours."
      }, null, 2));
      
      console.log("\n💡 Important:");
      console.log(`   1. Use SR ID: ${exampleSR.id} in the URL`);
      console.log(`   2. Login as dispatcher/admin (User ID: ${exampleDisp.id})`);
      if (exampleTech) {
        console.log(`   3. Assign to Technician ID: ${exampleTech.id}`);
      } else {
        console.log(`   3. No technician available - WO will be UNASSIGNED`);
      }
    }

  } catch (error) {
    console.error("\n❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }

  console.log("\n" + "=".repeat(60) + "\n");
};

testEndpoint();
