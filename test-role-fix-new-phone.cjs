// Quick test to verify role parameter is working
const fetch = require('node-fetch');

const BASE_URL = 'https://outside-project-backend-production.up.railway.app';

async function testWithNewPhone() {
  // Generate a unique phone number for testing
  const timestamp = Date.now().toString().slice(-8);
  const testPhone = `+88017${timestamp}`;
  
  console.log('🧪 Testing Role Parameter with NEW phone number...');
  console.log(`📱 Test phone: ${testPhone}\n`);
  
  try {
    // Step 1: Send OTP with TECH_FREELANCER role
    console.log('📤 Step 1: Sending OTP with role=TECH_FREELANCER...');
    const otpResponse = await fetch(`${BASE_URL}/api/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: testPhone,
        name: 'Test Freelancer',
        type: 'REGISTRATION',
        role: 'TECH_FREELANCER'
      })
    });
    
    const otpData = await otpResponse.json();
    console.log('✅ Response:', JSON.stringify(otpData, null, 2));
    
    if (!otpData.code) {
      console.log('❌ No OTP code in response!');
      return;
    }
    
    // Step 2: Verify OTP
    console.log('\n📤 Step 2: Verifying OTP...');
    const verifyResponse = await fetch(`${BASE_URL}/api/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: testPhone,
        code: otpData.code,
        type: 'REGISTRATION'
      })
    });
    
    const verifyData = await verifyResponse.json();
    console.log('✅ Response:', JSON.stringify(verifyData, null, 2));
    
    // Check for the bug
    if (verifyData.user) {
      console.log('\n❌ BUG DETECTED: User object present in verify response!');
      console.log(`   User role: ${verifyData.user.role}`);
      console.log('   Expected: No user object (should be created in Step 3)');
      return;
    } else {
      console.log('\n✅ CORRECT: No user object in verify response');
      console.log('   User will be created in Step 3 with correct role');
    }
    
    // Step 3: Set Password
    console.log('\n📤 Step 3: Setting password...');
    const setPasswordResponse = await fetch(`${BASE_URL}/api/auth/set-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: testPhone,
        password: 'test123',
        tempToken: verifyData.tempToken
      })
    });
    
    const userData = await setPasswordResponse.json();
    console.log('✅ Response:', JSON.stringify(userData, null, 2));
    
    // Final verification
    console.log('\n' + '='.repeat(70));
    if (userData.user && userData.user.role === 'TECH_FREELANCER') {
      console.log('✅ SUCCESS! User created with TECH_FREELANCER role');
      console.log('✅ Role parameter is working correctly!');
      console.log(`\n📋 Final User Details:`);
      console.log(`   ID: ${userData.user.id}`);
      console.log(`   Name: ${userData.user.name}`);
      console.log(`   Phone: ${userData.user.phone}`);
      console.log(`   Role: ${userData.user.role} ✅`);
    } else {
      console.log('❌ FAILED!');
      console.log(`   Expected role: TECH_FREELANCER`);
      console.log(`   Actual role: ${userData.user?.role}`);
    }
    console.log('='.repeat(70));
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
  }
}

// Run the test
testWithNewPhone();
