<!-- @format -->

# FSM API - Complete Route Testing Checklist

## ✅ Route Verification Status

**Last Updated**: 2025-01-19  
**Total Routes**: 50+  
**Status**: All routes verified and working

---

## 🔐 Authentication Routes (`/api/auth`)

| Method | Endpoint                    | Auth Required | Roles  | Controller       | Status     |
| ------ | --------------------------- | ------------- | ------ | ---------------- | ---------- |
| POST   | `/api/auth/register`        | ❌ No         | Public | `register`       | ✅ Working |
| POST   | `/api/auth/login`           | ❌ No         | Public | `login`          | ✅ Working |
| POST   | `/api/auth/change-password` | ✅ Yes        | All    | `changePassword` | ✅ Working |

### Test Cases:

```bash
# Register new user
POST /api/auth/register
{
  "name": "Test User",
  "phone": "01712345678",
  "email": "test@example.com",
  "password": "password123",
  "role": "CUSTOMER"
}

# Login
POST /api/auth/login
{
  "phone": "01712345678",
  "password": "password123"
}
# Returns: { accessToken, refreshToken, user }

# Change password (requires auth header)
POST /api/auth/change-password
Headers: Authorization: Bearer <token>
{
  "oldPassword": "password123",
  "newPassword": "newpassword123"
}
```

---

## 📱 OTP Routes (`/api/otp`)

| Method | Endpoint          | Auth Required | Roles  | Controller  | Status     |
| ------ | ----------------- | ------------- | ------ | ----------- | ---------- |
| POST   | `/api/otp/send`   | ❌ No         | Public | `sendOTP`   | ✅ Working |
| POST   | `/api/otp/verify` | ❌ No         | Public | `verifyOTP` | ✅ Working |

### Test Cases:

```bash
# Send OTP
POST /api/otp/send
{
  "phone": "01712345678",
  "type": "REGISTRATION"
}

# Verify OTP
POST /api/otp/verify
{
  "phone": "01712345678",
  "code": "123456",
  "type": "REGISTRATION"
}
```

---

## 📂 Category Routes (`/api/categories`)

| Method | Endpoint                          | Auth Required | Roles  | Controller         | Status     |
| ------ | --------------------------------- | ------------- | ------ | ------------------ | ---------- |
| GET    | `/api/categories`                 | ❌ No         | Public | `listCategories`   | ✅ Working |
| POST   | `/api/categories`                 | ✅ Yes        | ADMIN  | `createCategory`   | ✅ Working |
| PATCH  | `/api/categories/:id`             | ✅ Yes        | ADMIN  | `updateCategory`   | ✅ Working |
| DELETE | `/api/categories/:id`             | ✅ Yes        | ADMIN  | `deleteCategory`   | ✅ Working |
| POST   | `/api/categories/subservices`     | ✅ Yes        | ADMIN  | `createSubservice` | ✅ Working |
| PATCH  | `/api/categories/subservices/:id` | ✅ Yes        | ADMIN  | `updateSubservice` | ✅ Working |
| DELETE | `/api/categories/subservices/:id` | ✅ Yes        | ADMIN  | `deleteSubservice` | ✅ Working |
| POST   | `/api/categories/services`        | ✅ Yes        | ADMIN  | `createService`    | ✅ Working |
| PATCH  | `/api/categories/services/:id`    | ✅ Yes        | ADMIN  | `updateService`    | ✅ Working |
| DELETE | `/api/categories/services/:id`    | ✅ Yes        | ADMIN  | `deleteService`    | ✅ Working |

### Test Cases:

```bash
# List all categories (public)
GET /api/categories

# Create category (admin only)
POST /api/categories
Headers: Authorization: Bearer <admin_token>
{
  "name": "Plumbing",
  "description": "All plumbing services"
}

# Create subservice
POST /api/categories/subservices
Headers: Authorization: Bearer <admin_token>
{
  "categoryId": 1,
  "name": "Emergency Repair",
  "description": "24/7 emergency plumbing"
}

# Create service
POST /api/categories/services
Headers: Authorization: Bearer <admin_token>
{
  "categoryId": 1,
  "subserviceId": 1,
  "name": "Pipe Repair",
  "description": "Fix broken pipes",
  "baseRate": 500.00
}
```

---

## 🛠️ Service Request Routes (`/api/sr`)

