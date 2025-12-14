# Individual Commission & Bonus Rates for Technicians

**Status:** ✅ ALREADY IMPLEMENTED (December 14, 2025)

## Overview

The system **already supports** setting individual commission and bonus rates for each technician (both freelancers and internal employees). Each technician can have their own custom rates that override any default rates.

## Database Schema

```prisma
model TechnicianProfile {
  id             Int      @id @default(autoincrement())
  userId         Int      @unique
  type           TechType // FREELANCER or INTERNAL
  commissionRate Float    // Individual commission rate (e.g., 0.2 = 20%)
  bonusRate      Float    // Individual bonus rate (e.g., 0.05 = 5%)
  baseSalary     Float?   // For internal employees only
  status         String   // ACTIVE, INACTIVE
  // ... other fields
}
```

## How It Works

### 1. Setting Rates During Technician Creation

**Endpoint:** `POST /api/technicians`

**Authorization:** Admin only

```json
{
  "name": "Ahmed Hassan",
  "phone": "8801712345678",
  "email": "ahmed@example.com",
  "specialization": "ELECTRICAL",
  "type": "FREELANCER",
  "commissionRate": 0.15,
  "bonusRate": 0.03,
  "homeAddress": "123 Main Street, Dhaka"
}
```

**Response:**
```json
{
  "message": "Technician created successfully",
  "technician": {
    "id": 42,
    "techId": "TECH-042",
    "name": "Ahmed Hassan",
    "phone": "8801712345678",
    "specialization": "ELECTRICAL",
    "type": "FREELANCER",
    "password": "TechAbc12345"
  }
}
```

### 2. Updating Individual Rates

**Endpoint:** `PATCH /api/technicians/:id`

**Authorization:** Admin only

```json
{
  "commissionRate": 0.18,
  "bonusRate": 0.04
}
```

**Example:** Update only commission rate for technician ID 42:
```json
PATCH /api/technicians/42
Authorization: Bearer {{adminToken}}

{
  "commissionRate": 0.25
}
```

### 3. Viewing Individual Rates

**Endpoint:** `GET /api/technicians/:id`

**Response:**
```json
{
  "id": 42,
  "name": "Ahmed Hassan",
  "phone": "8801712345678",
  "email": "ahmed@example.com",
  "role": "TECH_FREELANCER",
  "technicianProfile": {
    "id": 25,
    "type": "FREELANCER",
    "commissionRate": 0.25,
    "bonusRate": 0.04,
    "status": "ACTIVE",
    "specialization": "ELECTRICAL"
  }
}
```

## Rate Types Explained

### Commission Rate (For Freelancers)

- **Who:** Freelance technicians (`TECH_FREELANCER`)
- **What:** Percentage of job payment earned by technician
- **Format:** Decimal (0.0 to 1.0)
  - `0.10` = 10%
  - `0.15` = 15%
  - `0.20` = 20%
  - `0.40` = 40%
- **Example:** Job payment is $100, commission rate is 0.20 (20%)
  - Technician earns: $100 × 0.20 = $20
  - Company keeps: $100 - $20 = $80

### Bonus Rate (For Internal Employees)

- **Who:** Internal employees (`TECH_INTERNAL`)
- **What:** Percentage bonus on top of base salary
- **Format:** Decimal (0.0 to 1.0)
  - `0.03` = 3%
  - `0.05` = 5%
  - `0.07` = 7%
  - `0.10` = 10%
- **Example:** Job payment is $100, bonus rate is 0.05 (5%)
  - Employee bonus: $100 × 0.05 = $5
  - Plus base salary: $3000/month

## Use Cases

### Use Case 1: High-Performance Freelancer

A freelancer consistently delivers excellent service and completes jobs quickly.

```json
POST /api/technicians
{
  "name": "Top Performer",
  "phone": "8801798765432",
  "type": "FREELANCER",
  "specialization": "HVAC",
  "commissionRate": 0.35,
  "bonusRate": 0.05
}
```

**Result:** This technician earns 35% commission instead of the default 40% or 20%.

### Use Case 2: New Freelancer Training Period

A new freelancer is in training period with lower rates.

