ALTER TABLE "academic_alert_preferences"
ADD COLUMN "whatsapp_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "encrypted_whatsapp_phone" TEXT,
ADD COLUMN "whatsapp_phone_last_four" VARCHAR(4),
ADD COLUMN "whatsapp_consent_at" TIMESTAMP(3),
ADD COLUMN "whatsapp_verified_at" TIMESTAMP(3),
ADD COLUMN "whatsapp_last_test_at" TIMESTAMP(3);

ALTER TABLE "academic_alert_records"
ADD COLUMN "whatsapp_sent_at" TIMESTAMP(3),
ADD COLUMN "whatsapp_message_id" VARCHAR(255),
ADD COLUMN "whatsapp_last_attempt_at" TIMESTAMP(3),
ADD COLUMN "whatsapp_attempt_count" SMALLINT NOT NULL DEFAULT 0,
ADD COLUMN "whatsapp_last_error" VARCHAR(500);

CREATE INDEX "academic_alert_records_whatsapp_dispatch_idx"
ON "academic_alert_records"("user_id", "whatsapp_sent_at", "whatsapp_attempt_count");
