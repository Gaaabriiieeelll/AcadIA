-- Configure the two semester-long humanities subjects.
UPDATE "subjects"
SET "bimester_count" = 2
WHERE "name" IN (
  'FILOSOFIA II',
  'SOCIOLOGIA II'
);

-- Remove only grade slots that no longer belong to these subjects.
DELETE FROM "bimester_grades" AS "grade"
USING "subjects" AS "subject"
WHERE "grade"."subject_id" = "subject"."id"
  AND "grade"."bimester" > "subject"."bimester_count";
