<!-- @format -->

# FSM System - Postman Testing Guide

**Last Updated:** November 30, 2025

---

## 🔑 Test Credentials (From Seed Data)

| Role                  | Phone        | Notes                    |
| --------------------- | ------------ | ------------------------ |
| **Admin**             | `1111111111` | Full system access       |
| **Dispatcher**        | `2222222222` | Assign work orders       |
| **Call Center**       | `3333333333` | Create SRs for customers |
| **Tech (Internal)**   | `4444444444` | Salaried technician      |
| **Tech (Freelancer)** | `5555555555` | Contract technician      |
| **Tech (Freelancer)** | `6666666666` | Another freelancer       |
| **Customer**          | `9999999999` | Primary test customer    |
| **Customer**          | `8888888888` | Secondary customer       |
| **Customer**          | `7777777777` | Third customer           |

---

## 📋 Quick Start Guide

### Step 1: Import Collection

1. Open Postman
2. Click **Import**
3. Select `POSTMAN_LOCATION_TESTING.json`

### Step 2: Set Base URL

- Collection variable `base_url` is set to: `http://localhost:4000/api`
- Update if your server runs on different port

### Step 3: Test Authentication

#### For Customer Login:

1. Run: **"Send OTP for Login"** (phone: `9999999999`)
2. Copy OTP code from response
3. Paste into **"Login with OTP"** request body
4. Run login → Token saved automatically to `{{auth_token}}`

#### For Admin Login:

1. Run: **"Send OTP for Admin Login"** (phone: `1111111111`)
2. Copy OTP code from response
3. Paste into **"Admin Login with OTP"**
4. Run login → Token saved automatically

---

## 🧪 Complete Testing Scenarios

### Scenario 1: New Customer Registration

```
1. Send OTP for Registration (phone: 0123456789)
2. Get OTP from response: { "code": "123456" }
3. Complete Registration with OTP
   - Include: phone, name, email, otp, password
4. Verify user created successfully
```

### Scenario 2: Customer Books Service

```
1. Login as Customer (9999999999)
2. Create SR with Preferred Date/Time
   - Set preferredDate: "2025-12-05T10:00:00Z"
   - Set preferredTime: "Morning"
3. Get My Service Requests
4. Verify SR created with scheduledAt field
```

### Scenario 3: Rebook Completed Service

```
1. Login as Customer (9999999999)
2. Get My Service Requests
3. Find a completed SR (status: PAID_VERIFIED)
4. Call Rebook endpoint with SR ID
5. Verify new SR created with same service details
```

### Scenario 4: Notification Management

```
1. Login as any user
2. Get My Notifications
3. Get Unread Notifications Only (?unreadOnly=true)
4. Mark single notification as read
5. Mark All Notifications as Read
```

### Scenario 5: Customer Profile Stats

```
1. Login as Customer (9999999999)
2. Get My Profile
3. Verify response includes:
   - totalBookings: (count of SRs)
   - totalSpent: (sum of verified payments)
   - businessHours: (operating hours object)
```

### Scenario 6: Location Services

```
1. Login as Technician (4444444444)
2. Update Technician Location
   - latitude: 40.7128
   - longitude: -74.0060
3. Login as Dispatcher (2222222222)
4. Get Nearby Technicians
5. Verify technician appears with distance
```

---

## 🎯 Test Data Available (From Seed)

### Service Requests

- **7 SRs total:**
  - 1 Converted to WO
  - 2 Open
  - 2 New
  - 1 Cancelled
  - 1 Guest SR

### Work Orders

- **7 WOs total:**
  - 1 PAID_VERIFIED (completed)
  - 1 IN_PROGRESS
  - 1 ACCEPTED
  - 1 ASSIGNED
  - 1 UNASSIGNED
  - 1 COMPLETED_PENDING_PAYMENT
  - 1 CANCELLED

### Categories & Services

- **3 Categories:**
  - HVAC
  - Electrical
  - Plumbing
- **3 Subservices** (one per category)
- **3 Services** (AC Repair, Wiring, Pipe Repair)

### Payments & Commissions

- **4 Payments:**

  - 1 VERIFIED
  - 2 PENDING_VERIFICATION
  - 1 REJECTED

- **4 Commissions:**
  - 1 Paid out
  - 2 Pending
  - 1 Booked

### Notifications

- **11 Notifications:**
  - 5 Read
  - 6 Unread

---

## 🔄 Common API Flows

### Flow 1: Guest Creates SR (No Auth)

