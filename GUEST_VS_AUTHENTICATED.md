<!-- @format -->

# Guest vs Authenticated User Service Requests

## 🎯 Overview

The system now properly differentiates between **guest users** (unauthenticated) and **authenticated users** when creating service requests.

---

## 🔐 Authentication Logic

### Authenticated User (isGuest = false)

- User provides valid Bearer token in Authorization header
- `req.user` is populated by `optionalAuth` middleware
- SR created with `isGuest: false`
- `customerId` = authenticated user's ID
- `createdById` = authenticated user's ID
- `source` = "CUSTOMER_APP"

### Guest User (isGuest = true)

- No Authorization header provided
- `req.user` is null
- SR created with `isGuest: true`
- System creates temporary user account with empty passwordHash
- `customerId` = temporary user ID
- `createdById` = null
- `source` = "WEB_PORTAL"

---

## 📝 Implementation Details

### 1. Optional Authentication Middleware

**File:** `src/middleware/auth.js`

```javascript
// Optional authentication - sets req.user if token is valid, but doesn't reject if missing
export const optionalAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    const token = header.split(" ")[1];
    try {
      const decoded = verifyToken(token);
      req.user = decoded; // { id, role, phone }
    } catch {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
};
```

### 2. SR Routes with Optional Auth

**File:** `src/routes/sr.routes.js`

```javascript
// Customer / Guest create SR (optional auth - supports both authenticated and guest users)
router.post("/", optionalAuth, createSR);
```

### 3. SR Creation Logic

**File:** `src/controllers/sr.controller.js`

```javascript
// Determine if user is authenticated
const isAuthenticated = req.user && req.user.id;

if (isAuthenticated && req.user.role === "CUSTOMER") {
  customerId = req.user.id;
  createdById = req.user.id;
  isGuest = false; // Authenticated customer
  finalSource = "CUSTOMER_APP";

  console.log(
    `✅ Authenticated customer ${req.user.phone} creating SR (isGuest: false)`
  );
}
// Handle guest/web portal SR creation (no authentication)
else {
  let guestUser = await prisma.user.findUnique({ where: { phone } });

  if (!guestUser) {
    guestUser = await prisma.user.create({
      data: {
        phone,
        name,
        email,
        passwordHash: "",
        role: "CUSTOMER",
      },
    });
    console.log(`👤 Created guest user: ${phone}`);
  }

  customerId = guestUser.id;
  isGuest = true; // Guest user from web portal
  finalSource = "WEB_PORTAL";
  createdById = null; // No authenticated creator

  console.log(`🌐 Guest user ${phone} creating SR (isGuest: true)`);
}
```

---

## 🔒 Customer Privacy - SR Filtering

### List SRs Endpoint

**File:** `src/controllers/sr.controller.js`

```javascript
export const listSR = async (req, res, next) => {
  const userRole = req.user.role;
  const userId = req.user.id;

  const where = {};

  // Customers can only see their own SRs
  if (userRole === "CUSTOMER") {
    where.customerId = userId;
  }

  // ... rest of the code
};
```

**Key Points:**

- ✅ Customers can **ONLY** see SRs where `customerId` matches their user ID
- ✅ Admins, Dispatchers, Call Center can see all SRs
- ✅ Guest users **CANNOT** access the list endpoint (requires authentication)

---

## 🧪 Testing Examples

### 1. Create SR as Authenticated Customer

```bash
POST /api/srs
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "phone": "9999999999",
  "address": "123 Main St, New York",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "categoryId": 1,
  "subserviceId": 2,
  "serviceId": 3,
  "description": "AC not cooling properly",
  "priority": "HIGH"
}
```

**Response:**

```json
{
  "id": 1,
  "srNumber": "SR-1733057400000",
  "isGuest": false,
  "source": "CUSTOMER_APP",
  "customerId": 10,
  "createdById": 10,
  "customer": {
    "id": 10,
    "name": "Test Customer",
    "phone": "9999999999"
  }
}
```

### 2. Create SR as Guest

```bash
POST /api/srs
Content-Type: application/json

{
  "phone": "0987654321",
  "name": "Guest Customer",
  "email": "guest@example.com",
  "address": "456 Oak Ave, Brooklyn",
  "latitude": 40.6782,
  "longitude": -73.9442,
  "categoryId": 1,
  "subserviceId": 1,
  "description": "Plumbing issue"
}
```

**Response:**

```json
{
  "id": 2,
  "srNumber": "SR-1733057500000",
  "isGuest": true,
  "source": "WEB_PORTAL",
  "customerId": 15,
  "createdById": null,
  "customer": {
    "id": 15,
    "name": "Guest Customer",
    "phone": "0987654321"
  }
}
```

### 3. Get My SRs (Authenticated Customer Only)

