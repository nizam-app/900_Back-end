<!-- @format -->

# Call Center "Forbidden" Error - Troubleshooting Guide

## ❌ Problem

All Call Center endpoints showing "Forbidden" (403 error) in Postman.

## ✅ Solution Steps

### Step 1: Login First (MOST IMPORTANT)

You **MUST** login before using any Call Center endpoints!

1. Open Postman collection
2. Navigate to **"Call Center"** folder
3. Click **"Login - Call Center"** endpoint
4. Click **Send** button
5. Check response - should show:
   ```json
   {
     "token": "eyJhbGc...",
     "user": {
       "role": "CALL_CENTER",
       ...
     }
   }
   ```

### Step 2: Verify Token is Saved

After successful login, the token should auto-save to `{{callCenterToken}}` variable.

**To verify:**

1. Click the "Eye" icon (👁️) in top right of Postman
2. Look for `callCenterToken` in environment variables
3. It should have a long JWT token value

**If token is NOT saved:**

1. Go to "Login - Call Center" endpoint
2. Click "Tests" tab
3. Make sure it has this script:
   ```javascript
   var jsonData = pm.response.json();
   pm.environment.set("callCenterToken", jsonData.token);
   ```
4. Re-send the login request

### Step 3: Check Environment

Make sure you're using the correct Postman environment:

1. Click environment dropdown (top right)
2. Select your environment (e.g., "FSM Dev" or "Local")
3. Verify `baseUrl` is set (e.g., `http://localhost:4000`)

### Step 4: Test Each Endpoint

#### A. Get Dashboard Stats

```
GET {{baseUrl}}/api/call-center/stats
Authorization: Bearer {{callCenterToken}}
```

**Expected:** 200 OK with statistics

#### B. Create Customer with GPS

```
POST {{baseUrl}}/api/callcenter/customers
Authorization: Bearer {{callCenterToken}}

Body:
{
  "name": "Test Customer",
  "phone": "12345678",
  "email": "test@example.com",
  "latitude": 23.8103,
  "longitude": 90.4125,
  "address": "Test Address"
}
```

**Expected:** 201 Created

#### C. Create SR for Customer

```
POST {{baseUrl}}/api/sr
Authorization: Bearer {{callCenterToken}}

Body:
{
  "name": "Customer Name",
  "phone": "12345678",
  "address": "Service Address",
  "categoryId": 1,
  "serviceId": 1,
  "description": "AC repair needed"
}
```

**Expected:** 201 Created

#### D. Get WO Technician Info

```
GET {{baseUrl}}/api/callcenter/wos/1/technician
Authorization: Bearer {{callCenterToken}}
```

**Expected:** 200 OK with technician details

---

## 🔍 Common Issues

### Issue 1: "Forbidden" Error

**Cause:** Not logged in or wrong token
**Solution:**

1. Send "Login - Call Center" request
2. Verify `callCenterToken` is saved
3. Try the endpoint again

### Issue 2: "Unauthorized" Error

**Cause:** Token is missing or invalid
**Solution:**

1. Check if Authorization header is present
2. Verify it's `Bearer {{callCenterToken}}`
3. Re-login if token expired (tokens valid for 7 days)

### Issue 3: Token Not Saving

**Cause:** Test script missing or environment not selected
**Solution:**

1. Select environment from dropdown
2. Check "Tests" tab in login endpoint
3. Manually copy token and set it in environment variables

### Issue 4: "Phone number must be exactly 8 digits"

**Cause:** Phone format is wrong
**Solution:** Use 8-digit format without country code or +

- ✅ Correct: `"12345678"`, `"98765432"`
- ❌ Wrong: `"+8801712345678"`, `"01712345678"`, `"8801712345678"`

---

## 🧪 Quick Test Script

Run this to verify everything works:

```bash
node test-callcenter-auth.js
```

**Expected output:**

```
✅ Login successful!
✅ Dashboard stats successful!
```

If you see errors, the backend may not be running:

```bash
npm run dev
```

---

## 📋 Credentials

**Call Center Login:**

- **Phone:** `3333333333`
- **Password:** `callcenter123`

**Other test users:**

- **Admin:** `1111111111` / `admin123`
- **Dispatcher:** `2222222222` / `dispatcher123`
- **Technician:** `4444444444` / `tech123`

---

## 🔐 Token Explanation

When you login, you get a JWT token that proves:

1. You are authenticated (valid user)
2. Your role is CALL_CENTER
3. Your user ID is 3

The token is sent in every request:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

The backend checks:

1. Is token valid? ✅ Yes → Continue
2. Does user have CALL_CENTER role? ✅ Yes → Allow access
3. If either is NO → Return "Forbidden" (403)

---

## ✅ Final Checklist

Before trying endpoints, make sure:

- [ ] Backend server is running (`npm run dev`)
- [ ] Database is seeded (`npm run seed`)
- [ ] Postman environment is selected
- [ ] "Login - Call Center" request sent successfully
- [ ] `callCenterToken` variable is set
- [ ] Authorization header uses `{{callCenterToken}}`

---

## 🎯 Summary

**The "Forbidden" error means you're not logged in!**

**Quick Fix:**

1. ✅ Send "Login - Call Center" request
2. ✅ Verify token is saved
3. ✅ Try the endpoint again
4. ✅ Should work now!

**Still not working?**

- Check if server is running: `http://localhost:4000`
- Check console for errors
- Run test script: `node test-callcenter-auth.js`
- Verify user exists: `node check-callcenter-user.js`

---

**Last Updated:** December 14, 2025  
**Status:** ✅ Tested and Working
