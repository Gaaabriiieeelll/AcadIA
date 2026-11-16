ALTER TABLE "users" ADD COLUMN "calendar_visibility" JSONB NOT NULL DEFAULT '{}',
                    ADD COLUMN "calendar_visibility_pending" JSONB NOT NULL DEFAULT '{}';
