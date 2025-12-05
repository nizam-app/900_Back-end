<!-- @format -->

# Registration Examples - 3 Main Roles

## ✅ The Fix is Complete!

You can now register users with ANY role by simply changing the `"role"` value in Step 1.

---

## 🎯 EXAMPLE 1: Register as CUSTOMER

### Step 1: Send OTP

```json
POST /api/otp/send
{
  "phone": "+8801700000020",
  "name": "John Customer",
  "type": "REGISTRATION",
  "role": "CUSTOMER"
}
```

### Step 2: Verify OTP

```json
POST /api/otp/verify
{
  "phone": "+8801700000020",
  "code": "123456",
  "type": "REGISTRATION"
}
```

### Step 3: Set Password

```json
POST /api/auth/set-password
{
  "phone": "+8801700000020",
  "password": "test123",
  "tempToken": "temp_..."
}
```

**Result:** User created as **CUSTOMER** ✅

---

## 🎯 EXAMPLE 2: Register as TECH_FREELANCER

### Step 1: Send OTP

```json
POST /api/otp/send
{
  "phone": "+8801700000021",
  "name": "Mike Freelancer",
  "type": "REGISTRATION",
  "role": "TECH_FREELANCER"
}
```

### Step 2: Verify OTP

```json
POST /api/otp/verify
{
  "phone": "+8801700000021",
  "code": "123456",
  "type": "REGISTRATION"
}
```

### Step 3: Set Password

```json
POST /api/auth/set-password
{
  "phone": "+8801700000021",
  "password": "test123",
  "tempToken": "temp_..."
}
```

**Result:** User created as **TECH_FREELANCER** (40% commission) ✅

---

## 🎯 EXAMPLE 3: Register as TECH_INTERNAL

### Step 1: Send OTP

```json
POST /api/otp/send
{
  "phone": "+8801700000022",
  "name": "Sarah Employee",
  "type": "REGISTRATION",
  "role": "TECH_INTERNAL"
}
```

### Step 2: Verify OTP

```json
POST /api/otp/verify
{
  "phone": "+8801700000022",
  "code": "123456",
  "type": "REGISTRATION"
}
```

### Step 3: Set Password

```json
POST /api/auth/set-password
{
  "phone": "+8801700000022",
  "password": "test123",
  "tempToken": "temp_..."
}
```

**Result:** User created as **TECH_INTERNAL** (15% commission + 5% bonus + base salary) ✅

---

## 🎯 BONUS: All Other Roles

### DISPATCHER

```json
{
  "phone": "+8801700000023",
  "name": "Lisa Dispatcher",
  "type": "REGISTRATION",
  "role": "DISPATCHER"
}
```

### CALL_CENTER

```json
{
  "phone": "+8801700000024",
  "name": "Tom Support",
  "type": "REGISTRATION",
  "role": "CALL_CENTER"
}
```

### ADMIN

```json
{
  "phone": "+8801700000025",
  "name": "Admin User",
  "type": "REGISTRATION",
  "role": "ADMIN"
}
```

---

## ⚠️ Important Notes

1. **Use UNIQUE phone numbers** - Each test needs a new number that doesn't exist in the database
2. **Role is REQUIRED** - Don't use empty string `"role": ""`
3. **Valid roles only** - Use one of: CUSTOMER, TECH_FREELANCER, TECH_INTERNAL, DISPATCHER, CALL_CENTER, ADMIN
4. **Case sensitive** - Use UPPERCASE as shown above

---

## 🔧 Your Original Request (FIXED)

**WRONG ❌:**

```json
{
  "phone": "+8801700000012",
  "name": "Fresh Test",
  "type": "REGISTRATION",
  "role": "" // ❌ Empty string - will default to TECH_FREELANCER
}
```

**CORRECT ✅:**

```json
{
  "phone": "+8801700000012",
  "name": "Fresh Test",
  "type": "REGISTRATION",
  "role": "CUSTOMER" // ✅ Specify the role you want
}
```

---

## 🎉 Summary

**The system NOW supports registering all 6 roles:**

1. ✅ CUSTOMER
2. ✅ TECH_FREELANCER (40% commission)
3. ✅ TECH_INTERNAL (15% commission + 5% bonus + salary)
4. ✅ DISPATCHER
5. ✅ CALL_CENTER
6. ✅ ADMIN

Just change the `"role"` value in Step 1 (Send OTP) and the user will be created with that role in Step 3!
