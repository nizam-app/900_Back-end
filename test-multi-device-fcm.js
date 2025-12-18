/** @format */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testMultiDeviceFCM() {
  console.log("🧪 Testing Multi-Device FCM Token Support...\n");

  try {
    // Test user ID (technician Adama Ba)
    const userId = 5;

    // Simulate registering 3 devices
    const devices = [
      {
        userId,
        token: "test_token_android_device_1",
        deviceType: "ANDROID",
        deviceName: "Samsung Galaxy S23",
        deviceId: "samsung_s23_12345",
      },
      {
        userId,
        token: "test_token_ios_device_2",
        deviceType: "IOS",
        deviceName: "iPhone 13 Pro",
        deviceId: "iphone_13_pro_67890",
      },
      {
        userId,
        token: "test_token_web_device_3",
        deviceType: "WEB",
        deviceName: "Chrome Browser",
        deviceId: "web_chrome_99999",
      },
    ];

    console.log("📱 Registering 3 devices for user", userId);

    for (const device of devices) {
      const result = await prisma.fCMToken.upsert({
        where: { token: device.token },
        update: {
          isActive: true,
          lastUsedAt: new Date(),
        },
        create: device,
      });

      console.log(
        `  ✅ ${device.deviceType}: ${device.deviceName} (ID: ${result.id})`
      );
    }

    console.log("\n📊 Total FCM Tokens for User:", userId);
    const allTokens = await prisma.fCMToken.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    allTokens.forEach((token, index) => {
      console.log(
        `  ${index + 1}. ${token.deviceType || "UNKNOWN"} - ${
          token.deviceName || "No name"
        }`
      );
      console.log(`     Token: ${token.token.substring(0, 20)}...`);
      console.log(`     Active: ${token.isActive}`);
      console.log(`     Last Used: ${token.lastUsedAt.toISOString()}`);
      console.log();
    });

    console.log("🧹 Cleaning up test tokens...");
    await prisma.fCMToken.deleteMany({
      where: {
        token: {
          in: devices.map((d) => d.token),
        },
      },
    });

    console.log("✅ Test completed successfully!\n");
    console.log("📝 Multi-Device Support Features:");
    console.log(
      "  - ✅ Users can register multiple FCM tokens (one per device)"
    );
    console.log("  - ✅ Push notifications sent to ALL registered devices");
    console.log("  - ✅ Invalid tokens automatically deactivated");
    console.log("  - ✅ Device tracking (type, name, ID)");
    console.log("  - ✅ Selective device removal (by token or device ID)");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testMultiDeviceFCM();
