<!-- @format -->

# Two Registration Systems - Quick Reference

## December 4, 2025 Update

The FSM system now supports **TWO** distinct technician registration flows.

---

## 🎯 Quick Comparison

|                 | Freelancer (One)             | Internal Tech (Two)             |
| --------------- | ---------------------------- | ------------------------------- |
| **Who**         | External contractors         | Company employees               |
| **Access**      | Public (mobile app)          | Internal portal                 |
| **Endpoints**   | `/api/otp/*` + `/api/auth/*` | `/api/employee/register/*`      |
| **Steps**       | 3 (OTP → Verify → Password)  | 3 (Details → Verify → Password) |
| **Role**        | TECH_FREELANCER              | TECH_INTERNAL                   |
| **Rate**        | 40% commission               | 5% bonus                        |
| **Employee ID** | ❌ Not required              | ✅ Required                     |
| **Payment**     | Per-job commission           | Salary + bonus                  |

---

## 1️⃣ Freelancer Registration

**"One is Freelancer"**

### API Flow

```
POST /api/otp/send
→ name, phone

POST /api/otp/verify
→ phone, code

POST /api/auth/set-password
→ phone, password, tempToken
```

### Creates

- Role: `TECH_FREELANCER`
- Type: `FREELANCER`
- Commission: `40%`
- No employee ID

### Postman Section

**"Authentication & OTP"** (first 3 endpoints)

---

## 2️⃣ Internal Tech Registration

**"Two is Internal Tech"**

### API Flow

```
POST /api/employee/register/initiate
→ name, employeeId, phone

POST /api/employee/register/verify-otp
→ phone, code

POST /api/employee/register/complete
→ phone, password, tempToken, name, employeeId
```

### Creates

- Role: `TECH_INTERNAL`
- Type: `INTERNAL`
- Bonus: `5%`
- Employee ID: `EMP-2025-XXX`

### Postman Section

**"Employee Registration (Internal Team)"** (4 endpoints)

---

## 📱 Example Requests

### Freelancer (One)

```bash
# Step 1
curl -X POST http://localhost:4000/api/otp/send \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Freelancer",
    "phone": "+8801718981009",
    "type": "REGISTRATION"
  }'

# Step 2
curl -X POST http://localhost:4000/api/otp/verify \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+8801718981009",
    "code": "123456",
    "type": "REGISTRATION"
  }'

# Step 3
curl -X POST http://localhost:4000/api/auth/set-password \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+8801718981009",
    "password": "test123",
    "tempToken": "temp_xxx"
  }'
```

### Internal Tech (Two)

```bash
# Step 1
curl -X POST http://localhost:4000/api/employee/register/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Internal",
    "employeeId": "EMP-2025-001",
    "phone": "+8801718981000"
  }'

# Step 2
curl -X POST http://localhost:4000/api/employee/register/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+8801718981000",
    "code": "123456"
  }'

# Step 3
curl -X POST http://localhost:4000/api/employee/register/complete \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+8801718981000",
    "password": "employee123",
    "tempToken": "temp_xxx",
    "name": "John Internal",
    "employeeId": "EMP-2025-001"
  }'
```

---

## 🎨 UI Mockups

### One: Freelancer (Mobile App)

```
┌─────────────────────────┐
│  Create Your Account    │
├─────────────────────────┤
│ Step 1: Your Details    │
│ ┌─────────────────────┐ │
│ │ Full Name           │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ Phone Number        │ │
│ └─────────────────────┘ │
│                         │
│    [Continue] →         │
└─────────────────────────┘
```

### Two: Internal Tech (Portal)

```
┌─────────────────────────┐
│ Internal Team Portal    │
├─────────────────────────┤
│ Create Employee Account │
│                         │
│ Step 1: Employee Info   │
│ ┌─────────────────────┐ │
│ │ Full Name           │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ Employee ID         │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ Phone Number        │ │
│ └─────────────────────┘ │
│                         │
│    [Continue] →         │
└─────────────────────────┘
```

---

## 💾 Database Comparison

### After Freelancer Registration

```sql
User {
  id: 5,
  role: "TECH_FREELANCER",
  name: "John Freelancer",
  phone: "1718981009"
}

TechnicianProfile {
  id: 2,
  userId: 5,
  type: "FREELANCER",
  commissionRate: 0.4,  -- 40%
  bonusRate: 0.05,
  status: "ACTIVE"
}
```

### After Internal Tech Registration

```sql
User {
  id: 17,
  role: "TECH_INTERNAL",
  name: "John Internal",
  phone: "1718981000"
}

TechnicianProfile {
  id: 4,
  userId: 17,
  type: "INTERNAL",
  commissionRate: 0,
  bonusRate: 0.05,      -- 5%
  status: "ACTIVE",
  specialization: "EMP-2025-001"  -- Employee ID
}
```

---

## 📦 Files

### Freelancer Registration

- Routes: `src/routes/otp.routes.js`, `src/routes/auth.routes.js`
- Controllers: `src/controllers/otp.controller.js`, `src/controllers/auth.controller.js`
- Test: `test-freelancer-registration.js`

### Internal Tech Registration

- Routes: `src/routes/employee.routes.js`
- Controller: `src/controllers/employee.controller.js`
- Test: `test-employee-registration.js`

---

## ✅ Status

Both registration systems are:

- ✅ Fully implemented
- ✅ Tested with OTP delivery
- ✅ Documented in Postman
- ✅ Ready for production

**Updated:** December 4, 2025
