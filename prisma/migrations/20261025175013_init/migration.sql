-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT NOT NULL DEFAULT '',
    "industry" TEXT NOT NULL DEFAULT '',
    "businessModel" TEXT NOT NULL DEFAULT '',
    "stage" TEXT NOT NULL DEFAULT '',
    "teamSize" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "productsServices" TEXT NOT NULL DEFAULT '',
    "targetCustomers" TEXT NOT NULL DEFAULT '',
    "competitors" TEXT NOT NULL DEFAULT '',
    "goals" TEXT NOT NULL DEFAULT '',
    "challenges" TEXT NOT NULL DEFAULT '',
    "brandVoice" TEXT NOT NULL DEFAULT ''
);
