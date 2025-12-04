-- CreateEnum
CREATE TYPE "MigrationTemp" AS ENUM ('TEMP');

-- Step 1: Create temporary tables to store old data
CREATE TABLE "_old_subservices" AS SELECT * FROM "Subservice";
CREATE TABLE "_old_services" AS SELECT * FROM "Service";

-- Step 2: Clear existing data (we'll repopulate after schema change)
DELETE FROM "Service";
DELETE FROM "Subservice";

-- Step 3: Drop old foreign key constraints
ALTER TABLE "Subservice" DROP CONSTRAINT "Subservice_categoryId_fkey";
ALTER TABLE "Service" DROP CONSTRAINT "Service_categoryId_fkey";
ALTER TABLE "Service" DROP CONSTRAINT "Service_subserviceId_fkey";

-- Step 4: Modify Subservice table (remove categoryId, add serviceId)
ALTER TABLE "Subservice" DROP COLUMN "categoryId";
ALTER TABLE "Subservice" ADD COLUMN "serviceId" INTEGER;

-- Step 5: Modify Service table (remove subserviceId)
ALTER TABLE "Service" DROP COLUMN "subserviceId";

-- Step 6: Migrate data - swap the meaning of Service and Subservice
-- Old Subservices become new Services (e.g., "AC Repair" becomes a Service)
INSERT INTO "Service" (id, "categoryId", name, description, "baseRate", "createdAt", "updatedAt")
SELECT id, "categoryId", name, description, NULL as "baseRate", "createdAt", "updatedAt"
FROM "_old_subservices";

-- Old Services become new Subservices (e.g., "AC Not Cooling" becomes a Subservice)
-- Map old Service.subserviceId to new Subservice.serviceId
INSERT INTO "Subservice" (id, "serviceId", name, description, "createdAt", "updatedAt")
SELECT id, "subserviceId" as "serviceId", name, description, "createdAt", "updatedAt"
FROM "_old_services";

-- Step 7: Add new foreign key constraints
ALTER TABLE "Service" ADD CONSTRAINT "Service_categoryId_fkey" 
  FOREIGN KEY ("categoryId") REFERENCES "Category"(id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Subservice" ADD CONSTRAINT "Subservice_serviceId_fkey" 
  FOREIGN KEY ("serviceId") REFERENCES "Service"(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 8: Make serviceId NOT NULL
ALTER TABLE "Subservice" ALTER COLUMN "serviceId" SET NOT NULL;

-- Step 9: Drop temporary tables
DROP TABLE "_old_subservices";
DROP TABLE "_old_services";

-- Step 10: Drop temporary enum
DROP TYPE "MigrationTemp";
