<!-- @format -->

# Image Upload Issue - Using External Service

## 🚨 Problem Identified

Your project has an **external image upload service** configured:

```
IMAGE_UPLOAD_SERVICE_URL=https://img.mtscorporate.com
```

But work order completion photos are being saved **locally** to the `uploads/wo-completion/` folder instead of using this external service!

---

## 📊 Current Situation

### ✅ CORRECT Implementation (Technician Documents)

- **File:** `src/routes/technician-management.routes.js`
- **Method:** Saves to temp directory → uploads to external service → deletes temp file
- **Storage:** `os.tmpdir()` (system temp folder)
- **Result:** Images stored on `https://img.mtscorporate.com` ✅

### ❌ WRONG Implementation (Work Order Completion Photos)

- **File:** `src/routes/wo.routes.js`
- **Method:** Saves directly to project folder
- **Storage:** `uploads/wo-completion/` (local project folder)
- **Result:** Images stored locally in your project ❌

---

## 🔍 Why This Is a Problem

### 1. **Deployment Issues**

- When you deploy to Coolify/Docker, local uploads will be lost on container restart
- No persistent storage means lost images

### 2. **Scalability Issues**

- Multiple server instances can't share local files
- Can't use load balancing properly

### 3. **Backup Issues**

- Need to backup both database AND uploads folder
- Increases complexity

### 4. **Inconsistency**

- Technician documents use external service
- Work order photos use local storage
- Different behavior is confusing

---

## ✅ Solution: Fix Work Order Routes

### Current Code (WRONG)

```javascript
// src/routes/wo.routes.js

// ❌ Saves to project folder
const uploadDir = "uploads/wo-completion";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // ❌ Local storage
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "wo-" + uniqueSuffix + path.extname(file.originalname));
  },
});
```

### Fixed Code (CORRECT)

```javascript
// src/routes/wo.routes.js
import os from "os"; // Add this import

// ✅ Use system temp directory
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, os.tmpdir()); // ✅ System temp folder
  },
  filename: (req, file, cb) => {
    cb(
      null,
      `temp-wo-${Date.now()}-${Math.random().toString(36).substring(7)}-${
        file.originalname
      }`
    );
  },
});
```

### Update Service to Use External Upload

```javascript
// src/services/wo.service.js
import { uploadImageToService } from "../utils/imageUpload.js"; // Add this import

export const completeWorkOrderByTechnician = async (woId, techId, data) => {
  const { completionNotes, materialsUsed, files } = data;

  // ... existing validation code ...

  // ✅ Process uploaded files - Upload to external service
  const photoUrls = [];
  if (files && files.length > 0) {
    for (const file of files) {
      try {
        // Upload to external service
        const imageUrl = await uploadImageToService(file);
        photoUrls.push(imageUrl);
      } catch (error) {
        console.error("Failed to upload completion photo:", error);
        // Continue with other files even if one fails
      }
    }
  }

  const updated = await prisma.workOrder.update({
    where: { id: woId },
    data: {
      status: "COMPLETED_PENDING_PAYMENT",
      completedAt: new Date(),
      completionNotes: completionNotes || null,
      completionPhotos: photoUrls.length > 0 ? JSON.stringify(photoUrls) : null,
      materialsUsed: parsedMaterials ? JSON.stringify(parsedMaterials) : null,
    },
  });

  // ... rest of the code ...
};
```

---

## 🎯 Files That Need Changes

### 1. `src/routes/wo.routes.js`

**Change:** Use `os.tmpdir()` instead of `uploads/wo-completion/`

### 2. `src/services/wo.service.js`

**Change:** Use `uploadImageToService()` instead of saving local paths

### 3. (Optional) Clean up existing uploads

**After fix:** Can delete the `uploads/` folder from project

---

## 📝 Step-by-Step Implementation

### Step 1: Update wo.routes.js

```diff
// src/routes/wo.routes.js
import { Router } from "express";
import multer from "multer";
import path from "path";
- import fs from "fs";
+ import os from "os";

- // Ensure upload directory exists
- const uploadDir = "uploads/wo-completion";
- if (!fs.existsSync(uploadDir)) {
-   fs.mkdirSync(uploadDir, { recursive: true });
- }

- // Configure multer for completion photos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
-   cb(null, uploadDir);
+   cb(null, os.tmpdir());
  },
  filename: (req, file, cb) => {
-   const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
-   cb(null, "wo-" + uniqueSuffix + path.extname(file.originalname));
+   cb(
+     null,
+     `temp-wo-${Date.now()}-${Math.random().toString(36).substring(7)}-${
+       file.originalname
+     }`
+   );
  },
});
```

### Step 2: Update wo.service.js

```diff
// src/services/wo.service.js
import { prisma } from "../prisma.js";
+ import { uploadImageToService } from "../utils/imageUpload.js";

export const completeWorkOrderByTechnician = async (woId, techId, data) => {
  const { completionNotes, materialsUsed, files } = data;

  // ... existing code ...

  // Process uploaded files
  const photoUrls = [];
  if (files && files.length > 0) {
-   files.forEach(file => {
-     photoUrls.push(`/uploads/wo-completion/${file.filename}`);
-   });
+   for (const file of files) {
+     try {
+       const imageUrl = await uploadImageToService(file);
+       photoUrls.push(imageUrl);
+     } catch (error) {
+       console.error("Failed to upload completion photo:", error);
+     }
+   }
  }

  // ... rest of code ...
};
```

### Step 3: Test the Changes

```bash
# 1. Restart the server
npm start

# 2. Test work order completion with photos
# Upload should now go to https://img.mtscorporate.com

# 3. Check database - photoUrls should be external URLs
# Example: https://img.mtscorporate.com/uploads/wo-123456.jpg
# NOT: /uploads/wo-completion/wo-123456.jpg
```

---

## 🧪 Testing Checklist

- [ ] Work order completion with 1 photo
- [ ] Work order completion with multiple photos
- [ ] Check database - URLs should be `https://img.mtscorporate.com/...`
- [ ] Verify temp files are deleted after upload
- [ ] Check `uploads/` folder is no longer growing
- [ ] View photos in frontend - URLs should work

---

## 🎯 Expected Results After Fix

### Before Fix

```json
{
  "completionPhotos": "[
    \"/uploads/wo-completion/wo-1765697502833-123456.jpg\",
    \"/uploads/wo-completion/wo-1765697502833-789012.jpg\"
  ]"
}
```

### After Fix

```json
{
  "completionPhotos": "[
    \"https://img.mtscorporate.com/uploads/wo-1765697502833-abc123.jpg\",
    \"https://img.mtscorporate.com/uploads/wo-1765697502833-def456.jpg\"
  ]"
}
```

---

## 🗑️ Cleanup (After Fix Works)

Once you verify the fix works:

1. **Delete uploads folder from project:**

   ```bash
   rm -rf uploads/
   ```

2. **Add to .gitignore (if not already there):**

   ```
   uploads/
   ```

3. **Update .dockerignore (if using Docker):**
   ```
   uploads/
   ```

---

## 📚 Summary

**Current State:**

- ❌ Work order photos: Local storage (`uploads/` folder)
- ✅ Technician documents: External service (`img.mtscorporate.com`)

**After Fix:**

- ✅ Work order photos: External service
- ✅ Technician documents: External service
- ✅ No local files stored in project
- ✅ Docker/deployment ready
- ✅ Scalable architecture

---

**Last Updated:** December 14, 2025  
**Status:** 🚨 Issue Identified - Fix Ready to Apply  
**Priority:** HIGH - Affects deployments and scalability
