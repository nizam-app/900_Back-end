<!-- @format -->

# Service Request Creation - Fixes Applied (Dec 4, 2025)

## Issue Identified

Based on the UI mockup showing the 3-step service request flow, we identified that the `name` field handling needed improvement for guest users creating service requests.

## Problems Fixed

### 1. **Name Field Validation for Guests**

**Before:** Name was optional for guest/web portal users  
**After:** Name is now required for guest SR creation

```javascript
// Added validation
if (!isAuthenticated && !name) {
  return res.status(400).json({
    message: "Name is required for service request creation",
  });
}
```

### 2. **Updating Existing Guest Users**

**Before:** If a guest user already existed, their name wouldn't be updated  
**After:** Name is updated if provided and different from existing

```javascript
// Update existing guest user's name if provided and different
if (name && guestUser.name !== name) {
  guestUser = await prisma.user.update({
    where: { phone },
    data: { name },
  });
  console.log(`👤 Updated guest user name: ${phone} → ${name}`);
}
```

### 3. **Enhanced Response Object**

**Before:** Response didn't explicitly include customer name and appointment fields  
**After:** Response now clearly shows all important fields

```javascript
const response = {
  ...sr,
  srId: sr.id,
  status: sr.status,
  isGuest: sr.isGuest,
  customerName: sr.customer?.name, // Explicit customer name
  preferredAppointmentDate: sr.preferredDate, // Customer's requested date
  preferredAppointmentTime: sr.preferredTime, // Customer's requested time
};
```

## API Endpoints Updated

### POST /api/sr (Guest/Web Portal)

**Required Fields:**

- `name` - Customer's full name ✨ **NOW REQUIRED**
- `phone` - 10-15 digit phone number
- `address` - Service location address
- `categoryId` - Service category ID
- `subserviceId` - Subservice ID

**Optional Fields:**

- `email` - Customer email
- `serviceId` - Specific service ID
- `description` - Problem description
- `latitude` - GPS latitude
- `longitude` - GPS longitude
- `paymentType` - "CASH" or "MOBILE_MONEY" (default: "CASH")
- `priority` - "LOW", "MEDIUM", or "HIGH" (default: "MEDIUM")
- `preferredDate` - ISO 8601 datetime (e.g., "2025-12-10T10:00:00Z")
- `preferredTime` - Time slot (e.g., "Morning", "Afternoon", "Evening")

### Example Request (Guest)

```json
{
  "name": "Jane Customer",
  "phone": "0701234567",
  "address": "456 Oak Street, Downtown",
  "latitude": -1.292066,
  "longitude": 36.821946,
  "categoryId": 1,
  "subserviceId": 1,
  "serviceId": 1,
  "description": "AC not cooling properly",
  "paymentType": "MOBILE_MONEY",
  "priority": "HIGH",
  "preferredDate": "2025-12-10T10:00:00Z",
  "preferredTime": "Morning"
}
```

### Example Response

```json
{
  "id": 25,
  "srId": 25,
  "srNumber": "SR-1733308800000",
  "customerId": 6,
  "categoryId": 1,
  "subserviceId": 1,
  "serviceId": 1,
  "description": "AC not cooling properly",
  "priority": "HIGH",
  "address": "456 Oak Street, Downtown",
  "latitude": -1.292066,
  "longitude": 36.821946,
  "paymentType": "MOBILE_MONEY",
  "preferredDate": "2025-12-10T10:00:00.000Z",
  "preferredTime": "Morning",
  "status": "NEW",
  "source": "WEB_PORTAL",
  "isGuest": true,
  "customerName": "Jane Customer",
  "preferredAppointmentDate": "2025-12-10T10:00:00.000Z",
  "preferredAppointmentTime": "Morning",
  "customer": {
    "id": 6,
    "name": "Jane Customer",
    "phone": "0701234567"
  },
  "category": {
    "id": 1,
    "name": "General Maintenance"
  },
  "subservice": {
    "id": 1,
    "name": "Window Repair"
  },
  "service": {
    "id": 1,
    "name": "Repair & Fixes"
  },
  "createdAt": "2025-12-04T12:00:00.000Z",
  "updatedAt": "2025-12-04T12:00:00.000Z"
}
```

## UI Flow Integration

### Step 1: Service Details Screen

Collects:

- Full Name ✅
- Phone Number ✅
- Service Address ✅

### Step 2: Additional Details (Optional)

Collects:

- Description (Optional) ✅
- Preferred Appointment Date & Time (Optional) ✅

All fields are properly handled and stored in the database.

## Postman Collection Updates

Updated `FSM-API.postman_collection.json`:

1. **Create SR (Guest) with GPS** - Added `preferredDate` and `preferredTime` fields, updated description
2. **Create SR (Authenticated Customer)** - Added `preferredDate` and `preferredTime` fields, updated description

## Testing

### Test Guest SR Creation

```bash
curl -X POST http://localhost:3000/api/sr \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "phone": "0701234567",
    "address": "123 Main Street",
    "categoryId": 1,
    "subserviceId": 1,
    "preferredDate": "2025-12-10T10:00:00Z",
    "preferredTime": "Morning"
  }'
```

### Expected Response

- Status: 201 Created
- Response includes `customerName`, `preferredAppointmentDate`, `preferredAppointmentTime`
- `isGuest: true`
- User record created/updated with provided name

### Test Without Name (Should Fail)

```bash
curl -X POST http://localhost:3000/api/sr \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "0701234567",
    "address": "123 Main Street",
    "categoryId": 1,
    "subserviceId": 1
  }'
```

Expected Response:

```json
{
  "message": "Name is required for service request creation"
}
```

## Files Modified

1. **src/controllers/sr.controller.js**

   - Added name validation for guest users
   - Added logic to update existing guest user names
   - Enhanced response object with explicit fields

2. **FSM-API.postman_collection.json**
   - Updated "Create SR (Guest) with GPS" request
   - Updated "Create SR (Authenticated Customer)" request
   - Added preferredDate and preferredTime examples
   - Updated descriptions with field requirements

## Benefits

✅ **Data Integrity** - Customer names always captured for guest SRs  
✅ **Better UX** - Clear error messages when required fields missing  
✅ **Consistent Data** - Existing guest users get name updates  
✅ **Appointment Preferences** - Customers can specify preferred dates/times  
✅ **Clear Response** - All important fields explicitly included in response  
✅ **UI Alignment** - Backend now matches the 3-step UI flow requirements

## Next Steps

1. Test the updated endpoints with Postman
2. Update frontend to use the new response fields
3. Implement UI validation to ensure name is always provided
4. Consider adding name length validation (min 2 chars, max 100 chars)

---

**Summary:** The SR creation flow now properly handles customer names for guest users, validates required fields, updates existing records, and provides clear, comprehensive responses that align with the UI mockup requirements.
