import type { SubjectColor } from "@/types/subjects";

export const SUBJECT_AREAS = {
  exact: { label: "Exatas", color: "#2563eb" },
  nature: { label: "Ciências da natureza", color: "#16833f" },
  human: { label: "Humanas", color: "#7c3aed" },
  languages: { label: "Linguagens", color: "#c2410c" },
  technical: { label: "Formação técnica", color: "#0f766e" },
  wellbeing: { label: "Corpo e bem-estar", color: "#be123c" },
} as const satisfies Record<string, { label: string; color: SubjectColor }>;

export type SubjectArea = keyof typeof SUBJECT_AREAS;
