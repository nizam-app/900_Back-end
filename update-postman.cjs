const fs = require('fs');

// Read the Postman collection
const collection = JSON.parse(fs.readFileSync('FSM-API.postman_collection.json', 'utf8'));

// Find and update OTP endpoints
collection.item.forEach(folder => {
  if (folder.name === 'Authentication & OTP') {
    folder.item.forEach(endpoint => {
      // Update Send OTP
      if (endpoint.name === 'Send OTP') {
        endpoint.request.body.raw = JSON.stringify({
          phone: "+8801718981009",
          type: "REGISTRATION"
        }, null, 2);
        
        endpoint.request.description = "Send OTP for phone verification. Types: REGISTRATION, LOGIN, PASSWORD_RESET, VERIFICATION\n\nTESTED & WORKING (Dec 2, 2025)\n\nPhone Format (Bangladesh):\n- +8801718981009 (recommended - with country code)\n- 8801718981009 (works - auto-formatted)\n- 01718981009 (works - auto-converted to 8801718981009)\n\nResponse includes:\n- OTP code (for testing/development)\n- Expiry time (5 minutes)\n- SMS status (sent/failed)\n\nNote: OTP is stored in database and valid for 5 minutes. SMS delivery depends on BulkGate credits.";
      }
      
      // Update Verify OTP
      if (endpoint.name === 'Verify OTP') {
        endpoint.request.body.raw = JSON.stringify({
          phone: "+8801718981009",
          code: "123456",
          type: "REGISTRATION"
        }, null, 2);
        
        endpoint.request.description = "Verify OTP code sent to phone number\n\nTESTED & WORKING (Dec 2, 2025)\n\nRequirements:\n- Use the SAME phone format as Send OTP\n- 6-digit code must match exactly\n- Must be verified within 5 minutes\n- Type must match the Send OTP request\n\nSuccess Response:\n- verified: true\n- tempToken: Temporary token for registration (valid 10 minutes)\n- tempTokenExpiry: Token expiration time\n\nUse the tempToken to complete registration with /api/auth/set-password endpoint.";
      }
      
      // Update Register User
      if (endpoint.name === 'Register User') {
        endpoint.request.body.raw = JSON.stringify({
          phone: "+8801718981009",
          password: "password123",
          name: "John Doe",
          role: "CUSTOMER"
        }, null, 2);
      }
    });
  }
});

// Write the updated collection
fs.writeFileSync('FSM-API.postman_collection.json', JSON.stringify(collection, null, '\t'), 'utf8');
console.log('✅ Postman collection updated successfully!');
console.log('- Phone numbers updated to: +8801718981009');
console.log('- OTP endpoint descriptions enhanced');
console.log('- JSON format preserved correctly');
