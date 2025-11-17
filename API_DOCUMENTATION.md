<!-- @format -->

# FSM System API Documentation

## Base URL

```
http://localhost:3000/api
```

## Authentication

Most endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

---

## 🔐 Authentication & OTP

### Send OTP

Send OTP code to phone number for registration, login, or password reset.

**Endpoint:** `POST /otp/send`

**Body:**

```json
{
  "phone": "1234567890",
  "type": "REGISTRATION" // REGISTRATION | LOGIN | PASSWORD_RESET
}
```

**Response:**

```json
{
  "message": "OTP sent successfully",
  "debug": {
    // Only in development
    "code": "123456"
  }
}
```

---

### Verify OTP

Verify the OTP code sent to the phone number.

**Endpoint:** `POST /otp/verify`

**Body:**

```json
{
  "phone": "1234567890",
  "code": "123456",
  "type": "REGISTRATION"
}
```

**Response:**

```json
{
  "message": "OTP verified successfully",
  "verified": true
}
```

---

### Register User

Register a new user account.

**Endpoint:** `POST /auth/register`

**Body:**

```json
{
  "phone": "1234567890",
  "password": "securePassword123",
  "name": "John Doe",
  "role": "CUSTOMER" // Optional, defaults to CUSTOMER
}
```

**Roles:** `CUSTOMER`, `TECH_INTERNAL`, `TECH_FREELANCER`, `DISPATCHER`, `CALL_CENTER`, `ADMIN`

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "phone": "1234567890",
    "role": "CUSTOMER"
  }
}
```

---

### Login

Login with phone number and password.

**Endpoint:** `POST /auth/login`

**Body:**

```json
{
  "phone": "1234567890",
  "password": "securePassword123"
}
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "phone": "1234567890",
    "role": "CUSTOMER"
  }
}
```

---

## 📋 Service Requests (SR)

### Create Service Request

Create a new service request. Can be called by guest users (no auth required) or authenticated customers.

**Endpoint:** `POST /sr`

**Body:**

```json
{
  "name": "John Doe",
  "phone": "1234567890",
  "address": "123 Main St, City",
  "categoryId": 1,
  "subserviceId": 1,
  "serviceId": 1,
  "description": "AC not cooling properly",
  "paymentType": "MOBILE_MONEY", // CASH | MOBILE_MONEY
  "priority": "HIGH", // LOW | MEDIUM | HIGH
  "source": "CUSTOMER_APP" // CUSTOMER_APP | WEB_PORTAL | CALL_CENTER
}
```

**Response:**

```json
{
  "id": 1,
  "srNumber": "SR-1700000000000",
  "customerId": 1,
  "status": "NEW",
  "createdAt": "2025-11-17T10:00:00.000Z",
  ...
}
```

---

### List Service Requests

Get all service requests with optional filters.

**Endpoint:** `GET /sr?status=NEW&phone=1234567890`

**Auth Required:** Yes (Dispatcher, Call Center, Admin)

**Query Parameters:**

- `status` - Filter by status (NEW, OPEN, CONVERTED_TO_WO, CANCELLED)
- `phone` - Filter by customer phone number

**Response:**

```json
[
  {
    "id": 1,
    "srNumber": "SR-1700000000000",
    "customer": {
      "id": 1,
      "name": "John Doe",
      "phone": "1234567890"
    },
    "category": { "id": 1, "name": "HVAC Services" },
    "status": "NEW",
    ...
  }
]
```

---

## 🛠️ Work Orders (WO)

### Convert SR to WO

Dispatcher converts a service request into a work order.

**Endpoint:** `POST /wos/from-sr/:srId`

**Auth Required:** Yes (Dispatcher, Admin)

**Body:**

```json
{
  "technicianId": 5, // Optional
  "scheduledAt": "2025-11-20T10:00:00Z", // Optional
  "notes": "Customer prefers morning appointments"
}
```

**Response:**

```json
{
  "id": 1,
  "woNumber": "WO-1700000000000",
  "srId": 1,
  "status": "ASSIGNED",  // or UNASSIGNED if no technicianId
  ...
}
```

---

### Assign Technician to WO

Assign or reassign a technician to a work order.

**Endpoint:** `PATCH /wos/:id/assign`

**Auth Required:** Yes (Dispatcher, Admin)

**Body:**

```json
{
  "technicianId": 5
}
```

**Response:**

```json
{
  "id": 1,
  "woNumber": "WO-1700000000000",
  "technicianId": 5,
  "status": "ASSIGNED",
  ...
}
```

---

### Accept/Decline Work Order

Technician accepts or declines an assigned work order.

**Endpoint:** `POST /wos/:id/respond`

**Auth Required:** Yes (Technician)

**Body:**

```json
{
  "action": "ACCEPT" // ACCEPT | DECLINE
}
```

**Response:**

```json
{
  "id": 1,
  "status": "ACCEPTED",  // or UNASSIGNED if declined
  "acceptedAt": "2025-11-17T10:30:00.000Z",
  ...
}
```

---

### Start Work Order

Technician starts the job with GPS check-in.

**Endpoint:** `POST /wos/:id/start`

**Auth Required:** Yes (Technician)

**Body:**

```json
{
  "lat": 23.8103,
  "lng": 90.4125
}
```

**Response:**

```json
{
  "message": "Work started"
}
```

---

### Complete Work Order

Technician marks the job as completed.

**Endpoint:** `POST /wos/:id/complete`

**Auth Required:** Yes (Technician)

**Body:**

```json
{
  "notes": "AC fixed, cleaned filters, refilled gas",
  "completionPhotos": ["url1", "url2"], // Optional
  "materialsUsed": ["Filter", "Gas"] // Optional
}
```

**Response:**

```json
{
  "id": 1,
  "status": "COMPLETED_PENDING_PAYMENT",
  "completedAt": "2025-11-17T12:00:00.000Z",
  ...
}
```

---

## 💰 Payments

### Create Payment (Upload Proof)

Technician uploads payment proof after job completion.

**Endpoint:** `POST /payments`

**Auth Required:** Yes (Technician)

**Content-Type:** `multipart/form-data`

**Form Data:**

```
woId: 1
amount: 500
method: MOBILE_MONEY  // CASH | MOBILE_MONEY
transactionRef: TXN123456
proof: <file>
```

**Response:**

```json
{
  "id": 1,
  "woId": 1,
  "amount": 500,
  "status": "PENDING_VERIFICATION",
  "proofUrl": "/uploads/proof-123.jpg",
  ...
}
```

---

### Verify Payment

Admin or Dispatcher verifies or rejects a payment.

**Endpoint:** `PATCH /payments/:id/verify`

**Auth Required:** Yes (Dispatcher, Admin)

**Body:**

```json
{
  "action": "APPROVE", // APPROVE | REJECT
  "reason": "Unclear screenshot" // Required if REJECT
}
```

**Response:**

```json
{
  "id": 1,
  "status": "VERIFIED",  // or REJECTED
  "verifiedAt": "2025-11-17T13:00:00.000Z",
  ...
}
```

**Note:** When payment is approved:

- WO status → `PAID_VERIFIED`
- Commission/Bonus automatically created
- Technician gets notification

---

## 💼 Commissions & Payouts

### Get My Commissions

Technician views their commissions and bonuses.

**Endpoint:** `GET /commissions/my-commissions?status=EARNED`

**Auth Required:** Yes (Technician)

**Query Parameters:**

- `status` - Filter by status (EARNED, PAID, CANCELLED)

**Response:**

```json
{
  "commissions": [
    {
      "id": 1,
      "type": "COMMISSION",  // or BONUS
      "amount": 100,
      "rate": 0.2,
      "status": "EARNED",
      "workOrder": {
        "woNumber": "WO-1700000000000",
        "address": "123 Main St"
      },
      ...
    }
  ],
  "summary": {
    "total": 500,
    "earned": 300,
    "paid": 200
  }
}
```

---

### Technician Dashboard

Get dashboard statistics for technician.

**Endpoint:** `GET /commissions/dashboard`

**Auth Required:** Yes (Technician)

**Response:**

```json
{
  "openWOs": [...],
  "inProgressWOs": [...],
  "completedWOsCount": 25,
  "monthlyCommission": 2500,
  "walletBalance": 1500
}
```

---

### Request Payout

Technician requests an on-demand payout.

**Endpoint:** `POST /commissions/payout-request`

**Auth Required:** Yes (Technician)

**Body:**

```json
{
  "amount": 1000,
  "reason": "Need funds for medical emergency" // Optional
}
```

**Response:**

```json
{
  "id": 1,
  "technicianId": 5,
  "amount": 1000,
  "status": "PENDING",
  "createdAt": "2025-11-17T14:00:00.000Z"
}
```

---

### Review Payout Request

Admin reviews and approves/rejects payout request.

**Endpoint:** `PATCH /commissions/payout-requests/:id`

**Auth Required:** Yes (Admin)

**Body:**

```json
{
  "action": "APPROVE", // APPROVE | REJECT
  "reason": "Insufficient earned balance" // Required if REJECT
}
```

**Response:**

```json
{
  "message": "Payout approved and processed",
  "payout": {
    "id": 1,
    "totalAmount": 1000,
    "status": "PAID",
    ...
  }
}
```

---

## 🏷️ Categories & Services

### List Categories

Get all categories with subservices and services.

**Endpoint:** `GET /categories`

**Auth Required:** No

**Response:**

```json
[
  {
    "id": 1,
    "name": "HVAC Services",
    "description": "...",
    "subservices": [
      {
        "id": 1,
        "name": "AC Repair",
        "services": [
          {
            "id": 1,
            "name": "AC Not Cooling",
            "baseRate": 500
          }
        ]
      }
    ]
  }
]
```

---

### Create Category

Admin creates a new service category.

**Endpoint:** `POST /categories`

**Auth Required:** Yes (Admin)

**Body:**

```json
{
  "name": "Electrical Services",
  "description": "All electrical repairs and installations"
}
```

---

## 👥 Admin

### Dashboard Statistics

Get overview statistics for admin dashboard.

**Endpoint:** `GET /admin/dashboard`

**Auth Required:** Yes (Admin, Dispatcher)

**Response:**

```json
{
  "totalSRs": 150,
  "totalWOs": 120,
  "completedWOs": 100,
  "pendingPayments": 10,
  "totalRevenue": 50000,
  "monthlyRevenue": 15000,
  "totalCommissions": 10000,
  "monthlyCommissions": 3000,
  "activeTechnicians": 15,
  "totalCustomers": 200
}
```

---

### List Users

Get all users with optional filters.

**Endpoint:** `GET /admin/users?role=TECH_FREELANCER&isBlocked=false&search=john`

**Auth Required:** Yes (Admin, Dispatcher)

**Query Parameters:**

- `role` - Filter by role
- `isBlocked` - Filter by blocked status (true/false)
- `search` - Search by name, phone, or email

---

### Block/Unblock Technician

Block or unblock a technician with reason.

**Endpoint:** `PATCH /admin/users/:id/block`

**Auth Required:** Yes (Admin, Dispatcher)

**Body:**

```json
{
  "isBlocked": true,
  "blockedReason": "Multiple customer complaints about service quality"
}
```

**Response:**

```json
{
  "id": 5,
  "isBlocked": true,
  "blockedReason": "Multiple customer complaints about service quality",
  "blockedAt": "2025-11-17T15:00:00.000Z",
  ...
}
```

---

### Get Technician Locations

Get real-time location of all technicians for map view.

**Endpoint:** `GET /admin/technician-locations`

**Auth Required:** Yes (Admin, Dispatcher)

**Response:**

```json
[
  {
    "id": 5,
    "name": "Mike Freelancer",
    "phone": "5555555555",
    "role": "TECH_FREELANCER",
    "lastLatitude": 23.8103,
    "lastLongitude": 90.4125,
    "locationStatus": "ONLINE", // ONLINE | BUSY | OFFLINE
    "locationUpdatedAt": "2025-11-17T15:30:00.000Z"
  }
]
```

---

## 📊 Reports

### Work Order Report

Get detailed work order report with filters.

**Endpoint:** `GET /reports/work-orders?startDate=2025-01-01&endDate=2025-12-31&status=PAID_VERIFIED`

**Auth Required:** Yes (Admin, Dispatcher)

**Query Parameters:**

- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)
- `status` - Filter by status
- `technicianId` - Filter by technician
- `categoryId` - Filter by category

**Response:**

```json
{
  "workOrders": [...],
  "summary": {
    "total": 100,
    "completed": 85,
    "inProgress": 10,
    "pending": 3,
    "cancelled": 2
  }
}
```

---

### Commission Report

Get commission report with filters.

**Endpoint:** `GET /reports/commissions?startDate=2025-11-01&endDate=2025-11-30&status=PAID`

**Auth Required:** Yes (Admin, Dispatcher)

**Response:**

```json
{
  "commissions": [...],
  "summary": {
    "total": 5000,
    "earned": 2000,
    "paid": 3000,
    "count": 50
  }
}
```

---

### Technician Performance

Get technician performance metrics.

**Endpoint:** `GET /reports/technician-performance?startDate=2025-11-01`

**Auth Required:** Yes (Admin, Dispatcher)

**Response:**

```json
{
  "technicians": [
    {
      "id": 5,
      "name": "Mike Freelancer",
      "completedJobs": 25,
      "totalEarnings": 5000,
      "walletBalance": 1500
    }
  ]
}
```

---

### Financial Report

Get financial summary report.

**Endpoint:** `GET /reports/financial?startDate=2025-11-01&endDate=2025-11-30`

**Auth Required:** Yes (Admin)

**Response:**

```json
{
  "totalRevenue": 50000,
  "totalCommissions": 10000,
  "totalPayouts": 8000,
  "pendingPayments": 2000,
  "netProfit": 40000
}
```

---

## 🔔 Notifications

### Get Notifications

Get user's notifications.

**Endpoint:** `GET /notifications?unreadOnly=true`

**Auth Required:** Yes

**Query Parameters:**

- `unreadOnly` - Show only unread (true/false)

**Response:**

```json
[
  {
    "id": 1,
    "type": "WO_ASSIGNED",
    "title": "New Work Order Assigned",
    "message": "You have been assigned work order WO-1700000000000",
    "isRead": false,
    "createdAt": "2025-11-17T10:00:00.000Z"
  }
]
```

---

### Mark Notification as Read

Mark a single notification as read.

**Endpoint:** `PATCH /notifications/:id/read`

**Auth Required:** Yes

---

### Mark All as Read

Mark all notifications as read.

**Endpoint:** `PATCH /notifications/read-all`

**Auth Required:** Yes

---

## 📍 Location

### Update Location

Technician updates their GPS location.

**Endpoint:** `POST /location/update`

**Auth Required:** Yes (Technician)

**Body:**

```json
{
  "latitude": 23.8103,
  "longitude": 90.4125,
  "status": "ONLINE" // ONLINE | BUSY | OFFLINE
}
```

---

### Get Nearby Technicians

Find technicians near a location.

**Endpoint:** `GET /location/nearby?latitude=23.8103&longitude=90.4125&radius=5`

**Auth Required:** Yes (Admin, Dispatcher)

**Query Parameters:**

- `latitude` - Location latitude
- `longitude` - Location longitude
- `radius` - Search radius in km (optional)

---

## 📝 Status Values

### Service Request Status

- `NEW` - Just created
- `OPEN` - Being processed
- `CONVERTED_TO_WO` - Converted to work order
- `CANCELLED` - Cancelled

### Work Order Status

- `UNASSIGNED` - Not yet assigned to technician
- `ASSIGNED` - Assigned but not accepted
- `ACCEPTED` - Technician accepted
- `IN_PROGRESS` - Work in progress
- `COMPLETED_PENDING_PAYMENT` - Job done, awaiting payment
- `PAID_VERIFIED` - Payment verified, commission booked
- `CANCELLED` - Cancelled

### Payment Status

- `PENDING_VERIFICATION` - Awaiting verification
- `VERIFIED` - Approved and verified
- `REJECTED` - Rejected by admin

### Commission Status

- `EARNED` - Earned but not paid out
- `PAID` - Paid to technician
- `CANCELLED` - Cancelled

---

## ⚠️ Error Responses

All endpoints return errors in this format:

```json
{
  "message": "Error description"
}
```

Common HTTP status codes:

- `400` - Bad Request (validation error)
- `401` - Unauthorized (no token or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error
