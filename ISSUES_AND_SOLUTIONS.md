<!-- @format -->

# FSM System - Issues & Solutions

**Date:** November 26, 2025  
**Status:** All issues documented with solutions

---

## Issues List & Solutions

### 1. List Service Request API Not Working / Get All Work Orders API Not Working

**Issue:** APIs returning errors or not functioning properly.

**Solution:**

**Service Requests - Get All:**

```javascript
GET /api/srs

// Query parameters (optional)
?status=OPEN
&priority=HIGH
&page=1
&limit=10

Response: 200 OK
{
  "serviceRequests": [
    {
      "id": 1,
      "srNumber": "SR-1732617600000",
      "status": "OPEN",
      "priority": "HIGH",
      "description": "AC not cooling",
      "customer": {
        "id": 5,
        "name": "John Doe",
        "phone": "+254712345678"
      },
      "category": {
        "id": 1,
        "name": "HVAC"
      },
      "technician": null,  // Added for history
      "woStatus": null,    // Added for call center
      "createdAt": "2025-11-26T10:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 10
}
```

**Work Orders - Get All:**

```javascript
GET /api/wos

// Query parameters (optional)
?status=IN_PROGRESS
&technicianId=5
&page=1
&limit=10

Response: 200 OK
{
  "workOrders": [
    {
      "id": 10,
      "woNumber": "WO-1732617700000",
      "status": "IN_PROGRESS",
      "amount": 5000,  // Added
      "technician": {
        "id": 8,
        "name": "Tech Name",
        "phone": "+254722334455"
      },
      "customer": {
        "id": 5,
        "name": "Customer Name",
        "phone": "+254712345678"
      },
      "category": {
        "id": 1,
        "name": "HVAC"
      },
      "scheduledAt": "2025-11-27T10:00:00Z",
      "createdAt": "2025-11-26T14:00:00Z"
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10
}
```

---

### 2. Create Service Request - Missing Status and SR-ID

**Issue:** Response doesn't return status and srId.

**Solution:**

```javascript
POST /api/srs
Authorization: Bearer <token>

Request:
{
  "categoryId": 1,
  "subserviceId": 2,
  "serviceId": 3,
  "description": "AC not cooling properly",
  "priority": "HIGH",
  "customerName": "Jane Smith",
  "customerPhone": "+254723456789",
  "customerEmail": "jane@example.com",
  "latitude": -1.2921,
  "longitude": 36.8219,
  "address": "123 Main St, Nairobi",
  "images": ["image1.jpg", "image2.jpg"]  // Optional
}

Response: 201 Created
{
  "id": 15,
  "srNumber": "SR-1732617600000",  // Added
  "status": "OPEN",                 // Added
  "priority": "HIGH",
  "description": "AC not cooling properly",
  "customer": {
    "id": 5,
    "name": "Jane Smith",
    "phone": "+254723456789",
    "email": "jane@example.com"
  },
  "category": {
    "id": 1,
    "name": "HVAC"
  },
  "createdAt": "2025-11-26T10:00:00Z"
}
```

---

### 3. Convert SR to WO - Missing Estimated Duration

**Issue:** Estimated duration property not available.

**Solution:**

```javascript
POST /api/wos
Authorization: Bearer <dispatcher-token>

Request:
{
  "srId": 15,
  "technicianId": 8,              // Now OPTIONAL
  "scheduledAt": "2025-11-27T10:00:00Z",
  "estimatedDuration": 120,       // Added (minutes)
  "notes": "Customer prefers morning",
  "amount": 5000                  // Added
}

Response: 201 Created
{
  "id": 42,
  "woNumber": "WO-1732617700000",
  "status": "PENDING_ACCEPTANCE",
  "estimatedDuration": 120,       // Added
  "amount": 5000,                 // Added
  "technician": {
    "id": 8,
    "name": "John Tech",
    "phone": "+254722334455"
  },
  "scheduledAt": "2025-11-27T10:00:00Z",
  "createdAt": "2025-11-26T14:30:00Z"
}
```

---

### 4. Call Center & Internal/Freelancer Roles

**Issue:** Roles not available properly.

**Solution:**

**Available Roles:**

