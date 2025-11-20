# Postman Testing Guide for Enhanced Location Services

## 🚀 Quick Setup

### 1. Import the Collection
1. Open Postman
2. Click "Import" button
3. Select `POSTMAN_LOCATION_TESTING.json` file
4. Collection "FSM Location Services - Enhanced" will be imported

### 2. Configure Environment Variables
The collection uses these variables:
- `base_url`: http://localhost:3000/api (auto-configured)
- `auth_token`: Will be set automatically after login

### 3. Start Your Server
```bash
cd "d:\Service Management\outside-project-backend"
npm run dev
```
Server should start on: http://localhost:3000

## 📋 Testing Steps

### Step 1: Authentication
**Test either login option:**

#### Option A: Login as Technician
```
POST /api/auth/login
Body: {
  "phone": "1234567890",
  "password": "password123"
}
```

#### Option B: Login as Admin/Dispatcher
```
POST /api/auth/login
Body: {
  "phone": "admin123", 
  "password": "admin123"
}
```

**✅ Success Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "role": "TECH_INTERNAL"
  }
}
```

### Step 2: Update Technician Location
**Endpoint:** `POST /api/location/update`
**Auth Required:** Technician role
**Headers:** 
- `Authorization: Bearer {{auth_token}}`
- `Content-Type: application/json`

#### Test Cases:

**Test Case 1: New York Location**
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

**Test Case 2: Los Angeles Location**
```json
{
  "latitude": 34.0522,
  "longitude": -118.2437
}
```

**Test Case 3: London Location**
```json
{
  "latitude": 51.5074,
  "longitude": -0.1278
}
```

**✅ Expected Response:**
```json
{
  "success": true,
  "message": "Location updated successfully",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "locationName": "New York, NY, USA",
    "updatedAt": "2024-11-19T10:30:00.000Z"
  }
}
```

### Step 3: Get Nearby Technicians
**Endpoint:** `GET /api/location/nearby`
**Auth Required:** Admin/Dispatcher role
**Headers:** `Authorization: Bearer {{auth_token}}`

#### Query Parameters:
- `latitude`: Customer/Work Order latitude (required)
- `longitude`: Customer/Work Order longitude (required)
- `radius`: Search radius in km (optional, default: 10)
- `limit`: Max technicians to return (optional, default: 10)

#### Test Cases:

**Test Case 1: Times Square Area**
```
GET /api/location/nearby?latitude=40.7580&longitude=-73.9855&radius=5&limit=5
```

**Test Case 2: Wide Search**
```
GET /api/location/nearby?latitude=40.7128&longitude=-74.0060&radius=50&limit=20
```

**✅ Expected Response:**
```json
{
  "success": true,
  "technicians": [
    {
      "id": 1,
      "name": "John Smith",
      "phone": "1234567890",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "distance": 2.5,
      "locationName": "123 Main St, New York, NY 10001",
      "estimatedArrival": "15 minutes",
      "status": "available",
      "lastUpdated": "2024-11-19T10:30:00.000Z"
    }
  ],
  "total": 1,
  "searchCenter": {
    "latitude": 40.7580,
    "longitude": -73.9855,
    "radius": 5
  }
}
```

### Step 4: Get Location History
**Endpoint:** `GET /api/location/history/:technicianId`
**Auth Required:** Admin/Dispatcher role
**Headers:** `Authorization: Bearer {{auth_token}}`

#### Query Parameters:
- `startDate`: Start date (YYYY-MM-DD) (optional)
- `endDate`: End date (YYYY-MM-DD) (optional)
- `limit`: Max records (optional, default: 100)

#### Test Case:
```
GET /api/location/history/1?startDate=2024-11-01&endDate=2024-11-19&limit=50
```

**✅ Expected Response:**
```json
{
  "success": true,
  "locations": [
    {
      "id": 1,
      "latitude": 40.7128,
      "longitude": -74.0060,
      "locationName": "New York, NY, USA",
      "timestamp": "2024-11-19T10:30:00.000Z"
    }
  ],
  "technician": {
    "id": 1,
    "name": "John Smith"
  },
  "total": 1
}
```

## 🔍 Testing Scenarios

### Scenario 1: Complete Workflow
1. Login as technician
2. Update location to New York
3. Login as admin
4. Search for nearby technicians in NYC area
5. Check location history

### Scenario 2: Distance Validation
1. Update technician location to specific coordinates
2. Search from different distances (1km, 5km, 10km, 50km)
3. Verify distance calculations are accurate

### Scenario 3: Multiple Locations
1. Update location to different cities
2. Verify location names are correctly geocoded
3. Test international locations

## 🚨 Error Testing

### Invalid Coordinates
```json
{
  "latitude": 200,
  "longitude": -200
}
```
**Expected:** 400 Bad Request with validation error

### Missing Authorization
Remove Authorization header
**Expected:** 401 Unauthorized

### Wrong Role Access
Login as technician, try to access nearby technicians
**Expected:** 403 Forbidden

## 📊 Response Validation

### Automated Tests (Built into Postman Collection)
Each request includes tests that verify:
- Status code is correct
- Response structure is valid
- Required fields are present
- Distance calculations are included
- Location names are geocoded

### Manual Validation Checklist
- ✅ Location names are human-readable addresses
- ✅ Distances are in kilometers with reasonable precision
- ✅ Coordinates are within valid ranges (-90 to 90 lat, -180 to 180 lng)
- ✅ Estimated arrival times are calculated
- ✅ Real-time updates work (if Socket.io client connected)

## 🔧 Troubleshooting

### Common Issues:

1. **"Cannot find technician"**
   - Ensure you're logged in as the correct user type
   - Check if technician has updated location recently

2. **"No nearby technicians found"**
   - Increase search radius
   - Verify technicians have updated their locations
   - Check if coordinates are in correct area

3. **Geocoding fails**
   - Check internet connection for OpenStreetMap access
   - Verify Google Maps API key if using Google geocoding
   - Some remote locations may not have address data

4. **Authentication errors**
   - Ensure token is valid and not expired
   - Check user roles match endpoint requirements

This testing guide provides comprehensive coverage of all enhanced location features with geocoding, distance calculations, and real-time capabilities!