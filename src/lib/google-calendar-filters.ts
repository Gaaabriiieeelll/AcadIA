import { GOOGLE_CALENDAR_CATEGORIES, type GoogleCalendarCategory } from "./google-calendar-categories";
import { calendarApiRequest } from "./google-calendar-sync";

export const GOOGLE_CALENDAR_LIST_SCOPE = "https://www.googleapis.com/auth/calendar.calendarlist";
export type CalendarVisibility = Record<GoogleCalendarCategory, boolean>;
export type CalendarVisibilityPatch = Partial<CalendarVisibility>;

export function visibilityPatch(value: unknown): CalendarVisibilityPatch {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.keys(GOOGLE_CALENDAR_CATEGORIES).flatMap((key) => {
    const visible = (value as Record<string, unknown>)[key];
    return typeof visible === "boolean" ? [[key, visible]] : [];
  }));
}

export function calendarVisibility(value: unknown): CalendarVisibility {
  return { institutional: true, exams: true, activities: true, notices: true, personal: true, ...visibilityPatch(value) };
}

export function hasCalendarFilterPermission(scopes: string) {
  return scopes.split(/\s+/).includes(GOOGLE_CALENDAR_LIST_SCOPE);
}

export function changedVisibility(baseline: unknown, selected: unknown): CalendarVisibilityPatch {
  const before = calendarVisibility(baseline);
  const after = visibilityPatch(selected);
  return Object.fromEntries(Object.entries(after).filter(([key, value]) => before[key as GoogleCalendarCategory] !== value));
}

export async function syncCalendarVisibility(
  ids: Partial<Record<GoogleCalendarCategory, string>>,
  pending: CalendarVisibilityPatch,
  token: string,
  persist: (category: GoogleCalendarCategory, visible: boolean) => Promise<void>,
) {
  // Only access the app's known calendars, never list or edit unrelated ones.
  for (const category of Object.keys(GOOGLE_CALENDAR_CATEGORIES) as GoogleCalendarCategory[]) {
    const id = ids[category];
    if (!id) continue;
    const path = `/users/me/calendarList/${encodeURIComponent(id)}`;
    const remote = await calendarApiRequest<{ selected?: boolean }>(path, token);
    const visible = pending[category];
    if (visible !== undefined) {
      if (Boolean(remote.selected) !== visible) {
        await calendarApiRequest(path, token, {
          method: "PATCH", body: JSON.stringify({ selected: visible }),
        });
      }
      await persist(category, visible);
    } else {
      // An omitted selected field is false in CalendarList resources.
      await persist(category, Boolean(remote.selected));
    }
  }
}