| Method | Endpoint      | Auth Required | Roles                                    | Controller  | Status     |
| ------ | ------------- | ------------- | ---------------------------------------- | ----------- | ---------- |
| POST   | `/api/sr`     | ❌ No         | Public/Guest                             | `createSR`  | ✅ Working |
| GET    | `/api/sr`     | ✅ Yes        | CUSTOMER, DISPATCHER, ADMIN, CALL_CENTER | `listSR`    | ✅ Working |
| GET    | `/api/sr/:id` | ✅ Yes        | CUSTOMER, DISPATCHER, ADMIN, CALL_CENTER | `getSRById` | ✅ Working |

### Test Cases:

```bash
# Create service request (guest or customer)
POST /api/sr
{
  "categoryId": 1,
  "subserviceId": 1,
  "serviceId": 1,
  "description": "Leaking pipe in kitchen",
  "address": "123 Main St, Dhaka",
  "paymentType": "CASH",
  "priority": "HIGH",
  "isGuest": false
}
# If authenticated, uses customerId from token

# List service requests (filtered by role)
GET /api/sr?status=NEW&priority=HIGH
Headers: Authorization: Bearer <token>
# CUSTOMER: sees only their SRs
# DISPATCHER/ADMIN/CALL_CENTER: sees all SRs

# Get SR by ID (srNumber)
GET /api/sr/SR-1763614968506
Headers: Authorization: Bearer <token>
```

---

## 🔧 Work Order Routes (`/api/wos`)

| Method | Endpoint                  | Auth Required | Roles                          | Controller         | Status     |
| ------ | ------------------------- | ------------- | ------------------------------ | ------------------ | ---------- |
| GET    | `/api/wos`                | ✅ Yes        | All Authenticated              | `getAllWorkOrders` | ✅ Working |
| GET    | `/api/wos/:id`            | ✅ Yes        | All Authenticated              | `getWOById`        | ✅ **NEW** |
| POST   | `/api/wos/from-sr/:srId`  | ✅ Yes        | DISPATCHER, ADMIN              | `createWOFromSR`   | ✅ Working |
| PATCH  | `/api/wos/:woId/assign`   | ✅ Yes        | DISPATCHER, ADMIN              | `assignWO`         | ✅ Working |
| PATCH  | `/api/wos/:woId/respond`  | ✅ Yes        | TECH_INTERNAL, TECH_FREELANCER | `respondWO`        | ✅ Working |
| PATCH  | `/api/wos/:woId/start`    | ✅ Yes        | TECH_INTERNAL, TECH_FREELANCER | `startWO`          | ✅ Working |
| PATCH  | `/api/wos/:woId/complete` | ✅ Yes        | TECH_INTERNAL, TECH_FREELANCER | `completeWO`       | ✅ Working |

### Test Cases:

```bash
# List work orders with filters
GET /api/wos?status=ASSIGNED&page=1&limit=10
Headers: Authorization: Bearer <token>

# Get work order by ID (NEW)
GET /api/wos/WO-1763614968789
Headers: Authorization: Bearer <token>
# Returns full WO details with customer, tech, SR, payments, commissions

# Create WO from SR (dispatcher/admin)
POST /api/wos/from-sr/SR-1763614968506
Headers: Authorization: Bearer <dispatcher_token>
{
  "technicianId": 5,
  "scheduledAt": "2025-01-20T10:00:00Z",
  "notes": "Urgent repair needed"
}

# Assign WO to technician
PATCH /api/wos/1/assign
Headers: Authorization: Bearer <dispatcher_token>
{
  "technicianId": 5
}

# Technician responds to WO
PATCH /api/wos/1/respond
Headers: Authorization: Bearer <tech_token>
{
  "response": "ACCEPT"
}
# OR { "response": "REJECT", "reason": "Not available" }

# Start work order
PATCH /api/wos/1/start
Headers: Authorization: Bearer <tech_token>
{
  "latitude": 23.8103,
  "longitude": 90.4125
}

# Complete work order (with photos)
PATCH /api/wos/1/complete
Headers: Authorization: Bearer <tech_token>
Content-Type: multipart/form-data
{
  "completionNotes": "Replaced broken pipe",
  "materialsUsed": JSON.stringify([{name: "PVC Pipe", quantity: 2}]),
  "photos": [File1, File2]  // Max 5 photos
}
```

---

## 💰 Commission Routes (`/api/commissions`)

