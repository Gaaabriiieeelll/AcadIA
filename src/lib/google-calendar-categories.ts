import type { CalendarEventTypeValue } from "@/types/calendar-events";

export const GOOGLE_CALENDAR_CATEGORIES = {
  institutional: { name: "Conecta Campus · Calendário institucional", color: "#8e24aa", eventColorId: "3" },
  exams: { name: "Conecta Campus · Provas", color: "#3f51b5", eventColorId: "9" },
  activities: { name: "Conecta Campus · Atividades", color: "#0b8043", eventColorId: "10" },
  notices: { name: "Conecta Campus · Editais", color: "#f4511e", eventColorId: "6" },
  personal: { name: "Conecta Campus · Compromissos pessoais", color: "#616161", eventColorId: "8" },
} as const;

export type GoogleCalendarCategory = keyof typeof GOOGLE_CALENDAR_CATEGORIES;

export function personalCalendarCategory(type: CalendarEventTypeValue): GoogleCalendarCategory {
  if (type === "EXAM") return "exams";
  if (type === "ASSIGNMENT" || type === "PRESENTATION") return "activities";
  return "personal";
}

export function readCategoryCalendarIds(value: unknown): Partial<Record<GoogleCalendarCategory, string>> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.keys(GOOGLE_CALENDAR_CATEGORIES).flatMap((key) => {
    const id = (value as Record<string, unknown>)[key];
    return typeof id === "string" && id.length > 0 ? [[key, id]] : [];
  }));
}
