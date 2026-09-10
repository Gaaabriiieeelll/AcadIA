-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "academic_tasks" (
    "id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "title" VARCHAR(140) NOT NULL,
    "description" VARCHAR(500),
    "due_date" DATE NOT NULL,
    "due_time" VARCHAR(5),
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_tasks_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "academic_tasks_due_time_check" CHECK (
        "due_time" IS NULL OR
        "due_time" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
    )
);

-- CreateIndex
CREATE INDEX "academic_tasks_subject_id_idx" ON "academic_tasks"("subject_id");

-- CreateIndex
CREATE INDEX "academic_tasks_due_date_idx" ON "academic_tasks"("due_date");

-- AddForeignKey
ALTER TABLE "academic_tasks" ADD CONSTRAINT "academic_tasks_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
