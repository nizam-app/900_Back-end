<!-- @format -->

# 🔧 OTP Live Server Fix - Quick Guide

## 🎯 What Was Fixed

The OTP was working on localhost but not on live server because the SMS service was using **hardcoded credentials** instead of reading from environment variables.

### Changes Made:

1. **`src/services/sms.service.js`**

   - ✅ Added `dotenv` import
   - ✅ Changed hardcoded credentials to `process.env` variables
   - ✅ Added fallback values for development

2. **`.env.example`**

   - ✅ Added BulkGate configuration section
   - ✅ Documented all required environment variables

3. **New Files Created:**
   - ✅ `DEPLOYMENT_CHECKLIST.md` - Complete deployment guide
   - ✅ `diagnose-live.js` - Server diagnostic tool
   - ✅ `test-live-otp.js` - Live server OTP testing script

---

## 🚀 How to Fix OTP on Live Server

### Step 1: Update Environment Variables on Live Server

SSH into your live server and edit the `.env` file:

```bash
nano .env
# or
vi .env
```

Make sure these variables are present:

```bash
# BulkGate SMS API
BULKGATE_SMS_APP_ID="36014"
BULKGATE_SMS_APP_TOKEN="mS6UavzDJQ8KoJ2NZlSGmFaiPSNhsdBML1wq2ngi8rXvoTw0Qv"

# BulkGate OTP API
BULKGATE_OTP_APP_ID="36013"
BULKGATE_OTP_APP_TOKEN="7ohN0WzblPga1tugpwCXiHiQweVB3GImpmCanFNZSLsyhL87yR"

# Set to production
NODE_ENV="production"
```

### Step 2: Update Code on Live Server

Pull the latest changes:

```bash
cd /path/to/your/project
git pull origin main
# or copy the updated src/services/sms.service.js file
```

### Step 3: Restart the Server

```bash
# If using PM2
pm2 restart fsm-api

# If using systemd
sudo systemctl restart fsm-api

# If running directly
# Stop the current process and run:
npm start
```

### Step 4: Run Diagnostic

```bash
node diagnose-live.js
```

This will check:

- ✅ Node.js version
- ✅ Environment variables
- ✅ BulkGate credentials
- ✅ API connectivity
- ✅ Account credits

### Step 5: Test OTP

```bash
# Test with your phone number
node test-live-otp.js +8801718981009 http://your-live-server:4000

# Or test locally first
node test-live-otp.js +8801718981009 http://localhost:4000
```

---

## 🧪 Testing Commands

### 1. Check if environment variables are loaded:

```bash
# On live server
echo $BULKGATE_SMS_APP_ID
echo $BULKGATE_SMS_APP_TOKEN
```

### 2. Test OTP endpoint with curl:

```bash
curl -X POST http://your-server:4000/api/otp/send \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+8801718981009",
    "type": "REGISTRATION"
  }'
```

### 3. Check server logs:

```bash
# With PM2
pm2 logs fsm-api

# With systemd
journalctl -u fsm-api -f

# Direct logs
tail -f /var/log/fsm-api.log
```

---

## 🔍 Troubleshooting

### Problem: "Environment variables not loading"

**Solution 1:** Export manually before starting server

```bash
export BULKGATE_SMS_APP_ID="36014"
export BULKGATE_SMS_APP_TOKEN="mS6UavzDJQ8KoJ2NZlSGmFaiPSNhsdBML1wq2ngi8rXvoTw0Qv"
npm start
```

**Solution 2:** Use PM2 with .env file

```bash
pm2 start src/server.js --name fsm-api --update-env
```

### Problem: "OTP sends but SMS not received"

**Check BulkGate Credits:**

1. Login to https://portal.bulkgate.com
2. Check "Balance" or "Credits"
3. Purchase credits if balance is 0

**Check API Response:**

- Look for `"price": 0` and `"credit": 0` in logs
- This means no credits available

### Problem: "Cannot reach BulkGate API"

**Check Firewall:**

```bash
# Test connection
curl -I https://portal.bulkgate.com

# If blocked, whitelist portal.bulkgate.com
```

---

## 📊 What to Look for in Logs

### ✅ Good Logs (Working):

```
📱 Original phone: +8801718981009
📱 Formatted phone: 8801718981009
📤 Sending OTP SMS to 8801718981009...
📊 SMS Result: {
  "success": true,
  "status": "sent",
  "price": 0.05,
  "credit": 9.95
}
✅ OTP SMS sent successfully
```

### ❌ Bad Logs (No Credits):

```
📊 SMS Result: {
  "success": true,
  "status": "accepted",
  "price": 0,
  "credit": 0
}
```

**Fix:** Add credits to BulkGate account

### ❌ Bad Logs (Wrong Credentials):

```
📊 SMS Result: {
  "success": false,
  "error": "Invalid application credentials"
}
```

**Fix:** Check `.env` file has correct credentials

### ❌ Bad Logs (Network Error):

```
❌ Error sending SMS via BulkGate: fetch failed
```

**Fix:** Check firewall/network connectivity

---

## 📝 Quick Reference

### Test Endpoints:

| Endpoint          | Method | Body                                                                    |
| ----------------- | ------ | ----------------------------------------------------------------------- |
| `/api/otp/send`   | POST   | `{"phone": "+8801718981009", "type": "REGISTRATION"}`                   |
| `/api/otp/verify` | POST   | `{"phone": "+8801718981009", "code": "123456", "type": "REGISTRATION"}` |

### Valid OTP Types:

- `REGISTRATION`
- `LOGIN`
- `PASSWORD_RESET`
- `VERIFICATION`

### Phone Format:

- With country code: `+8801718981009` ✅
- Without plus: `8801718981009` ✅
- With zero: `01718981009` ✅
- Without country code: `1718981009` ❌

---

## 🆘 Still Not Working?

1. **Run diagnostics:**

   ```bash
   node diagnose-live.js
   ```

2. **Check all files are updated:**

   ```bash
   git status
   git diff src/services/sms.service.js
   ```

3. **Verify .env file exists and is readable:**

   ```bash
   ls -la .env
   cat .env | grep BULKGATE
   ```

4. **Test with direct API call:**

   ```bash
   node direct-otp-test.js
   ```

5. **Check BulkGate portal:**
   - Login: https://portal.bulkgate.com
   - Check balance
   - Check SMS logs
   - Check API credentials

---

## ✅ Success Checklist

- [ ] Code updated on live server
- [ ] `.env` file has BulkGate credentials
- [ ] `NODE_ENV=production` is set
- [ ] Server restarted
- [ ] Diagnostic script runs successfully
- [ ] Test OTP request returns 200 OK
- [ ] SMS received on phone
- [ ] Verification works
- [ ] Server logs show no errors
- [ ] BulkGate account has credits

---

**Need Help?**

- Check `DEPLOYMENT_CHECKLIST.md` for detailed guide
- Run `diagnose-live.js` for automated diagnostics
- Check server logs for error messages
- Verify BulkGate account status at https://portal.bulkgate.com

**Last Updated:** November 29, 2025
