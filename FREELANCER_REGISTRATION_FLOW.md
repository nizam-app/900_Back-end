# Freelancer Registration Flow - 3 Steps

## Overview
This document describes the complete 3-step registration flow for freelancers joining the FSM platform.

## Flow Steps

### Step 1: Enter Name & Phone Number
User enters their full name and phone number to begin registration.

**Endpoint:** `POST /api/otp/send`

**Request Body:**
```json
{
  "phone": "01712345678",
  "name": "John Technician",
  "type": "REGISTRATION"
}
```

**Success Response (200 OK):**
```json
{
  "message": "OTP sent successfully",
  "code": "123456",
  "expiresAt": "2025-12-04T10:35:00.000Z",
  "tempToken": "temp_1733305200000_abc123",
  "tempTokenExpiry": "2025-12-04T10:40:00.000Z",
  "smsStatus": "sent"
}
```

**Notes:**
- OTP is valid for 5 minutes
- tempToken is valid for 10 minutes
- In development, OTP code is returned in response for testing
- User's name is stored temporarily for use in Step 3

---

### Step 2: Verify Phone Number
User enters the 6-digit OTP code sent to their phone.

**Endpoint:** `POST /api/otp/verify`

**Request Body:**
```json
{
  "phone": "01712345678",
  "code": "123456",
  "type": "REGISTRATION"
}
```

**Success Response (200 OK):**
```json
{
  "message": "OTP verified successfully. You can now set your password.",
  "verified": true,
  "phone": "01712345678",
  "tempToken": "temp_1733305200000_abc123",
  "tempTokenExpiry": "2025-12-04T10:40:00.000Z"
}
```

**Error Response (400 Bad Request):**
```json
{
  "message": "Invalid or expired OTP"
}
```

**Notes:**
- OTP is marked as used after successful verification
- Returns same tempToken from Step 1
- User proceeds to Step 3 with this tempToken

---

### Step 3: Set Password
User creates a secure password (minimum 6 characters).

**Endpoint:** `POST /api/auth/set-password`

**Request Body:**
```json
{
  "phone": "01712345678",
  "password": "23423",
  "tempToken": "temp_1733305200000_abc123"
}
```

**Success Response (201 Created):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 123,
    "name": "John Technician",
    "phone": "01712345678",
    "email": null,
    "role": "TECH_FREELANCER"
  },
  "message": "Account created successfully! Welcome to FSM."
}
```

**Error Responses:**

**400 Bad Request - Invalid Token:**
```json
{
  "message": "Invalid or expired temporary token"
}
```

**400 Bad Request - Weak Password:**
```json
{
  "message": "Password must be at least 6 characters long"
}
```

**400 Bad Request - Already Registered:**
```json
{
  "message": "Phone already registered"
}
```

**Notes:**
- Password must be at least 6 characters (as shown in UI validation)
- User is automatically logged in after successful registration
- JWT token is returned for immediate use
- Technician profile is created automatically with:
  - Type: FREELANCER
  - Commission Rate: 40%
  - Status: ACTIVE
  - Wallet initialized with 0 balance

---

## Complete Flow Example

### 1. Start Registration (Step 1)
```bash
curl -X POST http://localhost:4000/api/otp/send \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "01712345678",
    "name": "John Technician",
    "type": "REGISTRATION"
  }'
```

### 2. Verify OTP (Step 2)
```bash
curl -X POST http://localhost:4000/api/otp/verify \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "01712345678",
    "code": "123456",
    "type": "REGISTRATION"
  }'
```

### 3. Set Password (Step 3)
```bash
curl -X POST http://localhost:4000/api/auth/set-password \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "01712345678",
    "password": "23423",
    "tempToken": "temp_1733305200000_abc123"
  }'
```

---

## UI Implementation Guide

### Step 1 Screen: "Join as Freelancer"
- Full Name input field
- Phone Number input field
- "Continue" button
- "Already have an account? Login" link
- "Back" button (navigation)

**Validation:**
- Name: Required
- Phone: Required, 10-15 digits

**On Continue:**
```javascript
const response = await fetch('/api/otp/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: phoneNumber,
    name: fullName,
    type: 'REGISTRATION'
  })
});

if (response.ok) {
  const data = await response.json();
  // Save tempToken for Step 3
  sessionStorage.setItem('tempToken', data.tempToken);
  sessionStorage.setItem('registrationPhone', phoneNumber);
  sessionStorage.setItem('registrationName', fullName);
  // Navigate to Step 2
  navigation.navigate('VerifyPhone');
}
```

---

### Step 2 Screen: "Verify Phone"
- Display: "OTP sent to your phone" with phone number
- OTP Code input (6-digit numeric)
- "Resend OTP" button
- "Verify & Continue" button
- "Back" button (returns to Step 1)

**Validation:**
- OTP: Required, exactly 6 digits

**On Verify:**
```javascript
const response = await fetch('/api/otp/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: sessionStorage.getItem('registrationPhone'),
    code: otpCode,
    type: 'REGISTRATION'
  })
});

