ALTER TABLE "calendar_events"
  ALTER COLUMN "end_date" DROP NOT NULL,
  ADD COLUMN "completed_at" TIMESTAMP(3);

CREATE INDEX "calendar_events_user_id_end_date_completed_at_idx"
  ON "calendar_events"("user_id", "end_date", "completed_at");

CREATE TABLE "android_widget_credentials" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "device_name" VARCHAR(80) NOT NULL,
  "pairing_code_hash" CHAR(64) NOT NULL,
  "token_hash" CHAR(64),
  "pairing_expires_at" TIMESTAMP(3) NOT NULL,
  "activated_at" TIMESTAMP(3),
  "last_used_at" TIMESTAMP(3),
  "revoked_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "android_widget_credentials_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "android_widget_credentials_pairing_code_hash_key"
  ON "android_widget_credentials"("pairing_code_hash");

CREATE UNIQUE INDEX "android_widget_credentials_token_hash_key"
  ON "android_widget_credentials"("token_hash");

CREATE INDEX "android_widget_credentials_user_id_revoked_at_idx"
  ON "android_widget_credentials"("user_id", "revoked_at");

CREATE INDEX "android_widget_credentials_pairing_expires_at_activated_at_idx"
  ON "android_widget_credentials"("pairing_expires_at", "activated_at");

ALTER TABLE "android_widget_credentials"
  ADD CONSTRAINT "android_widget_credentials_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
