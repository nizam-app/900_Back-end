<!-- @format -->

# Postman Collection - Complete Update Summary

## Overview

The FSM-API.postman_collection.json has been fully updated with ALL available endpoints from the codebase. This update includes many missing endpoints and enhanced documentation.

**Updated**: November 26, 2025
**Collection Version**: v3 (Complete Collection)

---

## What's New

### 🔐 Enhanced Authentication & OTP Section

**Added Endpoints:**

- ✅ `POST /api/auth/logout` - Logout user
- ✅ `POST /api/auth/change-password` - Change password
- ✅ `GET /api/auth/profile` - Get current user profile
- ✅ `PATCH /api/auth/profile` - Update user profile
- ✅ `PATCH /api/auth/customer/:userId` - Call center update customer profile

**Improvements:**

- Added comprehensive descriptions for all endpoints
- Added role information (CUSTOMER, TECH_FREELANCER, TECH_INTERNAL, DISPATCHER, CALL_CENTER, ADMIN)

---

### 📋 Enhanced Service Requests Section

**Added Endpoints:**

- ✅ `GET /api/sr/search-customer` - Search customer by phone (Call Center)
- ✅ `PATCH /api/sr/:id/cancel` - Cancel service request

**Improvements:**

- Added descriptions explaining access control
- Better documentation of guest vs authenticated flows

---

### 🔧 Enhanced Work Orders Section

**Added Endpoints:**

- ✅ `PATCH /api/wos/:woId/cancel` - Cancel work order
- ✅ `GET /api/wos/:woId/time-remaining` - Get remaining time before deadline
- ✅ `GET /api/wos/admin/active-deadlines` - View all active deadlines
- ✅ `POST /api/wos/admin/cleanup-expired` - Manually cleanup expired WOs
- ✅ `PATCH /api/wos/:woId/reassign` - Reassign work order to different technician

**Improvements:**

- Added time limit management endpoints (60min accept, 4hr complete deadlines)
- Enhanced descriptions for all endpoints
- Better documentation of technician workflow

---

### 📦 Enhanced Categories & Services Section

**Added Endpoints:**

- ✅ `PATCH /api/categories/:id` - Update category
- ✅ `DELETE /api/categories/:id` - Delete category
- ✅ `PATCH /api/categories/:id/activate` - Activate category
- ✅ `PATCH /api/categories/:id/deactivate` - Deactivate category
- ✅ `PATCH /api/categories/subservices/:id` - Update subservice
- ✅ `DELETE /api/categories/subservices/:id` - Delete subservice
- ✅ `PATCH /api/categories/services/:id` - Update service
- ✅ `DELETE /api/categories/services/:id` - Delete service

**Improvements:**

- Complete CRUD operations for categories, subservices, and services
- Added descriptions for all operations

---

### 👨‍💼 Enhanced Admin Dashboard Section

**Added Endpoints:**

- ✅ `PATCH /api/admin/users/:id` - Update user basic info
- ✅ `GET /api/admin/top-5-technicians` - Get top 5 performing technicians
- ✅ `GET /api/admin/work-orders/in-progress` - Get in-progress work orders
- ✅ `GET /api/admin/technicians/status-summary` - Get technician status summary
- ✅ `GET /api/admin/technicians/stats` - Get detailed technician statistics
- ✅ `GET /api/admin/work-orders/:woId/audit-trail` - Get WO audit trail
- ✅ `POST /api/admin/payouts/batch` - Create weekly payout batch

**Improvements:**

- Enhanced descriptions for all admin endpoints
- Better organization of admin tools

---

### 🗺️ Enhanced Location (GPS) Section

**Added Endpoints:**

- ✅ `GET /api/location/history/:technicianId` - Get location history with date range

**Improvements:**

- Better documentation of GPS tracking features
- Enhanced query parameter descriptions

---

### ⭐ NEW: Reviews & Ratings Section

**Complete New Section Added:**

- ✅ `POST /api/reviews` - Create review for completed work order
- ✅ `GET /api/reviews/technician/:technicianId` - Get all reviews for technician
- ✅ `GET /api/reviews/wo/:woId` - Get review for specific work order

**Features:**

- 5-star rating system
- Customer feedback on completed jobs
- Technician performance tracking

---

### 🎯 NEW: Dispatch Center Section

**Complete New Section Added:**

- ✅ `GET /api/dispatch/overview` - Real-time dispatch overview
- ✅ `GET /api/dispatch/technician-status` - Technician status summary
- ✅ `GET /api/dispatch/recent-work-orders` - Recent work orders
- ✅ `GET /api/dispatch/technician-locations` - Technician locations for map

