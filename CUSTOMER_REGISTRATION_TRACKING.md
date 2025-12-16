# Customer Registration Source Tracking

**Date**: December 16, 2024  
**Status**: ✅ Implemented

## Overview
Added functionality to track how customers were registered in the system, distinguishing between:
- **Self-Registered**: Customers who signed up themselves via the mobile app
- **Call Center Created**: Customers created by Call Center agents
- **Admin Created**: Customers created by Admin/Dispatcher
- **Web Portal**: Customers who registered via web portal

## Database Changes

### New Fields in User Model

```prisma
model User {
  // ... existing fields ...
  registrationSource String? // SELF_REGISTERED, CALL_CENTER, ADMIN, WEB_PORTAL
  createdById       Int? // ID of the user who created this account
  
  // ... existing relations ...
  createdBy              User?               @relation("CreatedByUser", fields: [createdById], references: [id])
  createdUsers           User[]              @relation("CreatedByUser")
}
```

### Migration
Location: `prisma/migrations/add_customer_tracking/migration.sql`

The migration:
1. Adds `registrationSource` and `createdById` fields to User table
2. Sets up foreign key relationship for `createdById`
3. Backfills existing data:
   - Customers with passwords → `SELF_REGISTERED`
   - Customers without passwords → `CALL_CENTER`
   - Staff roles → `ADMIN`

## API Changes

### New Endpoint: Get Customers List

**Endpoint**: `GET /api/admin/customers`

**Access**: Admin, Dispatcher, Call Center

**Query Parameters**:
- `registrationSource` (optional): Filter by registration source
  - Values: `SELF_REGISTERED`, `CALL_CENTER`, `ADMIN`, `WEB_PORTAL`

**Response**:
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
      "latitude": 40.4406,
      "longitude": -79.9959,
      "registrationSource": "CALL_CENTER",
      "createdById": 5,
      "createdBy": {
        "id": 5,
        "name": "Agent Smith",
        "phone": "+8801798765432",
        "role": "CALL_CENTER"
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "isBlocked": false
    },
    {
      "id": 2,
      "name": "Sarah Williams",
      "phone": "+8801823456789",
      "email": "sarah.w@email.com",
      "homeAddress": "456 Maple Avenue, Pittsburgh, PA 15232",
      "latitude": 40.4515,
      "longitude": -79.9325,
      "registrationSource": "SELF_REGISTERED",
      "createdById": null,
      "createdBy": null,
      "createdAt": "2024-02-20T14:22:00.000Z",
      "updatedAt": "2024-02-20T14:22:00.000Z",
      "isBlocked": false
    }
  ]
}
```

### Usage Examples

```bash
# Get all customers
GET /api/admin/customers

# Get only self-registered customers
GET /api/admin/customers?registrationSource=SELF_REGISTERED

# Get only call center created customers
GET /api/admin/customers?registrationSource=CALL_CENTER
```

## Updated Logic

### 1. Self-Registration (Mobile App)
**File**: `src/services/auth.service.js`

When customers register via OTP:
```javascript
user = await prisma.user.create({
  data: {
    phone,
    passwordHash: hash,
    name,
    email,
    role: "CUSTOMER",
    registrationSource: "SELF_REGISTERED", // ✅ Set automatically
  },
});
```

### 2. Call Center Customer Creation
**File**: `src/controllers/sr.controller.js`

When Call Center creates a customer while creating SR:
```javascript
customer = await prisma.user.create({
  data: {
    phone,
    name,
    email,
    passwordHash: "",
    role: "CUSTOMER",
    homeAddress: homeAddress || address,
    latitude,
    longitude,
    registrationSource: "CALL_CENTER", // ✅ Set to CALL_CENTER
    createdById: req.user.id, // ✅ Track the agent who created it
  },
});
```

### 3. Admin User Creation
**File**: `src/services/admin.service.js`

When Admin creates users via admin panel:
```javascript
const user = await prisma.user.create({
  data: {
    name,
    phone,
    email,
    passwordHash: hash,
    role,
    registrationSource: "ADMIN", // ✅ Set to ADMIN
    createdById: adminId, // ✅ Track which admin created it
  },
});
```

## Frontend Integration

### Customer Management Dashboard

The frontend should display:

1. **Statistics Cards** (already shown in your screenshot):
   ```
   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
   │ Total Customers │  │ Agent Created   │  │ Self-Registered │
   │       8         │  │   4 (50.0%)     │  │   4 (50.0%)     │
   └─────────────────┘  └─────────────────┘  └─────────────────┘
   ```

2. **Customer List with Badges**:
   - Show "Call Center Agent" badge for `registrationSource: "CALL_CENTER"`
   - Show "Mobile App" badge for `registrationSource: "SELF_REGISTERED"`
   - Show "Admin Created" badge for `registrationSource: "ADMIN"`

3. **Filter Options**:
   - Dropdown to filter by registration source
   - Show agent name who created the customer (from `createdBy` field)

### UI Components

```javascript
// Badge component
const getRegistrationBadge = (source) => {
  const badges = {
    SELF_REGISTERED: { label: 'Mobile App', color: 'blue' },
    CALL_CENTER: { label: 'Call Center Agent', color: 'red' },
    ADMIN: { label: 'Admin Created', color: 'green' },
    WEB_PORTAL: { label: 'Web Portal', color: 'purple' }
  };
  return badges[source] || { label: 'Unknown', color: 'gray' };
};

