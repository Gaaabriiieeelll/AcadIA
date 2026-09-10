-- AlterTable
ALTER TABLE "subjects" ADD COLUMN     "bimester_count" SMALLINT NOT NULL DEFAULT 4;

-- Configure the two semester-long technical subjects.
UPDATE "subjects"
SET "bimester_count" = 2
WHERE "name" IN (
  'LABORATÓRIO DE MATERIAIS · G1',
  'TECNOLOGIA MECÂNICA · G1'
);

-- Remove only the unused grade slots beyond each subject's configured length.
DELETE FROM "bimester_grades" AS "grade"
USING "subjects" AS "subject"
WHERE "grade"."subject_id" = "subject"."id"
  AND "grade"."bimester" > "subject"."bimester_count";

ALTER TABLE "subjects"
ADD CONSTRAINT "subjects_bimester_count_check"
CHECK ("bimester_count" IN (2, 4));