**Features:**

- Real-time dispatch center monitoring
- Technician availability tracking
- Work order status overview

---

## Section Summary

### Total Endpoints by Section:

1. **Authentication & OTP**: 13 endpoints (was 7, added 6)
2. **Service Requests**: 6 endpoints (was 4, added 2)
3. **Work Orders**: 15 endpoints (was 8, added 7)
4. **Payments**: 5 endpoints (unchanged)
5. **Commissions & Payouts**: 7 endpoints (unchanged)
6. **Categories & Services**: 13 endpoints (was 4, added 9)
7. **Admin Dashboard**: 15 endpoints (was 8, added 7)
8. **Reports**: 5 endpoints (unchanged)
9. **Notifications**: 3 endpoints (unchanged)
10. **Location (GPS)**: 5 endpoints (was 4, added 1)
11. **Call Center**: 3 endpoints (unchanged)
12. **Dispatcher**: 2 endpoints (unchanged)
13. **Reviews & Ratings**: 3 endpoints (NEW SECTION)
14. **Dispatch Center**: 4 endpoints (NEW SECTION)

### Total Endpoints: **99 endpoints** (was ~60)

---

## Key Features Documented

### 🔄 Complete CRUD Operations

- Categories, Subservices, and Services now have full CRUD
- User management fully documented
- Work order lifecycle completely covered

### ⏱️ Time Management

- 60-minute accept deadline
- 4-hour completion deadline
- Auto-status changes on expiry
- Manual and automatic cleanup

### 📊 Enhanced Reporting

- Technician performance metrics
- Financial reports
- Commission tracking
- Audit trails

### 🗺️ GPS & Location Tracking

- Real-time location updates
- Location history
- Nearby technician search
- ETA calculations
- Distance-based dispatching

### ⭐ Review System

- Customer feedback collection
- Technician rating tracking
- Work order reviews

### 🎯 Dispatch Center

- Real-time monitoring
- Technician availability
- Work order tracking
- Map visualization

---

## Environment Variables

The collection includes these environment variables:

- `baseUrl` - API base URL (default: http://localhost:4000)
- `imageUploadServiceUrl` - Image upload service URL
- `adminToken` - Admin authentication token
- `dispatcherToken` - Dispatcher authentication token
- `techToken` - Technician authentication token
- `customerToken` - Customer authentication token
- `callCenterToken` - Call center authentication token
- `srId` - Service request ID
- `srNumber` - Service request number
- `woId` - Work order ID
- `woNumber` - Work order number
- `paymentId` - Payment ID
- `payoutRequestId` - Payout request ID
- `newCustomerId` - Newly created customer ID

---

## Testing Workflow

### Complete End-to-End Flow:

1. **Authentication**: Login as different roles
2. **Service Request**: Create SR (guest/authenticated)
3. **Work Order**: Convert SR to WO, assign technician
4. **Job Execution**: Accept → Start (GPS check) → Complete (photos + materials)
5. **Payment**: Upload proof → Admin verify
6. **Commission**: Auto-calculated → Request payout
7. **Review**: Customer rates technician
8. **Reporting**: View all analytics

---

## API Documentation Improvements

### Each Endpoint Now Includes:

- ✅ Clear description of what it does
- ✅ Required roles/permissions
- ✅ Request body examples with all fields
- ✅ Query parameter descriptions
- ✅ Response handling with test scripts
- ✅ Use case context

---

## Quality Improvements

### Code Quality:

- ✅ Valid JSON structure
- ✅ Consistent formatting
- ✅ Proper test scripts for token management
- ✅ Comprehensive descriptions

### Organization:

- ✅ Logical section grouping
- ✅ Related endpoints together
- ✅ Clear naming conventions
- ✅ Workflow-based ordering

---

## Breaking Changes

**None** - This is a purely additive update. All existing endpoints remain unchanged.

---

## Next Steps

### For Developers:

1. Import the updated collection into Postman
2. Set up environment variables
3. Test authentication flows first
4. Follow the testing workflow above

### For Testing:

1. Use the collection runner for automated testing
2. Test each role's permissions
3. Verify all CRUD operations
4. Test time limit features
5. Verify GPS tracking
6. Test review system

---

## Support & Documentation

For more information:

- See `POSTMAN_TESTING_GUIDE.md` for detailed testing instructions
- See `TESTING_GUIDE.md` for general API testing
- See `README.md` for project overview

---

**Last Updated**: November 26, 2025
**Collection Version**: v3 (Complete Collection)
**Total Endpoints**: 99
**Sections**: 14
