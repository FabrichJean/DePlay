-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Deployment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL DEFAULT 'Web Application',
    "runtime" TEXT NOT NULL DEFAULT 'Node.js',
    "environment" TEXT NOT NULL DEFAULT 'Production',
    "url" TEXT NOT NULL DEFAULT '',
    "buildDir" TEXT NOT NULL DEFAULT '',
    "branch" TEXT NOT NULL DEFAULT 'main',
    "commit" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'deployed',
    "deployedAt" TEXT NOT NULL DEFAULT '',
    "duration" TEXT NOT NULL DEFAULT '',
    "steps" TEXT NOT NULL DEFAULT '[]',
    "logs" TEXT NOT NULL DEFAULT '[]',
    "info" TEXT NOT NULL DEFAULT '{}',
    "server" TEXT NOT NULL DEFAULT '{}',
    "metrics" TEXT NOT NULL DEFAULT '[]',
    "build" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Deployment" ("branch", "buildDir", "commit", "createdAt", "deployedAt", "description", "duration", "environment", "id", "info", "logs", "metrics", "name", "projectId", "runtime", "server", "status", "steps", "type", "url") SELECT "branch", "buildDir", "commit", "createdAt", "deployedAt", "description", "duration", "environment", "id", "info", "logs", "metrics", "name", "projectId", "runtime", "server", "status", "steps", "type", "url" FROM "Deployment";
DROP TABLE "Deployment";
ALTER TABLE "new_Deployment" RENAME TO "Deployment";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
