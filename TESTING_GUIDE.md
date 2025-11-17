<!-- @format -->

# 🧪 Testing Guide - FSM System

## Testing the Complete Workflow

This guide walks you through testing the entire FSM workflow from Service Request to Commission Payout.

## Prerequisites

1. Server running on http://localhost:3000
2. Database seeded with test data
3. API testing tool (Postman, curl, or similar)

## Test Credentials

```
Admin:          1111111111 / admin123
Dispatcher:     2222222222 / dispatcher123
Call Center:    3333333333 / callcenter123
Internal Tech:  4444444444 / tech123
Freelancer:     5555555555 / freelancer123
Customer:       9999999999 / customer123
```

---

## 🔄 Complete Workflow Test

### Step 1: Customer Creates Service Request

**No authentication required for guest customers**

```bash
# POST /api/sr
curl -X POST http://localhost:3000/api/sr \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "phone": "8888888888",
    "address": "456 Oak Street, Downtown",
    "categoryId": 1,
    "subserviceId": 1,
    "serviceId": 1,
    "description": "Air conditioner not cooling, making strange noise",
    "paymentType": "MOBILE_MONEY",
    "priority": "HIGH"
  }'
```

**Expected Response:**

```json
{
  "id": 1,
  "srNumber": "SR-1700000000000",
  "customerId": 10,
  "status": "NEW",
  "createdAt": "2025-11-17T10:00:00.000Z"
}
```

**Save the SR ID for next step**

---

### Step 2: Dispatcher Logs In

```bash
# POST /api/auth/login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "2222222222",
    "password": "dispatcher123"
  }'
```

**Save the token from response**

---

### Step 3: Dispatcher Converts SR to WO

```bash
# POST /api/wos/from-sr/:srId
curl -X POST http://localhost:3000/api/wos/from-sr/1 \
  -H "Authorization: Bearer YOUR_DISPATCHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "technicianId": 6,
    "scheduledAt": "2025-11-18T09:00:00Z",
    "notes": "Customer available after 9 AM"
  }'
```

**Expected Response:**

```json
{
  "id": 1,
  "woNumber": "WO-1700000000000",
  "status": "ASSIGNED",
  "technicianId": 6
}
```

**Technician receives notification**

---

### Step 4: Technician Logs In

```bash
# POST /api/auth/login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "5555555555",
    "password": "freelancer123"
  }'
```

**Save the technician token**

---

### Step 5: Technician Views Dashboard

```bash
# GET /api/commissions/dashboard
curl http://localhost:3000/api/commissions/dashboard \
  -H "Authorization: Bearer YOUR_TECH_TOKEN"
```

**Expected Response:**

```json
{
  "openWOs": [
    {
      "id": 1,
      "woNumber": "WO-1700000000000",
      "status": "ASSIGNED"
    }
  ],
  "inProgressWOs": [],
  "completedWOsCount": 0,
  "monthlyCommission": 0,
  "walletBalance": 0
}
```

---

### Step 6: Technician Accepts WO

```bash
# POST /api/wos/1/respond
curl -X POST http://localhost:3000/api/wos/1/respond \
  -H "Authorization: Bearer YOUR_TECH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "ACCEPT"
  }'
```

**Expected Response:**

```json
{
  "id": 1,
  "status": "ACCEPTED",
  "acceptedAt": "2025-11-17T10:30:00.000Z"
}
```

**Dispatcher receives notification**

---

### Step 7: Technician Updates Location

```bash
# POST /api/location/update
curl -X POST http://localhost:3000/api/location/update \
  -H "Authorization: Bearer YOUR_TECH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 23.8103,
    "longitude": 90.4125,
    "status": "BUSY"
  }'
```

---

### Step 8: Technician Starts Job (GPS Check-in)

```bash
# POST /api/wos/1/start
curl -X POST http://localhost:3000/api/wos/1/start \
  -H "Authorization: Bearer YOUR_TECH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 23.8103,
    "lng": 90.4125
  }'
```

**Expected Response:**

```json
{
  "message": "Work started"
}
```

**WO status → IN_PROGRESS**

---

