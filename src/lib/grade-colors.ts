import type { CSSProperties } from "react";

export const GRADE_COLOR_START = 70;
export const GRADE_COLOR_END = 100;

const RED_HUE = 0;
const GREEN_HUE = 120;

export type GradeColorStyle = CSSProperties & {
  "--grade-hue": number;
};

export function getGradeHue(score: number) {
  if (score <= GRADE_COLOR_START) return RED_HUE;

  const boundedScore = Math.min(score, GRADE_COLOR_END);
  const progress = (boundedScore - GRADE_COLOR_START) / (GRADE_COLOR_END - GRADE_COLOR_START);
  return Math.round((RED_HUE + progress * (GREEN_HUE - RED_HUE)) * 10) / 10;
}

export function getGradeColorStyle(score: number | null): GradeColorStyle | undefined {
  return score === null ? undefined : { "--grade-hue": getGradeHue(score) };
}
