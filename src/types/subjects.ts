export const SUBJECT_COLORS = [
  "#16833f",
  "#0f766e",
  "#2563eb",
  "#7c3aed",
  "#c2410c",
  "#be123c",
] as const;

export type SubjectColor = (typeof SUBJECT_COLORS)[number];

export type SubjectFormValues = {
  name: string;
  teacher: string | null;
  color: SubjectColor;
};

export type AssessmentFormValues = {
  name: string;
  score: number;
  weight: number;
};

export const BIMESTERS = [1, 2, 3, 4] as const;

export type BimesterNumber = (typeof BIMESTERS)[number];
export type BimesterCount = 2 | 4;

export function getSubjectBimesters(count: BimesterCount) {
  return BIMESTERS.slice(0, count) as BimesterNumber[];
}

export type BimesterGradesFormValues = {
  bimester1: number | null;
  bimester2: number | null;
  bimester3: number | null;
  bimester4: number | null;
};

export type AttendanceFormValues = {
  classesHeld: number;
  absences: number;
};

export type SubjectFormField = "name" | "teacher" | "color";
export type AssessmentFormField = "assessmentName" | "score" | "weight";
export type BimesterGradesFormField = keyof BimesterGradesFormValues;
export type AttendanceFormField = "classesHeld" | "absences";

export type FormActionState<Field extends string> = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<Field, string[]>>;
};

export type SubjectFormState = FormActionState<SubjectFormField>;
export type HifpbSubjectImportState = FormActionState<never>;
export type AssessmentFormState = FormActionState<AssessmentFormField>;
export type BimesterGradesFormState = FormActionState<BimesterGradesFormField>;
export type AttendanceFormState = FormActionState<AttendanceFormField>;

export type AssessmentDTO = {
  id: string;
  name: string;
  score: number;
  weight: number;
};

export type BimesterGradeDTO = {
  bimester: BimesterNumber;
  score: number | null;
  dataSource: "MANUAL" | "SUAP_REPORT" | "SUAP_API";
};

export type SubjectDTO = {
  id: string;
  name: string;
  teacher: string | null;
  color: string;
  classesHeld: number;
  absences: number;
  attendancePercentage: number | null;
  bimesterCount: BimesterCount;
  bimesterAverage: number | null;
  averageScore: number | null;
  officialAverage: number | null;
  finalAssessmentScore: number | null;
  finalAverage: number | null;
  academicStatus: string | null;
  academicPeriod: string | null;
  dataSource: "MANUAL" | "SUAP_REPORT" | "SUAP_API";
  sourceUpdatedAt: string | null;
  bimesterGrades: BimesterGradeDTO[];
  assessments: AssessmentDTO[];
};

export type SubjectFilterOption = Pick<SubjectDTO, "id" | "name" | "color">;

export type AcademicOverviewDTO = {
  subjectCount: number;
  assessmentCount: number;
  totalBimesterCount: number;
  subjectsWithoutGrades: number;
  twoBimesterSubjects: number;
  fourBimesterSubjects: number;
  averageScore: number | null;
  attendancePercentage: number | null;
};

export type AcademicBimesterOverviewDTO = {
  bimester: BimesterNumber;
  averageScore: number | null;
  filledGrades: number;
  eligibleSubjects: number;
};

export type AcademicDashboardDTO = {
  availableSubjects: SubjectFilterOption[];
  selectedSubjectIds: string[];
  overview: AcademicOverviewDTO;
  bimesters: AcademicBimesterOverviewDTO[];
  subjects: SubjectDTO[];
};
