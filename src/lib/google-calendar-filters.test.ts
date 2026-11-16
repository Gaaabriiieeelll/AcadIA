import assert from "node:assert/strict";
import test from "node:test";
import { calendarVisibility, changedVisibility, GOOGLE_CALENDAR_LIST_SCOPE, hasCalendarFilterPermission, syncCalendarVisibility, visibilityPatch, type CalendarVisibilityPatch } from "./google-calendar-filters";
import type { GoogleCalendarCategory } from "./google-calendar-categories";

test("filters default to visible and ignore unknown or nonboolean categories", () => {
  assert.deepEqual(visibilityPatch({ exams: false, activities: "false", unrelated: false }), { exams: false });
  assert.equal(calendarVisibility(null).exams, true);
  assert.equal(calendarVisibility({ exams: false }).exams, false);
  assert.equal(hasCalendarFilterPermission("https://www.googleapis.com/auth/calendar.app.created"), false);
  assert.equal(hasCalendarFilterPermission(`openid ${GOOGLE_CALENDAR_LIST_SCOPE}`), true);
});

test("stale forms send only categories the user actually changed", () => {
  const original = calendarVisibility({ exams: false });
  const selected = { ...original, activities: false };
  assert.deepEqual(changedVisibility(original, selected), { activities: false });
});

test("pulls Google selections and patches only pending choices in known app calendars", async (t) => {
  const writes: Array<{ id: string; body: unknown }> = [];
  const local: CalendarVisibilityPatch = {};
  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    const id = new URL(url).pathname.split("/").at(-1)!;
    assert.ok(["app-exams", "app-activities", "app-notices"].includes(id));
    if (init.method === "PATCH") {
      writes.push({ id, body: JSON.parse(init.body as string) });
      return Response.json({ selected: false });
    }
    return Response.json(id === "app-activities" ? {} : { selected: true, hidden: false, colorId: "7" });
  });
  await syncCalendarVisibility({ exams: "app-exams", activities: "app-activities", notices: "app-notices" }, { exams: false, notices: true }, "test", async (category, value) => { local[category] = value; });
  assert.deepEqual(writes, [{ id: "app-exams", body: { selected: false } }]);
  assert.deepEqual(local, { exams: false, activities: false, notices: true });
});

test("failed writes preserve pending local changes and missing calendars are not acknowledged", async (t) => {
  const acknowledged: GoogleCalendarCategory[] = [];
  t.mock.method(globalThis, "fetch", async (_url: string, init: RequestInit) => {
    return init.method === "PATCH"
      ? Response.json({ error: { message: "Unavailable" } }, { status: 503 })
      : Response.json({ selected: true });
  });
  await assert.rejects(syncCalendarVisibility({ exams: "app-exams" }, { exams: false }, "test", async (category) => { acknowledged.push(category); }));
  assert.equal(acknowledged.length, 0);
  await syncCalendarVisibility({}, { exams: false }, "test", async (category) => { acknowledged.push(category); });
  assert.equal(acknowledged.length, 0);
});

test("repeated synchronization does not rewrite a selection already applied", async (t) => {
  let selected = true;
  let patches = 0;
  const pending: CalendarVisibilityPatch = { exams: false };
  t.mock.method(globalThis, "fetch", async (_url: string, init: RequestInit) => {
    if (init.method === "PATCH") { patches++; selected = JSON.parse(init.body as string).selected; }
    return Response.json({ selected });
  });
  const persist = async (category: GoogleCalendarCategory) => { delete pending[category]; };
  await syncCalendarVisibility({ exams: "app-exams" }, pending, "test", persist);
  await syncCalendarVisibility({ exams: "app-exams" }, pending, "test", persist);
  assert.equal(patches, 1);
  assert.deepEqual(pending, {});
});
