import { createHash } from "node:crypto";
import { GOOGLE_CALENDAR_CATEGORIES, type GoogleCalendarCategory } from "./google-calendar-categories";

const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";
const GOOGLE_CALENDAR_TIMEOUT_MS = 15_000;
const MANAGED_PROPERTY = "acadiaManaged";
const SOURCE_KEY_PROPERTY = "acadiaSourceKey";
const SIGNATURE_PROPERTY = "acadiaSignature";

type GoogleCalendarErrorCode =
  | "AUTH_EXPIRED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UPSTREAM_FAILURE";

export class GoogleCalendarError extends Error {
  constructor(
    public readonly code: GoogleCalendarErrorCode,
    message?: string,
    public readonly operation?: string,
  ) {
    super(message ?? code);
    this.name = "GoogleCalendarError";
  }
}

export type GoogleCalendarResource = {
  id?: string;
  summary?: string;
};

type GoogleCalendarEvent = {
  id?: string;
  extendedProperties?: {
    private?: Record<string, string>;
  };
};

type GoogleCalendarEventList = {
  items?: GoogleCalendarEvent[];
  nextPageToken?: string;
};

type EventDateTime = {
  date?: string;
  dateTime?: string;
  timeZone?: string;
};

export type GoogleEventBody = {
  summary: string;
  description: string;
  colorId: string;
  start: EventDateTime;
  end: EventDateTime;
  transparency: "opaque" | "transparent";
  visibility: "private";
  reminders: { useDefault: boolean };
  recurrence?: string[];
  extendedProperties: {
    private: Record<string, string>;
  };
};

export type DesiredGoogleEvent = {
  category: GoogleCalendarCategory;
  sourceKey: string;
  signature: string;
  body: GoogleEventBody;
};

function calendarErrorCode(status: number): GoogleCalendarErrorCode {
  if (status === 409) return "CONFLICT";
  if (status === 401) return "AUTH_EXPIRED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404 || status === 410) return "NOT_FOUND";
  return "UPSTREAM_FAILURE";
}

