-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "url" TEXT NOT NULL DEFAULT '',
    "kind" TEXT NOT NULL DEFAULT 'none',
    "status" TEXT NOT NULL DEFAULT 'building',
    "source" TEXT NOT NULL DEFAULT 'git',
    "repository" TEXT NOT NULL DEFAULT '',
    "branch" TEXT NOT NULL DEFAULT 'main',
    "preset" TEXT NOT NULL DEFAULT 'nuxt',
    "rootDirectory" TEXT NOT NULL DEFAULT './',
    "installCommand" TEXT NOT NULL DEFAULT '',
    "buildCommand" TEXT NOT NULL DEFAULT '',
    "outputDirectory" TEXT NOT NULL DEFAULT '.',
    "fileCount" INTEGER NOT NULL DEFAULT 0,
    "deployments" INTEGER NOT NULL DEFAULT 0,
    "requests" TEXT NOT NULL DEFAULT '0',
    "errorRate" TEXT NOT NULL DEFAULT '0%',
    "sparkline" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_name_key" ON "Project"("name");
