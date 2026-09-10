import type { AcademicCalendarCategory } from "@/data/academic-calendar";
import type { CalendarEventTypeValue } from "@/types/calendar-events";

export const GOOGLE_CALENDAR_EVENT_COLOR_IDS = {
  BLUE: "9",
  GREEN: "10",
  RED: "11",
  YELLOW: "5",
  GRAY: "8",
} as const;

const PERSONAL_EVENT_COLOR_IDS: Record<CalendarEventTypeValue, string> = {
  EXAM: GOOGLE_CALENDAR_EVENT_COLOR_IDS.RED,
  FIELD_CLASS: GOOGLE_CALENDAR_EVENT_COLOR_IDS.GREEN,
  ASSIGNMENT: GOOGLE_CALENDAR_EVENT_COLOR_IDS.RED,
  PRESENTATION: GOOGLE_CALENDAR_EVENT_COLOR_IDS.RED,
  MEETING: GOOGLE_CALENDAR_EVENT_COLOR_IDS.BLUE,
  OTHER: GOOGLE_CALENDAR_EVENT_COLOR_IDS.GRAY,
};

const ACADEMIC_EVENT_COLOR_IDS: Record<AcademicCalendarCategory, string> = {
  holiday: GOOGLE_CALENDAR_EVENT_COLOR_IDS.YELLOW,
  recess: GOOGLE_CALENDAR_EVENT_COLOR_IDS.GREEN,
  milestone: GOOGLE_CALENDAR_EVENT_COLOR_IDS.BLUE,
  evaluation: GOOGLE_CALENDAR_EVENT_COLOR_IDS.RED,
  institutional: GOOGLE_CALENDAR_EVENT_COLOR_IDS.BLUE,
};

export function googleCalendarColorForPersonalEvent(eventType: CalendarEventTypeValue) {
  return PERSONAL_EVENT_COLOR_IDS[eventType];
}

export function googleCalendarColorForAcademicEvent(category: AcademicCalendarCategory) {
  return ACADEMIC_EVENT_COLOR_IDS[category];
}
