/*
  Warnings:

  - You are about to drop the column `specialty` on the `TechnicianProfile` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedHours` on the `WorkOrder` table. All the data in the column will be lost.
  - You are about to drop the column `isExpired` on the `WorkOrder` table. All the data in the column will be lost.
  - You are about to drop the column `responseDeadline` on the `WorkOrder` table. All the data in the column will be lost.
  - Changed the type of `status` on the `ServiceRequest` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `WorkOrder` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "SRStatus" AS ENUM ('PENDING', 'IN_PROCESS', 'RESOLVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WOStatus" AS ENUM ('ASSIGNED', 'IN_PROCESS', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "ServiceRequest" DROP COLUMN "status",
ADD COLUMN     "status" "SRStatus" NOT NULL;

-- AlterTable
ALTER TABLE "TechnicianProfile" DROP COLUMN "specialty";

-- AlterTable
ALTER TABLE "WorkOrder" DROP COLUMN "estimatedHours",
DROP COLUMN "isExpired",
DROP COLUMN "responseDeadline",
DROP COLUMN "status",
ADD COLUMN     "status" "WOStatus" NOT NULL;
