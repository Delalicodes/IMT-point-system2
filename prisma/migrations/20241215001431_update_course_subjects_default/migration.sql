/*
  Warnings:

  - You are about to drop the `CourseSubject` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Subject` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `code` on the `Course` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "CourseSubject_courseId_subjectId_key";

-- DropIndex
DROP INDEX "CourseSubject_subjectId_idx";

-- DropIndex
DROP INDEX "CourseSubject_courseId_idx";

-- DropIndex
DROP INDEX "Subject_code_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "CourseSubject";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Subject";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Course" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "subjects" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Course" ("createdAt", "description", "id", "name", "updatedAt") SELECT "createdAt", "description", "id", "name", "updatedAt" FROM "Course";
DROP TABLE "Course";
ALTER TABLE "new_Course" RENAME TO "Course";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
