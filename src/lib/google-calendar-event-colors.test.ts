import assert from "node:assert/strict";
import test from "node:test";

import {
  GOOGLE_CALENDAR_EVENT_COLOR_IDS,
  googleCalendarColorForAcademicEvent,
  googleCalendarColorForPersonalEvent,
} from "./google-calendar-event-colors";

test("usa azul para reuniões, marcos e semanas acadêmicas", () => {
  assert.equal(
    googleCalendarColorForPersonalEvent("MEETING"),
    GOOGLE_CALENDAR_EVENT_COLOR_IDS.BLUE,
  );
  assert.equal(
    googleCalendarColorForAcademicEvent("milestone"),
    GOOGLE_CALENDAR_EVENT_COLOR_IDS.BLUE,
  );
  assert.equal(
    googleCalendarColorForAcademicEvent("institutional"),
    GOOGLE_CALENDAR_EVENT_COLOR_IDS.BLUE,
  );
});

test("usa vermelho para atividades, provas, apresentações e avaliações", () => {
  for (const eventType of ["ASSIGNMENT", "EXAM", "PRESENTATION"] as const) {
    assert.equal(
      googleCalendarColorForPersonalEvent(eventType),
      GOOGLE_CALENDAR_EVENT_COLOR_IDS.RED,
    );
  }
  assert.equal(
    googleCalendarColorForAcademicEvent("evaluation"),
    GOOGLE_CALENDAR_EVENT_COLOR_IDS.RED,
  );
});

test("mantém cores distintas para campo, recessos, feriados e outros eventos", () => {
  assert.equal(
    googleCalendarColorForPersonalEvent("FIELD_CLASS"),
    GOOGLE_CALENDAR_EVENT_COLOR_IDS.GREEN,
  );
  assert.equal(
    googleCalendarColorForAcademicEvent("recess"),
    GOOGLE_CALENDAR_EVENT_COLOR_IDS.GREEN,
  );
  assert.equal(
    googleCalendarColorForAcademicEvent("holiday"),
    GOOGLE_CALENDAR_EVENT_COLOR_IDS.YELLOW,
  );
  assert.equal(
    googleCalendarColorForPersonalEvent("OTHER"),
    GOOGLE_CALENDAR_EVENT_COLOR_IDS.GRAY,
  );
});