```bash
GET /api/srs
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response:**

```json
[
  {
    "id": 1,
    "srNumber": "SR-1733057400000",
    "isGuest": false,
    "customer": {
      "id": 10,
      "name": "Test Customer",
      "phone": "9999999999"
    },
    "status": "PENDING_APPROVAL"
  }
]
```

**Notes:**

- ✅ Only returns SRs where `customerId` = authenticated user's ID
- ✅ Guest cannot access this endpoint

---

## 🔄 Guest to Registered User Upgrade

When a guest user registers with the same phone number:

1. System finds existing user with `passwordHash = ""`
2. OTP verification required
3. Password is set via `/api/auth/set-password`
4. User upgraded to registered user
5. Previous guest SRs remain associated with the account
6. `isGuest` flag stays as originally created (historical record)

**Example:**

```javascript
// Guest creates SR
POST /api/srs (no auth)
{
  "phone": "0987654321",
  "name": "Guest",
  ...
}
// Response: isGuest = true

// Later, guest registers
POST /api/otp/send { "phone": "0987654321", "type": "REGISTRATION" }
POST /api/otp/verify { "phone": "0987654321", "code": "123456", "type": "REGISTRATION" }
POST /api/auth/set-password { "phone": "0987654321", "password": "SecurePass123", "tempToken": "..." }

// Now user is registered, but old SR still shows isGuest = true (historical)
// New SRs will have isGuest = false
```

---

## 📊 Database Schema

### ServiceRequest Model

```prisma
model ServiceRequest {
  id           Int      @id @default(autoincrement())
  srNumber     String   @unique
  customerId   Int      // User ID (guest or authenticated)
  createdById  Int?     // Null for guest, userId for authenticated/call center
  isGuest      Boolean  // true = guest, false = authenticated
  source       String   // CUSTOMER_APP, WEB_PORTAL, CALL_CENTER
  // ... other fields
}
```

### User Model (Guest)

```prisma
model User {
  id           Int      @id @default(autoincrement())
  phone        String   @unique
  name         String?
  email        String?
  passwordHash String   // "" for guest, bcrypt hash for registered
  role         Role     // CUSTOMER
  // ... other fields
}
```

---

## ✅ Requirements Met

- ✅ 2.1 **isGuest correctly reflects authentication status**

  - Authenticated user → `isGuest: false`
  - Guest user → `isGuest: true`

- ✅ 2.2 **Proper authentication detection**

  - Uses `optionalAuth` middleware
  - Checks `req.user` existence

- ✅ 2.3 **Real customerId for authenticated users**

  - Uses `req.user.id` for authenticated customers
  - Sets `createdById` = `req.user.id`

- ✅ 2.4 **Guest SR stores temporary user ID**

  - Creates User record with empty passwordHash
  - Uses temporary user ID as customerId
  - Sets `createdById` = null

- ✅ 2.5 **Customer sees only their own SRs**
  - `listSR` filters by `customerId` for CUSTOMER role
  - Cannot see other customers' SRs

---

## 🔐 Security Considerations

1. **Guest User Limitations:**

   - Cannot access SR list endpoint
   - Cannot access profile endpoint
   - Cannot rebook or book again
   - Cannot receive notifications
   - Cannot login until password is set

2. **Authenticated User Privileges:**

   - Can see all their SRs (guest + authenticated)
   - Can rebook/book again
   - Can receive notifications
   - Can update profile

3. **Privacy:**
   - Customers cannot see other customers' SRs
   - Call center/admin/dispatcher can see all SRs for support

---

## 🧪 Postman Testing

Use `POSTMAN_LOCATION_TESTING.json`:

1. **"Create SR - Authenticated Customer"**

   - Includes Bearer token
   - Verifies `isGuest = false`

2. **"Create SR - Guest (No Auth)"**

   - No Authorization header
   - Verifies `isGuest = true`

3. **"Get My Service Requests"**
   - Requires authentication
   - Verifies only own SRs returned

---

## 📝 Logs

Server logs differentiate between guest and authenticated:

```bash
✅ Authenticated customer 9999999999 creating SR (isGuest: false)
```

```bash
👤 Created guest user: 0987654321
🌐 Guest user 0987654321 creating SR (isGuest: true)
```

---

## 🆘 Troubleshooting

### Issue: isGuest always true

**Solution:** Ensure Authorization header is included with valid Bearer token

### Issue: Cannot see my SRs

**Solution:** Ensure you're logged in as CUSTOMER role

### Issue: Guest user cannot register

**Solution:** Follow OTP verification flow before setting password

### Issue: Old SRs still show isGuest = true after registration

**Solution:** This is expected - isGuest is historical. New SRs will be false.

---

## 📚 Related Documentation

- `AUTHENTICATION_FLOW.md` - OTP and password setup
- `API_DOCUMENTATION.md` - All endpoints
- `POSTMAN_LOCATION_TESTING.json` - Test collection
