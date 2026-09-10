export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;

export type TaskPriorityValue = (typeof TASK_PRIORITIES)[number];

export type AcademicTaskFormValues = {
  subjectId: string;
  title: string;
  description: string | null;
  dueDate: string;
  dueTime: string | null;
  priority: TaskPriorityValue;
};

export type AcademicTaskFormField =
  | "subjectId"
  | "title"
  | "description"
  | "dueDate"
  | "dueTime"
  | "priority";

export type AcademicTaskFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<AcademicTaskFormField, string[]>>;
};

export type AcademicTaskStatus = "overdue" | "today" | "upcoming" | "completed";

export type AcademicTaskSourceValue = "MANUAL" | "GOOGLE_CLASSROOM";

export type AcademicTaskDTO = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  dueTime: string | null;
  priority: TaskPriorityValue;
  source: AcademicTaskSourceValue;
  sourceUrl: string | null;
  completed: boolean;
  completedAt: string | null;
  status: AcademicTaskStatus;
  subject: {
    id: string;
    name: string;
    color: string;
  };
};

export type AcademicTaskOverviewDTO = {
  pendingCount: number;
  dueTodayCount: number;
  overdueCount: number;
  dueSoonCount: number;
  nextTask: AcademicTaskDTO | null;
};