```json
POST /api/technicians
{
  "name": "New Trainee",
  "phone": "8801612345678",
  "type": "FREELANCER",
  "specialization": "ELECTRICAL",
  "commissionRate": 0.10,
  "bonusRate": 0.02
}
```

**Result:** Trainee earns 10% commission during probation.

### Use Case 3: Senior Internal Employee

A senior internal employee with higher bonus rate.

```json
POST /api/technicians
{
  "name": "Senior Tech",
  "phone": "8801512345678",
  "type": "INTERNAL",
  "specialization": "GENERAL",
  "baseSalary": 5000,
  "bonusRate": 0.10
}
```

**Result:** Employee earns $5000 base + 10% bonus on jobs.

### Use Case 4: Adjusting Rates Based on Performance

After 6 months, increase a freelancer's commission rate.

```json
PATCH /api/technicians/42
{
  "commissionRate": 0.30
}
```

**Result:** Commission increased from 20% to 30% as a reward.

## Default Rates

If rates are not specified during technician creation:

| Type       | Default Commission | Default Bonus |
| ---------- | ------------------ | ------------- |
| FREELANCER | 0.40 (40%)         | 0.05 (5%)     |
| INTERNAL   | 0.00 (0%)          | 0.05 (5%)     |

**Note:** Freelancers earn commission, internal employees earn bonus on top of salary.

## Commission Calculation Example

### Scenario: Freelancer Completes Job

**Job Details:**
- Service: AC Repair
- Customer Payment: $150
- Technician: Ahmed (Freelancer)
- Commission Rate: 0.25 (25%)

**Calculation:**
```
Commission Amount = $150 × 0.25 = $37.50
```

**Database Entry:**
```json
{
  "technicianId": 42,
  "amount": 37.50,
  "rate": 0.25,
  "type": "COMMISSION",
  "status": "PENDING",
  "workOrderId": 123
}
```

**Technician Earnings:**
```
This Week: $37.50
This Month: $450.00
All Time: $5,200.00
```

## Bonus Calculation Example

### Scenario: Internal Employee Completes Job

**Job Details:**
- Service: Electrical Wiring
- Customer Payment: $200
- Technician: Karim (Internal)
- Base Salary: $3000/month
- Bonus Rate: 0.05 (5%)

**Calculation:**
```
Bonus Amount = $200 × 0.05 = $10.00
```

**Monthly Earnings:**
```
Base Salary: $3000
Bonuses (20 jobs): $200
Total: $3200
```

## API Endpoints Summary

| Method | Endpoint                    | Description                           | Auth  |
| ------ | --------------------------- | ------------------------------------- | ----- |
| POST   | `/api/technicians`          | Create technician with custom rates   | Admin |
| PATCH  | `/api/technicians/:id`      | Update individual rates               | Admin |
| GET    | `/api/technicians/:id`      | View technician with current rates    | Admin |
| GET    | `/api/technicians/directory`| List all technicians with their rates | Admin |
| GET    | `/api/technicians/overview` | Statistics including avg rates        | Admin |

## Updating Multiple Technicians

To update rates for multiple technicians, you can:

### Option 1: Individual Updates (Recommended)

```bash
# Update Technician 1
PATCH /api/technicians/42
{ "commissionRate": 0.25 }

# Update Technician 2
PATCH /api/technicians/43
{ "commissionRate": 0.30 }
```

### Option 2: Bulk Rate Adjustment (Future Feature)

Currently not implemented, but could be added:
```json
POST /api/technicians/bulk-update-rates
{
  "technicianIds": [42, 43, 44, 45],
  "commissionRate": 0.22
}
```

## Testing in Postman

### Test 1: Create Technician with Custom Rates

```http
POST {{baseUrl}}/api/technicians
Authorization: Bearer {{adminToken}}
Content-Type: application/json

{
  "name": "Test Freelancer",
  "phone": "8801999888777",
  "email": "test@example.com",
  "specialization": "HVAC",
  "type": "FREELANCER",
  "commissionRate": 0.22,
  "bonusRate": 0.04
}
```

**Expected:** Technician created with 22% commission rate.

### Test 2: Update Commission Rate

```http
PATCH {{baseUrl}}/api/technicians/42
Authorization: Bearer {{adminToken}}
Content-Type: application/json

{
  "commissionRate": 0.28
}
```

**Expected:** Commission rate updated to 28%.

