-- ReturnRequest model
CREATE TYPE "ReturnRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');

CREATE TABLE "ReturnRequest" (
    "id"        TEXT NOT NULL,
    "orderId"   TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "reason"    VARCHAR(1000) NOT NULL,
    "items"     JSONB NOT NULL,
    "status"    "ReturnRequestStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ReturnRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ReturnRequest_orderId_idx"  ON "ReturnRequest"("orderId");
CREATE INDEX "ReturnRequest_userId_idx"   ON "ReturnRequest"("userId");
CREATE INDEX "ReturnRequest_status_idx"   ON "ReturnRequest"("status");
