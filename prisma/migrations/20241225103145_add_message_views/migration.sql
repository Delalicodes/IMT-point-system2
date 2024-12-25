-- CreateTable
CREATE TABLE "MessageView" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "viewedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MessageView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MessageView_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ChatMessage" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "MessageView_userId_idx" ON "MessageView"("userId");

-- CreateIndex
CREATE INDEX "MessageView_messageId_idx" ON "MessageView"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageView_userId_messageId_key" ON "MessageView"("userId", "messageId");