### Test 3: View Updated Rates

```http
GET {{baseUrl}}/api/technicians/42
Authorization: Bearer {{adminToken}}
```

**Expected:** Response shows `commissionRate: 0.28`.

### Test 4: List All Technicians with Rates

```http
GET {{baseUrl}}/api/technicians/directory
Authorization: Bearer {{adminToken}}
```

**Expected:** Array of technicians, each with their individual rates.

## Rate Validation Rules

### Commission Rate Validation
```javascript
if (commissionRate !== undefined) {
  const rate = parseFloat(commissionRate);
  if (isNaN(rate) || rate < 0 || rate > 1) {
    return res.status(400).json({
      message: "Commission rate must be between 0.0 and 1.0"
    });
  }
}
```

### Valid Examples
- `0.10` ✅ (10%)
- `0.25` ✅ (25%)
- `0.40` ✅ (40%)
- `0.5` ✅ (50%)
- `1.0` ✅ (100%)

### Invalid Examples
- `10` ❌ (should be 0.10)
- `25%` ❌ (should be 0.25)
- `-0.1` ❌ (negative)
- `1.5` ❌ (over 100%)
- `"twenty"` ❌ (not a number)

## Important Notes

1. **Individual Rates Override Defaults**
   - Each technician has their own rates stored in `TechnicianProfile`
   - These rates are used for commission/bonus calculations
   - Default rates only apply if no individual rate is set

2. **Freelancer vs Internal**
   - **Freelancers:** Earn `commissionRate` percentage of job payment
   - **Internal:** Earn fixed `baseSalary` + `bonusRate` percentage of job payment

3. **Rate Changes**
   - Updating rates affects **future** jobs only
   - Past commissions are not recalculated
   - Audit log tracks all rate changes

4. **Viewing Rates**
   - Admin can see all technicians' rates
   - Dispatcher can see rates in technician list
   - Technicians can see their own rate in profile

## Database Queries

### Get Technician with Rates
```javascript
const technician = await prisma.user.findUnique({
  where: { id: 42 },
  include: {
    technicianProfile: {
      select: {
        commissionRate: true,
        bonusRate: true,
        type: true,
        status: true
      }
    }
  }
});

console.log(`Commission: ${technician.technicianProfile.commissionRate * 100}%`);
// Output: Commission: 25%
```

### Update Individual Rate
```javascript
await prisma.technicianProfile.update({
  where: { userId: 42 },
  data: {
    commissionRate: 0.30
  }
});
```

### Calculate Commission
```javascript
const commission = await prisma.commission.create({
  data: {
    technicianId: 42,
    amount: jobAmount * technician.technicianProfile.commissionRate,
    rate: technician.technicianProfile.commissionRate,
    type: technician.technicianProfile.type === 'FREELANCER' 
      ? 'COMMISSION' 
      : 'BONUS',
    workOrderId: 123,
    status: 'PENDING'
  }
});
```

## Benefits

✅ **Flexibility:** Each technician can have custom rates
✅ **Performance Rewards:** Increase rates for top performers
✅ **Training Support:** Lower rates for new/training technicians
✅ **Fair Compensation:** Adjust rates based on experience/skills
✅ **Easy Management:** Update rates anytime via API
✅ **Transparent:** Technicians can see their own rates
✅ **Audit Trail:** All rate changes logged in database

## Status

✅ **PRODUCTION READY** - Feature is fully implemented and tested
- Database schema: ✅ Complete
- Create endpoint: ✅ Working (`POST /api/technicians`)
- Update endpoint: ✅ Working (`PATCH /api/technicians/:id`)
- View endpoint: ✅ Working (`GET /api/technicians/:id`)
- List endpoint: ✅ Working (`GET /api/technicians/directory`)
- Commission calculation: ✅ Using individual rates
- Validation: ✅ Implemented
- Documentation: ✅ Complete

## Related Documentation

- [Technician Management](./API_DOCUMENTATION.md#technician-management)
- [Commission System](./DECEMBER_4_2025_FIXES.md#commission-system)
- [Rate Structure](./seed-rates.js)

---

**Last Updated:** December 14, 2025
**Feature Status:** ✅ ALREADY IMPLEMENTED
**Testing Status:** ✅ FULLY TESTED
