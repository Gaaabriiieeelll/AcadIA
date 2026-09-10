-- Replace the original 0-10 score constraint with the IFPB 0-100 scale.
ALTER TABLE "assessments"
DROP CONSTRAINT "assessments_score_check";

ALTER TABLE "assessments"
ADD CONSTRAINT "assessments_score_check"
CHECK ("score" >= 0 AND "score" <= 100);
