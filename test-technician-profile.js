const BASE_URL = "http://localhost:4000/api";

async function testTechnicianProfile() {
  console.log("🧪 Testing Technician Profile API\n");

  try {
    // Step 1: Login as freelancer technician
    console.log("1️⃣ Logging in as freelancer technician...");
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: "+8805555555555", // Freelancer
        password: "freelancer123",
      }),
    });

    const loginData = await loginRes.json();
    if (!loginRes.ok) {
      console.error("❌ Login failed:", loginData);
      return;
    }

    console.log("Login response:", JSON.stringify(loginData, null, 2));
    const token = loginData.token || loginData.data?.token;
    if (!token) {
      console.error("❌ No token in response");
      return;
    }
    console.log("✅ Login successful\n");

    // Step 2: Get profile
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
    console.log("Profile structure:", JSON.stringify(profileData, null, 2));

    const profile = profileData.technicianProfile || profileData.data?.technicianProfile;
    if (!profile) {
      console.error("❌ No technicianProfile in response");
      return;
    }

    // Test Component 14.1: Employment Details
    console.log("📋 14.1 EMPLOYMENT DETAILS");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Department: ${profile.department || "❌ MISSING"}`);
    console.log(
      `Join Date: ${profile.joinDate ? new Date(profile.joinDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "❌ MISSING"}`
    );
    console.log(`Position: ${profile.position || "❌ MISSING"}`);
    console.log(
      `Status: ${profile.status === "ACTIVE" ? "✅ Active" : "⚠️ " + profile.status}`
    );

    const employmentComplete =
      profile.department && profile.joinDate && profile.position;
    console.log(
      `\n${employmentComplete ? "✅" : "❌"} Employment Details: ${employmentComplete ? "COMPLETE" : "INCOMPLETE"}\n`
    );

    // Test Component 14.2: Skills & Specializations
    console.log("🔧 14.2 SKILLS & SPECIALIZATIONS");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    if (profile.skills && Array.isArray(profile.skills)) {
      console.log(`Skills Count: ${profile.skills.length}`);
      console.log("Skills:");
      profile.skills.forEach((skill, index) => {
        console.log(`  ${index + 1}. ${skill}`);
      });
      console.log("\n✅ Skills: COMPLETE (Array format ready for badges)\n");
    } else {
      console.log("❌ Skills: MISSING or not parsed to array\n");
    }

    // Test Component 14.3: Certifications
    console.log("📜 14.3 MY CERTIFICATIONS");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    if (profile.certifications && Array.isArray(profile.certifications)) {
      const activeCerts = profile.certifications.filter(
        (cert) => cert.verifiedAt
      );
      console.log(`Total Certifications: ${profile.certifications.length}`);
      console.log(`Active/Verified: ${activeCerts.length}`);
      console.log("\nCertifications List:");

      profile.certifications.forEach((cert, index) => {
        console.log(`\n  ${index + 1}. ${cert.name}`);
        console.log(`     URL: ${cert.url}`);
        console.log(
          `     Status: ${cert.verifiedAt ? "✅ Verified on " + new Date(cert.verifiedAt).toLocaleDateString() : "⏳ Pending"}`
        );
      });

      console.log(
        `\n✅ Certifications: COMPLETE (${activeCerts.length} active)\n`
      );
    } else {
      console.log("❌ Certifications: MISSING or not parsed to array\n");
    }

    // Overall Summary
    console.log("📊 PROFILE COMPLETENESS SUMMARY");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    const skillsComplete =
      profile.skills && Array.isArray(profile.skills) && profile.skills.length > 0;
    const certsComplete =
      profile.certifications &&
      Array.isArray(profile.certifications) &&
      profile.certifications.length > 0;

    console.log(
      `14.1 Employment Details: ${employmentComplete ? "✅ COMPLETE" : "❌ INCOMPLETE"}`
    );
    console.log(
      `14.2 Skills: ${skillsComplete ? "✅ COMPLETE" : "❌ INCOMPLETE"}`
    );
    console.log(
      `14.3 Certifications: ${certsComplete ? "✅ COMPLETE" : "❌ INCOMPLETE"}`
    );

    const allComplete = employmentComplete && skillsComplete && certsComplete;
    console.log(`\n${allComplete ? "🎉" : "⚠️"} Overall: ${allComplete ? "ALL COMPONENTS READY FOR UI" : "SOME COMPONENTS MISSING"}`);

    // JSON structure for UI
    if (allComplete) {
      console.log("\n📱 JSON STRUCTURE FOR UI:");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(
        JSON.stringify(
          {
            employmentDetails: {
              department: profile.department,
              joinDate: profile.joinDate,
              position: profile.position,
              status: profile.status,
            },
            skills: profile.skills,
            certifications: {
              total: profile.certifications.length,
              active: profile.certifications.filter((c) => c.verifiedAt).length,
              list: profile.certifications,
            },
          },
          null,
          2
        )
      );
    }
  } catch (error) {
    console.error("💥 Test failed with error:", error.message);
  }
}

testTechnicianProfile();
