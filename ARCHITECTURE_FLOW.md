<!-- @format -->

# FSM System - Complete Architecture & Flow Documentation

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│  (Mobile App / Web Interface / Postman / External Services)     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY (Express)                       │
│                      src/app.js + server.js                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     MIDDLEWARE LAYER                             │
│  ├─ CORS Handler                                                 │
│  ├─ Body Parser (JSON/URL-encoded)                              │
│  ├─ File Upload (Multer)                                        │
│  ├─ Authentication (JWT Verification) - middleware/auth.js      │
│  ├─ Role-Based Authorization                                    │
│  └─ Error Handler - middleware/errorHandler.js                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                       ROUTING LAYER                              │
│  ├─ /api/auth           → auth.routes.js                        │
│  ├─ /api/categories     → category.routes.js                    │
│  ├─ /api/sr             → sr.routes.js                          │
│  ├─ /api/wos            → wo.routes.js                          │
│  ├─ /api/commissions    → commission.routes.js                  │
│  ├─ /api/payments       → payment.routes.js                     │
│  ├─ /api/notifications  → notification.routes.js                │
│  ├─ /api/location       → location.routes.js                    │
│  ├─ /api/reports        → report.routes.js                      │
│  ├─ /api/admin          → admin.routes.js                       │
│  └─ /api/otp            → otp.routes.js                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CONTROLLER LAYER                              │
│  Business Logic & Request Handling                              │
│  ├─ auth.controller.js      - Login, Register, Refresh          │
│  ├─ category.controller.js  - Categories, Services, Subservices │
│  ├─ sr.controller.js         - Service Requests (CRUD)          │
│  ├─ wo.controller.js         - Work Orders Management           │
│  ├─ commission.controller.js - Commission & Wallet Management   │
│  ├─ payment.controller.js    - Payment Processing               │
│  ├─ notification.controller.js - Push Notifications             │
│  ├─ location.controller.js   - GPS Tracking                     │
│  ├─ report.controller.js     - Reports & Analytics              │
│  ├─ admin.controller.js      - Admin Operations                 │
│  └─ otp.controller.js        - OTP Verification                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                               │
│  Core Business Logic & Data Processing                          │
│  ├─ auth.service.js         - JWT, Password Hashing             │
│  ├─ category.service.js     - Category Operations               │
│  ├─ sr.service.js           - SR Business Logic                 │
│  ├─ wo.service.js           - WO Lifecycle Management           │
│  ├─ commission.service.js   - Commission Calculation            │
│  ├─ payment.service.js      - Payment Processing                │
│  ├─ notification.service.js - FCM Integration                   │
│  ├─ location.service.js     - Geolocation Processing            │
│  ├─ report.service.js       - Data Aggregation                  │
│  ├─ admin.service.js        - User Management                   │
│  └─ otp.service.js          - OTP Generation/Validation         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   DATABASE ACCESS LAYER                          │
│                  Prisma ORM (v6.19.0)                            │
│                  src/prisma.js                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PostgreSQL DATABASE                           │
│  ├─ Users (6 Roles)                                              │
│  ├─ Categories, Services, SubServices                           │
│  ├─ ServiceRequests                                             │
│  ├─ WorkOrders                                                  │
│  ├─ Commissions & Wallets                                       │
│  ├─ Payments                                                    │
│  ├─ Notifications                                               │
│  └─ Locations                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication Flow

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ POST /api/auth/login
       │ { email, password }
       ▼
┌──────────────────────┐
│  auth.controller.js  │
│  - validateInput()   │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  auth.service.js     │
│  - findUser()        │
│  - bcrypt.compare()  │
│  - generateTokens()  │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│   utils/jwt.js       │
│  - signAccessToken() │
│  - signRefreshToken()│
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Response:           │
│  - accessToken       │
│  - refreshToken      │
│  - user (id, role)   │
└──────────────────────┘

Subsequent Requests:
┌─────────────┐
│   Client    │
│ Header:     │
│ Authorization: Bearer <accessToken>
└──────┬──────┘
       │
       ▼
┌──────────────────────┐
│ middleware/auth.js   │
│ - verifyToken()      │
│ - extractUser()      │
│ - attachToReq()      │
└──────┬───────────────┘
       │
       ▼ req.user = { userId, role }
┌──────────────────────┐
│   Controller         │
└──────────────────────┘
```

---

## 🛠️ Service Request (SR) Complete Flow

```
1. CREATE SERVICE REQUEST
┌─────────────┐
│  Customer   │
└──────┬──────┘
       │ POST /api/sr
       │ {
       │   categoryId,
       │   subServiceId,
       │   description,
       │   address,
       │   scheduledAt,
       │   images: [File]
       │ }
       ▼