export async function calendarApiRequest<T>(
  path: string,
  accessToken: string,
  init: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${GOOGLE_CALENDAR_API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(GOOGLE_CALENDAR_TIMEOUT_MS),
    });
  } catch {
    throw new GoogleCalendarError("UPSTREAM_FAILURE");
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as {
      error?: { message?: string };
    } | null;
    throw new GoogleCalendarError(
      calendarErrorCode(response.status),
      payload?.error?.message?.slice(0, 500),
      `${init.method ?? "GET"} ${path.split("?")[0].replace(/(\/calendars\/|\/calendarList\/)[^/]+/g, "$1:id").replace(/(\/events\/)[^/]+/g, "$1:id")}`,
    );
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function calendarPath(calendarId: string, suffix = "") {
  return `/calendars/${encodeURIComponent(calendarId)}${suffix}`;
}

async function listManagedGoogleEvents(calendarId: string, accessToken: string) {
  const events: GoogleCalendarEvent[] = [];
  let pageToken: string | undefined;

  do {
    const parameters = new URLSearchParams({
      maxResults: "2500",
      privateExtendedProperty: `${MANAGED_PROPERTY}=v1`,
      showDeleted: "false",
    });
    if (pageToken) parameters.set("pageToken", pageToken);
    const page = await calendarApiRequest<GoogleCalendarEventList>(
      `${calendarPath(calendarId, "/events")}?${parameters}`,
      accessToken,
    );
    events.push(...(page.items ?? []));
    pageToken = page.nextPageToken;
  } while (pageToken);

  return events;
}

async function runWithConcurrency(tasks: Array<() => Promise<void>>, concurrency = 6) {
  let nextIndex = 0;
  const results = await Promise.allSettled(Array.from({ length: Math.min(concurrency, tasks.length) }, async () => {
    while (nextIndex < tasks.length) {
      const task = tasks[nextIndex];
      nextIndex += 1;
      await task();
    }
  }));
  // Do not release the sync lease while other workers are still writing.
  const failed = results.find((result) => result.status === "rejected");
  if (failed?.status === "rejected") throw failed.reason;
}

async function reconcileGoogleEvents(
  calendarId: string,
  accessToken: string,
  desired: DesiredGoogleEvent[],
) {
  const existing = await listManagedGoogleEvents(calendarId, accessToken);
  const existingBySource = new Map<string, GoogleCalendarEvent>();
  const staleEvents: GoogleCalendarEvent[] = [];

  for (const event of existing) {
    const sourceKey = event.extendedProperties?.private?.[SOURCE_KEY_PROPERTY];
    if (!sourceKey || existingBySource.has(sourceKey)) {
      staleEvents.push(event);
    } else {
      existingBySource.set(sourceKey, event);
    }
  }

  const desiredKeys = new Set(desired.map((event) => event.sourceKey));
  staleEvents.push(...[...existingBySource.entries()]
    .filter(([sourceKey]) => !desiredKeys.has(sourceKey))
    .map(([, event]) => event));

  let createdCount = 0;
  let updatedCount = 0;
  let deletedCount = 0;
  let unchangedCount = 0;
  const tasks: Array<() => Promise<void>> = [];

  for (const event of desired) {
    const stored = existingBySource.get(event.sourceKey);
    if (!stored?.id) {
      tasks.push(async () => {
        // Stable IDs make retries after timeouts idempotent. A new ID generation
        // is used only when Google retains a tombstone for a deleted event.
        const baseId = createHash("sha256").update(`${calendarId}:${event.sourceKey}`).digest("hex");
        for (let generation = 0; ; generation += 1) {
          const id = `${baseId}${generation.toString(16)}`;
          try {
            await calendarApiRequest(calendarPath(calendarId, "/events"), accessToken, {
              method: "POST", body: JSON.stringify({ ...event.body, id }),
            });
            break;
          } catch (error) {
            if (!(error instanceof GoogleCalendarError) || error.code !== "CONFLICT" || generation >= 20) throw error;
            const current = await calendarApiRequest<GoogleCalendarEvent & { status?: string }>(
              calendarPath(calendarId, `/events/${id}`), accessToken,
            ).catch((readError: unknown) => {
              if (readError instanceof GoogleCalendarError && readError.code === "NOT_FOUND") return { status: "cancelled" } as GoogleCalendarEvent & { status: string };
              throw readError;
            });
            if (current.status === "cancelled") continue;
            if (current.extendedProperties?.private?.[SOURCE_KEY_PROPERTY] !== event.sourceKey) throw error;
            await calendarApiRequest(calendarPath(calendarId, `/events/${id}`), accessToken, {
              method: "PATCH", body: JSON.stringify({ ...event.body,
                start: { date: null, dateTime: null, timeZone: null, ...event.body.start },
                end: { date: null, dateTime: null, timeZone: null, ...event.body.end },
              }),
            });
            break;
          }
        }
        createdCount += 1;
      });
      continue;
    }

    const storedSignature = stored.extendedProperties?.private?.[SIGNATURE_PROPERTY];
    if (storedSignature === event.signature) {
      unchangedCount += 1;
      continue;
    }

    tasks.push(async () => {
      await calendarApiRequest(
        calendarPath(calendarId, `/events/${encodeURIComponent(stored.id!)}`),
        accessToken,
        {
          method: "PATCH",
          body: JSON.stringify({
            ...event.body,
            // Explicitly clear the old representation when switching to/from all-day.
            start: { date: null, dateTime: null, timeZone: null, ...event.body.start },
            end: { date: null, dateTime: null, timeZone: null, ...event.body.end },
          }),
        },
      );
      updatedCount += 1;
    });
  }

  const cleanup: Array<() => Promise<void>> = [];
  for (const event of staleEvents) {
    if (!event.id) continue;
    cleanup.push(async () => {
      await calendarApiRequest(
        calendarPath(calendarId, `/events/${encodeURIComponent(event.id!)}`),
        accessToken,
        { method: "DELETE" },
      ).catch((error: unknown) => {
        if (!(error instanceof GoogleCalendarError) || error.code !== "NOT_FOUND") throw error;
      });
      deletedCount += 1;
    });
  }

  await runWithConcurrency(tasks);
  return { createdCount, updatedCount, unchangedCount, cleanup, get deletedCount() { return deletedCount; } };
}

export async function syncCategorizedGoogleEvents(
  calendarIds: Record<GoogleCalendarCategory, string>,
  accessToken: string,
  desired: DesiredGoogleEvent[],
) {
  const results = [];
  // Complete writes in every destination before deleting any old copies.
  for (const category of Object.keys(GOOGLE_CALENDAR_CATEGORIES) as GoogleCalendarCategory[]) {
    results.push(await reconcileGoogleEvents(calendarIds[category], accessToken,
      desired.filter((event) => event.category === category)));
  }
  await runWithConcurrency(results.flatMap((result) => result.cleanup));
  return results.reduce((sum, result) => ({
    createdCount: sum.createdCount + result.createdCount,
    updatedCount: sum.updatedCount + result.updatedCount,
    deletedCount: sum.deletedCount + result.deletedCount,
    unchangedCount: sum.unchangedCount + result.unchangedCount,
  }), { createdCount: 0, updatedCount: 0, deletedCount: 0, unchangedCount: 0 });
}

