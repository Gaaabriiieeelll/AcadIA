import type { GoogleCalendarStatusDTO } from "@/types/google-calendar";

export const GOOGLE_CALENDAR_REAUTH_MESSAGE =
  "A autorização do Google Agenda expirou. Autorize novamente.";

const TOKEN_REFRESH_MARGIN_MS = 60_000;

type StoredCredential = {
  accountEmail: string;
  hasCalendarPermission: boolean;
  accessTokenExpiresAt: Date | null;
  hasRefreshToken: boolean;
};

type StoredIntegration = {
  calendarName: string;
  lastSyncedAt: Date | null;
  lastSyncedEventCount: number;
  lastSyncError: string | null;
};

export function googleCalendarStatusFromStoredState(
  credential: StoredCredential | null,
  integration: StoredIntegration | null,
  now = new Date(),
): GoogleCalendarStatusDTO {
  if (!credential || !credential.hasCalendarPermission) {
    return {
      status: "permission-required",
      accountEmail: null,
      calendarName: null,
      eventCount: 0,
      lastSyncedAt: null,
      lastError: null,
    };
  }

  const expiredWithoutRefresh = Boolean(
    credential.accessTokenExpiresAt
    && credential.accessTokenExpiresAt.getTime() <= now.getTime() + TOKEN_REFRESH_MARGIN_MS
    && !credential.hasRefreshToken,
  );
  const authorizationExpired = expiredWithoutRefresh
    || integration?.lastSyncError === GOOGLE_CALENDAR_REAUTH_MESSAGE;

  if (authorizationExpired) {
    return {
      status: "permission-required",
      accountEmail: credential.accountEmail,
      calendarName: integration?.calendarName ?? null,
      eventCount: integration?.lastSyncedEventCount ?? 0,
      lastSyncedAt: integration?.lastSyncedAt?.toISOString() ?? null,
      lastError: GOOGLE_CALENDAR_REAUTH_MESSAGE,
    };
  }

  if (!integration) {
    return {
      status: "not-connected",
      accountEmail: credential.accountEmail,
      calendarName: null,
      eventCount: 0,
      lastSyncedAt: null,
      lastError: null,
    };
  }

  return {
    status: integration.lastSyncError ? "error" : "connected",
    accountEmail: credential.accountEmail,
    calendarName: integration.calendarName,
    eventCount: integration.lastSyncedEventCount,
    lastSyncedAt: integration.lastSyncedAt?.toISOString() ?? null,
    lastError: integration.lastSyncError,
  };
}
