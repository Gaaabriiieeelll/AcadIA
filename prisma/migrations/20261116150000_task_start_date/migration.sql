ALTER TABLE "academic_tasks" ADD COLUMN "start_date" DATE, ADD COLUMN "start_date_source" VARCHAR(24);
ALTER TABLE "academic_tasks" ADD CONSTRAINT "academic_task_date_range" CHECK ("start_date" IS NULL OR "start_date" <= "due_date");
