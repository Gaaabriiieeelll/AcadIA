import assert from "node:assert/strict";
import test from "node:test";

import {
  GOOGLE_CALENDAR_REAUTH_MESSAGE,
  googleCalendarStatusFromStoredState,
} from "./google-calendar-status";

const now = new Date("2026-09-28T12:00:00.000Z");
const credential = {
  accountEmail: "aluno@academico.ifpb.edu.br",
  hasCalendarPermission: true,
  accessTokenExpiresAt: new Date("2026-09-17T23:00:00.000Z"),
  hasRefreshToken: false,
};
const integration = {
  calendarName: "AcadIA · Calendário acadêmico",
  lastSyncedAt: new Date("2026-09-17T22:36:00.000Z"),
  lastSyncedEventCount: 104,
  lastSyncError: null,
};

test("não mostra conectado quando o token expirou e não há como renová-lo", () => {
  const status = googleCalendarStatusFromStoredState(credential, integration, now);
  assert.equal(status.status, "permission-required");
  assert.equal(status.lastError, GOOGLE_CALENDAR_REAUTH_MESSAGE);
  assert.equal(status.eventCount, 104);
});

test("mantém a conexão se o token de acesso pode ser renovado", () => {
  const status = googleCalendarStatusFromStoredState(
    { ...credential, hasRefreshToken: true },
    integration,
    now,
  );
  assert.equal(status.status, "connected");
});

test("não mostra conectado após falha de renovação do acesso", () => {
  const status = googleCalendarStatusFromStoredState(
    { ...credential, hasRefreshToken: true },
    { ...integration, lastSyncError: GOOGLE_CALENDAR_REAUTH_MESSAGE },
    now,
  );
  assert.equal(status.status, "permission-required");
});

test("falha temporária pede nova tentativa sem exigir autorização", () => {
  const status = googleCalendarStatusFromStoredState(
    { ...credential, hasRefreshToken: true },
    { ...integration, lastSyncError: "Não foi possível acessar o Google Agenda agora." },
    now,
  );
  assert.equal(status.status, "error");
});
