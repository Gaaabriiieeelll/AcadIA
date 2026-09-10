CREATE TABLE "google_calendar_credentials" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "account_google_subject" VARCHAR(255) NOT NULL,
    "account_email" VARCHAR(320) NOT NULL,
    "encrypted_access_token" TEXT NOT NULL,
    "encrypted_refresh_token" TEXT,
    "access_token_expires_at" TIMESTAMP(3),
    "granted_scopes" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "google_calendar_credentials_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "google_calendar_credentials_user_id_key"
ON "google_calendar_credentials"("user_id");

CREATE INDEX "google_calendar_credentials_account_email_idx"
ON "google_calendar_credentials"("account_email");

ALTER TABLE "google_calendar_credentials"
ADD CONSTRAINT "google_calendar_credentials_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
