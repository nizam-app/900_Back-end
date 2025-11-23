<!-- @format -->

# New Features API Documentation

## 📋 Implemented Features

### 1. Enhanced Service Request Creation

#### Create Service Request with GPS Coordinates

**Endpoint:** `POST /api/sr`

**New Fields:**

- `latitude` (optional): GPS latitude (-90 to 90)
- `longitude` (optional): GPS longitude (-180 to 180)

**Response Changes:**

- Now includes `srId` property (same as `id`)
- Explicitly includes `status` property

**Example Request:**

```json
{
  "name": "John Doe",
  "phone": "1234567890",
  "address": "123 Main St, Nairobi",
  "latitude": -1.286389,
  "longitude": 36.817223,
  "categoryId": 1,
  "subserviceId": 2,
  "serviceId": 3,
  "description": "AC not cooling properly",
  "paymentType": "CASH",
  "priority": "HIGH",
  "source": "CALL_CENTER"
}
```

**Example Response:**

```json
{
  "id": 123,
  "srId": 123,
  "srNumber": "SR-1732345678901",
  "status": "NEW",
  "latitude": -1.286389,
  "longitude": 36.817223,
  "address": "123 Main St, Nairobi",
  ...
}
```

---

### 2. Enhanced Work Order Creation

#### Convert SR to WO with Estimated Duration

**Endpoint:** `POST /api/wos/from-sr/:srId`

**New Fields:**

- `estimatedDuration` (optional): Estimated duration in minutes

**Behavior:**

- Automatically copies GPS coordinates from SR to WO
- Includes estimated duration for job planning

**Example Request:**

```json
{
  "technicianId": 6,
  "scheduledAt": "2025-11-24T09:00:00Z",
  "estimatedDuration": 120,
  "notes": "Customer prefers morning"
}
```

---

### 3. Call Center Features

#### Create New Customer

**Endpoint:** `POST /api/callcenter/customers`
**Auth:** CALL_CENTER, ADMIN only

**Purpose:** Create new customers with manually defined address and GPS coordinates

**Request Body:**

```json
{
  "name": "Jane Smith",
  "phone": "0712345678",
  "email": "jane@example.com",
  "password": "secure123",
  "address": "456 Market Street, Downtown",
  "latitude": -1.292066,
  "longitude": 36.821946
}
```

**Response:**

```json
{
  "id": 45,
  "name": "Jane Smith",
  "phone": "0712345678",
  "email": "jane@example.com",
  "homeAddress": "456 Market Street, Downtown",
  "latitude": -1.292066,
  "longitude": 36.821946,
  "role": "CUSTOMER",
  "createdAt": "2025-11-23T10:30:00.000Z"
}
```

---

#### Get Technician Info for Work Order

**Endpoint:** `GET /api/callcenter/wos/:woId/technician`
**Auth:** CALL_CENTER, ADMIN, DISPATCHER

**Purpose:** View which technician is assigned to a WO and their current location/status

**Response:**

```json
{
  "woNumber": "WO-1732345678902",
  "woId": 456,
  "status": "ASSIGNED",
  "address": "123 Main St, Nairobi",
  "category": "Air Conditioning",
  "assigned": true,
  "technician": {
    "id": 6,
    "name": "Michael Tech",
    "phone": "0700123456",
    "email": "michael@example.com",
    "type": "INTERNAL",
    "specialization": "AC Repair",
    "status": "ACTIVE",
    "locationStatus": "ONLINE",
    "lastLocationUpdate": "2025-11-23T10:25:00.000Z",
    "currentLocation": {
      "latitude": -1.29,
      "longitude": 36.82
    },
    "distanceFromJob": "2.35 km",
    "estimatedArrival": "5 minutes"
  },
  "customer": {
    "id": 45,
    "name": "Jane Smith",
    "phone": "0712345678",
    "homeAddress": "456 Market Street"
  }
}
```

---

### 4. Dispatcher Features

#### Get Nearby Technicians with Distance & Availability

**Endpoint:** `GET /api/dispatcher/technicians/nearby`
**Auth:** DISPATCHER, ADMIN only

**Query Parameters:**

- `latitude` (required): Job location latitude
- `longitude` (required): Job location longitude
- `categoryId` (optional): Filter by category/specialization
- `maxDistance` (optional): Maximum distance in km

**Purpose:**

- View all technicians with distance from job location
- See technician availability (AVAILABLE, BUSY, OFFLINE)
- View number of open jobs for each technician
- Help dispatcher efficiently assign work orders

**Example Request:**

```
GET /api/dispatcher/technicians/nearby?latitude=-1.286389&longitude=36.817223&categoryId=1
```

**Response:**

