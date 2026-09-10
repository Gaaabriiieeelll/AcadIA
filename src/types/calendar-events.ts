export const CALENDAR_EVENT_TYPES = [
  "EXAM",
  "FIELD_CLASS",
  "ASSIGNMENT",
  "PRESENTATION",
  "MEETING",
  "OTHER",
] as const;

export type CalendarEventTypeValue = (typeof CALENDAR_EVENT_TYPES)[number];

export const CALENDAR_EVENT_TYPE_DETAILS: Record<
  CalendarEventTypeValue,
  { label: string; color: string }
> = {
  EXAM: { label: "Prova", color: "#be123c" },
  FIELD_CLASS: { label: "Aula de campo", color: "#0f766e" },
  ASSIGNMENT: { label: "Entrega ou atividade", color: "#2563eb" },
  PRESENTATION: { label: "Apresentação", color: "#7c3aed" },
  MEETING: { label: "Reunião", color: "#c2410c" },
  OTHER: { label: "Outro evento", color: "#64748b" },
};

export type CalendarEventFormValues = {
  subjectId: string | null;
  title: string;
  description: string | null;
  eventType: CalendarEventTypeValue;
  startDate: string;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
};

export type CalendarEventFormField =
  | "subjectId"
  | "title"
  | "description"
  | "eventType"
  | "startDate"
  | "endDate"
  | "startTime"
  | "endTime";

export type CalendarEventFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<CalendarEventFormField, string[]>>;
};

export type CalendarEventDTO = {
  id: string;
  title: string;
  description: string | null;
  eventType: CalendarEventTypeValue;
  startDate: string;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  completedAt: string | null;
  subject: {
    id: string;
    name: string;
    color: string;
  } | null;
};