┌──────────────────────────┐
│  authenticate Middleware │ ✓ Customer role
└──────┬───────────────────┘
       ▼
┌──────────────────────────┐
│  sr.controller.js        │
│  - createSR()            │
│  - validate input        │
│  - upload images         │
└──────┬───────────────────┘
       ▼
┌──────────────────────────┐
│  sr.service.js           │
│  - generate srNumber     │
│  - save images to disk   │
│  - create SR record      │
│  - status: NEW           │
└──────┬───────────────────┘
       ▼
┌──────────────────────────┐
│  notification.service.js │
│  - notify dispatchers    │
│  - notify call center    │
└──────┬───────────────────┘
       ▼
┌──────────────────────────┐
│  Response: SR created    │
│  srNumber: SR-1763614968506
└──────────────────────────┘


2. ASSIGN WORK ORDER
┌─────────────┐
│ Dispatcher  │
└──────┬──────┘
       │ POST /api/wos/from-sr/:srId
       │ {
       │   technicianId,
       │   scheduledDate,
       │   priority
       │ }
       ▼
┌──────────────────────────┐
│  authenticate Middleware │ ✓ Dispatcher/CallCenter
└──────┬───────────────────┘
       ▼
┌──────────────────────────┐
│  wo.controller.js        │
│  - createWOFromSR()      │
│  - validate tech exists  │
└──────┬───────────────────┘
       ▼
┌──────────────────────────┐
│  wo.service.js           │
│  - check SR status       │
│  - generate woNumber     │
│  - create WO (ASSIGNED)  │
│  - update SR → ASSIGNED  │
│  - link SR to WO         │
└──────┬───────────────────┘
       ▼
┌──────────────────────────┐
│  notification.service.js │
│  - notify technician     │
│  - notify customer       │
└──────┬───────────────────┘
       ▼
┌──────────────────────────┐
│  Response: WO created    │
│  woNumber: WO-1763614968789
└──────────────────────────┘


3. TECHNICIAN UPDATES WO STATUS
┌─────────────┐
│ Technician  │
└──────┬──────┘
       │ PUT /api/wos/:woId/status
       │ {
       │   status: "IN_PROGRESS" | "COMPLETED"
       │   notes: "...",
       │   completionImages: [File]
       │ }
       ▼
┌──────────────────────────┐
│  authenticate Middleware │ ✓ Tech role
└──────┬───────────────────┘
       ▼
┌──────────────────────────┐
│  wo.controller.js        │
│  - updateWOStatus()      │
│  - verify ownership      │
└──────┬───────────────────┘
       ▼
┌──────────────────────────┐
│  wo.service.js           │
│  - update WO status      │
│  - save images           │
│  - update SR status      │
│  - if COMPLETED:         │
│    - calculate cost      │
│    - trigger commission  │
└──────┬───────────────────┘
       ▼
┌──────────────────────────┐
│  commission.service.js   │
│  - calculate commission  │
│  - create Commission rec │
│  - status: EARNED        │
└──────┬───────────────────┘
       ▼
┌──────────────────────────┐
│  notification.service.js │
│  - notify customer       │
│  - notify dispatcher     │
└──────────────────────────┘
```

---

## 💰 Commission & Payment Flow

```
1. COMMISSION CALCULATION (Auto-triggered on WO completion)
┌──────────────────────────┐
│  wo.service.js           │
│  WO marked COMPLETED     │
└──────┬───────────────────┘
       ▼
┌──────────────────────────┐
│  commission.service.js   │
│  - get tech type         │
│  - calculate:            │
│    INTERNAL: 0%          │
│    FREELANCER: 15%       │
│  - create Commission     │
│    status: EARNED        │
└──────┬───────────────────┘
       ▼
┌──────────────────────────┐
│  wallet.service.js       │
│  - update wallet balance │
│  - create transaction    │
└──────────────────────────┘


2. PAYMENT PROCESSING
┌─────────────┐
│  Customer   │
└──────┬──────┘
       │ POST /api/payments
       │ {
       │   woId,
       │   amount,
       │   method: "CARD" | "CASH"
       │ }
       ▼
┌──────────────────────────┐
│  payment.controller.js   │
│  - createPayment()       │
│  - verify WO completed   │
└──────┬───────────────────┘
       ▼
