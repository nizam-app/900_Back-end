/*
  Warnings:

  - You are about to drop the column `specialty` on the `TechnicianProfile` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedHours` on the `WorkOrder` table. All the data in the column will be lost.
  - You are about to drop the column `isExpired` on the `WorkOrder` table. All the data in the column will be lost.
  - You are about to drop the column `responseDeadline` on the `WorkOrder` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN     "attachments" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "landmark" TEXT,
ADD COLUMN     "streetAddress" TEXT;

-- AlterTable
ALTER TABLE "SystemConfig" ADD COLUMN     "nextPayoutDate" TIMESTAMP(3),
ADD COLUMN     "payoutFrequency" TEXT NOT NULL DEFAULT 'WEEKLY';

-- AlterTable
ALTER TABLE "TechnicianProfile" DROP COLUMN "specialty";

-- AlterTable
ALTER TABLE "WorkOrder" DROP COLUMN "estimatedHours",
DROP COLUMN "isExpired",
DROP COLUMN "responseDeadline";