```javascript
// All available roles
ADMIN; // Full system access
DISPATCHER; // Assign and manage work orders
CALL_CENTER; // Create SRs on behalf of customers
TECH_INTERNAL; // Salaried technician
TECH_FREELANCER; // Contract-based technician
CUSTOMER; // End user
```

**User Registration/Creation:**

```javascript
POST /api/auth/register
// OR
POST /api/admin/users/create

Request:
{
  "name": "John Doe",
  "phone": "+254712345678",
  "email": "john@example.com",
  "password": "SecurePass123",
  "role": "CALL_CENTER"  // or TECH_INTERNAL, TECH_FREELANCER
}

Response: 201 Created
{
  "id": 25,
  "name": "John Doe",
  "phone": "+254712345678",
  "email": "john@example.com",
  "role": "CALL_CENTER",
  "createdAt": "2025-11-26T10:00:00Z"
}
```

---

### 5. Dispatcher/Admin/Call Center Login - Missing Role, Name, Password

**Issue:** Login response needs role, name, and proper authentication.

**Solution:**

```javascript
POST /api/auth/login

Request:
{
  "phone": "+254712345678",
  "password": "SecurePass123"
}

Response: 200 OK
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 10,
    "name": "Dispatcher Name",      // Added
    "phone": "+254712345678",
    "email": "dispatcher@fsm.com",
    "role": "DISPATCHER",            // Added
    "isBlocked": false,
    "createdAt": "2025-11-20T10:00:00Z"
  }
}
```

---

### 6. SR List - Technician & WO Status for History

**Issue:** Service request list needs technician info and work order status for history tracking.

**Solution:**

```javascript
GET /api/srs

Response: 200 OK
{
  "serviceRequests": [
    {
      "id": 1,
      "srNumber": "SR-1732617600000",
      "status": "CONVERTED_TO_WO",
      "description": "AC repair needed",
      "customer": {
        "id": 5,
        "name": "John Customer",
        "phone": "+254712345678"
      },
      "category": {
        "id": 1,
        "name": "HVAC"
      },
      // Added for history
      "technician": {
        "id": 8,
        "name": "Tech Name",
        "phone": "+254722334455"
      },
      // Added for call center - WO status visibility
      "workOrder": {
        "id": 42,
        "woNumber": "WO-1732617700000",
        "status": "IN_PROGRESS"
      },
      "createdAt": "2025-11-26T10:00:00Z"
    }
  ]
}
```

---

### 7. Service Request Cancel API

**Issue:** Cancel API missing.

**Solution:**

```javascript
PATCH /api/srs/:id/cancel
Authorization: Bearer <token>

Request:
{
  "reason": "Customer changed mind"
}

Response: 200 OK
{
  "id": 15,
  "srNumber": "SR-1732617600000",
  "status": "CANCELLED",
  "cancelReason": "Customer changed mind",
  "cancelledAt": "2025-11-26T15:00:00Z"
}
```

---

### 8. Call Center SR Creation - Phone Number Check

**Issue:** Need to check if customer exists by phone, show name/email only if new customer.

**Solution:**

**Step 1: Search Customer by Phone**

```javascript
GET /api/callcenter/search-customer?phone=+254712345678
Authorization: Bearer <callcenter-token>

// If customer EXISTS
Response: 200 OK
{
  "exists": true,
  "customer": {
    "id": 5,
    "name": "John Doe",
    "phone": "+254712345678",
    "email": "john@example.com"
  }
}

// If customer DOESN'T exist
Response: 200 OK
{
  "exists": false,
  "phone": "+254712345678"
}
```

**Step 2: Create SR**

**For Existing Customer:**

```javascript
POST /api/srs
Authorization: Bearer <callcenter-token>

Request:
{
  "customerId": 5,  // Use existing customer ID
  "categoryId": 1,
  "subserviceId": 2,
  "serviceId": 3,
  "description": "AC not working",
  "priority": "HIGH",
  "latitude": -1.2921,
  "longitude": 36.8219,
  "address": "123 Main St"
}
```

**For New Customer:**

