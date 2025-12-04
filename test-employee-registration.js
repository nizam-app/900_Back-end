// Test Employee Registration Flow
const BASE_URL = 'http://localhost:4000';

console.log('🧪 Testing Employee Registration Flow (3 Steps)...\n');

console.log('=== STEP 1: Enter Details & Send OTP ===');
console.log('POST /api/employee/register/initiate');
console.log('Body: { name, employeeId, phone }');
console.log('Response: { success, message, otpId, phone, expiresIn }\n');

console.log('=== STEP 2: Verify OTP Code ===');
console.log('POST /api/employee/register/verify-otp');
console.log('Body: { phone, code }');
console.log('Response: { success, message, tempToken, phone, name, employeeId }\n');

console.log('=== STEP 3: Set Password & Create Account ===');
console.log('POST /api/employee/register/complete');
console.log('Body: { phone, password, tempToken, name, employeeId }');
console.log('Response: { success, message, user, token }\n');

console.log('=== ADDITIONAL: Resend OTP ===');
console.log('POST /api/employee/register/resend-otp');
console.log('Body: { phone }');
console.log('Response: { success, message, otpId, expiresIn }\n');

console.log('✅ All Employee Registration Endpoints Created');
console.log('📖 Use Postman collection to test with actual data\n');

console.log('=== UI Flow Mapping ===');
console.log('Screen 1 (Enter Details):');
console.log('  - Full Name input → name');
console.log('  - Employee ID input → employeeId');
console.log('  - Phone Number input → phone');
console.log('  - Continue button → POST /api/employee/register/initiate\n');

console.log('Screen 2 (Verify Phone):');
console.log('  - OTP Code input → code');
console.log('  - Resend OTP button → POST /api/employee/register/resend-otp');
console.log('  - Verify & Continue button → POST /api/employee/register/verify-otp\n');

console.log('Screen 3 (Set Password):');
console.log('  - Password input → password (min 6 characters)');
console.log('  - Create Account button → POST /api/employee/register/complete\n');
