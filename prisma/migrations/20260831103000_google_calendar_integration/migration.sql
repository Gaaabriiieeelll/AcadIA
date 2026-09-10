CREATE TABLE "google_calendar_integrations" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "calendar_id" VARCHAR(1024) NOT NULL,
    "calendar_name" VARCHAR(160) NOT NULL DEFAULT 'AcadIA · Calendário acadêmico',
    "last_synced_at" TIMESTAMP(3),
    "last_synced_event_count" INTEGER NOT NULL DEFAULT 0,
    "last_sync_error" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "google_calendar_integrations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "google_calendar_integrations_user_id_key"
ON "google_calendar_integrations"("user_id");

CREATE UNIQUE INDEX "google_calendar_integrations_calendar_id_key"
ON "google_calendar_integrations"("calendar_id");

ALTER TABLE "google_calendar_integrations"
ADD CONSTRAINT "google_calendar_integrations_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
