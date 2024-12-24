/*
  Warnings:

  - You are about to drop the `ClockingRecord` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ClockingRecord";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "clocking_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalHours" REAL,
    CONSTRAINT "clocking_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "clocking_records_userId_idx" ON "clocking_records"("userId");
