ALTER TABLE "google_calendar_integrations" ADD COLUMN "category_calendars" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "users" ADD COLUMN "calendar_sync_lease_token" UUID,
                    ADD COLUMN "calendar_sync_lease_until" TIMESTAMP(3);