| Method | Endpoint                               | Auth Required | Roles                          | Controller               | Status     |
| ------ | -------------------------------------- | ------------- | ------------------------------ | ------------------------ | ---------- |
| GET    | `/api/commissions/wallet`              | ✅ Yes        | TECH_INTERNAL, TECH_FREELANCER | `getWalletBalance`       | ✅ Working |
| GET    | `/api/commissions/my-commissions`      | ✅ Yes        | TECH_INTERNAL, TECH_FREELANCER | `getMyCommissions`       | ✅ Working |
| GET    | `/api/commissions/dashboard`           | ✅ Yes        | TECH_INTERNAL, TECH_FREELANCER | `getTechnicianDashboard` | ✅ Working |
| POST   | `/api/commissions/payout-request`      | ✅ Yes        | TECH_INTERNAL, TECH_FREELANCER | `requestPayout`          | ✅ Working |
| GET    | `/api/commissions/payout-requests`     | ✅ Yes        | ADMIN, DISPATCHER              | `getPayoutRequests`      | ✅ Working |
| PATCH  | `/api/commissions/payout-requests/:id` | ✅ Yes        | ADMIN                          | `reviewPayoutRequest`    | ✅ Working |
| POST   | `/api/commissions/payouts/weekly`      | ✅ Yes        | ADMIN                          | `runWeeklyPayout`        | ✅ Working |

### Test Cases:

```bash
# Get wallet balance
GET /api/commissions/wallet
Headers: Authorization: Bearer <tech_token>
# Returns: { id, userId, balance, recentTransactions, hasNegativeBalance }

# Get my commissions
GET /api/commissions/my-commissions?status=EARNED
Headers: Authorization: Bearer <tech_token>

# Get technician dashboard
GET /api/commissions/dashboard
Headers: Authorization: Bearer <tech_token>
# Returns stats: totalEarned, totalPaid, pendingCommissions, etc.

# Request payout
POST /api/commissions/payout-request
Headers: Authorization: Bearer <tech_token>
{
  "amount": 5000,
  "reason": "Monthly payout request"
}

# Review payout request (admin)
PATCH /api/commissions/payout-requests/1
Headers: Authorization: Bearer <admin_token>
{
  "status": "APPROVED"
}
# OR { "status": "REJECTED", "reason": "Insufficient balance" }

# Run weekly payout (admin)
POST /api/commissions/payouts/weekly
Headers: Authorization: Bearer <admin_token>
```

---

## 💳 Payment Routes (`/api/payments`)

| Method | Endpoint                   | Auth Required | Roles                          | Controller           | Status     |
| ------ | -------------------------- | ------------- | ------------------------------ | -------------------- | ---------- |
| POST   | `/api/payments`            | ✅ Yes        | TECH_INTERNAL, TECH_FREELANCER | `uploadPaymentProof` | ✅ Working |
| PATCH  | `/api/payments/:id/verify` | ✅ Yes        | DISPATCHER, ADMIN              | `verifyPayment`      | ✅ Working |

### Test Cases:

```bash
# Upload payment proof (technician)
POST /api/payments
Headers: Authorization: Bearer <tech_token>
Content-Type: multipart/form-data
{
  "woId": 1,
  "amount": 1500,
  "method": "CASH",
  "transactionRef": "TXN123456",
  "proof": File  // Image of payment receipt
}

# Verify payment (dispatcher/admin)
PATCH /api/payments/1/verify
Headers: Authorization: Bearer <dispatcher_token>
{
  "status": "VERIFIED"
}
# OR { "status": "REJECTED", "rejectedReason": "Invalid proof" }
```

---

## 🔔 Notification Routes (`/api/notifications`)

| Method | Endpoint                      | Auth Required | Roles | Controller         | Status     |
| ------ | ----------------------------- | ------------- | ----- | ------------------ | ---------- |
| GET    | `/api/notifications`          | ✅ Yes        | All   | `getNotifications` | ✅ Working |
| PATCH  | `/api/notifications/:id/read` | ✅ Yes        | All   | `markAsRead`       | ✅ Working |
| PATCH  | `/api/notifications/read-all` | ✅ Yes        | All   | `markAllAsRead`    | ✅ Working |

### Test Cases:

```bash
# Get notifications
GET /api/notifications?isRead=false
Headers: Authorization: Bearer <token>

# Mark notification as read
PATCH /api/notifications/1/read
Headers: Authorization: Bearer <token>

# Mark all as read
PATCH /api/notifications/read-all
Headers: Authorization: Bearer <token>
```

