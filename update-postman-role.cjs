/** @format */

// Update Postman Collection with Role Parameter
const fs = require("fs");

const filePath = "FSM-API-FIXED-Dec4-2025-FINAL.postman_collection.json";

// Read the file
let content = fs.readFileSync(filePath, "utf8");

// Parse JSON
const collection = JSON.parse(content);

// Find and update Send OTP request
if (collection.item && collection.item[0] && collection.item[0].item) {
  const authSection = collection.item[0];
  const sendOtpRequest = authSection.item[0]; // First item is Send OTP

  if (sendOtpRequest.name === "Send OTP (Step 1 for Registration)") {
    // Update the request body to include role
    sendOtpRequest.request.body.raw = `{
  "phone": "+8801718981009",
  "name": "John Freelancer",
  "type": "REGISTRATION",
  "role": "TECH_FREELANCER"
}

// 📋 ROLE SELECTION - Choose one:

// 1️⃣ TECH_FREELANCER (40% commission)
// {
//   "phone": "+8801718981009",
//   "name": "John Freelancer",
//   "type": "REGISTRATION",
//   "role": "TECH_FREELANCER"
// }

// 2️⃣ TECH_INTERNAL (15% commission + 5% bonus + base salary)
// {
//   "phone": "+8801712345678",
//   "name": "Sarah Employee",
//   "type": "REGISTRATION",
//   "role": "TECH_INTERNAL"
// }

// 3️⃣ CUSTOMER (service requester)
// {
//   "phone": "+8801798765432",
//   "name": "Mike Customer",
//   "type": "REGISTRATION",
//   "role": "CUSTOMER"
// }

// 4️⃣ DISPATCHER (work order management)
// {
//   "phone": "+8801756789012",
//   "name": "Lisa Dispatcher",
//   "type": "REGISTRATION",
//   "role": "DISPATCHER"
// }

// 5️⃣ CALL_CENTER (customer support)
// {
//   "phone": "+8801734567890",
//   "name": "Tom Support",
//   "type": "REGISTRATION",
//   "role": "CALL_CENTER"
// }

// 6️⃣ ADMIN (full system access)
// {
//   "phone": "+8801723456789",
//   "name": "Admin User",
//   "type": "REGISTRATION",
//   "role": "ADMIN"
// }`;

    // Update description
    sendOtpRequest.request.description = `**STEP 1 OF 3: Enter Name, Phone & Role**

Send OTP for phone verification. Used for registration, login, password reset, and verification.

**UPDATED:** Dec 5, 2025 - NOW ACCEPTS ROLE PARAMETER! ✅

**📋 ALL AVAILABLE ROLES:**

1. **CUSTOMER** - End customers who request services
   - Permissions: Create SR, view own SRs/WOs, make payments
   - Commission: None

2. **TECH_FREELANCER** - Freelance technicians
   - Permissions: Accept WOs, update status, receive commissions
   - Commission: 40%

3. **TECH_INTERNAL** - Internal employees
   - Permissions: Same as freelancer + employment benefits
   - Commission: 15% + 5% bonus + base salary

4. **DISPATCHER** - Work order management
   - Permissions: View all WOs, assign technicians, update WO status
   - Commission: None

5. **CALL_CENTER** - Customer support
   - Permissions: Create SRs for customers, view all SRs/WOs
   - Commission: None

6. **ADMIN** - Full system access
   - Permissions: All operations, user management, settings
   - Commission: None

**Request Body:**
- phone (required): Phone number (10-15 digits)
- name (required for REGISTRATION): Full name of the user
- type (required): REGISTRATION, LOGIN, PASSWORD_RESET, or VERIFICATION
- role (optional): CUSTOMER, TECH_FREELANCER, TECH_INTERNAL, DISPATCHER, CALL_CENTER, ADMIN
  - If provided, user will be created with this role
  - If not provided, defaults to TECH_FREELANCER for backward compatibility

**Phone Format (Bangladesh):**
- +8801718981009 (recommended - with country code)
- 8801718981009 (works - auto-formatted)
- 01718981009 (works - auto-converted to 8801718981009)

**Success Response:**
- code: OTP code (for testing/development)
- tempToken: Temporary token (valid 10 minutes)
- expiresAt: OTP expiry time (5 minutes)
- smsStatus: sent/failed

**What Happens:**
1. OTP code generated (6 digits, valid 5 minutes)
2. SMS sent to phone number
3. Temporary token created (valid 10 minutes)
4. User's name AND role stored in OTP metadata
5. Proceed to Step 2: Verify OTP
6. Complete with Step 3: Set Password (role from metadata is used)

**3-Step Registration Flow:**
1. Send OTP with name + role → OTP sent, metadata stored
2. Verify OTP → Phone verified, temp token returned
3. Set Password → User created with stored role

TESTED & WORKING (Dec 5, 2025)`;

    console.log("✅ Updated Send OTP request with role parameter");
  }
}

// Write back to file
fs.writeFileSync(filePath, JSON.stringify(collection, null, "\t"));
console.log("✅ Postman collection saved successfully!");
