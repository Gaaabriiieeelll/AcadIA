-- CreateEnum
CREATE TYPE "CalendarEventType" AS ENUM ('EXAM', 'FIELD_CLASS', 'ASSIGNMENT', 'PRESENTATION', 'MEETING', 'OTHER');

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "subject_id" UUID,
    "title" VARCHAR(140) NOT NULL,
    "description" VARCHAR(500),
    "event_type" "CalendarEventType" NOT NULL DEFAULT 'OTHER',
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "start_time" VARCHAR(5),
    "end_time" VARCHAR(5),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "calendar_events_user_id_start_date_idx" ON "calendar_events"("user_id", "start_date");

-- CreateIndex
CREATE INDEX "calendar_events_subject_id_idx" ON "calendar_events"("subject_id");

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
