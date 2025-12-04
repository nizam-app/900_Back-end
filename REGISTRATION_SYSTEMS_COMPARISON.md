<!-- @format -->

# Registration Systems Comparison

## Overview

The FSM system now supports **TWO** distinct registration flows:

1. **Freelancer Registration** - For external technicians (40% commission)
2. **Internal Employee Registration** - For company staff (5% bonus + salary)

Both use 3-step OTP verification but create different user types.

---

## 1. Freelancer Registration (Public)

**User Type:** TECH_FREELANCER  
**Access:** Public registration via mobile app  
**Compensation:** 40% commission per job

### Flow

#### Step 1: Send OTP

```http
POST /api/otp/send
{
  "phone": "+8801718981009",
  "name": "John Freelancer",
  "type": "REGISTRATION"
}
```

**Response:**

```json
{
  "success": true,
  "message": "OTP sent to +8801718981009",
  "code": "123456",
  "tempToken": "temp_1733305200000_abc123",
  "expiresAt": "2025-12-04T10:05:00Z"
}
```

#### Step 2: Verify OTP

```http
POST /api/otp/verify
{
  "phone": "+8801718981009",
  "code": "123456",
  "type": "REGISTRATION"
}
```

**Response:**

```json
{
  "verified": true,
  "tempToken": "temp_1733305200000_abc123",
  "phone": "1718981009"
}
```

#### Step 3: Set Password

```http
POST /api/auth/set-password
{
  "phone": "+8801718981009",
  "password": "test123",
  "tempToken": "temp_1733305200000_abc123"
}
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 5,
    "name": "John Freelancer",
    "phone": "1718981009",
    "role": "TECH_FREELANCER",
    "technicianProfile": {
      "id": 2,
      "type": "FREELANCER",
      "commissionRate": 0.4,
      "status": "ACTIVE"
    }
  },
  "message": "Account created successfully! Welcome to FSM."
}
```

### What Gets Created

```javascript
User {
  role: "TECH_FREELANCER",
  name: "John Freelancer",
  phone: "1718981009"
}

TechnicianProfile {
  type: "FREELANCER",
  commissionRate: 0.4,  // 40%
  bonusRate: 0.05,      // 5% (not used for freelancers)
  status: "ACTIVE"
}

Wallet {
  balance: 0
}
```

---

## 2. Internal Employee Registration (Portal)

**User Type:** TECH_INTERNAL  
**Access:** Internal Team Portal (admin access required)  
**Compensation:** 5% bonus + fixed salary  
**Requires:** Employee ID

### Flow

#### Step 1: Initiate Registration

```http
POST /api/employee/register/initiate
{
  "name": "John Internal",
  "employeeId": "EMP-2025-001",
  "phone": "+8801718981000"
}
```

**Response:**

```json
{
  "success": true,
  "message": "OTP sent to +8801718981000",
  "code": "123456",
  "tempToken": "temp_1733305200000_abc123",
  "expiresAt": "2025-12-04T10:05:00Z"
}
```

**Note:** Employee ID is stored in OTP metadata for Step 3.

#### Step 2: Verify OTP

```http
POST /api/employee/register/verify-otp
{
  "phone": "+8801718981000",
  "code": "123456"
}
```

**Response:**

```json
{
  "success": true,
  "verified": true,
  "message": "Phone verified successfully",
  "tempToken": "temp_1733305200000_abc123",
  "phone": "1718981000"
}
```

#### Step 3: Complete Registration

```http
POST /api/employee/register/complete
{
  "phone": "+8801718981000",
  "password": "employee123",
  "tempToken": "temp_1733305200000_abc123",
  "name": "John Internal",
  "employeeId": "EMP-2025-001"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Employee account created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 17,
    "name": "John Internal",
    "phone": "1718981000",
    "role": "TECH_INTERNAL",
    "technicianProfile": {
      "id": 4,
      "type": "INTERNAL",
      "bonusRate": 0.05,
      "status": "ACTIVE"
    }
  }
}
```

#### Resend OTP (Optional)

```http
POST /api/employee/register/resend-otp
{
  "phone": "+8801718981000"
}
```

**Response:**

```json
{
  "success": true,
  "message": "OTP resent to +8801718981000",
  "code": "654321",
  "tempToken": "temp_1733305260000_xyz789",
  "expiresAt": "2025-12-04T10:10:00Z"
}
```

**Note:** Preserves employee data (name, employeeId) from Step 1.

### What Gets Created

```javascript
User {
  role: "TECH_INTERNAL",
  name: "John Internal",
  phone: "1718981000"
}

TechnicianProfile {
  type: "INTERNAL",
  commissionRate: 0,        // No commission
  bonusRate: 0.05,          // 5% bonus
  status: "ACTIVE",
  specialization: "EMP-2025-001"  // Employee ID stored here
}

Wallet {
  balance: 0
}
```

