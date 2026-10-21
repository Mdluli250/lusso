CREATE TYPE "FulfillmentStatus" AS ENUM ('UNFULFILLED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED');

CREATE TABLE "ShippingAddress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recipient" VARCHAR(120) NOT NULL,
    "phone" VARCHAR(30) NOT NULL,
    "addressLine1" VARCHAR(180) NOT NULL,
    "addressLine2" VARCHAR(180),
    "city" VARCHAR(100) NOT NULL,
    "province" VARCHAR(100) NOT NULL,
    "postalCode" VARCHAR(20) NOT NULL,
    "country" VARCHAR(80) NOT NULL DEFAULT 'South Africa',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShippingAddress_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ShippingAddress_userId_key" ON "ShippingAddress"("userId");
ALTER TABLE "ShippingAddress" ADD CONSTRAINT "ShippingAddress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Order"
  ADD COLUMN "shippingAddress" JSONB,
  ADD COLUMN "shippingAmountZAR" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "fulfillmentStatus" "FulfillmentStatus" NOT NULL DEFAULT 'UNFULFILLED',
  ADD COLUMN "carrier" VARCHAR(100),
  ADD COLUMN "trackingNumber" VARCHAR(200),
  ADD COLUMN "shippedAt" TIMESTAMP(3),
  ADD COLUMN "deliveredAt" TIMESTAMP(3),
  ADD COLUMN "refundedAt" TIMESTAMP(3),
  ADD COLUMN "refundReference" VARCHAR(200),
  ADD COLUMN "refundAmountZAR" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "payfastPaymentId" TEXT,
  ADD COLUMN "reservationExpiresAt" TIMESTAMP(3);

ALTER TABLE "Subscription"
  ADD COLUMN "token" VARCHAR(255),
  ADD COLUMN "paymentMethod" VARCHAR(80),
  ADD COLUMN "lastChargedAt" TIMESTAMP(3),
  ADD COLUMN "retryCount" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "type" VARCHAR(80) NOT NULL,
    "recipient" VARCHAR(254) NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "NotificationLog_key_key" ON "NotificationLog"("key");

