-- AlterTable
ALTER TABLE "User" ADD COLUMN     "salesforceAccountId" TEXT,
ADD COLUMN     "salesforceContactId" TEXT,
ADD COLUMN     "salesforceSyncedAt" TIMESTAMP(3);
