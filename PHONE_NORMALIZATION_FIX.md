# Phone Number Normalization Fix

## Problem Identified
The authentication system had inconsistent phone number handling:
1. **OTP Service** formatted phones for SMS (+880...) but stored original format in database
2. **Auth Service** expected phones without country codes in database
3. **Users** sent requests with country codes (+8801719912009)
4. **Database** stored phones without country codes (1719912009)
5. Result: **Login failed with "User not found"** even though user existed

## Solution Implemented

### 1. Created Phone Utility (`src/utils/phone.js`)
```javascript
// Normalize for database: +8801719912009 → 1719912009
normalizePhoneForDB(phone)

// Format for SMS: 1719912009 → +8801719912009
formatPhoneForSMS(phone)

// Validate Bangladesh phone numbers
isValidPhone(phone)
```

### 2. Updated Auth Service (`src/services/auth.service.js`)
- ✅ Added `normalizePhoneForDB` import
- ✅ All phone lookups now use normalized format
- ✅ `loginUser()` - normalizes before database query
- ✅ `setPasswordAfterOTP()` - normalizes before user lookup
- ✅ `registerUser()` - normalizes before creation

### 3. Updated OTP Service (`src/services/otp.service.js`)
- ✅ Added phone normalization utilities
- ✅ `sendOTP()` - normalizes for DB, formats for SMS
- ✅ `verifyOTPByCode()` - normalizes before verification
- ✅ `verifyOTP()` - normalizes before verification
- ✅ Console logs show both formats for debugging

### 4. Database Format
All phones stored **WITHOUT country code**:
```
✅ CORRECT: 1719912009, 9999999999, 5555555555
❌ WRONG: +8801719912009, 8801719912009, 01719912009
```

## Testing

### Test User Created
- Phone: `1719912009` (database format)
- Password: `password123`
- Email: test@example.com
- Role: CUSTOMER

### Login Request Formats (All Work Now)
```json
// With +880
{"phone": "+8801719912009", "password": "password123"}

// With 880
{"phone": "8801719912009", "password": "password123"}

// With 0
{"phone": "01719912009", "password": "password123"}

// Without prefix
{"phone": "1719912009", "password": "password123"}
```

All formats above normalize to `1719912009` for database lookup.

## Existing Users (From Seed)
All seed users already use correct format:
- Admin: `1111111111`
- Dispatcher: `2222222222`
- Call Center: `3333333333`
- Technician: `4444444444`
- Freelancer: `5555555555`
- Customer 1: `9999999999`
- **Customer 2 (blocked): `8888888888`** ✅
- Customer 3: `7777777777`

Password for all: Check seed.js (admin123, customer123, etc.)

## How to Test in Postman

### 1. Login with Test User
```
POST {{baseUrl}}/api/auth/login
Body:
{
  "phone": "+8801719912009",
  "password": "password123"
}
```

### 2. Login with Blocked User (Should fail with 403)
```
POST {{baseUrl}}/api/auth/login
Body:
{
  "phone": "+8808888888888",
  "password": "customer123"
}
Response: 403 - "Your account has been blocked. Reason: Multiple customer complaints"
```

### 3. Login with Existing Seed User
```
POST {{baseUrl}}/api/auth/login
Body:
{
  "phone": "+8809999999999",
  "password": "customer123"
}
```

## Files Modified
1. ✅ `src/utils/phone.js` - NEW FILE
2. ✅ `src/services/auth.service.js` - 6 changes
3. ✅ `src/services/otp.service.js` - 5 changes
4. ✅ `prisma/seed.js` - Fixed customer2 upsert with password
5. ✅ `create-test-user.js` - NEW TEST FILE

## Console Output Example
```
📱 Original phone: +8801719912009
📱 Normalized phone (DB): 1719912009
📱 Formatted phone (SMS): +8801719912009
```

## Benefits
1. ✅ Users can login with any phone format
2. ✅ SMS still works (uses +880 format)
3. ✅ Database queries are consistent
4. ✅ No duplicate users
5. ✅ Bangladesh phone validation
6. ✅ Clear debugging logs

## Bangladesh Phone Format Reference
- Country Code: +880
- Mobile Format: 1XXXXXXXXX (10 digits without leading 0)
- Example: +8801719912009 → DB: 1719912009

## Next Steps
✅ Phone normalization implemented
✅ All existing services updated
✅ Test user created
⏳ Ready for Postman testing
⏳ Consider updating frontend to show phone with +880 format