```http
POST /api/srs
Content-Type: application/json

{
  "phone": "0111111111",
  "name": "Guest User",
  "email": "guest@example.com",
  "address": "123 Guest St",
  "categoryId": 1,
  "subserviceId": 2,
  "description": "Need AC repair"
}

Response:
{
  "isGuest": true,
  "customerId": <auto-created>,
  "createdById": null
}
```

### Flow 2: Authenticated Customer Creates SR

```http
POST /api/srs
Authorization: Bearer <token>
Content-Type: application/json

{
  "phone": "9999999999",
  "address": "123 Main St",
  "categoryId": 1,
  "subserviceId": 2,
  "preferredDate": "2025-12-05T10:00:00Z",
  "preferredTime": "Morning"
}

Response:
{
  "isGuest": false,
  "customerId": 6,
  "createdById": 6
}
```

### Flow 3: Call Center Creates SR for Customer

```http
POST /api/srs
Authorization: Bearer <call-center-token>
Content-Type: application/json

{
  "phone": "9999999999",
  "address": "123 Main St",
  "categoryId": 1,
  "subserviceId": 2
}

Response:
{
  "isGuest": false,
  "customerId": 6,
  "createdById": 3,  // Call center agent ID
  "source": "CALL_CENTER"
}
```

---

## 📱 Response Examples

### OTP Send Response

```json
{
  "message": "OTP sent successfully",
  "code": "123456",
  "expiresAt": "2025-11-30T10:50:00Z",
  "smsStatus": "sent"
}
```

### Login Response

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 6,
    "name": "Jane Customer",
    "phone": "9999999999",
    "email": "customer@example.com",
    "role": "CUSTOMER"
  }
}
```

### SR List Response

```json
[
  {
    "id": 1,
    "srNumber": "SR-1732617600000",
    "status": "CONVERTED_TO_WO",
    "isGuest": false,
    "preferredDate": "2025-12-05T10:00:00Z",
    "preferredTime": "Morning",
    "scheduledAt": "2025-12-05T10:00:00Z",
    "woStatus": "IN_PROGRESS",
    "customer": {...},
    "category": {...}
  }
]
```

### Customer Profile Response

```json
{
  "id": 6,
  "name": "Jane Customer",
  "phone": "9999999999",
  "email": "customer@example.com",
  "role": "CUSTOMER",
  "totalBookings": 15,
  "totalSpent": 75000,
  "businessHours": {
    "monday": "9:00 AM - 6:00 PM",
    "tuesday": "9:00 AM - 6:00 PM",
    "wednesday": "9:00 AM - 6:00 PM",
    "thursday": "9:00 AM - 6:00 PM",
    "friday": "9:00 AM - 6:00 PM",
    "saturday": "10:00 AM - 4:00 PM",
    "sunday": "Closed"
  }
}
```

---

## ⚠️ Important Notes

### OTP Authentication

- **All logins now use OTP** (password-based login removed)
- OTP expires in **5 minutes**
- Each OTP can only be used **once**
- OTP types: `LOGIN`, `REGISTRATION`, `PASSWORD_RESET`, `VERIFICATION`

### Guest vs Authenticated

- **Guest**: `isGuest=true`, no auth token, creates user in background
- **Authenticated**: `isGuest=false`, requires auth token, uses existing user

### Preferred Date/Time

- Both fields are **optional**
- `preferredDate`: ISO 8601 datetime
- `preferredTime`: String ("Morning", "Afternoon", "Evening", or custom)

### Rebook Service

- Only works with **completed SRs** (PAID_VERIFIED status)
- Copies service details from original SR
- Can override: description, address, preferredDate, preferredTime

---

## 🐛 Troubleshooting

### Issue: "Phone and OTP are required"

**Solution:** You're using old password-based login. Use OTP flow:

1. Call `/api/otp/send` first
2. Then `/api/auth/login` with OTP

### Issue: "Invalid or expired OTP"

**Solution:**

- OTP expires in 5 minutes
- Each OTP can only be used once
- Request new OTP and try again

### Issue: "Service Request not found" (Rebook)

**Solution:**

- Verify SR ID exists
- Ensure SR belongs to logged-in customer
- Check SR status is PAID_VERIFIED

### Issue: Token not saving

**Solution:**

- Check "Tests" tab in Postman
- Verify response code is 200
- Check collection variables ({{auth_token}})

---

## 📞 Support

For issues or questions:

- Check `FIXES_COMPLETED.md` for recent changes
- Review `API_DOCUMENTATION.md` for endpoint details
- Check `ISSUES_AND_SOLUTIONS.md` for common problems

---

**Happy Testing! 🚀**
