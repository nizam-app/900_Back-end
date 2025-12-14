# Call Center - Customer Preferred Date Feature

**Status:** ✅ ALREADY IMPLEMENTED (December 14, 2025)

## Overview

Call center agents **already have the ability** to enter the customer's preferred date and time for service execution when creating service requests.

## Implementation Details

### Database Schema

The `ServiceRequest` model includes:
```prisma
model ServiceRequest {
  // ... other fields ...
  preferredDate DateTime? // Optional preferred appointment date
  preferredTime String?   // Optional preferred time slot (e.g., "Morning", "Afternoon", "Evening")
  // ... other fields ...
}
```

### API Endpoint

**POST /api/sr** (Call Center Authentication Required)

### Request Body Fields

**Required Fields:**
- `phone` - Customer phone number
- `address` - Service location address
- `categoryId` - Service category ID
- `serviceId` - Service ID

**Optional Fields for Scheduling:**
- `preferredDate` - Customer's preferred service date (ISO 8601 format: "2025-12-20T10:00:00Z")
- `preferredTime` - Preferred time slot ("Morning", "Afternoon", "Evening", or custom)
- `scheduledAt` - Alternative to preferredDate (same format)
- `notes` - Call center appointment notes

**Other Optional Fields:**
- `name` - Customer name (required if new customer)
- `email` - Customer email (required if new customer)
- `subserviceId` - Specific subservice ID
- `description` - Problem description
- `latitude` - GPS latitude
- `longitude` - GPS longitude
- `paymentType` - "CASH" or "MOBILE_MONEY" (default: "CASH")
- `priority` - "LOW", "MEDIUM", or "HIGH" (default: "MEDIUM")
- `homeAddress` - Customer home address

## Usage Examples

### Example 1: Create SR with Preferred Date for Existing Customer

```json
POST /api/sr
Authorization: Bearer {{callCenterToken}}
Content-Type: application/json

{
  "phone": "8801712345678",
  "address": "123 Main Street, Dhaka",
  "categoryId": 1,
  "serviceId": 2,
  "subserviceId": 3,
  "description": "AC not cooling properly",
  "paymentType": "CASH",
  "priority": "HIGH",
  "preferredDate": "2025-12-20T10:00:00Z",
  "preferredTime": "Morning",
  "notes": "Customer prefers morning slot, has meeting in afternoon"
}
```

### Example 2: Create SR with Preferred Date for New Customer

```json
POST /api/sr
Authorization: Bearer {{callCenterToken}}
Content-Type: application/json

{
  "name": "Jane Customer",
  "email": "jane@example.com",
  "phone": "8801798765432",
  "address": "456 Oak Street, Chittagong",
  "categoryId": 2,
  "serviceId": 5,
  "description": "Electrical wiring issue",
  "paymentType": "MOBILE_MONEY",
  "priority": "MEDIUM",
  "preferredDate": "2025-12-25T14:00:00Z",
  "preferredTime": "Afternoon",
  "notes": "New customer, prefers afternoon appointment between 2-4 PM"
}
```

### Example 3: Using `scheduledAt` Instead of `preferredDate`

```json
POST /api/sr
Authorization: Bearer {{callCenterToken}}
Content-Type: application/json

{
  "phone": "8801612345678",
  "address": "789 Market Road, Sylhet",
  "categoryId": 3,
  "serviceId": 8,
  "scheduledAt": "2025-12-18T09:00:00Z",
  "notes": "Customer requested specific appointment time"
}
```

## Date Format Guidelines

### ISO 8601 Format
- Format: `YYYY-MM-DDTHH:mm:ssZ`
- Example: `2025-12-20T10:00:00Z`
- Time zone: UTC (Z suffix)

### Common Time Slots
- **Morning**: 08:00 - 12:00 (e.g., "2025-12-20T09:00:00Z")
- **Afternoon**: 12:00 - 17:00 (e.g., "2025-12-20T14:00:00Z")
- **Evening**: 17:00 - 21:00 (e.g., "2025-12-20T18:00:00Z")

### Bangladesh Time Zone (GMT+6)
If customer says "10 AM Bangladesh time" on December 20:
```
Bangladesh: 2025-12-20 10:00 AM (GMT+6)
UTC:        2025-12-20 04:00 AM (GMT+0)
Format:     2025-12-20T04:00:00Z
```

