import type { BimesterCount, BimesterGradeDTO } from "@/types/subjects";

// Projection of regular bimesters with equal weights, independent of SUAP results.
export function projectGrades(grades: BimesterGradeDTO[], count: BimesterCount, target: number) {
  const scores = Array.from({ length: count }, (_, index) =>
    grades.find((grade) => grade.bimester === index + 1)?.score ?? null,
  ).filter((score): score is number => score !== null);
  const total = scores.reduce((sum, score) => sum + score, 0);
  const remaining = count - scores.length;
  const needed = remaining > 0 ? Math.max(0, (target * count - total) / remaining) : null;
  return {
    remaining,
    filled: scores.length,
    neededAverage: needed === null ? null : Math.ceil((needed - 1e-9) * 10) / 10,
    maximumAverage: (total + remaining * 100) / count,
    status: total >= target * count ? "reached" as const
      : remaining === 0 ? "finished" as const
      : needed! > 100 ? "unreachable" as const : "pending" as const,
  };
}