```javascript
POST /api/srs
Authorization: Bearer <callcenter-token>

Request:
{
  "customerPhone": "+254712345678",  // Phone is required
  "customerName": "Jane Smith",      // Required for new customer
  "customerEmail": "jane@example.com", // Optional for new customer
  "categoryId": 1,
  "subserviceId": 2,
  "serviceId": 3,
  "description": "AC not working",
  "priority": "HIGH",
  "latitude": -1.2921,
  "longitude": 36.8219,
  "address": "123 Main St",
  "images": ["image1.jpg", "image2.jpg"]  // Optional - array of image URLs
}

Response: 201 Created
{
  "id": 20,
  "srNumber": "SR-1732618000000",
  "status": "OPEN",
  "customer": {
    "id": 15,  // Newly created customer ID
    "name": "Jane Smith",
    "phone": "+254712345678",
    "email": "jane@example.com"
  },
  "category": {
    "id": 1,
    "name": "HVAC"
  }
}
```

---

### 9. Logout API

**Issue:** Missing logout endpoint.

**Solution:**

```javascript
POST /api/auth/logout
Authorization: Bearer <token>

Request: {} // Empty body

Response: 200 OK
{
  "message": "Logged out successfully"
}

// Frontend should:
// 1. Remove token from localStorage/sessionStorage
// 2. Clear user data from state
// 3. Redirect to login page
```

---

### 10. WO Convert - TechnicianId Optional

**Issue:** TechnicianId should be optional when converting SR to WO.

**Solution:**

```javascript
POST /api/wos
Authorization: Bearer <dispatcher-token>

// Option 1: With technician (immediate assignment)
Request:
{
  "srId": 15,
  "technicianId": 8,            // OPTIONAL
  "scheduledAt": "2025-11-27T10:00:00Z",
  "estimatedDuration": 120,
  "amount": 5000,
  "notes": "Customer prefers morning"
}

// Option 2: Without technician (assign later)
Request:
{
  "srId": 15,
  // technicianId omitted
  "scheduledAt": "2025-11-27T10:00:00Z",
  "estimatedDuration": 120,
  "amount": 5000,
  "notes": "Will assign technician later"
}

Response: 201 Created
{
  "id": 42,
  "woNumber": "WO-1732617700000",
  "status": "PENDING_ASSIGNMENT",  // Different status when no tech assigned
  "technician": null,              // null if not assigned
  "scheduledAt": "2025-11-27T10:00:00Z",
  "estimatedDuration": 120,
  "amount": 5000
}
```

---

### 11. WO Reassign - Date, Time, Duration, Notes

**Issue:** Reassign should allow updating schedule, duration, and notes.

**Solution:**

```javascript
PATCH /api/wos/:woId/reassign
Authorization: Bearer <dispatcher-token>

Request:
{
  "technicianId": 12,                      // Required - new technician
  "scheduledAt": "2025-11-28T14:00:00Z",  // Optional - new date/time
  "estimatedDuration": 180,                // Optional - new duration (minutes)
  "notes": "Customer requested different time", // Optional - reassignment notes
  "reason": "Previous tech unavailable"    // Optional - reassignment reason
}

Response: 200 OK
{
  "id": 42,
  "woNumber": "WO-1732617700000",
  "status": "PENDING_ACCEPTANCE",
  "technician": {
    "id": 12,
    "name": "New Tech Name",
    "phone": "+254733445566"
  },
  "scheduledAt": "2025-11-28T14:00:00Z",
  "estimatedDuration": 180,
  "reassignmentNotes": "Customer requested different time",
  "reassignedAt": "2025-11-26T16:00:00Z"
}
```

---

### 12. WO Decline - Reason Required

**Issue:** Work order decline/reject needs reason.

**Solution:**

```javascript
PATCH /api/wos/:woId/reject
Authorization: Bearer <tech-token>

Request:
{
  "reason": "Not available at scheduled time"  // Required
}

Response: 200 OK
{
  "id": 42,
  "woNumber": "WO-1732617700000",
  "status": "REJECTED",
  "rejectionReason": "Not available at scheduled time",
  "rejectedAt": "2025-11-26T16:30:00Z",
  "technician": {
    "id": 8,
    "name": "Tech Name"
  }
}
```

---

### 13. Dashboard Stats API - All Status Counts

**Issue:** Need API to get counts for all statuses.

**Solution:**

**Work Order Stats:**

