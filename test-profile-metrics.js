const BASE_URL = "http://localhost:4000/api";

async function testProfileMetrics() {
  console.log("🧪 Testing Technician Profile Metrics\n");

  try {
    // Login as freelancer technician
    console.log("1️⃣ Logging in as freelancer technician...");
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: "+8805555555555",
        password: "freelancer123",
      }),
    });

    const loginData = await loginRes.json();
    if (!loginRes.ok) {
      console.error("❌ Login failed:", loginData);
      return;
    }

    const token = loginData.token || loginData.data?.token;
    console.log("✅ Login successful\n");

    // Get profile
    console.log("2️⃣ Fetching technician profile...");
    const profileRes = await fetch(`${BASE_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const profileData = await profileRes.json();
    if (!profileRes.ok) {
      console.error("❌ Profile fetch failed:", profileData);
      return;
    }

    console.log("✅ Profile fetched successfully\n");

    const profile = profileData.technicianProfile || profileData.data?.technicianProfile;

    // Test 15.1: Response Time
    console.log("⏱️  15.1 RESPONSE TIME");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    if (profile.responseTime) {
      console.log(`Average: ${profile.responseTime.formatted}`);
      console.log(`Minutes: ${profile.responseTime.minutes}`);
      console.log(`Status: ${profile.responseTime.status.toUpperCase()}`);
      console.log(`Rating: ${
        profile.responseTime.status === 'excellent' ? '⭐⭐⭐' :
        profile.responseTime.status === 'good' ? '⭐⭐' : '⭐'
      }`);
      console.log("✅ Response Time: COMPLETE\n");
    } else {
      console.log("❌ Response Time: MISSING\n");
    }

    // Test 15.2: Bonus
    console.log("💰 15.2 BONUS INFORMATION");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    if (profile.bonus) {
      console.log(`This Week: $${profile.bonus.thisWeek.toFixed(2)}`);
      console.log(`Rate: ${(profile.bonus.rate * 100).toFixed(0)}% ${profile.bonus.type}`);
      console.log(`Type: ${profile.bonus.type}`);
      console.log("✅ Bonus Information: COMPLETE\n");
    } else {
      console.log("❌ Bonus Information: MISSING\n");
    }

    // Test 15.3: Priority Status
    console.log("🎯 15.3 PRIORITY STATUS");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    if (profile.priorityStatus) {
      console.log("Job Distribution:");
      console.log(`  HIGH:   ${profile.priorityStatus.counts.high} jobs (${profile.priorityStatus.percentages.high}%)`);
      console.log(`  MEDIUM: ${profile.priorityStatus.counts.medium} jobs (${profile.priorityStatus.percentages.medium}%)`);
      console.log(`  LOW:    ${profile.priorityStatus.counts.low} jobs (${profile.priorityStatus.percentages.low}%)`);
      console.log(`\nMost Common: ${profile.priorityStatus.mostCommon}`);
      console.log("✅ Priority Status: COMPLETE\n");
    } else {
      console.log("❌ Priority Status: MISSING\n");
    }

    // Overall Summary
    console.log("📊 METRICS SUMMARY");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    const hasResponseTime = !!profile.responseTime;
    const hasBonus = !!profile.bonus;
    const hasPriorityStatus = !!profile.priorityStatus;

    console.log(`15.1 Response Time: ${hasResponseTime ? '✅ COMPLETE' : '❌ MISSING'}`);
    console.log(`15.2 Bonus: ${hasBonus ? '✅ COMPLETE' : '❌ MISSING'}`);
    console.log(`15.3 Priority Status: ${hasPriorityStatus ? '✅ COMPLETE' : '❌ MISSING'}`);

    const allComplete = hasResponseTime && hasBonus && hasPriorityStatus;
    console.log(`\n${allComplete ? '🎉' : '⚠️'} Overall: ${allComplete ? 'ALL METRICS READY' : 'SOME METRICS MISSING'}`);

    // Full JSON Response
    if (allComplete) {
      console.log("\n📱 FULL METRICS JSON:");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(JSON.stringify({
        responseTime: profile.responseTime,
        bonus: profile.bonus,
        priorityStatus: profile.priorityStatus,
      }, null, 2));
    }

  } catch (error) {
    console.error("💥 Test failed with error:", error.message);
  }
}

testProfileMetrics();
