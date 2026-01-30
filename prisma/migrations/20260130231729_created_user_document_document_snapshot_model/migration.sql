-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "currentDecayLevel" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "globalDecayMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "documentAge" BIGINT NOT NULL DEFAULT 0,
    "totalEdits" INTEGER NOT NULL DEFAULT 0,
    "currentPageIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSavedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentSnapshot" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "decayLevel" DOUBLE PRECISION NOT NULL,
    "documentAge" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE INDEX "Document_userId_idx" ON "Document"("userId");

-- CreateIndex
CREATE INDEX "Document_title_idx" ON "Document"("title");

-- CreateIndex
CREATE INDEX "Document_updatedAt_idx" ON "Document"("updatedAt");

-- CreateIndex
CREATE INDEX "DocumentSnapshot_documentId_idx" ON "DocumentSnapshot"("documentId");

-- CreateIndex
CREATE INDEX "DocumentSnapshot_createdAt_idx" ON "DocumentSnapshot"("createdAt");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentSnapshot" ADD CONSTRAINT "DocumentSnapshot_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
