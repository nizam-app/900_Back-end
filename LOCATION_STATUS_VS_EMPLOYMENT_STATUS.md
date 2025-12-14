<!-- @format -->

# Understanding `locationStatus` vs `status` - Complete Guide

## 📊 The Two Status Fields Explained

When you fetch nearby technicians, you see **TWO different status fields**:

```json
{
  "id": 5,
  "name": "Mike Freelancer",
  "phone": "5555555555",
  "role": "TECH_FREELANCER",
  "locationStatus": "ONLINE",      // ← Real-time GPS tracking status
  "technicianProfile": {
    "type": "FREELANCER",
    "status": "ACTIVE"              // ← Employment/account status
  }
}
```

---

## 🎯 1. `locationStatus` (GPS Tracking Status)

**Location:** `User.locationStatus` field  
**Type:** Real-time, changes frequently  
**Updated by:** Mobile app, every 30-60 seconds

### Values:
- **`"ONLINE"`** - Technician is available and GPS tracking is ON
- **`"BUSY"`** - Technician is currently on a job
- **`"OFFLINE"`** - Technician is not available (app closed, toggle OFF)
- **`null`** - Status never set (treated as OFFLINE)

### Purpose:
- Shows **current availability** for job assignment
- Used by dispatcher to find available technicians
- Updated in real-time as technician moves/works
- Controls whether technician appears in "nearby" searches

### When It Changes:
```javascript
// User opens mobile app and enables availability
locationStatus: "ONLINE"

// User accepts a work order
locationStatus: "BUSY"

// User completes work order
locationStatus: "ONLINE" (back to available)

// User logs out or disables availability
locationStatus: "OFFLINE"
```

---

## 👤 2. `status` (Employment Status)

**Location:** `TechnicianProfile.status` field  
**Type:** Semi-permanent, rarely changes  
**Updated by:** Admin/Dispatcher only

### Values:
- **`"ACTIVE"`** - Technician is employed and can work
- **`"INACTIVE"`** - Technician is suspended/terminated
- **`"ON_LEAVE"`** - Technician is on vacation/leave (optional)
- **`"TRAINING"`** - Technician in training period (optional)

### Purpose:
- Shows **employment/account status**
- Determines if technician can receive jobs at all
- Changed by admins through backend
- Part of HR/management system

### When It Changes:
```javascript
// New technician hired
status: "ACTIVE"

// Technician takes vacation
status: "ON_LEAVE"

// Technician fired or quits
status: "INACTIVE"

// Technician under review
status: "SUSPENDED"
```

---

## 🔄 How They Work Together

### Decision Matrix for Job Assignment:

| Employment Status | Location Status | Can Get Jobs? | Notes |
|------------------|-----------------|---------------|-------|
| `ACTIVE` | `ONLINE` | ✅ YES | Perfect - Ready to work |
| `ACTIVE` | `BUSY` | ⚠️ NO | On another job |
| `ACTIVE` | `OFFLINE` | ❌ NO | Not available right now |
| `ACTIVE` | `null` | ❌ NO | Never set location |
| `INACTIVE` | `ONLINE` | ❌ NO | Account disabled |
| `INACTIVE` | Any | ❌ NO | Cannot work at all |

### Logic:
```javascript
const canReceiveJob = 
  technicianProfile.status === "ACTIVE" &&  // Must be employed
  locationStatus === "ONLINE";              // Must be available now
```

---

## 🖥️ Frontend Implementation

### 1. Display Both Statuses

```jsx
function TechnicianCard({ technician }) {
  return (
    <div className="technician-card">
      <h3>{technician.name}</h3>
      
      {/* Employment Status Badge */}
      <div className="employment-status">
        <span className={`badge ${technician.technicianProfile.status.toLowerCase()}`}>
          {technician.technicianProfile.status}
        </span>
      </div>
      
      {/* Real-time Availability */}
      <div className="availability">
        <StatusIndicator status={technician.locationStatus} />
        <span>{getAvailabilityText(technician.locationStatus)}</span>
      </div>
      
      {/* Distance & ETA */}
      <p>{technician.distance.toFixed(2)} km away</p>
      <p>ETA: {technician.estimatedArrival}</p>
    </div>
  );
}

function StatusIndicator({ status }) {
  const colors = {
    ONLINE: "green",
    BUSY: "orange",
    OFFLINE: "gray",
    null: "gray"
  };
  
  return (
    <div 
      className="status-dot" 
      style={{ backgroundColor: colors[status] || "gray" }}
    />
  );
}

function getAvailabilityText(locationStatus) {
  switch(locationStatus) {
    case "ONLINE": return "Available Now";
    case "BUSY": return "On Another Job";
    case "OFFLINE": return "Offline";
    default: return "Status Unknown";
  }
}
```