### Step 9: Technician Completes Job

```bash
# POST /api/wos/1/complete
curl -X POST http://localhost:3000/api/wos/1/complete \
  -H "Authorization: Bearer YOUR_TECH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Fixed AC compressor, cleaned filters, refilled refrigerant gas",
    "completionPhotos": ["photo1.jpg", "photo2.jpg"],
    "materialsUsed": ["AC Filter", "R-22 Gas - 1kg"]
  }'
```

**Expected Response:**

```json
{
  "id": 1,
  "status": "COMPLETED_PENDING_PAYMENT",
  "completedAt": "2025-11-17T12:00:00.000Z"
}
```

**Dispatcher receives notification**

---

### Step 10: Customer Pays via Mobile Money

**Customer sends payment to company wallet**

Transaction ID: TXN123456789

---

### Step 11: Technician Uploads Payment Proof

```bash
# POST /api/payments
curl -X POST http://localhost:3000/api/payments \
  -H "Authorization: Bearer YOUR_TECH_TOKEN" \
  -F "woId=1" \
  -F "amount=500" \
  -F "method=MOBILE_MONEY" \
  -F "transactionRef=TXN123456789" \
  -F "proof=@payment-screenshot.jpg"
```

**Expected Response:**

```json
{
  "id": 1,
  "woId": 1,
  "amount": 500,
  "status": "PENDING_VERIFICATION",
  "proofUrl": "/uploads/proof-xxxxx.jpg"
}
```

---

### Step 12: Admin Verifies Payment

```bash
# Login as Admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "1111111111",
    "password": "admin123"
  }'

# Verify Payment
curl -X PATCH http://localhost:3000/api/payments/1/verify \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "APPROVE"
  }'
```

**Expected Response:**

```json
{
  "id": 1,
  "status": "VERIFIED",
  "verifiedAt": "2025-11-17T13:00:00.000Z"
}
```

**Automatic Actions:**

1. WO status → PAID_VERIFIED
2. Commission created (500 \* 0.2 = 100)
3. Wallet updated (+100)
4. Technician receives notification

---

### Step 13: Technician Views Commissions

```bash
# GET /api/commissions/my-commissions
curl http://localhost:3000/api/commissions/my-commissions \
  -H "Authorization: Bearer YOUR_TECH_TOKEN"
```

**Expected Response:**

```json
{
  "commissions": [
    {
      "id": 1,
      "type": "COMMISSION",
      "amount": 100,
      "rate": 0.2,
      "status": "EARNED",
      "workOrder": {
        "woNumber": "WO-1700000000000"
      }
    }
  ],
  "summary": {
    "total": 100,
    "earned": 100,
    "paid": 0
  }
}
```

---

### Step 14: Technician Requests Payout

```bash
# POST /api/commissions/payout-request
curl -X POST http://localhost:3000/api/commissions/payout-request \
  -H "Authorization: Bearer YOUR_TECH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "reason": "Weekly expenses"
  }'
```

**Expected Response:**

```json
{
  "id": 1,
  "technicianId": 6,
  "amount": 100,
  "status": "PENDING"
}
```

---

### Step 15: Admin Approves Payout

```bash
# PATCH /api/commissions/payout-requests/1
curl -X PATCH http://localhost:3000/api/commissions/payout-requests/1 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "APPROVE"
  }'
```

**Expected Response:**

```json
{
  "message": "Payout approved and processed",
  "payout": {
    "id": 1,
    "totalAmount": 100,
    "status": "PAID"
  }
}
```

**Automatic Actions:**

1. Commission status → PAID
2. Wallet balance reduced (-100)
3. Wallet transaction recorded
4. Technician receives notification

---

## 🧪 Additional Test Scenarios

### Test OTP Flow

```bash
# 1. Send OTP
curl -X POST http://localhost:3000/api/otp/send \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "7777777777",
    "type": "REGISTRATION"
  }'

# Check terminal for OTP code (in development)

# 2. Verify OTP
curl -X POST http://localhost:3000/api/otp/verify \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "7777777777",
    "code": "123456",
    "type": "REGISTRATION"
  }'

# 3. Register with verified phone
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "7777777777",
    "password": "newuser123",
    "name": "New User"
  }'
```