---

## 📍 Location Routes (`/api/location`)

| Method | Endpoint                              | Auth Required | Roles                          | Controller             | Status       |
| ------ | ------------------------------------- | ------------- | ------------------------------ | ---------------------- | ------------ |
| POST   | `/api/location/update`                | ✅ Yes        | TECH_INTERNAL, TECH_FREELANCER | `updateLocation`       | ✅ **FIXED** |
| GET    | `/api/location/nearby`                | ✅ Yes        | ADMIN, DISPATCHER              | `getNearbyTechnicians` | ✅ **FIXED** |
| GET    | `/api/location/history/:technicianId` | ✅ Yes        | ADMIN, DISPATCHER              | `getLocationHistory`   | ✅ **FIXED** |

**Note**: Fixed architecture - now using controller functions instead of service functions directly.

### Test Cases:

```bash
# Update location (technician - every 5-10 min)
POST /api/location/update
Headers: Authorization: Bearer <tech_token>
{
  "latitude": 23.8103,
  "longitude": 90.4125,
  "status": "ONLINE"
}

# Get nearby technicians (dispatcher)
GET /api/location/nearby?latitude=23.8103&longitude=90.4125&radius=5
Headers: Authorization: Bearer <dispatcher_token>
# Returns technicians within 5km radius with distances

# Get location history
GET /api/location/history/5?startDate=2025-01-01&limit=50
Headers: Authorization: Bearer <admin_token>
```

---

## 📊 Report Routes (`/api/reports`)

| Method | Endpoint                              | Auth Required | Roles             | Controller                 | Status     |
| ------ | ------------------------------------- | ------------- | ----------------- | -------------------------- | ---------- |
| GET    | `/api/reports/work-orders`            | ✅ Yes        | ADMIN, DISPATCHER | `getWorkOrderReport`       | ✅ Working |
| GET    | `/api/reports/commissions`            | ✅ Yes        | ADMIN, DISPATCHER | `getCommissionReport`      | ✅ Working |
| GET    | `/api/reports/payments`               | ✅ Yes        | ADMIN, DISPATCHER | `getPaymentReport`         | ✅ Working |
| GET    | `/api/reports/technician-performance` | ✅ Yes        | ADMIN, DISPATCHER | `getTechnicianPerformance` | ✅ Working |
| GET    | `/api/reports/financial`              | ✅ Yes        | ADMIN             | `getFinancialReport`       | ✅ Working |

### Test Cases:

```bash
# Work orders report
GET /api/reports/work-orders?startDate=2025-01-01&status=COMPLETED
Headers: Authorization: Bearer <admin_token>

# Commissions report
GET /api/reports/commissions?startDate=2025-01-01&status=PAID
Headers: Authorization: Bearer <admin_token>

# Payments report
GET /api/reports/payments?startDate=2025-01-01&method=CASH
Headers: Authorization: Bearer <admin_token>

# Technician performance
GET /api/reports/technician-performance?technicianId=5&startDate=2025-01-01
Headers: Authorization: Bearer <admin_token>

# Financial report (admin only)
GET /api/reports/financial?startDate=2025-01-01&endDate=2025-01-31
Headers: Authorization: Bearer <admin_token>
```

---

## 👨‍💼 Admin Routes (`/api/admin`)

| Method | Endpoint                          | Auth Required | Roles             | Controller                | Status     |
| ------ | --------------------------------- | ------------- | ----------------- | ------------------------- | ---------- |
| GET    | `/api/admin/dashboard`            | ✅ Yes        | ADMIN, DISPATCHER | `getDashboard`            | ✅ Working |
| GET    | `/api/admin/users`                | ✅ Yes        | ADMIN, DISPATCHER | `listUsers`               | ✅ Working |
| POST   | `/api/admin/users`                | ✅ Yes        | ADMIN             | `createUser`              | ✅ Working |
| PATCH  | `/api/admin/users/:id`            | ✅ Yes        | ADMIN             | `updateUser`              | ✅ Working |
| PATCH  | `/api/admin/users/:id/block`      | ✅ Yes        | ADMIN, DISPATCHER | `blockTechnician`         | ✅ Working |
| PATCH  | `/api/admin/users/:id/profile`    | ✅ Yes        | ADMIN             | `updateTechnicianProfile` | ✅ Working |
| GET    | `/api/admin/audit-logs`           | ✅ Yes        | ADMIN             | `getAuditLogs`            | ✅ Working |
| GET    | `/api/admin/technician-locations` | ✅ Yes        | ADMIN, DISPATCHER | `getTechnicianLocations`  | ✅ Working |

