-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "TechnicianProfile" ADD COLUMN     "academicTitle" TEXT,
ADD COLUMN     "baseSalary" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "degreesUrl" TEXT,
ADD COLUMN     "idCardUrl" TEXT,
ADD COLUMN     "photoUrl" TEXT,
ADD COLUMN     "residencePermitFrom" TIMESTAMP(3),
ADD COLUMN     "residencePermitTo" TIMESTAMP(3),
ADD COLUMN     "residencePermitUrl" TEXT,
ADD COLUMN     "specialization" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "homeAddress" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "WorkOrder" ADD COLUMN     "estimatedDuration" INTEGER,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" SERIAL NOT NULL,
    "freelancerCommissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.20,
    "internalEmployeeBonusRate" DOUBLE PRECISION NOT NULL DEFAULT 0.05,
    "internalEmployeeBaseSalary" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" INTEGER,

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);