┌──────────────────────────┐
│  payment.service.js      │
│  - create payment record │
│  - update WO isPaid      │
│  - update SR isPaid      │
│  - update Commission     │
│    status: PAID          │
└──────┬───────────────────┘
       ▼
┌──────────────────────────┐
│  commission.service.js   │
│  - mark commission PAID  │
│  - finalize wallet       │
└──────┬───────────────────┘
       ▼
┌──────────────────────────┐
│  notification.service.js │
│  - notify tech of payment│
└──────────────────────────┘


3. WALLET BALANCE CHECK
┌─────────────┐
│ Technician  │
└──────┬──────┘
       │ GET /api/commissions/wallet
       ▼
┌──────────────────────────┐
│  authenticate Middleware │ ✓ Tech role
└──────┬───────────────────┘
       ▼
┌──────────────────────────┐
│  commission.controller.js│
│  - getWalletBalance()    │
└──────┬───────────────────┘
       ▼
┌──────────────────────────┐
│  commission.service.js   │
│  - find/create wallet    │
│  - get recent txns       │
│  - validate balance      │
└──────┬───────────────────┘
       ▼
┌──────────────────────────┐
│  Response:               │
│  {                       │
│    id, userId, balance,  │
│    recentTransactions,   │
│    hasNegativeBalance    │
│  }                       │
└──────────────────────────┘
```

---

## 📍 Location Tracking Flow

```
┌─────────────┐
│ Technician  │
│ (Mobile App)│
└──────┬──────┘
       │ POST /api/location/update
       │ {
       │   latitude: 23.8103,
       │   longitude: 90.4125
       │ }
       │ (Every 5-10 minutes while active)
       ▼
┌──────────────────────────┐
│  authenticate Middleware │ ✓ Tech role
└──────┬───────────────────┘
       ▼
┌──────────────────────────┐
│  location.controller.js  │
│  - updateLocation()      │
│  - validate coords       │
└──────┬───────────────────┘
       ▼
┌──────────────────────────┐
│  location.service.js     │
│  - upsert location       │
│  - update timestamp      │
│  - save coordinates      │
└──────┬───────────────────┘
       ▼
┌──────────────────────────┐
│  Database                │
│  Location table updated  │
└──────────────────────────┘

GET TECHNICIAN LOCATION (Dispatcher/Customer)
┌─────────────┐
│ Dispatcher  │
└──────┬──────┘
       │ GET /api/location/:userId
       ▼
┌──────────────────────────┐
│  location.controller.js  │
│  - getTechnicianLocation()│
└──────┬───────────────────┘
       ▼
┌──────────────────────────┐
│  location.service.js     │
│  - fetch latest location │
│  - check freshness       │
│  - return coords         │
└──────┬───────────────────┘
       ▼
┌──────────────────────────┐
│  Response:               │
│  {                       │
│    latitude, longitude,  │
│    updatedAt             │
│  }                       │
└──────────────────────────┘
```

---

## 🔔 Notification Flow

```
PUSH NOTIFICATION TRIGGER
┌──────────────────────────┐
│  Any Service             │
│  (SR, WO, Commission)    │
└──────┬───────────────────┘
       │ Call notification.service.sendNotification()
       ▼
┌──────────────────────────┐
│  notification.service.js │
│  - get user FCM token    │
│  - create notification   │
│  - send via Firebase     │
└──────┬───────────────────┘
       ▼
┌──────────────────────────┐
│  Firebase Cloud          │
│  Messaging (FCM)         │
└──────┬───────────────────┘
       ▼
┌──────────────────────────┐
│  User's Mobile Device    │
│  Push notification shown │
└──────────────────────────┘

NOTIFICATION RETRIEVAL
┌─────────────┐
│    User     │
└──────┬──────┘
       │ GET /api/notifications
       ▼
┌──────────────────────────┐
│  notification.controller │
│  - getNotifications()    │
└──────┬───────────────────┘
       ▼
┌──────────────────────────┐
│  notification.service.js │
│  - fetch user's notifs   │
│  - filter by read/unread │
│  - sort by date          │
└──────┬───────────────────┘
       ▼
┌──────────────────────────┐
│  Response: List of       │
│  notifications with      │
│  title, body, data       │
└──────────────────────────┘
```

---

## 📊 Reporting Flow

```
ADMIN REPORT REQUEST
┌─────────────┐
│   Admin     │
└──────┬──────┘
       │ GET /api/reports/commissions
       │ ?startDate=2025-11-01
       │ &status=PAID
       ▼