### 2. Filter Technicians for Assignment

```jsx
function DispatcherAssignmentView({ technicians }) {
  // Filter: Only show ACTIVE + ONLINE technicians
  const availableTechnicians = technicians.filter(tech => 
    tech.technicianProfile.status === "ACTIVE" &&
    tech.locationStatus === "ONLINE"
  );
  
  // Separate categories for display
  const onlineReady = technicians.filter(tech => 
    tech.technicianProfile.status === "ACTIVE" && 
    tech.locationStatus === "ONLINE"
  );
  
  const busy = technicians.filter(tech => 
    tech.locationStatus === "BUSY"
  );
  
  const offline = technicians.filter(tech => 
    tech.technicianProfile.status === "ACTIVE" && 
    (tech.locationStatus === "OFFLINE" || !tech.locationStatus)
  );
  
  const inactive = technicians.filter(tech => 
    tech.technicianProfile.status !== "ACTIVE"
  );
  
  return (
    <div className="technician-list">
      <Section title="Available Now" technicians={onlineReady} color="green" />
      <Section title="On Jobs" technicians={busy} color="orange" />
      <Section title="Offline" technicians={offline} color="gray" />
      <Section title="Inactive" technicians={inactive} color="red" />
    </div>
  );
}
```

### 3. Color-Coded Status Display

```jsx
function StatusBadge({ locationStatus, employmentStatus }) {
  // Determine color based on both statuses
  let color = "gray";
  let text = "Unavailable";
  
  if (employmentStatus !== "ACTIVE") {
    color = "red";
    text = "Inactive Account";
  } else {
    switch(locationStatus) {
      case "ONLINE":
        color = "green";
        text = "Available";
        break;
      case "BUSY":
        color = "orange";
        text = "On Job";
        break;
      case "OFFLINE":
      default:
        color = "gray";
        text = "Offline";
    }
  }
  
  return (
    <span className={`status-badge bg-${color}`}>
      {text}
    </span>
  );
}
```

### 4. Dashboard Summary Stats

```jsx
function TechnicianDashboard({ technicians }) {
  const stats = {
    totalActive: technicians.filter(t => 
      t.technicianProfile.status === "ACTIVE"
    ).length,
    
    availableNow: technicians.filter(t => 
      t.technicianProfile.status === "ACTIVE" && 
      t.locationStatus === "ONLINE"
    ).length,
    
    onJobs: technicians.filter(t => 
      t.locationStatus === "BUSY"
    ).length,
    
    offline: technicians.filter(t => 
      t.technicianProfile.status === "ACTIVE" &&
      (t.locationStatus === "OFFLINE" || !t.locationStatus)
    ).length,
    
    inactive: technicians.filter(t => 
      t.technicianProfile.status !== "ACTIVE"
    ).length
  };
  
  return (
    <div className="dashboard">
      <StatCard title="Available" value={stats.availableNow} color="green" />
      <StatCard title="On Jobs" value={stats.onJobs} color="orange" />
      <StatCard title="Offline" value={stats.offline} color="gray" />
      <StatCard title="Inactive" value={stats.inactive} color="red" />
    </div>
  );
}
```

### 5. Real-time Map View

```jsx
function TechnicianMap({ technicians }) {
  return (
    <GoogleMap>
      {technicians.map(tech => {
        // Only show ACTIVE technicians on map
        if (tech.technicianProfile.status !== "ACTIVE") return null;
        
        // Color code markers by locationStatus
        const markerColor = 
          tech.locationStatus === "ONLINE" ? "green" :
          tech.locationStatus === "BUSY" ? "orange" :
          "gray";
        
        return (
          <Marker
            key={tech.id}
            position={{
              lat: tech.lastLatitude,
              lng: tech.lastLongitude
            }}
            icon={{
              url: `/markers/${markerColor}-pin.svg`
            }}
            title={`${tech.name} - ${tech.locationStatus || 'OFFLINE'}`}
          />
        );
      })}
    </GoogleMap>
  );
}
```

---

## 📱 Mobile App (Technician Side)

### Availability Toggle Implementation

```jsx
// Mobile app toggle for technicians
function AvailabilityToggle() {
  const [isAvailable, setIsAvailable] = useState(false);
  
  const handleToggle = async (value) => {
    try {
      // Get current location
      const location = await Location.getCurrentPositionAsync({});
      
      // Update locationStatus on server
      await fetch('/api/location/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          status: value ? 'ONLINE' : 'OFFLINE'  // ← Updates locationStatus
        })
      });
      
      setIsAvailable(value);
    } catch (error) {
      console.error('Failed to update availability:', error);
    }
  };
  
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Availability Status</Text>
      <Text style={styles.subtitle}>Accept new jobs</Text>
      <Switch
        value={isAvailable}
        onValueChange={handleToggle}
      />
    </View>
  );
}
```

