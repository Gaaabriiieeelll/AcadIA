import assert from "node:assert/strict";
import test from "node:test";
import { competitions } from "@/data/competitions";
import { buildAcademicAlertCenter } from "@/lib/academic-alerts";
import { buildCompetitionAlerts, competitionNow, filterCompetitions, getCompetitionCalendarEvents, getCompetitionStatus, hasConfirmedStages } from "@/lib/competitions";
import { protectedNavigation } from "@/lib/protected-navigation";
import type { Competition } from "@/types/competitions";

const now = new Date("2026-10-20T15:00:00Z");
const dhpb = competitions.find((c) => c.id === "dhpb-2026")!;
const filters = { query: "", area: "", campus: "", level: "", status: "" };
test("aba vem imediatamente após o curso, sem depender do seu nome", () => {
  const index = protectedNavigation.findIndex((item) => item.id === "schedule");
  assert.equal(protectedNavigation[index + 1].id, "competitions");
  assert.equal(protectedNavigation[index + 1].href, "/olimpiadas");
  assert.equal(protectedNavigation.filter((item) => item.id === "competitions").length, 1);
});
test("catálogo tem IDs, datas válidas e rastreabilidade de cada fato confirmado", () => {
  assert.equal(new Set(competitions.map((c) => c.id)).size, competitions.length);
  for (const c of competitions) {
    assert.ok(c.sources.length);
    const ids = new Set(c.sources.map((s) => s.id));
    assert.equal(ids.size, c.sources.length);
    for (const source of c.sources) {
      assert.equal(new URL(source.url).protocol, "https:");
      assert.ok(source.checkedAt);
    }
    for (const fact of [c.eligibility, c.registration, c.participation, c.support, c.cost]) {
      for (const id of fact?.sourceIds ?? []) assert.ok(ids.has(id), `${c.id}: ${id}`);
    }
    assert.equal(new Set(c.stages.map((s) => s.id)).size, c.stages.length);
    for (const stage of c.stages) {
      assert.ok(ids.has(stage.sourceId));
      for (const date of [stage.startDate, stage.endDate ?? stage.startDate]) {
        assert.equal(new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10), date);
        assert.equal(Number(date.slice(0, 4)), c.year);
      }
      assert.ok(stage.startDate <= (stage.endDate ?? stage.startDate));
      for (const time of [stage.startTime, stage.endTime].filter(Boolean)) assert.match(time!, /^([01]\d|2[0-3]):[0-5]\d$/);
    }
    if (!hasConfirmedStages(c)) assert.ok(c.pending.length);
  }
});
test("inscrições vencidas não aparecem abertas, inclusive no limite do fuso", () => {
  assert.equal(competitionNow(new Date("2026-09-11T02:59:59Z")), "2026-09-10T23:59:59");
  assert.equal(getCompetitionStatus(dhpb, new Date("2026-09-11T02:59:59Z")), "open");
  assert.equal(getCompetitionStatus(dhpb, new Date("2026-09-11T03:00:00Z")), "closed");
  assert.equal(getCompetitionStatus(dhpb, new Date("2026-07-29T12:00:00Z")), "future");
  assert.equal(getCompetitionStatus(dhpb, now), "ongoing");
  assert.equal(getCompetitionStatus(dhpb, new Date("2026-12-06T15:01:00Z")), "completed");
  assert.equal(filterCompetitions(competitions, { ...filters, status: "open" }, now).length, 0);
});
test("busca sem acentos e filtros combinados por área, campus, nível e situação", () => {
  assert.equal(filterCompetitions(competitions, { ...filters, query: "historia paraiba", area: "História", campus: "João Pessoa", level: "Médio/Técnico", status: "ongoing" }, now)[0]?.id, "dhpb-2026");
  assert.equal(filterCompetitions(competitions, { ...filters, query: "historia", area: "Robótica" }, now).length, 0);
  assert.ok(filterCompetitions(competitions, { ...filters, campus: "Participação local a confirmar" }, now).every((c) => !hasConfirmedStages(c)));
});
test("pendências sem data não geram eventos; edições não repetem no ano seguinte", () => {
  const pending = competitions.filter((c) => !hasConfirmedStages(c));
  assert.ok(pending.length > 0);
  assert.deepEqual(getCompetitionCalendarEvents(pending, "2026-01-01", "2026-12-31"), []);
  assert.deepEqual(getCompetitionCalendarEvents(competitions, "2027-01-01", "2027-12-31"), []);
  const gated: Competition = { ...dhpb, calendarReady: false };
  assert.deepEqual(getCompetitionCalendarEvents([gated], "2026-01-01", "2026-12-31"), []);
});
test("atualizações preservam identidade, deduplicam e não alteram eventos pessoais", () => {
  const first = getCompetitionCalendarEvents([dhpb], "2026-01-01", "2026-12-31");
  const changed = { ...dhpb, stages: dhpb.stages.map((s) => s.id === "final" ? { ...s, startDate: "2026-12-07" } : s) };
  const updated = getCompetitionCalendarEvents([dhpb, changed], "2026-01-01", "2026-12-31");
  assert.equal(updated.length, first.length);
  assert.deepEqual(updated.map((e) => e.id), first.map((e) => e.id));
  assert.equal(updated.find((e) => e.id.endsWith(":final"))?.startDate, "2026-12-07");
  const personal = Object.freeze({ id: "personal", title: "Minha prova", startDate: "2026-12-05" });
  const combined = [personal, ...updated];
  assert.equal(combined[0], personal);
  assert.equal(combined[0].title, "Minha prova");
});
test("inscrição, resultado e prova são distintos; DHPB e SBC têm horários oficiais", () => {
  const events = getCompetitionCalendarEvents(competitions, "2026-01-01", "2026-12-31");
  const result = events.find((e) => e.id === "competition:dhpb-2026:final-call")!;
  assert.equal(result.startDate, "2026-11-04");
  assert.equal(result.startTime, null);
  assert.equal(result.endTime, "23:59");
  const final = events.find((e) => e.id === "competition:dhpb-2026:final")!;
  assert.equal(final.startDate, "2026-12-05");
  assert.equal(final.startTime, "08:00");
  assert.equal(final.endTime, "12:00");
  const sbc = events.find((e) => e.id === "competition:sbc-2026:final")!;
  assert.equal(sbc.startTime, "14:00");
  assert.match(sbc.title, /classificados/);
});
test("lembretes exigem acompanhamento e opt-in; etapas classificadas exigem outra opção", () => {
  const date = new Date("2026-12-01T12:00:00Z");
  const subscription = { competitionId: dhpb.id, remindersEnabled: true, includeQualified: false };
  assert.deepEqual(buildCompetitionAlerts([dhpb], [], date, 7), []);
  assert.deepEqual(buildCompetitionAlerts([dhpb], [{ ...subscription, remindersEnabled: false }], date, 7), []);
  assert.deepEqual(buildCompetitionAlerts([dhpb], [subscription], date, 7), []);
  const reminders = buildCompetitionAlerts([dhpb], [{ ...subscription, includeQualified: true }], date, 7);
  assert.equal(reminders.length, 2);
  assert.ok(reminders.every((a) => a.category === "calendar"));
  assert.equal(buildCompetitionAlerts([dhpb], [{ ...subscription, includeQualified: true }], date, 3).length, 0);
});
test("lembrete de inscrição aponta encerramento e ignora prazo vencido", () => {
  const subscription = { competitionId: dhpb.id, remindersEnabled: true, includeQualified: false };
  const reminders = buildCompetitionAlerts([dhpb], [subscription], new Date("2026-09-04T12:00:00Z"), 7);
  assert.equal(reminders.length, 1);
  assert.equal(reminders[0].dateKey, "2026-09-10");
  assert.match(reminders[0].title, /prazo de inscrição/);
  assert.equal(buildCompetitionAlerts([dhpb], [subscription], new Date("2026-09-11T03:00:00Z"), 0).length, 0);
  const qualified = { ...subscription, includeQualified: true };
  assert.equal(buildCompetitionAlerts([dhpb], [qualified], new Date("2026-12-05T15:01:00Z"), 0).length, 0);
});
test("alertas sem duplicação entram na central e respeitam sua categoria existente", () => {
  const subscription = { competitionId: dhpb.id, remindersEnabled: true, includeQualified: true };
  const alerts = buildCompetitionAlerts([dhpb, dhpb], [subscription, subscription], new Date("2026-12-01T12:00:00Z"), 7);
  assert.equal(alerts.length, 2);
  const center = buildAcademicAlertCenter({ competitionAlerts: alerts, subjects: [], tasks: [], personalEvents: [], officialEvents: [], todayDateKey: "2026-12-01" });
  assert.equal(center.summary.planning, 2);
  assert.equal(center.summary.total, 2);
  const pending = competitions.filter((c) => !hasConfirmedStages(c));
  assert.deepEqual(buildCompetitionAlerts(pending, pending.map((c) => ({ ...subscription, competitionId: c.id })), now, 30), []);
});
