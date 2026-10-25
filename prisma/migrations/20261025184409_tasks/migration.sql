-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "prompt" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "routing" TEXT NOT NULL,
    "routingReason" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'queued',
    "aiMode" TEXT NOT NULL DEFAULT 'mock',
    "summary" TEXT NOT NULL DEFAULT '',
    "output" TEXT NOT NULL DEFAULT '',
    "error" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "Task_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Task_workspaceId_createdAt_idx" ON "Task"("workspaceId", "createdAt");
