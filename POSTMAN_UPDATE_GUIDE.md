<!-- @format -->

# Postman Collection Update Required

## ✅ Server is Running on Port 4000

## 🔧 Route Changes You Need to Update in Postman

### Service Requests Routes (UPDATED)

The SR routes have been changed from `/api/sr` to `/api/srs` (plural).

**Update these endpoints in your Postman collection:**

1. **Create SR (Guest)**

   - OLD: `POST {{baseUrl}}/api/sr`
   - NEW: `POST {{baseUrl}}/api/srs`

2. **List SRs**
   - OLD: `GET {{baseUrl}}/api/sr?status=NEW`
   - NEW: `GET {{baseUrl}}/api/srs?status=NEW`

### Work Order Routes (Already Correct ✅)

All WO routes are already using the correct format:

- ✅ `POST /api/wos/from-sr/:srId`
- ✅ `PATCH /api/wos/:woId/assign`
- ✅ `PATCH /api/wos/:woId/respond`
- ✅ `PATCH /api/wos/:woId/start`
- ✅ `PATCH /api/wos/:woId/complete`

## 📝 How to Update Postman Collection

### Option 1: Manual Update in Postman

1. Open Postman
2. Find "Create SR (Guest)" request
3. Change URL from `{{baseUrl}}/api/sr` to `{{baseUrl}}/api/srs`
4. Find "List SRs" request
5. Change URL from `{{baseUrl}}/api/sr?status=NEW` to `{{baseUrl}}/api/srs?status=NEW`
6. Save collection

### Option 2: Re-import Updated Collection

The collection file has been updated. You can:

1. Delete old "FSM System API" collection in Postman
2. Import the updated `FSM-API.postman_collection.json`

## 🧪 Test the Endpoints

### 1. Create SR (No Authentication Required)

```
POST http://localhost:4000/api/srs
Content-Type: application/json

{
  "name": "Test Customer",
  "phone": "1234567890",
  "address": "123 Test Street",
  "categoryId": 1,
  "subserviceId": 1,
  "serviceId": 1,
  "description": "Test service request",
  "paymentType": "CASH",
  "priority": "MEDIUM"
}
```

### 2. List SRs (Requires Authentication)

```
GET http://localhost:4000/api/srs?status=NEW
Authorization: Bearer <your_dispatcher_token>
```

## 🔐 Authentication Notes

- **Create SR**: No token required (guest access)
- **List SRs**: Requires token with role: CUSTOMER, DISPATCHER, ADMIN, or CALL_CENTER
  - Customers see only their own SRs
  - Dispatcher/Admin/Call Center see all SRs

## ⚠️ Common Errors and Solutions

### Error: "Cannot POST /api/sr"

- **Cause**: Using old route `/api/sr`
- **Solution**: Update to `/api/srs` (plural)

### Error: 401 Unauthorized on List SRs

- **Cause**: Missing or invalid authentication token
- **Solution**: Login first and use the token in Authorization header

### Error: Empty array returned

- **Possible causes**:
  1. No service requests in database yet
  2. Wrong status filter (e.g., no SRs with status="NEW")
  3. Customer role only sees their own SRs (might be empty)

## 📋 Current API Endpoints

### Service Requests

- `POST /api/srs` - Create SR (no auth)
- `GET /api/srs` - List SRs (auth required)

### Work Orders

- `POST /api/wos/from-sr/:srId` - Convert SR to WO
- `PATCH /api/wos/:woId/assign` - Assign technician
- `PATCH /api/wos/:woId/respond` - Accept/Decline WO
- `PATCH /api/wos/:woId/start` - Start job
- `PATCH /api/wos/:woId/complete` - Complete job

All routes are now consistent and working! 🎉