---

## Key Differences

| Feature               | Freelancer                              | Internal Employee              |
| --------------------- | --------------------------------------- | ------------------------------ |
| **Role**              | TECH_FREELANCER                         | TECH_INTERNAL                  |
| **Registration Path** | `/api/otp/*` + `/api/auth/set-password` | `/api/employee/register/*`     |
| **Employee ID**       | Not required                            | Required (EMP-XXXX-XXX)        |
| **Commission Rate**   | 40%                                     | 0% (not used)                  |
| **Bonus Rate**        | 5% (not used)                           | 5%                             |
| **Payment Model**     | Per-job commission                      | Fixed salary + bonus           |
| **Profile Type**      | FREELANCER                              | INTERNAL                       |
| **OTP Metadata**      | Only name                               | Name + employeeId              |
| **Access Level**      | Technician features                     | Technician + internal features |

---

## UI Differences

### Freelancer Registration UI (Mobile App)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Create Account

Step 1: Enter Details
┌─────────────────────────┐
│ Full Name               │
└─────────────────────────┘
┌─────────────────────────┐
│ Phone Number            │
└─────────────────────────┘

Step 2: Verify OTP
┌───┬───┬───┬───┬───┬───┐
│ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │
└───┴───┴───┴───┴───┴───┘

Step 3: Set Password
┌─────────────────────────┐
│ Password                │
└─────────────────────────┘
━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Internal Employee Registration UI (Portal)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Internal Team Portal
Create Employee Account

Step 1: Employee Details
┌─────────────────────────┐
│ Full Name               │
└─────────────────────────┘
┌─────────────────────────┐
│ Employee ID             │
└─────────────────────────┘
┌─────────────────────────┐
│ Phone Number            │
└─────────────────────────┘

Step 2: Verify OTP
┌───┬───┬───┬───┬───┬───┐
│ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │
└───┴───┴───┴───┴───┴───┘

Step 3: Set Password
Employee: John Internal
Employee ID: EMP-2025-001
┌─────────────────────────┐
│ Password                │
└─────────────────────────┘
━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Backend Implementation

### Freelancer Registration

- **Controller:** `src/controllers/auth.controller.js`
- **Routes:**
  - `POST /api/otp/send` (OTP controller)
  - `POST /api/otp/verify` (OTP controller)
  - `POST /api/auth/set-password` (Auth controller)

### Internal Employee Registration

- **Controller:** `src/controllers/employee.controller.js`
- **Routes:**
  - `POST /api/employee/register/initiate`
  - `POST /api/employee/register/verify-otp`
  - `POST /api/employee/register/complete`
  - `POST /api/employee/register/resend-otp`

---

## Testing

### Test Freelancer Registration

```bash
node test-freelancer-registration.js
```

### Test Employee Registration

```bash
node test-employee-registration.js
```

---

## Postman Collection

### Freelancer Registration

- **Section:** "Authentication & OTP"
- **Endpoints:**
  1. Send OTP (Step 1 for Registration)
  2. Verify OTP (Step 2 for Registration)
  3. Set Password (Step 3 - Complete Registration)

### Internal Employee Registration

- **Section:** "Employee Registration (Internal Team)"
- **Endpoints:**
  1. Step 1: Initiate Registration
  2. Step 2: Verify OTP
  3. Step 3: Complete Registration
  4. Resend OTP

---

## Database Records

### Freelancer Example

```sql
-- User table
INSERT INTO User (role, name, phone) VALUES ('TECH_FREELANCER', 'John Freelancer', '1718981009');

-- TechnicianProfile table
INSERT INTO TechnicianProfile (userId, type, commissionRate, bonusRate, status)
VALUES (5, 'FREELANCER', 0.4, 0.05, 'ACTIVE');

-- Wallet table
INSERT INTO Wallet (technicianId, balance) VALUES (2, 0);
```

### Internal Employee Example

```sql
-- User table
INSERT INTO User (role, name, phone) VALUES ('TECH_INTERNAL', 'John Internal', '1718981000');

-- TechnicianProfile table (employeeId stored in specialization)
INSERT INTO TechnicianProfile (userId, type, commissionRate, bonusRate, status, specialization)
VALUES (17, 'INTERNAL', 0, 0.05, 'ACTIVE', 'EMP-2025-001');

-- Wallet table
INSERT INTO Wallet (technicianId, balance) VALUES (4, 0);
```

---

## Summary

✅ **Freelancer Registration:** Public, 40% commission, no employee ID  
✅ **Employee Registration:** Internal portal, 5% bonus, requires employee ID  
✅ Both use 3-step OTP verification  
✅ Both auto-login after registration  
✅ Both create wallet with 0 balance  
✅ Postman collection updated with all endpoints

**Status:** Both systems fully implemented and tested (Dec 4, 2025)
