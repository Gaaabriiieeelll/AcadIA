import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import { GOOGLE_CALENDAR_CATEGORIES, personalCalendarCategory, readCategoryCalendarIds } from "./google-calendar-categories";
import { initializeCalendarColor, syncCategorizedGoogleEvents, type DesiredGoogleEvent } from "./google-calendar-sync";

const ids = { institutional: "legacy", exams: "exams", activities: "activities", notices: "notices", personal: "personal" };

test("calendar list color failures never block event synchronization or change visibility", async (t) => {
  let status = 401;
  t.mock.method(globalThis, "fetch", async (_url: string, init: RequestInit) => {
    assert.deepEqual(JSON.parse(init.body as string), { backgroundColor: "#3f51b5", foregroundColor: "#ffffff" });
    return Response.json({ error: { message: "Invalid Credentials" } }, { status });
  });
  assert.equal(await initializeCalendarColor("exams", "#3f51b5", "test"), true);
  status = 403;
  assert.equal(await initializeCalendarColor("exams", "#3f51b5", "test"), true);
  status = 503;
  assert.equal(await initializeCalendarColor("exams", "#3f51b5", "test"), false);
});
function desired(category: DesiredGoogleEvent["category"] = "activities"): DesiredGoogleEvent {
  return { category, sourceKey: "task:1", signature: "new", body: {
    summary: "Atividade", description: "Prazo final", colorId: GOOGLE_CALENDAR_CATEGORIES[category].eventColorId,
    start: { date: "2026-11-16" }, end: { date: "2026-11-25" },
    transparency: "transparent", visibility: "private", reminders: { useDefault: true },
    extendedProperties: { private: { acadiaManaged: "v1", acadiaSourceKey: "task:1", acadiaSignature: "new" } },
  } };
}

function googleFake(t: TestContext) {
  type Stored = Partial<DesiredGoogleEvent["body"]> & { id: string; status?: string };
  const calendars = new Map(Object.values(ids).map((id) => [id, new Map<string, Stored>()]));
  calendars.get("legacy")!.set("old", { ...desired().body, id: "old" });
  calendars.get("legacy")!.set("manual", { id: "manual", summary: "User event" });
  const requests: string[] = [];
  const failures = { post: false, afterPost: false };
  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/\/calendars\/([^/]+)\/events(?:\/([^/]+))?$/)!;
    const calendar = calendars.get(decodeURIComponent(match[1]))!;
    const id = match[2];
    const method = init.method ?? "GET";
    requests.push(`${method} ${match[1]}${id ? `/${id}` : ""}`);
    const json = (value: unknown, status = 200) => Response.json(value, { status });
    if (method === "GET" && !id) {
      assert.equal(parsed.searchParams.get("privateExtendedProperty"), "acadiaManaged=v1");
      return json({ items: [...calendar.values()].filter((e) => e.status !== "cancelled" && e.extendedProperties?.private.acadiaManaged === "v1") });
    }
    if (method === "GET") return json(calendar.get(id) ?? {}, calendar.has(id) ? 200 : 404);
    if (method === "POST") {
      if (failures.post) return json({ error: { message: "temporary failure" } }, 503);
      const event = JSON.parse(init.body as string) as Stored;
      if (calendar.has(event.id)) return json({}, 409);
      calendar.set(event.id, event);
      if (failures.afterPost) { failures.afterPost = false; throw new Error("connection lost after save"); }
      return json(event);
    }
    if (method === "PATCH") {
      const event = { ...calendar.get(id), ...JSON.parse(init.body as string) } as Stored;
      calendar.set(id, event);
      return json(event);
    }
    if (method === "DELETE") {
      calendar.set(id, { id, status: "cancelled" });
      return new Response(null, { status: 204 });
    }
    throw new Error(`Unexpected request: ${method}`);
  });
  return { calendars, requests, failures };
}

test("routes explicit exam types without guessing titles and reads only known IDs", () => {
  assert.equal(personalCalendarCategory("EXAM"), "exams");
  assert.equal(personalCalendarCategory("ASSIGNMENT"), "activities");
  assert.equal(personalCalendarCategory("PRESENTATION"), "activities");
  for (const kind of ["MEETING", "FIELD_CLASS", "OTHER"] as const) assert.equal(personalCalendarCategory(kind), "personal");
  assert.deepEqual(readCategoryCalendarIds({ exams: "a", activities: 4, unknown: "b" }), { exams: "a" });
  assert.deepEqual(readCategoryCalendarIds(null), {});
});

test("migrates only managed events after destination writes and repeated sync is unchanged", async (t) => {
  const fake = googleFake(t);
  const counts = await syncCategorizedGoogleEvents(ids, "test-token", [desired()]);
  assert.equal(counts.createdCount, 1);
  assert.equal(counts.deletedCount, 1);
  assert.ok(fake.calendars.get("legacy")!.has("manual"));
  assert.ok(fake.requests.indexOf("POST activities") < fake.requests.indexOf("DELETE legacy/old"));
  const repeated = await syncCategorizedGoogleEvents(ids, "test-token", [desired()]);
  assert.deepEqual(repeated, { createdCount: 0, updatedCount: 0, deletedCount: 0, unchangedCount: 1 });
  const event = [...fake.calendars.get("activities")!.values()][0];
  assert.deepEqual(event.start, { date: "2026-11-16" });
  assert.deepEqual(event.end, { date: "2026-11-25" });
});

test("failed destination retains old events; timeout after saving resumes without duplicates", async (t) => {
  const fake = googleFake(t);
  fake.failures.post = true;
  await assert.rejects(syncCategorizedGoogleEvents(ids, "test-token", [desired()]));
  assert.ok(!fake.requests.some((request) => request.startsWith("DELETE")));
  fake.failures.post = false;
  fake.failures.afterPost = true;
  await assert.rejects(syncCategorizedGoogleEvents(ids, "test-token", [desired()]));
  assert.ok(!fake.requests.some((request) => request.startsWith("DELETE")));
  await syncCategorizedGoogleEvents(ids, "test-token", [desired()]);
  assert.equal(fake.calendars.get("activities")!.size, 1);
  assert.equal(fake.calendars.get("legacy")!.get("old")!.status, "cancelled");
});

test("category changes can return to a calendar with a deleted event tombstone", async (t) => {
  const fake = googleFake(t);
  await syncCategorizedGoogleEvents(ids, "test-token", [desired()]);
  await syncCategorizedGoogleEvents(ids, "test-token", [desired("exams")]);
  await syncCategorizedGoogleEvents(ids, "test-token", [desired()]);
  const active = [...fake.calendars.get("activities")!.values()].filter((event) => event.status !== "cancelled");
  assert.equal(active.length, 1);
  assert.equal(active[0].colorId, "10");
});
