export const STUDY_WEEKDAYS = [
  { value: 1, shortLabel: "Seg", label: "Segunda-feira" },
  { value: 2, shortLabel: "Ter", label: "Terça-feira" },
  { value: 3, shortLabel: "Qua", label: "Quarta-feira" },
  { value: 4, shortLabel: "Qui", label: "Quinta-feira" },
  { value: 5, shortLabel: "Sex", label: "Sexta-feira" },
  { value: 6, shortLabel: "Sáb", label: "Sábado" },
  { value: 7, shortLabel: "Dom", label: "Domingo" },
] as const;

export type StudyWeekday = (typeof STUDY_WEEKDAYS)[number]["value"];
export type StudySessionStatus = "PLANNED" | "COMPLETED";
export type StudySessionSource = "AUTOMATIC" | "MANUAL";

export type StudyAvailabilityDTO = {
  weekday: StudyWeekday;
  startTime: string;
  endTime: string;
};

export type StudyPlanPreferenceDTO = {
  configured: boolean;
  weeklyGoalMinutes: number;
  sessionDuration: number;
  breakDuration: number;
  availability: StudyAvailabilityDTO[];
};

export type StudySessionDTO = {
  id: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  focus: string | null;
  rationale: string;
  priorityScore: number;
  status: StudySessionStatus;
  source: StudySessionSource;
  completedAt: string | null;
  subject: {
    id: string;
    name: string;
    color: string;
  };
};

export type StudySubjectPriorityDTO = {
  subjectId: string;
  name: string;
  color: string;
  score: number;
  reasons: string[];
  suggestedFocus: string;
};

export type StudyPlanSummaryDTO = {
  totalSessions: number;
  completedSessions: number;
  plannedMinutes: number;
  completedMinutes: number;
  goalMinutes: number;
  progressPercentage: number;
};

export type StudyPlanDTO = {
  weekStart: string;
  weekEnd: string;
  todayDateKey: string;
  preferences: StudyPlanPreferenceDTO;
  sessions: StudySessionDTO[];
  priorities: StudySubjectPriorityDTO[];
  subjects: Array<{ id: string; name: string; color: string }>;
  summary: StudyPlanSummaryDTO;
};

export type StudyPlanPreferenceFormField =
  | "weeklyGoalHours"
  | "sessionDuration"
  | "breakDuration"
  | "availability";

export type StudySessionFormField =
  | "subjectId"
  | "scheduledDate"
  | "startTime"
  | "durationMinutes"
  | "focus";

export type StudyPlanFormState<Field extends string = never> = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<Field, string[]>>;
};

export type StudyPlanPreferenceFormState = StudyPlanFormState<StudyPlanPreferenceFormField>;
export type StudySessionFormState = StudyPlanFormState<StudySessionFormField>;
export type StudyPlanGenerateState = StudyPlanFormState;

export type StudyPlanPreferenceValues = {
  weeklyGoalMinutes: number;
  sessionDuration: number;
  breakDuration: number;
  availability: StudyAvailabilityDTO[];
};

export type StudySessionFormValues = {
  subjectId: string;
  scheduledDate: string;
  startTime: string;
  durationMinutes: number;
  focus: string | null;
};
