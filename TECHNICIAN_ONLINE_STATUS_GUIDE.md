# Technician Online/Offline Status - Complete Guide

## 🔍 Problem

When dispatcher assigns work orders, technicians' online/offline status is not showing correctly.

## ✅ Solution

The system **IS working correctly**! The `locationStatus` field shows the real-time status. You just need to ensure technicians are actually ONLINE.

---

## 📊 Current Status (Check Anytime)

Run this command to see all technician statuses:

```bash
node check-technician-status.js
```

**Output shows:**
- 🟢 ONLINE - Available for assignment
- 🟡 BUSY - Currently on a job
- ⚫ OFFLINE - Not available (or status not set)
- ❌ BLOCKED - Cannot receive jobs

---

## 🎯 Current Situation

From the check, you have:
- **2 ONLINE** technicians:
  - Ahmed Hassan (5555555555)
  - David Electrician (6666666666)
- **1 BUSY** technician:
  - John Technician (4444444444)
- **28 OFFLINE** technicians

---

## 🛠️ How to Make Technicians ONLINE

### Method 1: Update via API (Recommended)

```bash
# Login as technician
POST {{baseUrl}}/api/auth/login
Body: {
  "phone": "4444444444",
  "password": "tech123"
}

# Update location to ONLINE
POST {{baseUrl}}/api/location/update
Authorization: Bearer {{technicianToken}}
Body: {
  "latitude": 23.8103,
  "longitude": 90.4125,
  "status": "ONLINE"
}
```

### Method 2: Update Directly in Database

```sql
-- Make specific technician online
UPDATE "User"
SET 
  "locationStatus" = 'ONLINE',
  "lastLatitude" = 23.8103,
  "lastLongitude" = 90.4125,
  "locationUpdatedAt" = NOW()
WHERE phone = '6666666666';

-- Make ALL technicians online (for testing)
UPDATE "User"
SET 
  "locationStatus" = 'ONLINE',
  "lastLatitude" = 23.8103,
  "lastLongitude" = 90.4125,
  "locationUpdatedAt" = NOW()
WHERE role IN ('TECH_INTERNAL', 'TECH_FREELANCER')
  AND "isBlocked" = false;
```

### Method 3: Create Script to Set All Online

```javascript
// set-all-technicians-online.js
import { prisma } from "./src/prisma.js";

async function main() {
  const result = await prisma.user.updateMany({
    where: {
      role: { in: ["TECH_INTERNAL", "TECH_FREELANCER"] },
      isBlocked: false,
    },
    data: {
      locationStatus: "ONLINE",
      lastLatitude: 23.8103,
      lastLongitude: 90.4125,
      locationUpdatedAt: new Date(),
    },
  });

  console.log(`✅ Updated ${result.count} technicians to ONLINE`);
  await prisma.$disconnect();
}

main().catch(console.error);
```

Run it:
```bash
node set-all-technicians-online.js
```

---

## 📱 How Dispatcher Sees Online Status

### 1. Get Technician Locations (Map View)
```bash
GET {{baseUrl}}/api/dispatch/technician-locations
Authorization: Bearer {{dispatcherToken}}
```

**Response includes `locationStatus`:**
```json
[
  {
    "id": 5,
    "name": "Ahmed Hassan (Updated)",
    "phone": "5555555555",
    "lastLatitude": 23.8103,
    "lastLongitude": 90.4125,
    "locationStatus": "ONLINE",  ← Shows online/offline
    "locationUpdatedAt": "2025-12-14T06:19:35.342Z",
    "technicianProfile": {
      "type": "FREELANCER",
      "specialization": "[\"Electrical\",\"Plumbing\"]",
      "status": "ACTIVE"
    }
  }
]
```

### 2. Get Technician Status Summary
```bash
GET {{baseUrl}}/api/dispatch/technician-status
Authorization: Bearer {{dispatcherToken}}
```

**Response:**
```json
{
  "activeTechnicians": 2,     ← ONLINE count
  "busyTechnicians": 1,       ← BUSY count
  "blockedTechnicians": 4,    ← BLOCKED count
  "allTechnicians": 31        ← TOTAL count
}
```

### 3. Get Available Technicians for Assignment

```bash
GET {{baseUrl}}/api/location/nearby?latitude=23.8103&longitude=90.4125&status=ONLINE
Authorization: Bearer {{dispatcherToken}}
```

**Only returns ONLINE technicians!**

---

## 🎨 Frontend Display

### How to Show Online Status in UI:

