import assert from "node:assert/strict";
import test from "node:test";
import { classroomTaskStart, inclusiveCalendarDays, taskCalendarPeriod } from "./google-calendar-period";
import { academicTaskSchema } from "./validation/academic-tasks";

test("intervalo de inscrição inclui início, dias intermediários e último dia", () => {
  assert.deepEqual(inclusiveCalendarDays("2026-11-10", "2026-11-20"), {
    start: { date: "2026-11-10" }, end: { date: "2026-11-21" },
  });
  assert.equal(inclusiveCalendarDays("2026-12-30", "2026-12-31").end.date, "2027-01-01");
  assert.equal(inclusiveCalendarDays("2028-02-28", "2028-02-29").end.date, "2028-03-01");
});

test("atividade com início ocupa o período mesmo com horário de entrega", () => {
  assert.deepEqual(taskCalendarPeriod("2026-11-10", "2026-11-20", "23:59"),
    inclusiveCalendarDays("2026-11-10", "2026-11-20"));
  assert.deepEqual(taskCalendarPeriod("2026-11-20", "2026-11-20", null),
    inclusiveCalendarDays("2026-11-20", "2026-11-20"));
});

test("atividade sem início preserva prazo pontual, inclusive na virada do dia", () => {
  const period = taskCalendarPeriod(null, "2026-12-31", "23:30");
  assert.ok("dateTime" in period.start);
  assert.ok("dateTime" in period.end);
  assert.equal(period.start.dateTime, "2026-12-31T23:30:00");
  assert.equal(period.end.dateTime, "2027-01-01T00:30:00");
  assert.deepEqual(taskCalendarPeriod(null, "2026-11-20", null), inclusiveCalendarDays("2026-11-20", "2026-11-20"));
});

test("Classroom prioriza publicação agendada e converte o fuso sem confundir criação com publicação", () => {
  const value = classroomTaskStart({ scheduledTime: "2026-11-11T01:00:00Z", creationTime: "2026-11-01T12:00:00Z" }, "2026-11-20");
  assert.equal(value.startDate?.toISOString().slice(0, 10), "2026-11-10");
  assert.equal(value.startDateSource, "SCHEDULED");
  assert.equal(classroomTaskStart({ creationTime: "2026-11-01T12:00:00Z" }, "2026-11-20").startDateSource, "CREATED");
  for (const item of [{}, { creationTime: "invalid" }, { scheduledTime: "2026-12-01T12:00:00Z" }]) {
    assert.equal(classroomTaskStart(item, "2026-11-20").startDate, null);
  }
});

test("formulário rejeita início inválido ou após o prazo e aceita registros antigos", () => {
  const task = { subjectId: "123e4567-e89b-42d3-a456-426614174000", title: "Prova", description: "", dueDate: "2026-11-20", dueTime: "", priority: "MEDIUM" };
  assert.equal(academicTaskSchema.parse(task).startDate, null);
  assert.equal(academicTaskSchema.safeParse({ ...task, startDate: "2026-11-10" }).success, true);
  for (const startDate of ["2026-11-21", "2026-02-30", "invalid"]) {
    assert.equal(academicTaskSchema.safeParse({ ...task, startDate }).success, false);
  }
});