if (response.ok) {
  const data = await response.json();
  // Confirm tempToken matches
  if (data.tempToken === sessionStorage.getItem('tempToken')) {
    // Navigate to Step 3
    navigation.navigate('SetPassword');
  }
}
```

**On Resend OTP:**
```javascript
// Call Step 1 API again with same phone and name
const response = await fetch('/api/otp/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: sessionStorage.getItem('registrationPhone'),
    name: sessionStorage.getItem('registrationName'),
    type: 'REGISTRATION'
  })
});

if (response.ok) {
  const data = await response.json();
  // Update tempToken
  sessionStorage.setItem('tempToken', data.tempToken);
  showToast('OTP resent successfully');
}
```

---

### Step 3 Screen: "Set Password"
- Display: Example "23423" with eye icon (show/hide password)
- Password input field (minimum 6 characters)
- Password strength indicator (optional)
- "Password must be at least 6 characters long" hint
- "Create Account" button
- "Back" button (returns to Step 2)

**Validation:**
- Password: Required, minimum 6 characters

**On Create Account:**
```javascript
const response = await fetch('/api/auth/set-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: sessionStorage.getItem('registrationPhone'),
    password: password,
    tempToken: sessionStorage.getItem('tempToken')
  })
});

if (response.ok) {
  const data = await response.json();
  // Save JWT token
  localStorage.setItem('authToken', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  
  // Clear temporary registration data
  sessionStorage.removeItem('tempToken');
  sessionStorage.removeItem('registrationPhone');
  sessionStorage.removeItem('registrationName');
  
  // Navigate to dashboard
  navigation.navigate('Dashboard');
  showToast(data.message); // "Account created successfully! Welcome to FSM."
}
```

---

## Security Features

1. **OTP Expiration:** 5 minutes
2. **Temp Token Expiration:** 10 minutes
3. **One-Time Use:** OTP is marked as used after verification
4. **Phone Validation:** Format validation prevents invalid numbers
5. **Password Strength:** Minimum 6 characters enforced
6. **Token Verification:** tempToken must match for password creation

---

## Database Changes

When a freelancer completes registration, the following records are created:

1. **User Record:**
   - phone: Normalized phone number
   - passwordHash: Bcrypt hashed password
   - name: From Step 1
   - role: TECH_FREELANCER

2. **TechnicianProfile Record:**
   - type: FREELANCER
   - commissionRate: 0.4 (40%)
   - bonusRate: 0.05 (5%)
   - status: ACTIVE

3. **Wallet Record:**
   - balance: 0
   - Linked to technician

---

## Error Handling

### Common Errors:

1. **Phone already registered:**
   - Show: "This phone number is already registered. Please login instead."
   - Action: Provide "Go to Login" button

2. **Invalid OTP:**
   - Show: "Invalid or expired OTP. Please try again."
   - Action: Allow retry or resend OTP

3. **Expired tempToken:**
   - Show: "Session expired. Please start registration again."
   - Action: Return to Step 1

4. **Weak password:**
   - Show: "Password must be at least 6 characters long"
   - Action: Show password requirements

5. **Network errors:**
   - Show: "Connection failed. Please check your internet and try again."
   - Action: Retry button

---

## Testing

### Test Credentials:
Use these values to test the complete flow:

**Step 1:**
- Name: "Test Freelancer"
- Phone: "01799999999"

**Step 2:**
- OTP: (returned in Step 1 response during development)

**Step 3:**
- Password: "test123"

### Verify Profile Creation:
After registration, call GET /api/auth/profile to verify technician profile:

```bash
curl -X GET http://localhost:4000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected response should include technicianProfile with FREELANCER type.

---

## Migration from Old Flow

If you have existing users created with the old flow:
- They can still login with phone + password
- No migration needed for existing accounts
- New registrations will follow this 3-step flow

---

## Related Endpoints

- `POST /api/auth/login` - Login with phone + password
- `GET /api/auth/profile` - Get user profile (requires authentication)
- `PATCH /api/auth/profile` - Update profile (requires authentication)
- `POST /api/auth/change-password` - Change password (requires authentication)

---

## Support

For issues or questions about the registration flow:
1. Check server logs for detailed error messages
2. Verify OTP service is working (SMS credits available)
3. Ensure database migrations are up to date
4. Test with provided test credentials

---

Last Updated: December 4, 2025
Version: 1.0