┌──────────────────────────┐
│  authenticate Middleware │ ✓ Admin role
└──────┬───────────────────┘
       ▼
┌──────────────────────────┐
│  report.controller.js    │
│  - getCommissionReport() │
└──────┬───────────────────┘
       ▼
┌──────────────────────────┐
│  report.service.js       │
│  - query commissions     │
│  - aggregate data        │
│  - calculate totals      │
│  - group by tech/date    │
└──────┬───────────────────┘
       ▼
┌──────────────────────────┐
│  Response:               │
│  {                       │
│    totalCommissions,     │
│    totalAmount,          │
│    byTechnician: [...],  │
│    byDate: [...]         │
│  }                       │
└──────────────────────────┘
```

---

## 🗂️ File Structure Explanation

### Configuration & Setup

```
├── package.json              # Dependencies (Express, Prisma 6.19.0, JWT, bcrypt)
├── prisma/
│   ├── schema.prisma         # Database schema definition
│   └── migrations/           # Database migration history
├── src/
│   ├── server.js             # Entry point, starts Express server on port 4000
│   ├── app.js                # Express app setup, middleware, routes mounting
│   ├── prisma.js             # Prisma client singleton instance
│   └── config/
│       └── env.js            # Environment variables validation
```

### Middleware Layer

```
src/middleware/
├── auth.js                   # JWT verification, role extraction
└── errorHandler.js           # Global error handling, logging
```

### Routing Layer

```
src/routes/
├── auth.routes.js            # POST /login, /register, /refresh
├── category.routes.js        # CRUD for categories/services/subservices
├── sr.routes.js              # CRUD for service requests
├── wo.routes.js              # CRUD for work orders
├── commission.routes.js      # GET wallet, commissions
├── payment.routes.js         # POST payment processing
├── notification.routes.js    # GET notifications, mark as read
├── location.routes.js        # POST update, GET location
├── report.routes.js          # GET various reports (admin only)
├── admin.routes.js           # User management, system settings
└── otp.routes.js             # POST send OTP, verify OTP
```

### Controller Layer (Request Handlers)

```
src/controllers/
├── auth.controller.js        # Login, register, token refresh
├── category.controller.js    # Categories CRUD
├── sr.controller.js          # SR creation, retrieval, updates
├── wo.controller.js          # WO lifecycle management
├── commission.controller.js  # Wallet & commission queries
├── payment.controller.js     # Payment creation, verification
├── notification.controller.js# Notification CRUD
├── location.controller.js    # Location updates, queries
├── report.controller.js      # Report generation
├── admin.controller.js       # Admin operations
└── otp.controller.js         # OTP send/verify
```

### Service Layer (Business Logic)

```
src/services/
├── auth.service.js           # Password hashing, JWT generation
├── category.service.js       # Category business rules
├── sr.service.js             # SR number generation, validation
├── wo.service.js             # WO assignment, status transitions
├── commission.service.js     # Commission calculation (15% for freelancers)
├── payment.service.js        # Payment processing, commission updates
├── notification.service.js   # FCM integration, notification creation
├── location.service.js       # Coordinate validation, storage
├── report.service.js         # Data aggregation, statistics
├── admin.service.js          # User CRUD, role management
└── otp.service.js            # OTP generation (6-digit), validation
```

### Utilities

```
src/utils/
├── jwt.js                    # signAccessToken(), signRefreshToken(), verifyToken()
└── location.js               # Distance calculation, coordinate utilities
```

### Storage

```
uploads/                      # User-uploaded files (images, documents)
├── wo-completion/            # Work order completion images
└── [hashed filenames]        # SR images, category images
```

---

## 🎭 User Roles & Permissions

```
CUSTOMER
├── Can create service requests
├── Can view own SRs and WOs
├── Can make payments
├── Can view notifications
└── Cannot access admin/reports

TECH_INTERNAL (Company Employee)
├── Can view assigned work orders
├── Can update WO status
├── Can upload location
├── 0% commission rate
└── Cannot assign work orders

TECH_FREELANCER (External Contractor)
├── Same as TECH_INTERNAL
├── 15% commission rate
└── Has wallet with balance tracking

DISPATCHER
├── Can view all SRs
├── Can create work orders from SRs
├── Can assign technicians
├── Can view location of all techs
└── Cannot modify payments

CALL_CENTER
├── Can view all SRs
├── Can create work orders
├── Can update SR status
└── Cannot view financial reports

