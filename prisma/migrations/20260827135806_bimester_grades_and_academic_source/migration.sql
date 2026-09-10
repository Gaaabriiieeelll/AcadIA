-- CreateEnum
CREATE TYPE "AcademicDataSource" AS ENUM ('MANUAL', 'SUAP_REPORT', 'SUAP_API');

-- AlterTable
ALTER TABLE "subjects" ADD COLUMN     "academic_code" VARCHAR(30),
ADD COLUMN     "academic_period" VARCHAR(20),
ADD COLUMN     "academic_status" VARCHAR(30),
ADD COLUMN     "data_source" "AcademicDataSource" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "diary_code" VARCHAR(30),
ADD COLUMN     "final_assessment_score" DECIMAL(5,2),
ADD COLUMN     "final_average" DECIMAL(5,2),
ADD COLUMN     "official_average" DECIMAL(5,2),
ADD COLUMN     "source_updated_at" TIMESTAMP(3),
ADD COLUMN     "workload_classes" INTEGER;

-- CreateTable
CREATE TABLE "bimester_grades" (
    "id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "bimester" SMALLINT NOT NULL,
    "score" DECIMAL(5,2),
    "data_source" "AcademicDataSource" NOT NULL DEFAULT 'MANUAL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bimester_grades_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bimester_grades_subject_id_idx" ON "bimester_grades"("subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "bimester_grades_subject_id_bimester_key" ON "bimester_grades"("subject_id", "bimester");

-- AddForeignKey
ALTER TABLE "bimester_grades" ADD CONSTRAINT "bimester_grades_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Keep imported and manually edited academic values inside the IFPB scale.
ALTER TABLE "subjects"
ADD CONSTRAINT "subjects_workload_classes_check"
CHECK ("workload_classes" IS NULL OR "workload_classes" >= 0),
ADD CONSTRAINT "subjects_official_average_check"
CHECK ("official_average" IS NULL OR ("official_average" >= 0 AND "official_average" <= 100)),
ADD CONSTRAINT "subjects_final_assessment_score_check"
CHECK ("final_assessment_score" IS NULL OR ("final_assessment_score" >= 0 AND "final_assessment_score" <= 100)),
ADD CONSTRAINT "subjects_final_average_check"
CHECK ("final_average" IS NULL OR ("final_average" >= 0 AND "final_average" <= 100));

ALTER TABLE "bimester_grades"
ADD CONSTRAINT "bimester_grades_bimester_check"
CHECK ("bimester" BETWEEN 1 AND 4),
ADD CONSTRAINT "bimester_grades_score_check"
CHECK ("score" IS NULL OR ("score" >= 0 AND "score" <= 100));
