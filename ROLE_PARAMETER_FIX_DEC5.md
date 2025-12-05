<!-- @format -->

# Role Parameter Fix - December 5, 2025

## ✅ ISSUE FIXED: Role Parameter Now Works Correctly

### Problem

When sending `"role": "TECH_FREELANCER"` in the Send OTP request, the user was being created as `CUSTOMER` instead. The role parameter was being ignored.

### Root Cause

1. **OTP Controller** didn't accept `role` parameter
2. **OTP Service** didn't store `role` in metadata
3. **Verify OTP** was auto-creating users as `CUSTOMER` during REGISTRATION
4. **Set Password** wasn't using role from OTP metadata

### Solution Implemented

#### 1. Updated OTP Controller (`src/controllers/otp.controller.js`)

```javascript
// NOW ACCEPTS role parameter
const { phone, type, name, role } = req.body;

// Validates role if provided
if (role) {
  const validRoles = [
    "CUSTOMER",
    "TECH_FREELANCER",
    "TECH_INTERNAL",
    "DISPATCHER",
    "CALL_CENTER",
    "ADMIN",
  ];
  if (!validRoles.includes(role)) {
    return res.status(400).json({
      message: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
    });
  }
}

// Pass role to service
const result = await otpService.sendOTP(phone, type, name, role);
```

#### 2. Updated OTP Service (`src/services/otp.service.js`)

```javascript
// Accept role parameter
export const sendOTP = async (phone, type, name = null, role = null) => {
  // ...

  // Store both name AND role in metadata
  const metadata = {};
  if (name) metadata.name = name;
  if (role) metadata.role = role;

  const otpRecord = await prisma.oTP.create({
    data: {
      // ...
      metadataJson:
        Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : null,
    },
  });
};

// FIXED: Don't auto-create user during REGISTRATION
// Only auto-create for LOGIN type
if (!user && type === "LOGIN") {
  // Create CUSTOMER for login
}
// REGISTRATION users are created in setPassword with correct role
```

#### 3. Updated Auth Service (`src/services/auth.service.js`)

```javascript
// Get role from OTP metadata
let finalName = name;
let finalRole = role;
if (otpRecord.metadataJson) {
  try {
    const metadata = JSON.parse(otpRecord.metadataJson);
    if (!finalName) finalName = metadata.name;
    if (!finalRole) finalRole = metadata.role; // ✅ NOW RETRIEVES ROLE
  } catch (e) {
    console.log("Could not parse OTP metadata");
  }
}

// Use finalRole (includes metadata role)
const userRole = finalRole || "TECH_FREELANCER";
```

## 📋 How to Use

### Send OTP with Role (Step 1)

```json
POST /api/otp/send
{
  "phone": "+8801718981009",
  "name": "John Freelancer",
  "type": "REGISTRATION",
  "role": "TECH_FREELANCER"
}
```

**All Available Roles:**

1. `CUSTOMER` - Service requesters
2. `TECH_FREELANCER` - Freelance technicians (40% commission)
3. `TECH_INTERNAL` - Internal employees (15% commission + 5% bonus + salary)
4. `DISPATCHER` - Work order management
5. `CALL_CENTER` - Customer support
6. `ADMIN` - Full system access

### Verify OTP (Step 2)

```json
POST /api/otp/verify
{
  "phone": "+8801718981009",
  "code": "123456",
  "type": "REGISTRATION"
}
```

**Response includes:**

- `tempToken` - Use this in Step 3
- NO user is created yet (this was the bug!)

### Set Password (Step 3)

```json
POST /api/auth/set-password
{
  "phone": "+8801718981009",
  "password": "test123",
  "tempToken": "temp_1733..."
}
```

**What happens:**

1. Retrieves role from OTP metadata (stored in Step 1)
2. Creates user with the correct role
3. Creates technician profile if TECH_FREELANCER or TECH_INTERNAL
4. Returns JWT token

## ✅ Testing Results

### Before Fix

```json
// Send OTP
{"role": "TECH_FREELANCER"}

// Verify OTP Response
{"user": {"role": "CUSTOMER"}} ❌ WRONG!
```

### After Fix

```json
// Send OTP
{"role": "TECH_FREELANCER"}

// Verify OTP Response
No user created yet ✅

// Set Password Response
{"user": {"role": "TECH_FREELANCER"}} ✅ CORRECT!
```

## 🎯 Benefits

1. **Single Registration Flow** - No need for separate employee/freelancer endpoints
2. **Role Selection Upfront** - User selects role in Step 1
3. **Flexible** - Role can be changed before password is set
4. **Backward Compatible** - If no role provided, defaults to TECH_FREELANCER
5. **Consistent** - Same 3-step flow for all roles

## 📝 Files Modified

1. `src/controllers/otp.controller.js` - Accept role parameter
2. `src/services/otp.service.js` - Store role in metadata, fix auto-creation bug
3. `src/services/auth.service.js` - Retrieve role from metadata
4. `FSM-API-FIXED-Dec4-2025-FINAL.postman_collection.json` - Updated with role examples

## 🚀 Status

✅ **FIXED AND TESTED** - December 5, 2025

All roles now work correctly through the unified registration flow!
