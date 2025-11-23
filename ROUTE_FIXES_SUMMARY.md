<!-- @format -->

# Route Fixes - All Postman Endpoints Now Working

## ✅ Issues Fixed

### 1. **Payment Endpoints** - ADDED

Missing endpoints that were in Postman collection but not implemented:

**Added Routes:**

- `GET /api/payments` - List all payments with filters (Admin/Dispatcher)
- `GET /api/payments/:id` - Get payment details by ID

**Added Controllers:**

- `getAllPayments()` - Fetch paginated payment list with filters (status, woId, technicianId, method)
- `getPaymentById()` - Fetch single payment with full relations (WO, customer, tech, commissions)

**Features:**

- Pagination support
- Filter by: status, woId, technicianId, method
- Includes work order details, customer info, technician info, verifier details
- Shows related commissions

---

### 2. **Location Endpoints** - ADDED

Missing ETA calculation endpoint:

**Added Route:**

- `GET /api/location/eta` - Calculate estimated time of arrival

**Added Controller:**

- `getETA()` - Calculate distance and ETA from technician to destination

**Features:**

- Uses Haversine formula for accurate distance calculation
- Estimates travel time (assumes 30 km/h average city speed)
- Returns formatted time (minutes or hours + minutes)
- Validates technician location availability
- Accessible by Admin, Dispatcher, and Customer roles

---

## 📋 Complete Endpoint Summary

### Payment Endpoints (4 total)

| Method | Endpoint                   | Description           | Roles                   |
| ------ | -------------------------- | --------------------- | ----------------------- |
| GET    | `/api/payments`            | List all payments     | Admin, Dispatcher       |
| GET    | `/api/payments/:id`        | Get payment by ID     | Admin, Dispatcher, Tech |
| POST   | `/api/payments`            | Upload payment proof  | Tech                    |
| PATCH  | `/api/payments/:id/verify` | Verify/reject payment | Admin, Dispatcher       |

### Location Endpoints (5 total)

| Method | Endpoint                              | Description                   | Roles                       |
| ------ | ------------------------------------- | ----------------------------- | --------------------------- |
| POST   | `/api/location/update`                | Update technician location    | Tech                        |
| GET    | `/api/location/nearby`                | Get nearby technicians        | Admin, Dispatcher           |
| GET    | `/api/location/technician/:id`        | Get tech's current location   | Admin, Dispatcher, Customer |
| GET    | `/api/location/eta`                   | Calculate ETA to destination  | Admin, Dispatcher, Customer |
| GET    | `/api/location/history/:technicianId` | Get location check-in history | Admin, Dispatcher           |

---

## 🧪 Testing Examples

### Get All Payments

```bash
GET /api/payments?status=PENDING_VERIFICATION&page=1&limit=10
Headers: Authorization: Bearer <admin_token>

Response:
{
  "payments": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### Get Payment by ID

```bash
GET /api/payments/5
Headers: Authorization: Bearer <admin_token>

Response:
{
  "id": 5,
  "woId": 10,
  "amount": 1500,
  "method": "MOBILE_MONEY",
  "status": "VERIFIED",
  "workOrder": {
    "woNumber": "WO-123456",
    "customer": { "name": "John Doe", "phone": "..." },
    "technician": { "name": "Tech Name", "phone": "..." }
  },
  "commissions": [
    { "type": "COMMISSION", "amount": 225, "status": "EARNED" },
    { "type": "BONUS", "amount": 75, "status": "EARNED" }
  ]
}
```

### Get ETA

```bash
GET /api/location/eta?technicianId=6&destinationLat=23.8200&destinationLng=90.4200
Headers: Authorization: Bearer <dispatcher_token>

Response:
{
  "technician": {
    "id": 6,
    "name": "Tech Name",
    "currentLocation": {
      "latitude": 23.8103,
      "longitude": 90.4125
    },
    "locationStatus": "ONLINE",
    "lastUpdated": "2025-01-19T10:30:00Z"
  },
  "destination": {
    "latitude": 23.8200,
    "longitude": 90.4200
  },
  "distance": 1.23,  // km
  "estimatedTime": {
    "minutes": 2,
    "formatted": "2 minutes"
  }
}
```

---

## ✅ Verification Checklist

- [x] Payment GET endpoints added
- [x] Payment controllers implemented with proper relations
- [x] Location ETA endpoint added
- [x] ETA calculation using Haversine formula
- [x] All endpoints have proper authentication
- [x] All endpoints have role-based access control
- [x] Pagination implemented for list endpoints
- [x] Error handling for missing data
- [x] No compilation errors
- [x] All Postman collection endpoints now match actual routes

---

## 📊 Total Routes: 60+

All routes from the Postman collection are now implemented and working!

**Last Updated**: 2025-01-19  
**Status**: ✅ All endpoints verified and working
