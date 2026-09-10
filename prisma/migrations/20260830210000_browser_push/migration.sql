ALTER TABLE "academic_alert_records"
ADD COLUMN "browser_push_generation" SMALLINT NOT NULL DEFAULT 1;

CREATE TABLE "browser_push_subscriptions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "endpoint_hash" CHAR(64) NOT NULL,
    "encrypted_endpoint" TEXT NOT NULL,
    "encrypted_p256dh" TEXT NOT NULL,
    "encrypted_auth" TEXT NOT NULL,
    "expiration_at" TIMESTAMP(3),
    "disabled_at" TIMESTAMP(3),
    "last_success_at" TIMESTAMP(3),
    "failure_count" SMALLINT NOT NULL DEFAULT 0,
    "last_error" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "browser_push_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "browser_push_deliveries" (
    "id" UUID NOT NULL,
    "alert_record_id" UUID NOT NULL,
    "subscription_id" UUID NOT NULL,
    "generation" SMALLINT NOT NULL DEFAULT 1,
    "attempt_count" SMALLINT NOT NULL DEFAULT 0,
    "last_attempt_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "suppressed_at" TIMESTAMP(3),
    "last_error" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "browser_push_deliveries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "browser_push_subscriptions_endpoint_hash_key"
ON "browser_push_subscriptions"("endpoint_hash");

CREATE INDEX "browser_push_subscriptions_user_id_disabled_at_idx"
ON "browser_push_subscriptions"("user_id", "disabled_at");

CREATE UNIQUE INDEX "browser_push_deliveries_alert_record_id_subscription_id_generation_key"
ON "browser_push_deliveries"("alert_record_id", "subscription_id", "generation");

CREATE INDEX "browser_push_deliveries_dispatch_idx"
ON "browser_push_deliveries"("subscription_id", "delivered_at", "attempt_count");

ALTER TABLE "browser_push_subscriptions"
ADD CONSTRAINT "browser_push_subscriptions_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "browser_push_deliveries"
ADD CONSTRAINT "browser_push_deliveries_alert_record_id_fkey"
FOREIGN KEY ("alert_record_id") REFERENCES "academic_alert_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "browser_push_deliveries"
ADD CONSTRAINT "browser_push_deliveries_subscription_id_fkey"
FOREIGN KEY ("subscription_id") REFERENCES "browser_push_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