**Note:** Mobile app toggle **ONLY** changes `locationStatus`, never touches `status` field!

---

## 🎨 UI/UX Best Practices

### 1. Always Show Both Statuses
```
✅ Good:
┌─────────────────────┐
│ John Technician     │
│ 🟢 Available        │ ← locationStatus
│ 📋 Active Employee  │ ← employmentStatus  
│ 2.5 km away         │
└─────────────────────┘

❌ Bad:
┌─────────────────────┐
│ John Technician     │
│ Active              │ ← Which status?
│ 2.5 km away         │
└─────────────────────┘
```

### 2. Clear Visual Hierarchy
- **locationStatus** = Large, prominent (affects job assignment NOW)
- **employmentStatus** = Small badge/label (background info)

### 3. Action Buttons Based on Status
```jsx
function ActionButtons({ tech }) {
  const canAssign = 
    tech.technicianProfile.status === "ACTIVE" &&
    tech.locationStatus === "ONLINE";
  
  return (
    <>
      <button 
        disabled={!canAssign}
        onClick={() => assignJob(tech.id)}
      >
        {canAssign ? "Assign Job" : "Unavailable"}
      </button>
      
      {tech.locationStatus === "BUSY" && (
        <span className="hint">Currently on another job</span>
      )}
      
      {tech.technicianProfile.status !== "ACTIVE" && (
        <span className="hint">Account inactive</span>
      )}
    </>
  );
}
```

---

## 🔍 API Response Structure

```json
{
  "count": 1,
  "searchRadius": 5,
  "searchLocation": {
    "latitude": 23.8103,
    "longitude": 90.4125
  },
  "technicians": [
    {
      "id": 5,
      "name": "Mike Freelancer",
      "phone": "5555555555",
      "role": "TECH_FREELANCER",
      
      // GPS Tracking Status (changes frequently)
      "locationStatus": "ONLINE",
      "locationUpdatedAt": "2025-12-14T09:16:55.566Z",
      "lastLatitude": 23.8103,
      "lastLongitude": 90.4125,
      
      // Employment Status (changes rarely)
      "technicianProfile": {
        "type": "FREELANCER",
        "status": "ACTIVE",
        "commissionRate": 0.4
      },
      
      // Calculated fields
      "distance": 0,
      "locationName": "Mohakhali, Dhaka",
      "estimatedArrival": "0 minutes",
      "coordinates": "23.8103, 90.4125",
      "lastSeen": "2025-12-14T09:16:55.566Z",
      "availability": "ONLINE"
    }
  ]
}
```

---

## 📋 Summary Cheat Sheet

| Field | Database | Updated By | Frequency | Purpose |
|-------|----------|------------|-----------|---------|
| `locationStatus` | `User.locationStatus` | Mobile app | Every 30-60s | Real-time availability |
| `status` | `TechnicianProfile.status` | Admin | Rarely | Employment status |

### Quick Logic:
```javascript
// Can assign job?
const assignable = 
  status === "ACTIVE" &&        // Is employed
  locationStatus === "ONLINE";  // Is available now

// Show on map?
const showOnMap = 
  status === "ACTIVE" &&        // Is employed
  lastLatitude && lastLongitude; // Has GPS data

// Show as "available"?
const available = 
  status === "ACTIVE" &&
  locationStatus === "ONLINE";
```

---

## 🎯 Common Mistakes to Avoid

❌ **Wrong:** Only checking `locationStatus`
```javascript
// Missing employment status check!
if (tech.locationStatus === "ONLINE") {
  assignJob(tech.id); // ← Might assign to INACTIVE technician!
}
```

✅ **Correct:** Check both statuses
```javascript
if (tech.technicianProfile.status === "ACTIVE" && 
    tech.locationStatus === "ONLINE") {
  assignJob(tech.id);
}
```

❌ **Wrong:** Showing inactive technicians as "available"
```javascript
// Only checking GPS status
{tech.locationStatus === "ONLINE" && <Badge>Available</Badge>}
```

✅ **Correct:** Check employment first
```javascript
{tech.technicianProfile.status === "ACTIVE" && 
 tech.locationStatus === "ONLINE" && 
 <Badge>Available</Badge>}
```

---

**Last Updated:** December 14, 2025  
**Status:** ✅ Complete Guide - Ready for Frontend Implementation