ADMIN
├── Full system access
├── Can view all reports
├── Can manage users
├── Can configure categories
└── Can view all financial data
```

---

## 🔄 Database Schema Key Relationships

```
User (1) ─────< (M) ServiceRequest
User (1) ─────< (M) WorkOrder (as assignedTo)
User (1) ───── (1) Wallet
User (1) ─────< (M) Commission
User (1) ─────< (M) Notification
User (1) ───── (1) Location

ServiceRequest (1) ─────< (M) WorkOrder
WorkOrder (1) ───── (1) Payment
WorkOrder (1) ───── (1) Commission

Category (1) ─────< (M) Service
Service (1) ─────< (M) SubService
SubService (1) ─────< (M) ServiceRequest
```

---

## 🚀 API Endpoint Summary

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh access token

### Categories

- `GET /api/categories` - List all categories
- `POST /api/categories` - Create category (Admin)
- `POST /api/categories/services` - Create service (Admin)
- `POST /api/categories/subservices` - Create subservice (Admin)

### Service Requests

- `POST /api/sr` - Create SR (Customer)
- `GET /api/sr` - List SRs (filtered by role)
- `GET /api/sr/:id` - Get SR by ID
- `PUT /api/sr/:id/status` - Update SR status (Dispatcher/CallCenter)

### Work Orders

- `POST /api/wos/from-sr/:srId` - Create WO from SR (Dispatcher)
- `GET /api/wos` - List WOs (filtered by role)
- `GET /api/wos/:id` - Get WO details
- `PUT /api/wos/:id/status` - Update WO status (Tech)
- `POST /api/wos/:id/completion` - Mark WO complete with images (Tech)

### Commissions

- `GET /api/commissions/wallet` - Get wallet balance (Tech)
- `GET /api/commissions/my-commissions` - List own commissions (Tech)

### Payments

- `POST /api/payments` - Create payment (Customer)
- `GET /api/payments/:woId` - Get payment details

### Notifications

- `GET /api/notifications` - List notifications
- `PUT /api/notifications/:id/read` - Mark as read

### Location

- `POST /api/location/update` - Update GPS location (Tech)
- `GET /api/location/:userId` - Get tech location (Dispatcher)

### Reports

- `GET /api/reports/commissions` - Commission report (Admin)
- `GET /api/reports/work-orders` - WO statistics (Admin)

### Admin

- `GET /api/admin/users` - List all users (Admin)
- `PUT /api/admin/users/:id/role` - Change user role (Admin)

### OTP

- `POST /api/otp/send` - Send OTP to phone
- `POST /api/otp/verify` - Verify OTP code

---

## 🛡️ Security Measures

1. **JWT Authentication**

   - Access tokens expire in 15 minutes
   - Refresh tokens expire in 7 days
   - Tokens signed with secret from env

2. **Password Security**

   - Bcrypt hashing with salt rounds
   - Passwords never stored in plain text

3. **Role-Based Access Control**

   - Every protected route checks role
   - Middleware validates permissions

4. **File Upload Security**

   - Multer validates file types
   - Files stored with hashed names
   - Max file size limits enforced

5. **Input Validation**
   - All inputs validated before processing
   - SQL injection prevented by Prisma ORM
   - XSS protection via Express middleware

---

## 📦 Key Dependencies

- **Express**: Web framework
- **Prisma 6.19.0**: Database ORM (PostgreSQL)
- **jsonwebtoken**: JWT authentication
- **bcryptjs**: Password hashing
- **multer**: File upload handling
- **dotenv**: Environment configuration
- **firebase-admin**: Push notifications
- **nodemon**: Development auto-reload

---

## 🔧 Environment Variables Required

```env
DATABASE_URL=postgresql://user:password@localhost:5432/fsm_db
JWT_SECRET=your_secret_key
JWT_REFRESH_SECRET=your_refresh_secret
PORT=4000
NODE_ENV=development
FIREBASE_CREDENTIALS_PATH=./firebase-adminsdk.json
```

---

## 📝 Development Commands

```bash
# Install dependencies
npm install

# Run development server (auto-reload)
npm run dev

# Run production server
npm start

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Open Prisma Studio (DB GUI)
npx prisma studio

# Seed database
npm run seed
```

---

## 🎯 Future Enhancements

- [ ] Real-time updates via WebSockets
- [ ] Payment gateway integration (Stripe/Razorpay)
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Automated testing suite
- [ ] Docker containerization
- [ ] CI/CD pipeline

---

**Last Updated**: 2025-01-19  
**System Version**: 1.0.0  
**Prisma Version**: 6.19.0  
**Node Version**: 20.19.5
