ALTER TABLE "academic_alert_preferences" ADD COLUMN "reminder_days" SMALLINT NOT NULL DEFAULT 7;
ALTER TABLE "academic_alert_preferences" ADD CONSTRAINT "alert_reminder_days_range" CHECK ("reminder_days" BETWEEN 0 AND 30);
