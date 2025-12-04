# How to Import Postman Collection

## 📦 File: FSM-API-FIXED-Dec4-2025.postman_collection.json

### Quick Import Steps

1. **Open Postman**
   - Launch Postman application

2. **Import Collection**
   - Click "Import" button (top left)
   - Drag & drop `FSM-API-FIXED-Dec4-2025.postman_collection.json`
   - Or click "Choose Files" and select the file

3. **Verify Import**
   - Collection name: "FSM System API - Complete Collection (Dec 4, 2025)"
   - Total sections: 15
   - Total endpoints: 112

4. **Set Environment Variables**
   - Create new environment (optional)
   - Add variable: `baseUrl` = `http://localhost:4000`
   - Add tokens as needed: `adminToken`, `techToken`, `employeeToken`

### 🎯 What's New in This Collection

#### 1. Service Hierarchy Fixed ✅
- `GET /api/categories` now returns correct order
- Category → Service → Subservice

#### 2. Profile Endpoints ✅
- Section: "Commissions & Payouts"
- `GET /api/commissions/my-payout-requests` - New endpoint
- `GET /api/technician/work-history` - New endpoint

#### 3. Employee Registration System ✅
- **NEW SECTION:** "Employee Registration (Internal Team)"
- 4 endpoints for internal tech registration
- Complete 3-step flow with OTP

### 📝 Testing the New Features

#### Test Employee Registration (Internal Team)
```
1. Navigate to: "Employee Registration (Internal Team)"
2. Run "Step 1: Initiate Registration"
   - Enter name, employeeId, phone
   - Get OTP code and tempToken
3. Run "Step 2: Verify OTP"
   - Enter phone and OTP code
   - Get verified tempToken
4. Run "Step 3: Complete Registration"
   - Enter phone, password, tempToken, name, employeeId
   - Get JWT token
   - Save token as {{employeeToken}}
```

#### Test Profile Endpoints
```
1. Login as technician (get {{techToken}})
2. Navigate to: "Commissions & Payouts"
3. Run "Get My Payout Requests"
   - Shows technician's own payout requests
4. Navigate to: "Commissions & Payouts"
5. Run "Technician Work History (NEW Dec 4)"
   - Shows complete work history with stats
```

### 🔑 Environment Variables

Create these in your Postman environment:

```
baseUrl: http://localhost:4000
adminToken: [Get from Login - Admin endpoint]
techToken: [Get from Login - Technician endpoint]
employeeToken: [Get from Employee Registration Step 3]
customerToken: [Get from Login - Customer endpoint]
```

### 📊 Collection Structure

```
FSM System API - Complete Collection (Dec 4, 2025)
├── 1. Authentication & OTP (13 endpoints)
│   ├── Send OTP (Step 1) - Freelancer Registration
│   ├── Verify OTP (Step 2) - Freelancer Registration
│   ├── Set Password (Step 3) - Freelancer Registration
│   └── ... [10 more]
│
├── 2. Employee Registration (Internal Team) (4 endpoints) ⭐ NEW
│   ├── Step 1: Initiate Registration
│   ├── Step 2: Verify OTP
│   ├── Step 3: Complete Registration
│   └── Resend OTP
│
├── 3. Service Requests (9 endpoints)
├── 4. Work Orders (14 endpoints)
├── 5. Payments (6 endpoints)
│
├── 6. Commissions & Payouts (13 endpoints)
│   ├── Get My Payout Requests ⭐ NEW
│   └── Technician Work History (NEW Dec 4) ⭐ NEW
│
├── 7. Categories & Services (12 endpoints)
├── 8. Admin Dashboard (15 endpoints)
├── 9. Reports (5 endpoints)
├── 10. Notifications (4 endpoints)
├── 11. Location (GPS) (5 endpoints)
├── 12. Call Center (3 endpoints)
├── 13. Dispatcher (2 endpoints)
├── 14. Reviews & Ratings (3 endpoints)
└── 15. Dispatch Center (4 endpoints)
```

### ✅ Verification Checklist

After importing, verify:
- [x] Total sections: 15
- [x] Total endpoints: 112
- [x] New section "Employee Registration (Internal Team)" visible
- [x] "Get My Payout Requests" endpoint in Commissions section
- [x] "Technician Work History" endpoint in Commissions section
- [x] Collection description shows Dec 4, 2025 updates

### 🚀 Quick Test

Run this sequence to verify everything works:

1. **Test Service Hierarchy:**
   - Categories & Services → Get All Categories
   - Verify: Category has services array
   - Verify: Each service has subservices array

2. **Test Employee Registration:**
   - Employee Registration → Step 1: Initiate Registration
   - Use OTP code from response
   - Employee Registration → Step 2: Verify OTP
   - Employee Registration → Step 3: Complete Registration
   - Save returned token

3. **Test Profile Endpoints:**
   - Use technician token from login
   - Commissions & Payouts → Get My Payout Requests
   - Commissions & Payouts → Technician Work History

### 📚 Additional Documentation

See these files for detailed information:
- `DECEMBER_4_2025_FIXES.md` - Complete fix summary
- `REGISTRATION_SYSTEMS_COMPARISON.md` - Freelancer vs Employee registration
- `TWO_REGISTRATION_SYSTEMS.md` - Quick reference guide
- `test-employee-registration.js` - Testing guide

### 🔧 Troubleshooting

**Issue: Endpoints return 401 Unauthorized**
- Solution: Make sure you have valid token in Authorization header
- Format: `Bearer {{tokenName}}`

**Issue: OTP not received**
- Solution: Check server logs for OTP code
- Dev mode shows OTP in console

**Issue: Employee ID validation fails**
- Solution: Use format EMP-YYYY-NNN (e.g., EMP-2025-001)

### 📞 Support

If you encounter issues:
1. Check server is running: `http://localhost:4000/health`
2. Review server logs for errors
3. Verify database migration applied: `npx prisma migrate status`
4. Check environment variables are set correctly

---

**File:** FSM-API-FIXED-Dec4-2025.postman_collection.json  
**Date:** December 4, 2025  
**Version:** v4  
**Status:** ✅ Production Ready
