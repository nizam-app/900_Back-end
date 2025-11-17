<!-- @format -->

# Field Service Management (FSM) System - Backend

A comprehensive Field Service Management solution for facility management (maintenance, HVAC, electrical, plumbing, cleaning, etc.). The system manages the complete workflow from Service Request → Work Order → Job Execution → Payment → Commission/Bonus → Reporting.

## 🎯 Features

### Core Functionality

- **Service Request Management**: Customer app, web portal, and call center interfaces
- **Work Order Lifecycle**: Complete workflow from creation to completion
- **Payment Processing**: Mobile money and cash payment verification
- **Commission & Bonus**: Automatic calculation and payout management
- **Real-time Notifications**: Push notifications for all key events
- **GPS Tracking**: Technician location tracking and check-in/check-out
- **Comprehensive Reporting**: Work orders, payments, commissions, technician performance
- **Audit Logging**: Full trail of all operations and financial transactions
- **Offline Support**: Mobile app sync capabilities

### User Roles

- **Customer**: Create service requests, track status
- **Call Center Agent**: Log customer requests
- **Dispatcher/Coordinator**: Convert SR to WO, assign technicians, monitor progress
- **Technician** (Internal & Freelancer): Execute jobs, upload proofs, manage earnings
- **Admin/Manager**: Full system oversight and management

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with OTP verification
- **File Upload**: Multer
- **Security**: Helmet, bcryptjs

## 📋 Prerequisites

- Node.js >= 18.x
- PostgreSQL >= 14.x
- npm or yarn

## 🚀 Installation

1. **Clone the repository**

   ```powershell
   git clone <repository-url>
   cd outside-Project-backend
   ```

2. **Install dependencies**

   ```powershell
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:

   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/fsm_db"
   JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
   NODE_ENV="development"
   PORT=3000
   ```

4. **Run database migrations**

   ```powershell
   npx prisma migrate dev --name init
   npx prisma generate
   ```

5. **Create uploads directory**

   ```powershell
   New-Item -ItemType Directory -Force -Path uploads
   ```

6. **Start the server**
   ```powershell
   npm run dev
   ```

The server will start on `http://localhost:3000`

## 📚 API Endpoints Overview

### Authentication & OTP

- `POST /api/otp/send` - Send OTP to phone
- `POST /api/otp/verify` - Verify OTP code
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with phone/password

### Service Requests

- `POST /api/sr` - Create service request (guest/customer)
- `GET /api/sr` - List service requests

### Work Orders

- `POST /api/wos/from-sr/:srId` - Convert SR to WO
- `PATCH /api/wos/:id/assign` - Assign technician
- `POST /api/wos/:id/respond` - Accept/decline WO
- `POST /api/wos/:id/start` - Start job (GPS check-in)
- `POST /api/wos/:id/complete` - Complete job

### Payments

- `POST /api/payments` - Upload payment proof
- `PATCH /api/payments/:id/verify` - Verify payment

### Commissions & Payouts

- `GET /api/commissions/my-commissions` - Get technician commissions
- `GET /api/commissions/dashboard` - Technician dashboard
- `POST /api/commissions/payout-request` - Request payout
- `GET /api/commissions/payout-requests` - List payout requests (admin)
- `PATCH /api/commissions/payout-requests/:id` - Approve/reject payout

### Categories & Services

- `GET /api/categories` - List all categories
- `POST /api/categories` - Create category (admin)
- `POST /api/categories/subservices` - Create subservice (admin)
- `POST /api/categories/services` - Create service (admin)

### Admin

- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/users` - List users
- `POST /api/admin/users` - Create user
- `PATCH /api/admin/users/:id/block` - Block/unblock technician
- `GET /api/admin/technician-locations` - Map view

### Reports

- `GET /api/reports/work-orders` - Work order report
- `GET /api/reports/commissions` - Commission report
- `GET /api/reports/payments` - Payment report
- `GET /api/reports/technician-performance` - Performance metrics
- `GET /api/reports/financial` - Financial summary

### Notifications

- `GET /api/notifications` - Get notifications
- `PATCH /api/notifications/:id/read` - Mark as read

### Location

- `POST /api/location/update` - Update technician location
- `GET /api/location/nearby` - Find nearby technicians

## 🗂️ Database Schema

### Main Models

- **User**: All system users with role-based access
- **TechnicianProfile**: Additional data for technicians
- **Category, Subservice, Service**: Service hierarchy
- **ServiceRequest**: Customer service requests
- **WorkOrder**: Assigned jobs with full lifecycle
- **Payment**: Payment records with verification
- **Commission**: Earnings tracking
- **Wallet**: Freelancer wallet management
- **Payout**: Commission payout records
- **Notification**: User notifications
- **AuditLog**: System audit trail
- **OTP**: OTP verification records

## 🔐 Security

- JWT-based authentication
- Role-based authorization
- Password hashing with bcryptjs
- Helmet.js security headers
- CORS protection
- Audit logging for critical operations

## 📊 Work Order Lifecycle

1. **SR Created** - Customer creates service request
2. **WO Created** - Dispatcher converts SR to WO
3. **Assigned** - Technician receives notification
4. **Accepted/Declined** - Technician responds
5. **In Progress** - Work started with GPS check-in
6. **Completed (Pending Payment)** - Job finished, awaiting payment
7. **Paid (Verified)** - Payment verified by admin
8. **Closed** - Commission/bonus automatically booked

## 💰 Commission & Bonus System

- **Freelancers**: Earn commission (configurable %, default 20%)
- **Internal Technicians**: Earn bonus (configurable %, default 5%)
- **Automatic Calculation**: Triggered after payment verification
- **Weekly Payout**: Configurable (default: every Monday)
- **On-Demand Payout**: Technicians can request early payout
- **Wallet System**: Freelancers have wallet for balance tracking
- **Duplicate Prevention**: System ensures one-time commission per WO

## 🔔 Notification Events

- New WO assigned
- WO accepted/declined
- WO completed
- Payment verified
- Commission paid
- Technician blocked
- Payout approved/rejected

## 📝 Acceptance Checklist

✅ Customer can create SR without registration  
✅ OTP-based login/registration  
✅ Call center can create SRs  
✅ Dispatcher can convert SR to WO  
✅ Technician receives push notifications  
✅ GPS check-in at job start  
✅ Job completion with photo upload  
✅ Payment verification workflow  
✅ Automatic commission booking  
✅ Weekly and on-demand payouts  
✅ Technician blocking with reason  
✅ Real-time map view  
✅ Comprehensive reporting  
✅ Full audit logging

## 🚀 Deployment

### Production Setup

```powershell
# Install dependencies
npm install --production

# Run migrations
npx prisma migrate deploy
npx prisma generate

# Start server
npm start
```

### Environment Variables (Production)

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="strong-random-secret-key"
NODE_ENV="production"
PORT=3000
```

## 🗺️ Roadmap

- [ ] SMS integration for OTP (Twilio, Africa's Talking)
- [ ] Push notification service (Firebase/OneSignal)
- [ ] PDF/Excel report export
- [ ] Automated weekly payout cron job
- [ ] WebSocket for real-time updates
- [ ] Advanced geospatial queries (PostGIS)
- [ ] Multi-language support
- [ ] Mobile app SDK

## 📄 License

MIT License

## 👥 Support

For support, please open an issue on GitHub.
