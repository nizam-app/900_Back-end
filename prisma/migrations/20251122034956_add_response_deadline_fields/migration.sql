-- AlterTable
ALTER TABLE "WorkOrder" ADD COLUMN     "isExpired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "responseDeadline" TIMESTAMP(3);
