# System Status Documentation

## User Roles
```javascript
{
  "role": "TECH_INTERNAL", // Company employee technician
  "role": "TECH_FREELANCER", // Independent contractor
  "role": "CUSTOMER", // Service requester
  "role": "DISPATCHER", // Work order manager
  "role": "CALL_CENTER", // Customer service agent
  "role": "ADMIN" // Full system access
}
```

### Role Descriptions:

**TECH_INTERNAL (Internal Technician)**
- Company employee with salary
- Receives base salary + commission
- No wallet system
- Example: Full-time electrician employee

**TECH_FREELANCER (Freelance Technician)**
- Independent contractor
- Commission only, no salary
- Has wallet for balance tracking
- Can request payouts
- Example: Contract plumber

**CUSTOMER**
- Regular service requester
- Can create service requests
- Track their work orders

**DISPATCHER**
- Assigns work orders to technicians
- Manages scheduling and assignments
- Cannot modify technician documents

**CALL_CENTER**
- Creates service requests for customers
- First point of contact
- Customer service representative

**ADMIN**
- Full system access
- Can manage all users and settings
- Upload technician documents

---

## Service Request (SR) Status
```javascript
{
  "status": "NEW", // Just created, not yet processed
  "status": "OPEN", // Being reviewed by dispatcher
  "status": "CONVERTED_TO_WO", // Converted to work order
  "status": "CANCELLED" // Cancelled by customer/dispatcher
}
```

### SR Status Flow:
```
NEW → OPEN → CONVERTED_TO_WO
  ↓
CANCELLED (can happen at any stage)
```

---

## Work Order (WO) Status
```javascript
{
  "status": "UNASSIGNED", // No technician assigned yet
  "status": "ASSIGNED", // Assigned to technician, awaiting response
  "status": "ACCEPTED", // Technician accepted the job
  "status": "IN_PROGRESS", // Technician started work on site
  "status": "COMPLETED_PENDING_PAYMENT", // Job done, payment proof needed
  "status": "PAID_VERIFIED", // Payment verified, commission calculated
  "status": "CANCELLED" // Cancelled by dispatcher/admin
}
```

### WO Status Flow:
```
UNASSIGNED → ASSIGNED → ACCEPTED → IN_PROGRESS → COMPLETED_PENDING_PAYMENT → PAID_VERIFIED
    ↓           ↓          ↓            ↓
CANCELLED (can happen at multiple stages)
```

### Status Details:

**UNASSIGNED**
- Work order created but no technician assigned
- Dispatcher needs to assign a technician

**ASSIGNED**
- Technician assigned, has 30 minutes to respond
- Waiting for technician to accept or decline

**ACCEPTED**
- Technician accepted the job
- Scheduled to start work

**IN_PROGRESS**
- Technician checked in and started work
- Active on site

**COMPLETED_PENDING_PAYMENT**
- Job completed by technician
- Completion photos uploaded
- Waiting for customer payment proof

**PAID_VERIFIED**
- Payment proof verified by dispatcher/admin
- Commission calculated and credited
- Job fully closed

**CANCELLED**
- Work order cancelled
- Requires cancellation reason

---

## Payment Status
```javascript
{
  "status": "PENDING_UPLOAD", // No payment proof uploaded yet
  "status": "PENDING_VERIFICATION", // Proof uploaded, awaiting verification
  "status": "VERIFIED", // Payment verified by admin/dispatcher
  "status": "REJECTED" // Payment proof rejected
}
```

### Payment Status Flow:
```
PENDING_UPLOAD → PENDING_VERIFICATION → VERIFIED
                        ↓
                    REJECTED
```

### Status Details:

**PENDING_UPLOAD**
- Work order completed
- Customer hasn't uploaded payment proof yet

**PENDING_VERIFICATION**
- Payment proof uploaded by customer
- Awaiting admin/dispatcher verification

**VERIFIED**
- Payment verified
- Commission calculated
- Amount credited to technician

**REJECTED**
- Payment proof rejected
- Requires rejection reason
- Customer must upload new proof

---

## Commission Status
```javascript
{
  "status": "PENDING", // Commission calculated, not yet paid
  "status": "PAID", // Commission paid to technician
  "status": "CANCELLED" // Work order cancelled, commission void
}
```

---

## Technician Profile Status
```javascript
{
  "status": "ACTIVE", // Available for work assignments
  "status": "INACTIVE" // Temporarily not working
}
```

---