```javascript
GET /api/admin/stats/work-orders
Authorization: Bearer <admin-token>

Response: 200 OK
{
  "totalWorkOrders": 150,
  "byStatus": {
    "PENDING_ACCEPTANCE": 12,
    "ACCEPTED": 8,
    "IN_PROGRESS": 15,
    "COMPLETED_PENDING_PAYMENT": 5,
    "PAID_VERIFIED": 95,
    "CANCELLED": 10,
    "REJECTED": 3,
    "EXPIRED": 2
  },
  "todayStats": {
    "created": 5,
    "completed": 8,
    "inProgress": 15
  }
}
```

**Service Request Stats:**

```javascript
GET /api/admin/stats/service-requests
Authorization: Bearer <admin-token>

Response: 200 OK
{
  "totalServiceRequests": 200,
  "byStatus": {
    "OPEN": 25,
    "ASSIGNED": 10,
    "CONVERTED_TO_WO": 150,
    "CANCELLED": 15
  },
  "byPriority": {
    "LOW": 30,
    "MEDIUM": 80,
    "HIGH": 60,
    "URGENT": 30
  },
  "todayStats": {
    "created": 10,
    "converted": 8
  }
}
```

**Overall Dashboard Stats:**

```javascript
GET /api/admin/dashboard
Authorization: Bearer <admin-token>

Response: 200 OK
{
  "users": {
    "total": 500,
    "customers": 400,
    "technicians": 50,
    "dispatchers": 5,
    "callCenter": 10,
    "admins": 2
  },
  "serviceRequests": {
    "total": 200,
    "open": 25,
    "converted": 150
  },
  "workOrders": {
    "total": 150,
    "pending": 12,
    "inProgress": 15,
    "completed": 95
  },
  "payments": {
    "totalAmount": 500000,
    "pending": 50000,
    "verified": 450000
  },
  "commissions": {
    "totalAmount": 100000,
    "pending": 20000,
    "paid": 80000
  }
}
```

---

### 14. WO Amount Property Missing

**Issue:** Work order doesn't have amount field.

**Solution:**

**Added to Work Order model and all endpoints:**

```javascript
// Create WO
POST /api/wos
{
  "srId": 15,
  "technicianId": 8,
  "amount": 5000  // Added
}

// Get WO
GET /api/wos/42
Response:
{
  "id": 42,
  "woNumber": "WO-1732617700000",
  "amount": 5000,  // Added
  "status": "IN_PROGRESS",
  ...
}

// Update amount
PATCH /api/wos/42/update-amount
Authorization: Bearer <dispatcher-token>

Request:
{
  "amount": 6000
}

Response: 200 OK
{
  "id": 42,
  "amount": 6000,
  "updatedAt": "2025-11-26T17:00:00Z"
}
```

---

### 15. Technician Creation - Additional Data

**Issue:** Need to add optional additional data when creating technician.

**Solution:**

```javascript
POST /api/admin/users/create
Authorization: Bearer <admin-token>

Request:
{
  "name": "John Technician",
  "phone": "+254712345678",
  "email": "john@tech.com",
  "password": "SecurePass123",
  "role": "TECH_INTERNAL",  // or TECH_FREELANCER

  // Additional optional data
  "specialization": "HVAC Specialist",     // Optional
  "academicTitle": "Diploma in HVAC",      // Optional
  "commissionRate": 0.20,                   // Optional (default: 0.20)
  "bonusRate": 0.05,                        // Optional (default: 0.05)
  "baseSalary": 50000,                      // Optional - for TECH_INTERNAL only
  "photoUrl": "https://...",                // Optional
  "idCardUrl": "https://...",               // Optional
  "residencePermitUrl": "https://...",      // Optional - for foreign workers
  "residencePermitFrom": "2025-01-01",      // Optional
  "residencePermitTo": "2026-01-01",        // Optional
  "degreesUrl": ["url1", "url2"],           // Optional - array of certificate URLs
  "homeAddress": "123 Tech Street, Nairobi" // Optional
}

Response: 201 Created
{
  "id": 30,
  "name": "John Technician",
  "phone": "+254712345678",
  "email": "john@tech.com",
  "role": "TECH_INTERNAL",
  "technicianProfile": {
    "id": 10,
    "type": "INTERNAL",
    "commissionRate": 0.20,
    "bonusRate": 0.05,
    "baseSalary": 50000,
    "specialization": "HVAC Specialist",
    "academicTitle": "Diploma in HVAC",
    "status": "ACTIVE"
  },
  "createdAt": "2025-11-26T17:30:00Z"
}
```

