# API Fixes Summary

## Issues Fixed

### ✅ 1. Service Request Creation Without Access Token

**Problem**: SR creation route didn't allow guest/unauthenticated requests.

**Solution**: 
- Route `POST /api/srs` now works without authentication
- Controller handles both authenticated and guest users
- Guest users are automatically created with phone number
- Proper source tracking (CUSTOMER_APP, WEB_PORTAL, CALL_CENTER)

**Usage**:
```bash
# Guest/Customer creating SR (no token needed)
POST {{baseUrl}}/api/srs
{
  "name": "John Doe",
  "phone": "1234567890",
  "address": "123 Main St",
  "categoryId": 1,
  "subserviceId": 1,
  "serviceId": 1,
  "description": "AC not working",
  "paymentType": "CASH",
  "priority": "MEDIUM"
}
```

---

### ✅ 2. SR List Filtering by Role

**Problem**: Only DISPATCHER/ADMIN/CALL_CENTER could list SRs, customers couldn't see their own SRs.

**Solution**:
- Added CUSTOMER role to SR list endpoint
- Customers automatically filtered to see only their own SRs
- Dispatcher/Admin/Call Center see all SRs with optional filters

**Route Updated**: `GET /api/srs`
- **Customers**: See only their own SRs (filtered by `customerId = req.user.id`)
- **Dispatcher/Admin/Call Center**: See all SRs with query filters

**Usage**:
```bash
# Customer sees their own SRs
GET {{baseUrl}}/api/srs
Authorization: Bearer <customer_token>

# Dispatcher/Admin filters all SRs
GET {{baseUrl}}/api/srs?status=NEW&priority=HIGH
Authorization: Bearer <dispatcher_token>
```

---

### ✅ 3. Validation Added to Prevent Database Errors

**Problem**: No validation for enum fields and related entities, causing database errors.

**Validations Added**:

#### Phone Validation
- Must be 10-15 digits
- Regex: `/^\d{10,15}$/`

#### PaymentType Enum Validation
- Valid values: `CASH`, `MOBILE_MONEY`
- Default: `CASH`

#### Priority Enum Validation
- Valid values: `LOW`, `MEDIUM`, `HIGH`
- Default: `MEDIUM`

#### Source Enum Validation
- Valid values: `CUSTOMER_APP`, `WEB_PORTAL`, `CALL_CENTER`
- Auto-determined based on user role

#### Entity Existence Validation
- Validates `categoryId` exists in database
- Validates `subserviceId` exists in database
- Validates `serviceId` exists (if provided)

**Error Responses**:
```json
// Invalid phone
{ "message": "Phone must be 10-15 digits" }

// Invalid paymentType
{ "message": "Invalid paymentType. Must be one of: CASH, MOBILE_MONEY" }

// Invalid priority
{ "message": "Invalid priority. Must be one of: LOW, MEDIUM, HIGH" }

// Invalid source
{ "message": "Invalid source. Must be one of: CUSTOMER_APP, WEB_PORTAL, CALL_CENTER" }

// Category not found
{ "message": "Category not found" }

// Subservice not found
{ "message": "Subservice not found" }

// Service not found
{ "message": "Service not found" }
```

---

### ✅ 4. Fixed WO Respond Route

**Problem**: Route parameter inconsistency - `/api/wos/:woId/respond` didn't work because controller expected `req.params.id`.

**Solution**: 
- Standardized ALL WO routes to use `:woId` parameter
- Updated all WO controllers to use `req.params.woId`

**Routes Standardized**:
```javascript
PATCH /api/wos/:woId/assign    // Was /:id/assign
PATCH /api/wos/:woId/respond   // Was /:id/respond  ✅ FIXED
PATCH /api/wos/:woId/start     // Was /:id/start
PATCH /api/wos/:woId/complete  // Was /:id/complete
```

**Additional Validation for Respond**:
- Action field is required
- Valid actions: `ACCEPT`, `DECLINE`
- Returns clear error for invalid actions

**Usage**:
```bash
# Accept work order
PATCH {{baseUrl}}/api/wos/{{woId}}/respond
Authorization: Bearer <technician_token>
{
  "action": "ACCEPT"
}

# Decline work order
PATCH {{baseUrl}}/api/wos/{{woId}}/respond
Authorization: Bearer <technician_token>
{
  "action": "DECLINE"
}
```

---

## Files Modified

### Routes
- ✅ `src/routes/sr.routes.js` - Allow guest SR creation, added CUSTOMER to list endpoint
- ✅ `src/routes/wo.routes.js` - Standardized all routes to use `:woId`

### Controllers
- ✅ `src/controllers/sr.controller.js` - Added comprehensive validation, role-based filtering
- ✅ `src/controllers/wo.controller.js` - Updated all functions to use `req.params.woId`, added action validation

---

## Testing Checklist

### Service Request Creation (No Token)
- [ ] Create SR as guest (no token)
- [ ] Create SR with invalid phone format
- [ ] Create SR with invalid paymentType
- [ ] Create SR with invalid priority
- [ ] Create SR with non-existent categoryId
- [ ] Create SR with non-existent subserviceId

### Service Request List
- [ ] List SRs as CUSTOMER (should see only own)
- [ ] List SRs as DISPATCHER (should see all)
- [ ] List SRs with filters (status, priority, customerId)

### Work Order Respond
- [ ] Respond to WO with ACCEPT
- [ ] Respond to WO with DECLINE
- [ ] Respond to WO with invalid action
- [ ] Respond to WO without action field

### All WO Routes
- [ ] Assign WO: `PATCH /api/wos/:woId/assign`
- [ ] Respond WO: `PATCH /api/wos/:woId/respond`
- [ ] Start WO: `PATCH /api/wos/:woId/start`
- [ ] Complete WO: `PATCH /api/wos/:woId/complete`

---

## API Documentation Updates Needed

Update Postman/Swagger documentation:
1. SR creation endpoint - mark as "No auth required"
2. SR list endpoint - add CUSTOMER role to allowed roles
3. All WO routes - update parameter from `:id` to `:woId`
4. Add validation error examples to all endpoints

---

## Summary

All 4 issues have been resolved:
1. ✅ SR creation works without token
2. ✅ Customers can see their own SRs, dispatchers see all
3. ✅ Comprehensive validation prevents database errors
4. ✅ WO respond route works with consistent `:woId` parameter

The API now has proper validation, role-based access control, and consistent route parameters.
