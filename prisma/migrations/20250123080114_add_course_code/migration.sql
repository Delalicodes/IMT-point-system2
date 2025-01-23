/*
  Warnings:

  - Added the required column `code` to the `Course` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;

-- Add temporary code column
ALTER TABLE "Course" ADD COLUMN "temp_code" TEXT;

-- Update existing records with a default code based on their name
UPDATE "Course" SET temp_code = 'COURSE_' || substr(hex(randomblob(4)), 1, 8);

-- Create new table with the code column
CREATE TABLE "new_Course" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- Copy data from the old table to the new table
INSERT INTO "new_Course" ("id", "name", "code", "description", "createdAt", "updatedAt")
SELECT "id", "name", "temp_code", "description", "createdAt", "updatedAt"
FROM "Course";

-- Drop the old table
DROP TABLE "Course";

-- Rename the new table to the original name
ALTER TABLE "new_Course" RENAME TO "Course";

-- Create unique index for code
CREATE UNIQUE INDEX "Course_code_key" ON "Course"("code");

COMMIT;
PRAGMA foreign_keys=ON;
