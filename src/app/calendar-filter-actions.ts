"use server";

import { revalidatePath } from "next/cache";
import { updateCurrentCalendarFilters } from "@/data/calendar-filters";
import { GOOGLE_CALENDAR_CATEGORIES } from "@/lib/google-calendar-categories";
import { changedVisibility } from "@/lib/google-calendar-filters";

export async function saveCalendarFiltersAction(form: FormData) {
  const raw = form.get("baseline");
  let baseline: unknown;
  try { baseline = typeof raw === "string" && raw.length < 500 ? JSON.parse(raw) : null; } catch { baseline = null; }
  const keys = Object.keys(GOOGLE_CALENDAR_CATEGORIES);
  if (!baseline || typeof baseline !== "object" || !keys.every((key) => typeof (baseline as Record<string, unknown>)[key] === "boolean")) {
    return { status: "error" as const, message: "Recarregue a página para atualizar os filtros.", changed: false };
  }
  const selected = Object.fromEntries(keys.map((key) => [key, form.has(key)]));
  const result = await updateCurrentCalendarFilters(changedVisibility(baseline, selected));
  revalidatePath("/calendario");
  return result;
}

export async function refreshCalendarFiltersAction() {
  const result = await updateCurrentCalendarFilters();
  if (result.changed) revalidatePath("/calendario");
  return result;
}