## Response Format

```json
{
  "id": 42,
  "srId": 42,
  "srNumber": "SR-1734192000000",
  "customerId": 15,
  "categoryId": 1,
  "serviceId": 2,
  "subserviceId": 3,
  "description": "AC not cooling properly",
  "priority": "HIGH",
  "address": "123 Main Street, Dhaka",
  "paymentType": "CASH",
  "preferredDate": "2025-12-20T10:00:00.000Z",
  "preferredTime": "Morning",
  "status": "NEW",
  "source": "CALL_CENTER",
  "isGuest": false,
  "createdAt": "2025-12-14T08:30:00.000Z",
  "customer": {
    "id": 15,
    "name": "John Customer",
    "phone": "8801712345678"
  },
  "category": {
    "id": 1,
    "name": "HVAC"
  },
  "service": {
    "id": 2,
    "name": "AC Repair"
  }
}
```

## How It Works

### Call Center Workflow

1. **Call center agent receives customer call**
   - Customer explains the service issue
   - Customer mentions preferred date/time for service

2. **Agent searches for existing customer**
   ```
   GET /api/srs/search-customer?phone=8801712345678
   ```

3. **Agent creates service request with preferred date**
   - If customer exists: Use phone only
   - If new customer: Provide name + email
   - Include `preferredDate` and `preferredTime` fields
   - Add any special notes in `notes` field

4. **System stores preferred date**
   - SR created with `preferredDate` and `preferredTime`
   - Dispatcher can see this when converting SR to WO
   - Technician can see scheduled appointment time

5. **Dispatcher converts SR to WO**
   - Sees customer's preferred date
   - Can use it as `scheduledAt` for work order
   - Can adjust if technician availability differs

## Benefits

✅ **Customer Convenience**: Customers can request specific dates/times
✅ **Better Planning**: Dispatchers know customer preferences upfront
✅ **Higher Satisfaction**: Services scheduled at customer-preferred times
✅ **Clear Communication**: Notes field captures special requests
✅ **Audit Trail**: All preferences documented in database

## Integration Points

### Dispatcher View
- When viewing SR list, dispatcher can see `preferredDate` and `preferredTime`
- When converting SR to WO, can use preferred date as default `scheduledAt`

### Technician View
- Technicians see scheduled appointment time in their job list
- Can plan their day based on scheduled appointments

### Customer View
- If customer later logs in, they can see their preferred date
- Can track when service is scheduled

## Testing

### Test in Postman

1. **Login as Call Center Agent**
   ```
   POST /api/auth/login
   Body: { "phone": "3333333333", "password": "callcenter123" }
   ```

2. **Create SR with Preferred Date**
   ```
   POST /api/sr
   Authorization: Bearer {{callCenterToken}}
   Body: Include preferredDate and preferredTime fields
   ```

3. **Verify Response**
   - Check response includes `preferredDate` and `preferredTime`
   - Status should be `NEW`
   - Source should be `CALL_CENTER`

## Notes

- **Flexible Scheduling**: `preferredDate` is optional - can be added later if needed
- **Multiple Formats**: Both `preferredDate` and `scheduledAt` work (same field internally)
- **Time Slots**: `preferredTime` is freeform text - can be "Morning", "2-4 PM", "After 6 PM", etc.
- **Notes Field**: Use for special instructions like "Call before arriving", "Access code: 1234"

## Status

✅ **PRODUCTION READY** - Feature is fully implemented and tested
- Database schema: ✅ Complete
- API endpoint: ✅ Working
- Call center access: ✅ Authorized
- Validation: ✅ Implemented
- Documentation: ✅ Complete

## Related Documentation

- [SR_CREATION_FIX_DEC4.md](./SR_CREATION_FIX_DEC4.md) - SR creation implementation details
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Complete API reference
- [POSTMAN_TEST_GUIDE.md](./POSTMAN_TEST_GUIDE.md) - Testing scenarios
- [CALL_CENTER_DASHBOARD_FEATURE.md](./CALL_CENTER_DASHBOARD_FEATURE.md) - Call center features overview

---

**Last Updated:** December 14, 2025
**Feature Status:** ✅ ALREADY IMPLEMENTED
**Testing Status:** ✅ FULLY TESTED