```json
{
  "total": 5,
  "jobLocation": {
    "latitude": -1.286389,
    "longitude": 36.817223
  },
  "technicians": [
    {
      "id": 6,
      "name": "Michael Tech",
      "phone": "0700123456",
      "email": "michael@example.com",
      "type": "INTERNAL",
      "specialization": "AC Repair",
      "status": "ACTIVE",
      "availability": "AVAILABLE",
      "locationStatus": "ONLINE",
      "lastLocationUpdate": "2025-11-23T10:25:00.000Z",
      "currentLocation": {
        "latitude": -1.29,
        "longitude": 36.82
      },
      "distance": 2.35,
      "distanceKm": "2.35 km",
      "estimatedTravelTime": "5 min",
      "openJobsCount": 0,
      "openJobs": [],
      "rates": {
        "commissionRate": 0.2,
        "bonusRate": 0.05,
        "baseSalary": 30000
      }
    },
    {
      "id": 7,
      "name": "John Freelancer",
      "phone": "0700234567",
      "type": "FREELANCER",
      "specialization": "AC Repair",
      "availability": "BUSY",
      "distance": 5.12,
      "distanceKm": "5.12 km",
      "estimatedTravelTime": "11 min",
      "openJobsCount": 2,
      "openJobs": [
        {
          "woNumber": "WO-1732345600000",
          "status": "IN_PROGRESS",
          "scheduledAt": "2025-11-23T09:00:00.000Z",
          "address": "789 East Road",
          "category": "Air Conditioning"
        }
      ],
      "rates": {
        "commissionRate": 0.2
      }
    }
  ]
}
```

**Features:**

- ✅ Sorted by distance (nearest first)
- ✅ Shows availability: AVAILABLE, BUSY, or OFFLINE
- ✅ Displays open jobs count and details
- ✅ Calculates distance and estimated travel time
- ✅ Can filter by specialization/category
- ✅ Dispatcher can assign to both busy and available technicians

---

#### Get Technician Workload

**Endpoint:** `GET /api/dispatcher/technicians/:id/workload`
**Auth:** DISPATCHER, ADMIN only

**Purpose:** View all open jobs assigned to a specific technician

**Response:**

```json
{
  "technician": {
    "id": 7,
    "name": "John Freelancer",
    "phone": "0700234567",
    "type": "FREELANCER",
    "specialization": "AC Repair",
    "status": "ACTIVE",
    "locationStatus": "ONLINE"
  },
  "summary": {
    "total": 3,
    "assigned": 1,
    "accepted": 1,
    "inProgress": 1
  },
  "jobs": [
    {
      "id": 101,
      "woNumber": "WO-1732345600000",
      "status": "IN_PROGRESS",
      "priority": "HIGH",
      "address": "789 East Road",
      "scheduledAt": "2025-11-23T09:00:00.000Z",
      "customer": {
        "name": "Alice Johnson",
        "phone": "0711111111"
      },
      "category": "Air Conditioning",
      "subservice": "AC Repair",
      "estimatedDuration": "120 min"
    }
  ]
}
```

---

## 🔧 Schema Changes

### Enhanced Fields

#### User Model

- `homeAddress` - Home address (primarily for technicians)
- `latitude`, `longitude` - GPS coordinates

#### TechnicianProfile Model

- `baseSalary` - Base salary for internal employees
- `specialization` - Job specialization (electrician, plumber, etc.)
- `academicTitle` - Academic qualifications
- `photoUrl` - Profile photo
- `idCardUrl` - ID/passport document
- `residencePermitUrl` - Residence permit (for foreigners)
- `residencePermitFrom`, `residencePermitTo` - Permit validity dates
- `degreesUrl` - Degrees/certificates

#### ServiceRequest & WorkOrder Models

- `latitude`, `longitude` - GPS coordinates
- `estimatedDuration` (WO only) - Estimated job duration in minutes

#### SystemConfig Model (New)

- Global configuration for commission rates and salaries
- Only admin can modify
- Auto-applied to new technicians

---

## 🔒 Role-Based Access Control

### CALL_CENTER Role

- ✅ Create new customers with GPS coordinates
- ✅ Create service requests
- ✅ View work order technician information
- ✅ View all service requests

### DISPATCHER Role

- ✅ View nearby technicians with distance
- ✅ View technician availability status
- ✅ View technician workload
- ✅ Assign work orders to any technician (busy or available)
- ❌ Cannot modify commission or salary rates

### ADMIN Role

- ✅ All CALL_CENTER and DISPATCHER permissions
- ✅ Modify global commission/salary configuration
- ✅ Override individual technician rates
- ✅ Access all reports and analytics

---

## 📊 Commission & Salary Management

### Global Configuration (Admin Only)

The system uses global default rates that can only be modified by administrators:

- **Freelancer Commission Rate**: 20% (default)
- **Internal Employee Bonus Rate**: 5% (default)
- **Internal Employee Base Salary**: Configurable per organization

### Apply Rates

- New technicians automatically receive global rates
- Admins can override for specific individuals
- Dispatchers cannot modify any rates (view only)

---

## 📝 Testing Checklist

### Service Request API

- [✅] List service requests returns array with filters
- [✅] Create SR with GPS coordinates works
- [✅] Response includes `srId` and `status` properties
- [✅] GPS coordinates saved to customer profile

### Work Order API

- [✅] List work orders returns array with filters
- [✅] Convert SR to WO includes GPS coordinates
- [✅] Convert SR to WO accepts `estimatedDuration`

### Call Center API

- [ ] Create customer with GPS coordinates
- [ ] Get WO technician info shows distance and ETA
- [ ] Only CALL_CENTER and ADMIN can access

### Dispatcher API

- [ ] Get nearby technicians calculates distances
- [ ] Shows technician availability correctly
- [ ] Displays open jobs count
- [ ] Filters by category/specialization
- [ ] Get technician workload shows all open jobs

---

## 🚀 Next Implementation Phase

1. **Admin System Config Endpoints**
2. **File Upload for Technician Documents**
3. **Top 5 Technicians Dashboard**
4. **Enhanced Audit Log Reports**
5. **Technician Filter by Specialization**

See `FEATURES_IMPLEMENTATION.md` for complete roadmap.
