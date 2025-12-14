<!-- @format -->

# Call Center Agent Creator Info - Already Working ✅

## Overview

**Good News!** The system already tracks and displays which Call Center agent created each Service Request. Dispatchers can see this information when viewing SR details or SR lists.

---

## ✅ Current Implementation Status

### Database Schema
```prisma
model ServiceRequest {
  id            Int      @id @default(autoincrement())
  srNumber      String   @unique
  
  // Customer who requested the service
  customerId    Int
  customer      User     @relation("CustomerSRs", fields: [customerId])
  
  // User who created the SR (Call Center Agent, Customer, etc.)
  createdById   Int?
  createdBy     User?    @relation("CreatedSRs", fields: [createdById])
  
  // ... other fields
}
```

### API Response - SR List
```json
{
  "id": 102,
  "srNumber": "SR-1765697502833",
  "customer": {
    "id": 101,
    "name": "test call center sr create 3",
    "phone": "1234567890"
  },
  "createdBy": {
    "id": 3,
    "name": "Call Center Agent",
    "phone": "3333333333",
    "role": "CALL_CENTER"
  },
  "status": "NEW",
  "source": "CALL_CENTER",
  "category": { ... },
  "service": { ... }
}
```

### API Response - SR Detail
```json
{
  "id": 102,
  "srNumber": "SR-1765697502833",
  "customer": {
    "id": 101,
    "name": "test call center sr create 3",
    "phone": "1234567890",
    "email": "customer@example.com"
  },
  "createdBy": {
    "id": 3,
    "name": "Call Center Agent",
    "phone": "3333333333",
    "role": "CALL_CENTER"
  },
  "status": "NEW",
  "description": "Customer needs AC repair",
  "address": "123 Main St, Dhaka",
  "scheduledAt": "2025-12-15T10:00:00Z",
  "notes": "Customer prefers morning appointment",
  "workOrders": [ ... ]
}
```

---

## 📊 Database Check Results

From recent check (December 14, 2025):

```
📈 Summary:
   ✅ With Creator Info: 6/10
   ⚠️  Without Creator: 4/10
   📞 Created by Call Center: 6/10
```

### Why Some SRs Don't Have Creator Info?

**SRs WITHOUT creator:**
- Created via WEB_PORTAL (guest users, no authentication)
- Created before `createdById` tracking was implemented
- Old test data

**SRs WITH creator:**
- All CALL_CENTER source SRs have creator info ✅
- All authenticated user SRs have creator info ✅

---

## 🎯 Endpoints That Include Creator Info

### 1. Get All Service Requests
```http
GET /api/srs
Authorization: Bearer {dispatcherToken}
```

**Accessible by:** DISPATCHER, ADMIN, CALL_CENTER, CUSTOMER

**Response includes:**
- `createdBy.name` - Full name of who created SR
- `createdBy.phone` - Phone number
- `createdBy.role` - Role (CALL_CENTER, CUSTOMER, etc.)
- `createdBy.id` - User ID

### 2. Get Service Request by ID
```http
GET /api/srs/{id}
Authorization: Bearer {dispatcherToken}
```

**Accessible by:** DISPATCHER, ADMIN, CALL_CENTER, CUSTOMER (own SRs)

**Response includes:**
- Full `createdBy` object with name, phone, role
- All SR details
- Customer information
- Work order history

### 3. Get My Service Requests (Customer)
```http
GET /api/srs/my
Authorization: Bearer {customerToken}
```

**Note:** Customers see their own created SRs. The `createdBy` might be themselves or a Call Center agent who created it on their behalf.

---

## 🖥️ Frontend Display Examples

### Dispatcher Dashboard - SR List

