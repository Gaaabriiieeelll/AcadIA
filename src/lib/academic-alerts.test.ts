import assert from "node:assert/strict";
import test from "node:test";
import { buildAcademicAlertCenter } from "./academic-alerts";
import { alertPreferenceSchema } from "./validation/academic-alerts";
import type { CalendarEventDTO } from "@/types/calendar-events";
import type { AcademicTaskDTO } from "@/types/academic-tasks";

const event: CalendarEventDTO = { id: "exam", title: "Prova", description: null, eventType: "EXAM", startDate: "2026-10-11", endDate: "2026-10-11", startTime: "10:00", endTime: null, completedAt: null, subject: null };
const task: AcademicTaskDTO = { id: "task", title: "Lista", description: null, dueDate: "2026-10-11", dueTime: null, priority: "MEDIUM", source: "MANUAL", sourceUrl: null, completed: false, completedAt: null, status: "upcoming", subject: { id: "s", name: "Física", color: "#16833f" } };
const input = { subjects: [], tasks: [task], personalEvents: [event], officialEvents: [], todayDateKey: "2026-10-08" };

test("aplica antecedência inclusiva a provas e tarefas", () => {
  assert.equal(buildAcademicAlertCenter({ ...input, reminderDays: 2 }).alerts.length, 0);
  assert.equal(buildAcademicAlertCenter({ ...input, reminderDays: 3 }).alerts.length, 2);
  assert.equal(buildAcademicAlertCenter(input).preferences.reminderDays, 7);
});
test("antecedência zero mantém o dia atual e tarefas vencidas", () => {
  const result = buildAcademicAlertCenter({ ...input, reminderDays: 0, todayDateKey: "2026-10-11", tasks: [{ ...task, status: "today" }, { ...task, id: "overdue", dueDate: "2026-10-10", status: "overdue" }] });
  assert.equal(result.alerts.length, 3);
});
test("não lembra itens concluídos ou eventos encerrados", () => {
  assert.equal(buildAcademicAlertCenter({ ...input, tasks: [{ ...task, completed: true }], personalEvents: [{ ...event, completedAt: "2026-10-08" }] }).alerts.length, 0);
  assert.equal(buildAcademicAlertCenter({ ...input, tasks: [], todayDateKey: "2026-10-12" }).alerts.length, 0);
});
test("valida limites da antecedência no servidor", () => {
  const preferences = { targetAverage: "70", minimumAttendance: "75", gradesEnabled: true, attendanceEnabled: true, tasksEnabled: true, calendarEnabled: true };
  for (const value of ["-1", "31", "1.5", "", null, "abc"]) {
    assert.equal(alertPreferenceSchema.safeParse({ ...preferences, reminderDays: value }).success, false);
  }
  for (const value of ["0", "7", "30"]) {
    assert.equal(alertPreferenceSchema.safeParse({ ...preferences, reminderDays: value }).success, true);
  }
});