// Display in customer card
<div className="customer-card">
  <h3>{customer.name}</h3>
  <Badge color={getRegistrationBadge(customer.registrationSource).color}>
    {getRegistrationBadge(customer.registrationSource).label}
  </Badge>
  {customer.createdBy && (
    <p>Created by: {customer.createdBy.name} ({customer.createdBy.role})</p>
  )}
</div>
```

## Testing

### Test Cases

1. **Self-Registration**:
   ```bash
   # 1. Send OTP
   POST /api/otp/send
   { "phone": "+8801712345678" }
   
   # 2. Verify OTP and set password
   POST /api/auth/set-password
   { 
     "phone": "+8801712345678",
     "password": "password123",
     "name": "Test Customer",
     "tempToken": "..."
   }
   
   # 3. Check customer
   GET /api/admin/customers
   # Should show registrationSource: "SELF_REGISTERED"
   ```

2. **Call Center Creation**:
   ```bash
   # Login as Call Center agent
   POST /api/auth/login
   { "phone": "+8801798765432", "password": "callcenter123" }
   
   # Create SR (creates customer automatically)
   POST /api/srs
   {
     "phone": "+8801811111111",
     "name": "New Customer",
     "categoryId": 1,
     "subserviceId": 2,
     "address": "Test Address"
   }
   
   # Check customer
   GET /api/admin/customers
   # Should show registrationSource: "CALL_CENTER"
   # Should show createdById: <call_center_agent_id>
   ```

3. **Admin Creation**:
   ```bash
   # Login as Admin
   POST /api/auth/login
   { "phone": "+8801798888888", "password": "admin123" }
   
   # Create user
   POST /api/admin/users
   {
     "phone": "+8801822222222",
     "password": "test123",
     "name": "Admin Customer",
     "role": "CUSTOMER"
   }
   
   # Check customer
   GET /api/admin/customers
   # Should show registrationSource: "ADMIN"
   # Should show createdById: <admin_id>
   ```

4. **Filter by Source**:
   ```bash
   # Get only self-registered customers
   GET /api/admin/customers?registrationSource=SELF_REGISTERED
   
   # Get only call center created customers
   GET /api/admin/customers?registrationSource=CALL_CENTER
   ```

## Database Migration Steps

```bash
# 1. Generate migration
npx prisma migrate dev --name add_customer_tracking

# 2. Verify schema changes
npx prisma generate

# 3. Check database
npx prisma studio
# Navigate to User table and verify new fields exist
```

## Benefits

1. **Clear Visibility**: Admin can see exactly how each customer was registered
2. **Accountability**: Track which Call Center agent or Admin created each customer
3. **Analytics**: Generate reports on registration sources
4. **Audit Trail**: Complete history of customer creation
5. **Quality Control**: Monitor Call Center performance
6. **User Experience**: Differentiate support for self-registered vs agent-created customers

## Future Enhancements

1. **Reports**:
   - Daily/weekly registration statistics by source
   - Agent performance (number of customers created)
   - Registration trend analysis

2. **Notifications**:
   - Alert admin when Call Center creates many customers (potential data entry issues)
   - Welcome emails based on registration source

3. **Permissions**:
   - Different default permissions for self-registered vs agent-created customers
   - Auto-verify agent-created customers

4. **Analytics Dashboard**:
   - Charts showing registration sources over time
   - Heatmap of customer creation by agent
   - Conversion rates (guest to registered customer)

## Files Modified

1. ✅ `prisma/schema.prisma` - Added registrationSource and createdById fields
2. ✅ `prisma/migrations/add_customer_tracking/migration.sql` - Migration file
3. ✅ `src/services/auth.service.js` - Set registrationSource for self-registration
4. ✅ `src/controllers/sr.controller.js` - Set registrationSource for Call Center
5. ✅ `src/services/admin.service.js` - Set registrationSource for Admin creation
6. ✅ `src/controllers/admin.controller.js` - Added listCustomers endpoint
7. ✅ `src/routes/admin.routes.js` - Added /customers route

## Summary

The system now tracks:
- ✅ **How** customers were created (registrationSource)
- ✅ **Who** created them (createdById)
- ✅ **When** they were created (createdAt)
- ✅ Statistics and filtering capabilities
- ✅ Complete audit trail

Admins can now clearly see which customers:
- Registered themselves via mobile app
- Were created by Call Center agents
- Were created by Admin/Dispatcher
- Came from web portal
