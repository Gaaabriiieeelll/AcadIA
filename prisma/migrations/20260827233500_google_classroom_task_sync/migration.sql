-- CreateEnum
CREATE TYPE "AcademicTaskSource" AS ENUM ('MANUAL', 'GOOGLE_CLASSROOM');

-- AlterTable
ALTER TABLE "google_classroom_credentials"
ADD COLUMN "last_task_sync_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "academic_tasks"
ADD COLUMN "source" "AcademicTaskSource" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN "classroom_course_id" VARCHAR(255),
ADD COLUMN "classroom_course_work_id" VARCHAR(255),
ADD COLUMN "source_url" TEXT,
ADD COLUMN "source_updated_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "academic_tasks_subject_id_classroom_course_id_classroom_course_work_id_key"
ON "academic_tasks"("subject_id", "classroom_course_id", "classroom_course_work_id");