---

### Test Technician Blocking

```bash
# Admin blocks technician
curl -X PATCH http://localhost:3000/api/admin/users/6/block \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isBlocked": true,
    "blockedReason": "Multiple customer complaints"
  }'

# Try to assign WO to blocked technician (should fail)
curl -X PATCH http://localhost:3000/api/wos/2/assign \
  -H "Authorization: Bearer YOUR_DISPATCHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "technicianId": 6
  }'
```

---

### Test Reporting

```bash
# Work Order Report
curl "http://localhost:3000/api/reports/work-orders?status=PAID_VERIFIED" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Financial Report
curl "http://localhost:3000/api/reports/financial?startDate=2025-11-01&endDate=2025-11-30" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Technician Performance
curl "http://localhost:3000/api/reports/technician-performance" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

### Test Map View

```bash
# Get all technician locations
curl http://localhost:3000/api/admin/technician-locations \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Find nearby technicians
curl "http://localhost:3000/api/location/nearby?latitude=23.8103&longitude=90.4125&radius=5" \
  -H "Authorization: Bearer YOUR_DISPATCHER_TOKEN"
```

---

## ✅ Test Checklist

Use this checklist to verify all features:

### Authentication

- [ ] Register new user
- [ ] Login with phone/password
- [ ] Send OTP
- [ ] Verify OTP
- [ ] JWT token authentication
- [ ] Role-based access control

### Service Requests

- [ ] Create SR as guest
- [ ] Create SR as customer
- [ ] Create SR via call center
- [ ] List SRs with filters
- [ ] View SR details

### Work Orders

- [ ] Convert SR to WO
- [ ] Assign technician
- [ ] Reassign technician
- [ ] Accept WO
- [ ] Decline WO
- [ ] Start job with GPS
- [ ] Complete job
- [ ] Cancel WO

### Payments

- [ ] Upload payment proof
- [ ] Verify payment
- [ ] Reject payment
- [ ] View payment history

### Commissions

- [ ] Auto commission creation
- [ ] View commissions
- [ ] Request payout
- [ ] Approve payout
- [ ] Reject payout
- [ ] Wallet balance updates

### Admin Features

- [ ] Dashboard statistics
- [ ] User management
- [ ] Block technician
- [ ] Unblock technician
- [ ] Update technician profile
- [ ] View audit logs
- [ ] Map view

### Notifications

- [ ] WO assignment notification
- [ ] WO acceptance notification
- [ ] Payment verified notification
- [ ] Commission paid notification
- [ ] Mark notification as read

### Reports

- [ ] Work order report
- [ ] Commission report
- [ ] Payment report
- [ ] Technician performance
- [ ] Financial summary

### Categories

- [ ] List categories
- [ ] Create category
- [ ] Create subservice
- [ ] Create service
- [ ] Update/delete

---

## 🐛 Common Issues

### Token Invalid

- Ensure Bearer token is properly formatted
- Check token hasn't expired
- Login again to get fresh token

### Permission Denied

- Verify user role matches endpoint requirement
- Check authorization middleware

### Database Errors

- Ensure migrations are up to date
- Check database connection
- Verify foreign key relationships

---

## 📊 Expected Results Summary

After completing the workflow test:

1. **Service Request**: Status = CONVERTED_TO_WO
2. **Work Order**: Status = PAID_VERIFIED
3. **Payment**: Status = VERIFIED, Amount = 500
4. **Commission**: Status = PAID, Amount = 100 (20% of 500)
5. **Wallet**: Transaction history shows +100 then -100
6. **Notifications**: Multiple notifications sent
7. **Audit Logs**: All actions recorded

---

## 🎯 Performance Testing

### Load Test (Optional)

Install Apache Bench:

```bash
# Test login endpoint
ab -n 100 -c 10 -p login.json -T application/json http://localhost:3000/api/auth/login
```

### Database Query Performance

```sql
-- Check slow queries in PostgreSQL
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

---

**Happy Testing!** 🚀
