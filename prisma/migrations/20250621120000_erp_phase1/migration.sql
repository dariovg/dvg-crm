-- ERP Phase 1: roles, finanzas y RRHH

-- CreateEnum
CREATE TYPE "FinanceEntryType" AS ENUM ('EXPENSE', 'INCOME');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'ADMINISTRATION';
ALTER TYPE "UserRole" ADD VALUE 'FINANCE';

-- CreateTable
CREATE TABLE "EmployeeProfile" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fullName" TEXT NOT NULL,
    "department" TEXT,
    "jobTitle" TEXT,
    "contractType" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "monthlyCost" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "userId" TEXT,

    CONSTRAINT "EmployeeProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FinanceCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "FinanceEntryType" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "FinanceCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FinanceEntry" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" "FinanceEntryType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "entryDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "attachmentUrl" TEXT,
    "categoryId" TEXT NOT NULL,
    "quoteId" TEXT,
    "contactId" TEXT,
    "createdById" TEXT,

    CONSTRAINT "FinanceEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeProfile_userId_key" ON "EmployeeProfile"("userId");
CREATE INDEX "EmployeeProfile_active_idx" ON "EmployeeProfile"("active");
CREATE INDEX "EmployeeProfile_department_idx" ON "EmployeeProfile"("department");
CREATE UNIQUE INDEX "FinanceCategory_slug_key" ON "FinanceCategory"("slug");
CREATE INDEX "FinanceEntry_entryDate_idx" ON "FinanceEntry"("entryDate");
CREATE INDEX "FinanceEntry_type_idx" ON "FinanceEntry"("type");
CREATE INDEX "FinanceEntry_categoryId_idx" ON "FinanceEntry"("categoryId");
CREATE INDEX "FinanceEntry_quoteId_idx" ON "FinanceEntry"("quoteId");
CREATE INDEX "FinanceEntry_contactId_idx" ON "FinanceEntry"("contactId");

-- AddForeignKey
ALTER TABLE "EmployeeProfile" ADD CONSTRAINT "EmployeeProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FinanceEntry" ADD CONSTRAINT "FinanceEntry_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "FinanceCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FinanceEntry" ADD CONSTRAINT "FinanceEntry_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FinanceEntry" ADD CONSTRAINT "FinanceEntry_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FinanceEntry" ADD CONSTRAINT "FinanceEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