**Role Explanation:**

```javascript
/**
 * TECHNICIAN ROLES:
 *
 * TECH_INTERNAL:
 *   - Salaried employee
 *   - Receives monthly base salary + commission + bonus
 *   - Company provides tools and equipment
 *   - Fixed working hours
 *   - Example: Full-time HVAC technician
 *
 * TECH_FREELANCER:
 *   - Contract-based worker
 *   - Receives only commission + bonus (no base salary)
 *   - Uses own tools and equipment
 *   - Flexible working hours
 *   - Example: Independent electrician
 */
```

---

### 16. Get All Users - Missing Properties

**Issue:** User list endpoint missing properties.

**Solution:**

```javascript
GET /api/admin/users
Authorization: Bearer <admin-token>

// Query parameters (optional)
?role=TECH_INTERNAL
&status=ACTIVE
&page=1
&limit=20

Response: 200 OK
{
  "users": [
    {
      "id": 10,
      "name": "John Technician",
      "phone": "+254712345678",
      "email": "john@tech.com",
      "role": "TECH_INTERNAL",
      "isBlocked": false,
      "blockedReason": null,

      // Added properties
      "status": "ACTIVE",  // ACTIVE, INACTIVE, PENDING_APPROVAL
      "lastActive": "2025-11-26T18:00:00Z",
      "locationStatus": "ONLINE",  // ONLINE, BUSY, OFFLINE
      "latitude": -1.2921,
      "longitude": 36.8219,

      // Technician-specific data (if role is TECH_*)
      "technicianProfile": {
        "id": 5,
        "type": "INTERNAL",
        "specialization": "HVAC Specialist",
        "commissionRate": 0.20,
        "bonusRate": 0.05,
        "baseSalary": 50000,
        "academicTitle": "Diploma",
        "status": "ACTIVE"
      },

      // Statistics (if technician)
      "stats": {
        "completedJobs": 45,
        "totalEarnings": 150000,
        "averageRating": 4.8,
        "activeWorkOrders": 2
      },

      "createdAt": "2025-11-20T10:00:00Z",
      "updatedAt": "2025-11-26T18:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20
}
```

---

### 17. Get SR by ID Not Working

**Issue:** Getting service request by ID returns error.

**Solution:**

```javascript
GET /api/srs/:id
Authorization: Bearer <token>

// Can use either numeric ID or SR number
GET /api/srs/15
// OR
GET /api/srs/SR-1732617600000

Response: 200 OK
{
  "id": 15,
  "srNumber": "SR-1732617600000",
  "status": "CONVERTED_TO_WO",
  "priority": "HIGH",
  "description": "AC not cooling properly",

  "customer": {
    "id": 5,
    "name": "John Doe",
    "phone": "+254712345678",
    "email": "john@example.com",
    "address": "123 Main St"
  },

  "category": {
    "id": 1,
    "name": "HVAC",
    "description": "Heating, Ventilation, Air Conditioning"
  },

  "subservice": {
    "id": 2,
    "name": "Air Conditioning"
  },

  "service": {
    "id": 3,
    "name": "AC Repair",
    "baseRate": 5000
  },

  // Work order info (if converted)
  "workOrder": {
    "id": 42,
    "woNumber": "WO-1732617700000",
    "status": "IN_PROGRESS",
    "technician": {
      "id": 8,
      "name": "Tech Name",
      "phone": "+254722334455"
    }
  },

  "latitude": -1.2921,
  "longitude": 36.8219,
  "address": "123 Main St, Nairobi",
  "images": ["url1.jpg", "url2.jpg"],

  "createdBy": {
    "id": 10,
    "name": "Call Center Agent",
    "role": "CALL_CENTER"
  },

  "createdAt": "2025-11-26T10:00:00Z",
  "updatedAt": "2025-11-26T14:00:00Z"
}
```

---

### 18. Audit Logging

**Issue:** What audit logging has been implemented?

**Solution:**

**Audit Trail Implementation:**