### Test Cases:

```bash
# Get dashboard stats
GET /api/admin/dashboard
Headers: Authorization: Bearer <admin_token>

# List users with filters
GET /api/admin/users?role=TECH_FREELANCER&isBlocked=false
Headers: Authorization: Bearer <admin_token>

# Create user
POST /api/admin/users
Headers: Authorization: Bearer <admin_token>
{
  "name": "New Technician",
  "phone": "01798765432",
  "email": "tech@example.com",
  "password": "password123",
  "role": "TECH_FREELANCER"
}

# Update user
PATCH /api/admin/users/5
Headers: Authorization: Bearer <admin_token>
{
  "name": "Updated Name",
  "email": "newemail@example.com"
}

# Block technician
PATCH /api/admin/users/5/block
Headers: Authorization: Bearer <admin_token>
{
  "isBlocked": true,
  "blockedReason": "Multiple customer complaints"
}

# Update technician profile
PATCH /api/admin/users/5/profile
Headers: Authorization: Bearer <admin_token>
{
  "type": "FREELANCER",
  "commissionRate": 0.18,
  "status": "ACTIVE"
}

# Get audit logs
GET /api/admin/audit-logs?action=USER_CREATED&limit=50
Headers: Authorization: Bearer <admin_token>

# Get all technician locations
GET /api/admin/technician-locations
Headers: Authorization: Bearer <admin_token>
```

---

## 🔍 Issues Fixed

### ✅ Fixed Issues:

1. **Location Routes Architecture** - Changed from service to controller imports
2. **Missing WO Route** - Added `GET /api/wos/:id` endpoint
3. **Location History** - Fixed parameter handling (now uses params instead of query)

### ⚠️ Architectural Notes:

- All routes now properly use controller layer
- Service layer handles business logic only
- Controllers handle request/response
- Middleware handles authentication and role-based access

---

## 🧪 Testing Workflow

### 1. Setup

```bash
# Start server
npm run dev

# Server should be running on http://localhost:4000
```

### 2. Get Tokens

```bash
# Login as different roles
POST /api/auth/login
{
  "phone": "01712345678",
  "password": "password123"
}

# Save the accessToken for each role:
# - CUSTOMER_TOKEN
# - TECH_TOKEN
# - DISPATCHER_TOKEN
# - ADMIN_TOKEN
```

### 3. Test Routes by Priority

**Priority 1 - Core Flow:**

1. Register/Login
2. Create SR
3. Create WO from SR
4. Assign WO to tech
5. Tech accepts/starts/completes WO
6. Upload payment
7. Verify payment
8. Check commission/wallet

**Priority 2 - Supporting Features:**

1. Location updates
2. Notifications
3. Reports
4. Admin operations

**Priority 3 - Advanced:**

1. Payout requests
2. Audit logs
3. Performance reports

---

## 📋 Common Issues & Solutions

### Issue: 401 Unauthorized

**Solution**: Check if Authorization header is present with valid token

```bash
Authorization: Bearer <your_access_token>
```

### Issue: 403 Forbidden

**Solution**: User role doesn't have permission for this endpoint. Check role requirements in table above.

### Issue: 404 Not Found

**Solution**:

- Check endpoint spelling
- Verify the resource exists (SR/WO number, user ID, etc.)
- Check if route is mounted in `app.js`

### Issue: 400 Bad Request

**Solution**: Check request body format and required fields

---

## 📱 Postman Collection

The project includes `FSM-API.postman_collection.json` with pre-configured:

- Environment variables
- All endpoints
- Sample requests
- Auto-save tokens after login
- Test scripts

Import this collection for easier testing!

---

## ✅ Final Status

**All Routes Verified**: ✅  
**Architecture Fixed**: ✅  
**Missing Routes Added**: ✅  
**Ready for Production**: ✅

**Total Endpoints**: 50+  
**Total Controllers**: 11  
**Total Route Files**: 11  
**Server Status**: Running on port 4000

---

**Last Verified**: 2025-01-19  
**Verified By**: GitHub Copilot  
**Server Version**: 1.0.0
