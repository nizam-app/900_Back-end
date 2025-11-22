-- CreateEnum
CREATE TYPE "Specialty" AS ENUM ('ELECTRICAL', 'PLUMBING', 'HVAC', 'GENERAL', 'CARPENTRY', 'PAINTING');

-- AlterTable
ALTER TABLE "TechnicianProfile" ADD COLUMN     "specialty" "Specialty" NOT NULL DEFAULT 'GENERAL';