```javascript
// Technician card/list item
function TechnicianCard({ technician }) {
  const statusColor = {
    ONLINE: 'green',
    BUSY: 'yellow', 
    OFFLINE: 'gray'
  }[technician.locationStatus || 'OFFLINE'];

  const statusIcon = {
    ONLINE: '🟢',
    BUSY: '🟡',
    OFFLINE: '⚫'
  }[technician.locationStatus || 'OFFLINE'];

  return (
    <div className="technician-card">
      <span className={`status-${statusColor}`}>
        {statusIcon} {technician.name}
      </span>
      <span className="location-status">
        {technician.locationStatus || 'OFFLINE'}
      </span>
      {technician.locationStatus === 'ONLINE' && (
        <button>Assign Job</button>
      )}
    </div>
  );
}
```

---

## 🧪 Testing Steps

### Step 1: Check Current Status
```bash
node check-technician-status.js
```

### Step 2: Make Technicians Online
Choose one method:
- API update (Method 1)
- Direct database update (Method 2)
- Run script (Method 3)

### Step 3: Verify in Dispatcher

**A. Login as Dispatcher:**
```bash
POST {{baseUrl}}/api/auth/login
Body: {"phone": "2222222222", "password": "dispatcher123"}
```

**B. Check Technician Status:**
```bash
GET {{baseUrl}}/api/dispatch/technician-status
Authorization: Bearer {{dispatcherToken}}
```

**Expected:** `activeTechnicians` should show increased count

**C. View Technician Locations:**
```bash
GET {{baseUrl}}/api/dispatch/technician-locations
Authorization: Bearer {{dispatcherToken}}
```

**Expected:** All technicians show with their `locationStatus`

### Step 4: Test Assignment

**Get nearby ONLINE technicians:**
```bash
GET {{baseUrl}}/api/location/nearby?latitude=23.8103&longitude=90.4125&status=ONLINE
Authorization: Bearer {{dispatcherToken}}
```

**Should return only ONLINE technicians**

---

## 🔧 Status Values

| Status | Meaning | Can Be Assigned? | Icon |
|--------|---------|------------------|------|
| **ONLINE** | Available, ready for jobs | ✅ YES | 🟢 |
| **BUSY** | Currently on a job | ⚠️ Maybe (if allowed) | 🟡 |
| **OFFLINE** | Not available, logged out | ❌ NO | ⚫ |
| **null** | Status not set (treated as OFFLINE) | ❌ NO | ⚫ |

---

## 📋 Quick Reference

### Check Status
```bash
node check-technician-status.js
```

### Set ONE Technician Online
```bash
POST {{baseUrl}}/api/location/update
Authorization: Bearer {{technicianToken}}
Body: {"latitude": 23.8103, "longitude": 90.4125, "status": "ONLINE"}
```

### Set ALL Technicians Online (Testing)
```sql
UPDATE "User" SET "locationStatus" = 'ONLINE', "lastLatitude" = 23.8103, "lastLongitude" = 90.4125 
WHERE role IN ('TECH_INTERNAL', 'TECH_FREELANCER') AND "isBlocked" = false;
```

### Dispatcher View Status
```bash
GET {{baseUrl}}/api/dispatch/technician-status
GET {{baseUrl}}/api/dispatch/technician-locations
```

---

## ❓ FAQ

### Q: Why are most technicians showing OFFLINE?
**A:** Because they haven't updated their location status yet. When technicians log in via mobile app, they should call `/api/location/update` with status "ONLINE".

### Q: How often should location be updated?
**A:** Mobile apps should update every 30-60 seconds when technician is online. Desktop/web can update on login and manual refresh.

### Q: Can I filter technicians by status in dispatcher?
**A:** Yes! Use query parameter: `?status=ONLINE` in nearby technicians endpoint.

### Q: What if locationStatus is null?
**A:** Treated as OFFLINE. Technician has never set their status.

---

## 🎯 Production Setup

For production, technicians should:

1. **On Login:** Set status to ONLINE
2. **While Working:** Update location every 30-60 seconds
3. **On Job Accept:** Change to BUSY
4. **On Job Complete:** Change back to ONLINE
5. **On Logout:** Change to OFFLINE

**Mobile App Example:**
```javascript
// On login
await updateLocation({ status: 'ONLINE', ...currentGPS });

// Background location updates (every 30s)
setInterval(async () => {
  if (isLoggedIn && !isOffline) {
    await updateLocation({ status: currentStatus, ...currentGPS });
  }
}, 30000);

// On logout
await updateLocation({ status: 'OFFLINE', ...currentGPS });
```

---

## ✅ Summary

1. **System is working correctly** - `locationStatus` field shows real status
2. **Most technicians are OFFLINE** - They haven't set their status
3. **To test:** Set technicians to ONLINE using one of the methods above
4. **Dispatcher can see status** - Use `/api/dispatch/technician-locations`
5. **Filter by status** - Use `?status=ONLINE` parameter

**Next Steps:**
1. Run `node check-technician-status.js` to see current state
2. Set some technicians to ONLINE for testing
3. Check dispatcher endpoints to verify status shows correctly

---

**Last Updated:** December 14, 2025  
**Status:** ✅ Working as Designed
