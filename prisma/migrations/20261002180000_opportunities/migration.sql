CREATE TABLE "opportunities" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" VARCHAR(140) NOT NULL,
    "organization" VARCHAR(120) NOT NULL,
    "kind" VARCHAR(20) NOT NULL,
    "accepted_courses" VARCHAR(250),
    "modality" VARCHAR(20) NOT NULL DEFAULT 'unspecified',
    "location" VARCHAR(120),
    "deadline" DATE,
    "source_url" TEXT NOT NULL,
    "requirements" TEXT,
    "documents" TEXT,
    "notes" TEXT,
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "reminder_event_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "opportunities_reminder_event_id_key"
ON "opportunities"("reminder_event_id");

CREATE INDEX "opportunities_user_id_deadline_idx"
ON "opportunities"("user_id", "deadline");

ALTER TABLE "opportunities"
ADD CONSTRAINT "opportunities_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "opportunities"
ADD CONSTRAINT "opportunities_reminder_event_id_fkey"
FOREIGN KEY ("reminder_event_id") REFERENCES "calendar_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
