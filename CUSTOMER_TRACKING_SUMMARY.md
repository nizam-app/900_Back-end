<!-- @format -->

# Customer Registration Source - Implementation Summary

## ✅ What Was Implemented

### 1. Database Schema Changes

Added two new fields to the User model:

- `registrationSource` (String): Tracks HOW the customer was created
  - Values: `SELF_REGISTERED`, `CALL_CENTER`, `ADMIN`, `WEB_PORTAL`
- `createdById` (Int): Tracks WHO created the customer account
  - Links to the User who created this account (for staff-created accounts)

### 2. New API Endpoint

**GET /api/admin/customers**

Returns customer list with:

- Full customer details (name, phone, email, address, etc.)
- Registration source information
- Creator details (for staff-created accounts)
- Statistics breakdown

### 3. Updated Business Logic

**Self-Registration (Mobile App)**:

- When customers register via OTP, `registrationSource` is set to `SELF_REGISTERED`
- `createdById` remains null (no one created them)

**Call Center Creation**:

- When Call Center agents create customers, `registrationSource` is set to `CALL_CENTER`
- `createdById` is set to the agent's ID

**Admin Creation**:

- When Admins create users, `registrationSource` is set to `ADMIN`
- `createdById` is set to the admin's ID

## 📊 API Response Format

```json
{
  "total": 8,
  "statistics": {
    "selfRegistered": {
      "count": 4,
      "percentage": "50.0"
    },
    "callCenterCreated": {
      "count": 4,
      "percentage": "50.0"
    },
    "adminCreated": {
      "count": 0,
      "percentage": "0.0"
    },
    "webPortal": {
      "count": 0,
      "percentage": "0.0"
    },
    "unknown": {
      "count": 0,
      "percentage": "0.0"
    }
  },
  "customers": [
    {
      "id": 1,
      "name": "John Mitchell",
      "phone": "+8801712345678",
      "email": "john.mitchell@email.com",
      "homeAddress": "123 Oak Street, Pittsburgh, PA 15213",
      "registrationSource": "CALL_CENTER",
      "createdById": 5,
      "createdBy": {
        "id": 5,
        "name": "Agent Smith",
        "phone": "+8801798765432",
        "role": "CALL_CENTER"
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "isBlocked": false
    }
  ]
}
```

## 🎯 Frontend Integration

### Display Badges

Based on `registrationSource`:

- `SELF_REGISTERED` → Show "Mobile App" badge (blue)
- `CALL_CENTER` → Show "Call Center Agent" badge (red)
- `ADMIN` → Show "Admin Created" badge (green)
- `WEB_PORTAL` → Show "Web Portal" badge (purple)

### Show Creator Information

When `createdBy` is present:

```
Created by: Agent Smith (Call Center)
```

### Statistics Cards (Already in your UI)

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Total Customers │  │ Agent Created   │  │ Self-Registered │
│       8         │  │   4 (50.0%)     │  │   4 (50.0%)     │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### Filter Dropdown

Add filter to show:

- All Customers
- Self-Registered Only
- Call Center Created Only
- Admin Created Only

## 🧪 Testing

### 1. Get All Customers

```bash
GET https://outside.mtscorporate.com/api/admin/customers
Authorization: Bearer YOUR_ADMIN_TOKEN
```

### 2. Filter by Source

```bash
# Self-registered customers only
GET https://outside.mtscorporate.com/api/admin/customers?registrationSource=SELF_REGISTERED

# Call center created only
GET https://outside.mtscorporate.com/api/admin/customers?registrationSource=CALL_CENTER
```

## 📁 Files Modified

1. ✅ `prisma/schema.prisma` - Added fields to User model
2. ✅ `prisma/migrations/add_customer_tracking/migration.sql` - Database migration
3. ✅ `src/services/auth.service.js` - Set registrationSource for self-registration
4. ✅ `src/controllers/sr.controller.js` - Set registrationSource for Call Center creation
5. ✅ `src/services/admin.service.js` - Set registrationSource for Admin creation
6. ✅ `src/controllers/admin.controller.js` - Added listCustomers() function
7. ✅ `src/routes/admin.routes.js` - Added GET /admin/customers route

## ✅ Migration Status

Migration `add_customer_tracking` has been successfully applied to the database.

## 🎉 Benefits

1. **Clear Visibility**: Admins can see exactly how each customer was registered
2. **Accountability**: Track which agent created each customer
3. **Statistics**: Real-time breakdown of registration sources
4. **Filtering**: Filter customers by registration source
5. **Audit Trail**: Complete history of customer creation
6. **Quality Control**: Monitor Call Center agent performance

## 📝 Next Steps for Frontend

1. Update Customer Management page to call new endpoint
2. Add badges to customer cards based on registrationSource
3. Display creator information when available
4. Add filter dropdown for registration source
5. Update statistics cards with live data
6. Test with different user roles (Admin, Dispatcher, Call Center)

## 🔐 Permissions

The endpoint is accessible by:

- ✅ Admin
- ✅ Dispatcher
- ✅ Call Center

## ⚠️ Data Migration

Existing customers have been backfilled:

- Customers with passwords → `SELF_REGISTERED`
- Customers without passwords → `CALL_CENTER` (assumed)
- Staff users → `ADMIN`

Note: The `createdById` for existing customers will be null since this information wasn't tracked before.

## 📞 Support

For any issues or questions, refer to:

- Full documentation: `CUSTOMER_REGISTRATION_TRACKING.md`
- Test script: `test-customer-tracking.js`
