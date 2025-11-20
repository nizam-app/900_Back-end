# Enhanced Location Services Implementation

This implementation provides comprehensive location services for your FSM (Field Service Management) system with geocoding and distance calculations.

## Features Implemented

### 1. Location Utilities (`src/utils/location.js`)
- **Distance Calculation**: Haversine formula for accurate distance between coordinates
- **Geocoding**: Convert coordinates to human-readable addresses using OpenStreetMap/Google Maps
- **Coordinate Validation**: Ensure latitude/longitude values are valid
- **Travel Time Estimation**: Calculate estimated travel time based on distance

### 2. Enhanced Location Service (`src/services/location.service.js`)
- **getNearbyTechnicians**: Find technicians with distances and location names
- **updateLocation**: Real-time location updates with Socket.io broadcasting
- **getLocationHistory**: Track technician movement history

### 3. Admin Dashboard Enhancement (`src/controllers/admin.controller.js`)
- **getTechnicianLocations**: Enhanced with location names and distance sorting
- **Real-time tracking**: Live updates via Socket.io

### 4. Updated Routes (`src/routes/location.routes.js`)
- **Enhanced endpoints**: All location APIs now include geocoding and distances
- **Location history**: New endpoint for tracking technician movements

## API Endpoints

### Update Location
```
POST /api/locations/update
Headers: { Authorization: "Bearer <token>" }
Body: { 
  "latitude": 40.7128, 
  "longitude": -74.0060 
}
```

### Get Nearby Technicians
```
GET /api/locations/nearby?latitude=40.7128&longitude=-74.0060&radius=10&limit=10
Headers: { Authorization: "Bearer <token>" }
```

Response includes:
- Technician details
- Distance in kilometers
- Human-readable location name
- Estimated travel time

### Location History
```
GET /api/locations/history/:technicianId?startDate=2024-01-01&endDate=2024-01-31&limit=100
Headers: { Authorization: "Bearer <token>" }
```

## Configuration

### Environment Variables (.env)
```
GOOGLE_MAPS_API_KEY="your-google-maps-api-key-for-geocoding"
```

### Geocoding Providers
1. **OpenStreetMap (Default)**: Free, no API key required
2. **Google Maps**: More accurate, requires API key

## Real-time Features

### Socket.io Events
- **locationUpdate**: Broadcast when technician location changes
- **nearbyTechnicians**: Real-time updates of nearby technicians
- **technicianOnline/Offline**: Connection status updates

### Event Structure
```javascript
socket.on('locationUpdate', (data) => {
  // data.technicianId, data.latitude, data.longitude, data.locationName
});
```

## Usage Examples

### Frontend Integration
```javascript
// Get nearby technicians with location names
const response = await fetch('/api/locations/nearby?latitude=40.7128&longitude=-74.0060');
const data = await response.json();

data.technicians.forEach(tech => {
  console.log(`${tech.name} is ${tech.distance}km away at ${tech.locationName}`);
});
```

### Mobile App Integration
```javascript
// Update location with real-time broadcast
navigator.geolocation.getCurrentPosition(async (position) => {
  await fetch('/api/locations/update', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    })
  });
});
```

## Benefits

1. **Accurate Distance Calculations**: Haversine formula provides precise distances
2. **Human-readable Locations**: Geocoding converts coordinates to addresses
3. **Real-time Updates**: Socket.io ensures live location tracking
4. **Scalable Architecture**: Modular design for easy maintenance
5. **Multiple Geocoding Options**: Fallback from Google Maps to OpenStreetMap
6. **Performance Optimized**: Efficient database queries and caching

## Testing

Test the implementation:
1. Start the server: `npm run dev`
2. Update a technician's location via API
3. Check nearby technicians with location names
4. Monitor real-time updates via Socket.io

## Next Steps

1. **Mobile Integration**: Implement GPS tracking in mobile apps
2. **Map Visualization**: Add interactive maps showing technician locations
3. **Route Optimization**: Calculate optimal routes for multiple work orders
4. **Geofencing**: Set up location-based alerts and notifications

This implementation provides a complete solution for location-based features in your FSM system with accurate distance calculations, human-readable location names, and real-time updates.