```javascript
GET /api/admin/audit-trail
Authorization: Bearer <admin-token>

// Query parameters (optional)
?userId=10
&action=WO_COMPLETE
&entityType=WORK_ORDER
&startDate=2025-11-01
&endDate=2025-11-30
&page=1
&limit=50

Response: 200 OK
{
  "auditLogs": [
    {
      "id": 100,
      "userId": 8,
      "user": {
        "id": 8,
        "name": "Tech Name",
        "role": "TECH_INTERNAL"
      },
      "action": "WO_COMPLETE",
      "entityType": "WORK_ORDER",
      "entityId": 42,
      "details": {
        "woNumber": "WO-1732617700000",
        "customerId": 5,
        "amount": 5000
      },
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "timestamp": "2025-11-26T15:30:00Z"
    }
  ],
  "total": 500,
  "page": 1,
  "limit": 50
}
```

**Tracked Actions:**

```javascript
/**
 * AUDIT ACTIONS LOGGED:
 *
 * Authentication:
 * - USER_LOGIN
 * - USER_LOGOUT
 * - PASSWORD_CHANGE
 * - ACCOUNT_DEACTIVATE
 *
 * Service Requests:
 * - SR_CREATE
 * - SR_CANCEL
 *
 * Work Orders:
 * - WO_CREATE
 * - WO_ASSIGN
 * - WO_REASSIGN
 * - WO_ACCEPT
 * - WO_REJECT
 * - WO_START
 * - WO_COMPLETE
 * - WO_CANCEL
 *
 * Payments:
 * - PAYMENT_UPLOAD
 * - PAYMENT_VERIFY
 * - PAYMENT_REJECT
 *
 * Commissions:
 * - COMMISSION_CREATE
 * - PAYOUT_REQUEST
 * - PAYOUT_APPROVE
 * - PAYOUT_REJECT
 *
 * User Management:
 * - USER_CREATE
 * - USER_UPDATE
 * - USER_DELETE
 * - USER_SUSPEND
 * - USER_UNSUSPEND
 * - TECH_APPROVE
 * - TECH_REJECT
 */
```

---

### 19. Admin Category/Service/Subservice Creation

**Issue:** Admin should be able to create categories, services, and subservices.

**Solution:**

**Create Category:**

```javascript
POST /api/categories
Authorization: Bearer <admin-token>

Request:
{
  "name": "HVAC Services",
  "description": "Heating, Ventilation, and Air Conditioning"
}

Response: 201 Created
{
  "id": 1,
  "name": "HVAC Services",
  "description": "Heating, Ventilation, and Air Conditioning",
  "isActive": true,
  "createdAt": "2025-11-26T19:00:00Z"
}
```

**Create Subservice:**

```javascript
POST /api/categories/:categoryId/subservices
Authorization: Bearer <admin-token>

Request:
{
  "name": "Air Conditioning",
  "description": "AC installation and repair services"
}

Response: 201 Created
{
  "id": 2,
  "categoryId": 1,
  "name": "Air Conditioning",
  "description": "AC installation and repair services",
  "createdAt": "2025-11-26T19:05:00Z"
}
```

**Create Service:**

```javascript
POST /api/subservices/:subserviceId/services
Authorization: Bearer <admin-token>

Request:
{
  "name": "AC Repair",
  "description": "Repair and maintenance of air conditioning units",
  "baseRate": 5000
}

Response: 201 Created
{
  "id": 3,
  "subserviceId": 2,
  "name": "AC Repair",
  "description": "Repair and maintenance of air conditioning units",
  "baseRate": 5000,
  "createdAt": "2025-11-26T19:10:00Z"
}
```

**Get All Categories (Public - No Auth Required):**

```javascript
GET /api/categories

Response: 200 OK
{
  "categories": [
    {
      "id": 1,
      "name": "HVAC Services",
      "description": "Heating, Ventilation, and Air Conditioning",
      "isActive": true,
      "subservices": [
        {
          "id": 2,
          "name": "Air Conditioning",
          "services": [
            {
              "id": 3,
              "name": "AC Repair",
              "baseRate": 5000
            },
            {
              "id": 4,
              "name": "AC Installation",
              "baseRate": 8000
            }
          ]
        }
      ]
    }
  ]
}
```

---

## Status Enums with Explanations

### Service Request Status (SRStatus)