```jsx
// React Component
function ServiceRequestList({ srs }) {
  return (
    <table>
      <thead>
        <tr>
          <th>SR Number</th>
          <th>Customer</th>
          <th>Status</th>
          <th>Created By</th>
          <th>Source</th>
          <th>Created At</th>
        </tr>
      </thead>
      <tbody>
        {srs.map(sr => (
          <tr key={sr.id}>
            <td>{sr.srNumber}</td>
            <td>{sr.customer?.name}</td>
            <td>{sr.status}</td>
            <td>
              {sr.createdBy ? (
                <div>
                  <strong>{sr.createdBy.name}</strong>
                  <br />
                  <small className="text-muted">
                    {sr.createdBy.role} - {sr.createdBy.phone}
                  </small>
                </div>
              ) : (
                <span className="text-muted">Guest User</span>
              )}
            </td>
            <td>{sr.source}</td>
            <td>{new Date(sr.createdAt).toLocaleDateString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### SR Detail View

```jsx
function ServiceRequestDetail({ sr }) {
  return (
    <div className="sr-detail">
      <h2>Service Request {sr.srNumber}</h2>
      
      <div className="info-section">
        <h3>Customer Information</h3>
        <p><strong>Name:</strong> {sr.customer.name}</p>
        <p><strong>Phone:</strong> {sr.customer.phone}</p>
      </div>

      <div className="info-section">
        <h3>Request Details</h3>
        <p><strong>Service:</strong> {sr.service.name}</p>
        <p><strong>Status:</strong> {sr.status}</p>
        <p><strong>Priority:</strong> {sr.priority}</p>
      </div>

      {sr.createdBy && (
        <div className="info-section">
          <h3>Created By</h3>
          <div className="creator-badge">
            <span className="role-badge">{sr.createdBy.role}</span>
            <p><strong>{sr.createdBy.name}</strong></p>
            <p className="text-muted">{sr.createdBy.phone}</p>
          </div>
        </div>
      )}

      {sr.notes && (
        <div className="info-section">
          <h3>Notes from {sr.createdBy?.name || 'Customer'}</h3>
          <p>{sr.notes}</p>
        </div>
      )}
    </div>
  );
}
```

### Mobile UI - SR Card

```jsx
function ServiceRequestCard({ sr }) {
  return (
    <div className="sr-card">
      <div className="sr-header">
        <h4>{sr.srNumber}</h4>
        <span className={`status-badge ${sr.status}`}>{sr.status}</span>
      </div>
      
      <div className="sr-body">
        <p><strong>Customer:</strong> {sr.customer.name}</p>
        <p><strong>Service:</strong> {sr.service.name}</p>
        <p><strong>Address:</strong> {sr.address}</p>
        
        {sr.createdBy && (
          <div className="creator-info">
            <small>
              Created by <strong>{sr.createdBy.name}</strong>
              {sr.createdBy.role === 'CALL_CENTER' && ' 📞'}
            </small>
          </div>
        )}
      </div>
      
      <div className="sr-footer">
        <button onClick={() => viewDetails(sr.id)}>View Details</button>
      </div>
    </div>
  );
}
```

---

## 📱 Postman Testing

### Test 1: Login as Dispatcher
```json
POST /api/auth/login
{
  "phone": "2222222222",
  "password": "dispatcher123"
}
```

Save the `token` from response.

### Test 2: Get SR List
```http
GET /api/srs
Authorization: Bearer {token}
```

Look for `createdBy` in each SR:
```json
{
  "id": 102,
  "srNumber": "SR-1765697502833",
  "createdBy": {
    "id": 3,
    "name": "Call Center Agent",
    "phone": "3333333333",
    "role": "CALL_CENTER"
  }
}
```

### Test 3: Get Specific SR
```http
GET /api/srs/102
Authorization: Bearer {token}
```

Full creator details included in response.

---

## 🔍 Filtering by Creator (Future Enhancement)

Currently the API doesn't support filtering by creator, but it's easy to add:

### Backend Enhancement
```javascript
// src/controllers/sr.controller.js
export const listSR = async (req, res, next) => {
  try {
    const { status, priority, customerId, createdById } = req.query;
    
    const where = {};
    
    // Existing filters...
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (customerId) where.customerId = Number(customerId);
    
    // NEW: Filter by creator
    if (createdById) {
      where.createdById = Number(createdById);
    }
    
    const srs = await prisma.serviceRequest.findMany({
      where,
      include: {
        customer: true,
        createdBy: true,
        // ... other includes
      }
    });
    
    return res.json(srs);
  } catch (err) {
    next(err);
  }
};
```

### Usage
```http
GET /api/srs?createdById=3
# Returns only SRs created by Call Center Agent (User ID 3)

GET /api/srs?status=NEW&createdById=3
# Returns only NEW SRs created by Call Center Agent
```

---

## 📋 Summary

### ✅ What's Already Working

1. **Database tracking:** `createdById` field stores who created SR
2. **API responses:** All SR endpoints include `createdBy` object
3. **Role information:** Shows name, phone, role of creator
4. **Call Center SRs:** All CALL_CENTER source SRs have creator info
5. **Dispatcher access:** Dispatchers can see creator in SR list and detail

### ⚠️ Known Limitations

1. **Guest SRs:** Web portal guest users don't have creator info (by design)
2. **Old data:** Some old SRs might not have creator (created before tracking)
3. **No filtering:** Can't filter SRs by creator yet (easy to add)

### 💡 Recommendations

1. **Frontend:** Display creator info prominently in dispatcher UI
2. **Filtering:** Add ability to filter SRs by creator (optional)
3. **Reports:** Include creator in SR reports for accountability
4. **Training:** Ensure Call Center agents know their name appears on SRs

---

## 🧪 Test Commands

### Check Creator Info in Database
```bash
node check-sr-creator-field.js
```

Shows which SRs have creator information.

### Test API Response (when server running)
```bash
node test-sr-creator-info.js
```

Creates SR as Call Center, then checks if dispatcher can see creator.

---

## 🔗 Related Files

- **Schema:** `prisma/schema.prisma` - `ServiceRequest.createdBy` relation
- **Controller:** `src/controllers/sr.controller.js` - SR endpoints
- **Routes:** `src/routes/sr.routes.js` - SR API routes
- **Test Scripts:**
  - `check-sr-creator-field.js` - Database check
  - `test-sr-creator-info.js` - API integration test

---

**Last Updated:** December 14, 2025  
**Status:** ✅ Working - Creator information already tracked and displayed  
**Action Required:** None - feature already implemented and functioning
