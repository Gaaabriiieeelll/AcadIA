-- CreateTable
CREATE TABLE "academic_alert_preferences" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "target_average" SMALLINT NOT NULL DEFAULT 70,
    "minimum_attendance" SMALLINT NOT NULL DEFAULT 75,
    "grades_enabled" BOOLEAN NOT NULL DEFAULT true,
    "attendance_enabled" BOOLEAN NOT NULL DEFAULT true,
    "tasks_enabled" BOOLEAN NOT NULL DEFAULT true,
    "calendar_enabled" BOOLEAN NOT NULL DEFAULT true,
    "browser_notifications" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_alert_preferences_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "academic_alert_preferences_target_average_check" CHECK ("target_average" BETWEEN 0 AND 100),
    CONSTRAINT "academic_alert_preferences_minimum_attendance_check" CHECK ("minimum_attendance" BETWEEN 0 AND 100)
);

-- CreateTable
CREATE TABLE "academic_alert_records" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "alert_key" VARCHAR(255) NOT NULL,
    "category" VARCHAR(20) NOT NULL,
    "severity" VARCHAR(20) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" VARCHAR(800) NOT NULL,
    "action_label" VARCHAR(80) NOT NULL,
    "href" VARCHAR(300) NOT NULL,
    "date_key" DATE,
    "accent_color" VARCHAR(7),
    "first_detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(3),
    "dismissed_at" TIMESTAMP(3),
    "snoozed_until" DATE,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_alert_records_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "academic_alert_records_category_check" CHECK ("category" IN ('grades', 'attendance', 'tasks', 'calendar')),
    CONSTRAINT "academic_alert_records_severity_check" CHECK ("severity" IN ('critical', 'warning', 'info'))
);

-- CreateIndex
CREATE UNIQUE INDEX "academic_alert_preferences_user_id_key" ON "academic_alert_preferences"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "academic_alert_records_user_id_alert_key_key" ON "academic_alert_records"("user_id", "alert_key");

-- CreateIndex
CREATE INDEX "academic_alert_records_user_id_last_detected_at_idx" ON "academic_alert_records"("user_id", "last_detected_at");

-- AddForeignKey
ALTER TABLE "academic_alert_preferences" ADD CONSTRAINT "academic_alert_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_alert_records" ADD CONSTRAINT "academic_alert_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