```javascript
/**
 * SERVICE REQUEST STATUSES:
 *
 * OPEN:
 *   - Initial status when SR is created
 *   - Waiting to be converted to work order
 *   - Customer can cancel at this stage
 *
 * ASSIGNED:
 *   - Dispatcher is reviewing the SR
 *   - Planning to convert to WO
 *
 * CONVERTED_TO_WO:
 *   - SR has been converted to Work Order
 *   - Now tracked through WO lifecycle
 *   - Cannot be cancelled (must cancel WO instead)
 *
 * CANCELLED:
 *   - Customer or admin cancelled the SR
 *   - No work order will be created
 */

enum SRStatus {
  OPEN
  ASSIGNED
  CONVERTED_TO_WO
  CANCELLED
}
```

### Work Order Status (WOStatus)

```javascript
/**
 * WORK ORDER STATUSES:
 *
 * PENDING_ASSIGNMENT:
 *   - WO created but no technician assigned yet
 *   - Dispatcher needs to assign a technician
 *
 * PENDING_ACCEPTANCE:
 *   - Technician assigned, waiting for acceptance
 *   - Technician can accept or reject
 *   - Has time limit (e.g., 2 hours to respond)
 *
 * ACCEPTED:
 *   - Technician accepted the work order
 *   - Scheduled for the appointment time
 *   - Technician should start job at scheduled time
 *
 * IN_PROGRESS:
 *   - Technician started working on the job
 *   - Customer knows tech is on-site
 *   - Has completion time limit
 *
 * COMPLETED_PENDING_PAYMENT:
 *   - Job completed, photos uploaded
 *   - Waiting for technician to upload payment proof
 *   - Customer has paid (cash or mobile money)
 *
 * PAID_VERIFIED:
 *   - Payment proof uploaded and verified by admin
 *   - Commission calculated and added to tech wallet
 *   - Work order fully completed
 *
 * CANCELLED:
 *   - Work order cancelled by customer/admin/dispatcher
 *   - Reason must be provided
 *   - Cannot be resumed
 *
 * REJECTED:
 *   - Technician rejected the work order
 *   - Reason must be provided
 *   - Can be reassigned to another technician
 *
 * EXPIRED:
 *   - Time limit exceeded (no response or no completion)
 *   - Automatically set by system
 *   - Can be reassigned
 */

enum WOStatus {
  PENDING_ASSIGNMENT
  PENDING_ACCEPTANCE
  ACCEPTED
  IN_PROGRESS
  COMPLETED_PENDING_PAYMENT
  PAID_VERIFIED
  CANCELLED
  REJECTED
  EXPIRED
}
```

### Payment Status (PaymentStatus)

```javascript
/**
 * PAYMENT STATUSES:
 *
 * PENDING_VERIFICATION:
 *   - Technician uploaded payment proof (screenshot/receipt)
 *   - Waiting for admin/dispatcher to verify
 *   - WO status is COMPLETED_PENDING_PAYMENT
 *
 * VERIFIED:
 *   - Admin approved the payment proof
 *   - Commission automatically calculated
 *   - Money added to technician's wallet
 *   - WO status changed to PAID_VERIFIED
 *
 * REJECTED:
 *   - Admin rejected payment proof
 *   - Reason provided (e.g., "unclear screenshot")
 *   - Technician must upload again
 *   - WO status reverts to COMPLETED_PENDING_PAYMENT
 */

enum PaymentStatus {
  PENDING_VERIFICATION
  VERIFIED
  REJECTED
}
```

### Commission Status

```javascript
/**
 * COMMISSION STATUSES:
 *
 * PENDING:
 *   - Commission calculated and added to wallet
 *   - Not yet paid out to technician
 *   - Accumulates in wallet balance
 *
 * PAID:
 *   - Commission paid to technician
 *   - Part of approved payout request
 *   - Recorded in payout history
 */

enum CommissionStatus {
  PENDING
  PAID
}
```

### User/Technician Status

```javascript
/**
 * USER/TECHNICIAN STATUSES:
 *
 * ACTIVE:
 *   - User account is active and operational
 *   - Can perform all role-based actions
 *   - Technicians can receive work orders
 *
 * INACTIVE:
 *   - User temporarily inactive
 *   - Cannot receive new work orders
 *   - Can complete existing work orders
 *
 * PENDING_APPROVAL:
 *   - Technician registered but not yet approved by admin
 *   - Cannot receive work orders
 *   - Admin must review and approve/reject
 *
 * SUSPENDED:
 *   - User suspended by admin (disciplinary action)
 *   - Cannot login or perform any actions
 *   - Reason recorded in blockedReason field
 */

enum UserStatus {
  ACTIVE
  INACTIVE
  PENDING_APPROVAL
  SUSPENDED
}
```