## Technician Location Status
```javascript
{
  "locationStatus": "ONLINE", // Available and ready for assignments
  "locationStatus": "BUSY", // Currently on a job
  "locationStatus": "OFFLINE" // Not available
}
```

---

## Payout Request Status
```javascript
{
  "status": "PENDING", // Payout requested, awaiting review
  "status": "APPROVED", // Payout approved by admin
  "status": "REJECTED", // Payout request rejected
  "status": "COMPLETED" // Payout processed and sent
}
```

---

## Technician Specializations
```javascript
{
  "specialization": "ELECTRICAL", // Electrician
  "specialization": "PLUMBING", // Plumber
  "specialization": "HVAC", // AC/Heating repair
  "specialization": "GENERAL", // General maintenance
  "specialization": "CARPENTRY", // Carpenter
  "specialization": "PAINTING" // Painter
}
```

---

## Priority Levels
```javascript
{
  "priority": "LOW", // Can wait, non-urgent
  "priority": "MEDIUM", // Normal priority
  "priority": "HIGH" // Urgent, needs immediate attention
}
```

---

## Payment Methods
```javascript
{
  "method": "CASH", // Cash payment
  "method": "MOBILE_MONEY" // Mobile payment (bKash, Nagad, etc.)
}
```

---

## Service Request Source
```javascript
{
  "source": "CUSTOMER_APP", // Created by customer via mobile app
  "source": "WEB_PORTAL", // Created via web portal
  "source": "CALL_CENTER" // Created by call center agent
}
```

---

## User Block Status
```javascript
{
  "isBlocked": false, // User is active
  "isBlocked": true, // User is blocked
  "blockedReason": "Violation of terms", // Why user was blocked
  "blockedAt": "2025-11-26T10:30:00Z", // When user was blocked
  "blockedById": 1 // Admin who blocked the user
}
```

---

## Example: Complete Technician Creation Request
```json
POST /api/admin/users
{
  "phone": "777777",
  "password": "777777",
  "name": "777777",
  "email": "tech@example.com",
  "role": "TECH_FREELANCER",  // or "TECH_INTERNAL" for employee
  "homeAddress": "123 Main Street",
  "latitude": 23.8103,
  "longitude": 90.4125,
  "technicianProfile": {
    "commissionRate": 0.2,      // 20% commission (OPTIONAL, default: 0.2)
    "bonusRate": 0.05,           // 5% bonus (OPTIONAL, default: 0.05)
    "baseSalary": 50000,         // For TECH_INTERNAL only (OPTIONAL)
    "specialization": "ELECTRICAL", // OPTIONAL, default: GENERAL
    "status": "ACTIVE",          // OPTIONAL, default: ACTIVE
    "academicTitle": "BSc",      // OPTIONAL
    "photoUrl": "/uploads/photo.jpg",  // OPTIONAL
    "idCardUrl": "/uploads/id.jpg",    // OPTIONAL
    "residencePermitUrl": "/uploads/permit.jpg", // OPTIONAL
    "residencePermitFrom": "2025-01-01", // OPTIONAL
    "residencePermitTo": "2026-01-01",   // OPTIONAL
    "degreesUrl": "[\"url1\", \"url2\"]" // OPTIONAL, JSON array
  }
}
```

**Response:**
```json
{
  "id": 5,
  "name": "777777",
  "phone": "777777",
  "email": "tech@example.com",
  "role": "TECH_FREELANCER", // Independent contractor
  "isBlocked": false,
  "homeAddress": "123 Main Street",
  "latitude": 23.8103,
  "longitude": 90.4125,
  "technicianProfile": {
    "type": "FREELANCER", // INTERNAL for TECH_INTERNAL
    "commissionRate": 0.2,
    "bonusRate": 0.05,
    "status": "ACTIVE",
    "specialization": "ELECTRICAL"
  },
  "wallet": {
    "balance": 0
  }
}
```

---

## Audit Log Actions
Track all important system actions:
- USER_LOGIN
- USER_LOGOUT
- SR_CREATED
- SR_CANCELLED
- WO_CREATED_FROM_SR
- WO_ASSIGNED
- WO_REASSIGNED
- WO_RESPOND (accept/decline)
- WO_START
- WO_COMPLETE
- WO_CANCELLED
- PAYMENT_UPLOADED
- PAYMENT_VERIFIED
- PAYMENT_REJECTED
- COMMISSION_CALCULATED
- PAYOUT_REQUESTED
- PAYOUT_APPROVED