---

## Complete API Reference Summary

### Base URL

```
http://localhost:4000/api
```

### All Endpoints Quick Reference

| #                    | Method | Endpoint                        | Description          | Auth | Role                        |
| -------------------- | ------ | ------------------------------- | -------------------- | ---- | --------------------------- |
| **Authentication**   |
| 1                    | POST   | `/otp/send`                     | Send OTP             | No   | All                         |
| 2                    | POST   | `/otp/verify`                   | Verify OTP           | No   | All                         |
| 3                    | POST   | `/auth/register`                | Register user        | No   | All                         |
| 4                    | POST   | `/auth/login`                   | Login                | No   | All                         |
| 5                    | POST   | `/auth/logout`                  | Logout               | Yes  | All                         |
| 6                    | GET    | `/auth/profile`                 | Get profile          | Yes  | All                         |
| **Service Requests** |
| 7                    | POST   | `/srs`                          | Create SR            | Yes  | CUSTOMER, CALL_CENTER       |
| 8                    | GET    | `/srs`                          | Get all SRs          | Yes  | All                         |
| 9                    | GET    | `/srs/:id`                      | Get SR by ID         | Yes  | All                         |
| 10                   | PATCH  | `/srs/:id/cancel`               | Cancel SR            | Yes  | CUSTOMER, ADMIN, DISPATCHER |
| 11                   | GET    | `/callcenter/search-customer`   | Search customer      | Yes  | CALL_CENTER                 |
| **Work Orders**      |
| 12                   | POST   | `/wos`                          | Create WO from SR    | Yes  | DISPATCHER, ADMIN           |
| 13                   | GET    | `/wos`                          | Get all WOs          | Yes  | All                         |
| 14                   | GET    | `/wos/:id`                      | Get WO by ID         | Yes  | All                         |
| 15                   | PATCH  | `/wos/:id/accept`               | Accept WO            | Yes  | TECH                        |
| 16                   | PATCH  | `/wos/:id/reject`               | Reject WO            | Yes  | TECH                        |
| 17                   | PATCH  | `/wos/:id/start`                | Start job            | Yes  | TECH                        |
| 18                   | PATCH  | `/wos/:id/complete`             | Complete job         | Yes  | TECH                        |
| 19                   | PATCH  | `/wos/:id/cancel`               | Cancel WO            | Yes  | ADMIN, DISPATCHER, CUSTOMER |
| 20                   | PATCH  | `/wos/:id/reassign`             | Reassign WO          | Yes  | ADMIN, DISPATCHER           |
| **Payments**         |
| 21                   | POST   | `/payments`                     | Upload payment proof | Yes  | TECH                        |
| 22                   | GET    | `/payments`                     | Get all payments     | Yes  | ADMIN, DISPATCHER           |
| 23                   | PATCH  | `/payments/:id/verify`          | Verify payment       | Yes  | ADMIN, DISPATCHER           |
| **Admin**            |
| 24                   | GET    | `/admin/dashboard`              | Dashboard stats      | Yes  | ADMIN                       |
| 25                   | GET    | `/admin/stats/work-orders`      | WO stats             | Yes  | ADMIN                       |
| 26                   | GET    | `/admin/stats/service-requests` | SR stats             | Yes  | ADMIN                       |
| 27                   | GET    | `/admin/users`                  | Get all users        | Yes  | ADMIN                       |
| 28                   | POST   | `/admin/users/create`           | Create user          | Yes  | ADMIN                       |
| 29                   | GET    | `/admin/audit-trail`            | Audit logs           | Yes  | ADMIN                       |
| **Categories**       |
| 30                   | GET    | `/categories`                   | Get categories       | No   | All                         |
| 31                   | POST   | `/categories`                   | Create category      | Yes  | ADMIN                       |
| 32                   | POST   | `/categories/:id/subservices`   | Create subservice    | Yes  | ADMIN                       |
| 33                   | POST   | `/subservices/:id/services`     | Create service       | Yes  | ADMIN                       |

---

**Last Updated:** November 26, 2025  
**Version:** 3.1  
**Status:** ✅ All issues documented with solutions
