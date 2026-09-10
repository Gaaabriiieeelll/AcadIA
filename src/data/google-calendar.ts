import "server-only";

import { createHash } from "node:crypto";

import {
  academicCalendarCategories,
  academicCalendarEvents,
  academicCalendarMetadata,
} from "@/data/academic-calendar";
import { requireCurrentIdentity } from "@/data/current-user";
import { db } from "@/lib/db";
import {
  getGoogleCalendarAccessToken,
  GoogleCalendarConnectionError,
  grantedScopesIncludeGoogleCalendar,
} from "@/lib/google-calendar-credentials";
import {
  GOOGLE_CALENDAR_EVENT_COLOR_IDS,
  googleCalendarColorForAcademicEvent,
  googleCalendarColorForPersonalEvent,
} from "@/lib/google-calendar-event-colors";
import { CALENDAR_EVENT_TYPE_DETAILS } from "@/types/calendar-events";
import type {
  GoogleCalendarStatusDTO,
  GoogleCalendarSyncResult,
} from "@/types/google-calendar";

const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";
const GOOGLE_CALENDAR_NAME = "AcadIA · Calendário acadêmico";
const GOOGLE_CALENDAR_TIME_ZONE = "America/Sao_Paulo";
const GOOGLE_CALENDAR_TIMEOUT_MS = 15_000;
const MANAGED_PROPERTY = "acadiaManaged";
const SOURCE_KEY_PROPERTY = "acadiaSourceKey";
const SIGNATURE_PROPERTY = "acadiaSignature";
const TASK_PRIORITY_LABELS = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
} as const;

type GoogleCalendarErrorCode =
  | "AUTH_EXPIRED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "UPSTREAM_FAILURE";

class GoogleCalendarError extends Error {
  constructor(
    public readonly code: GoogleCalendarErrorCode,
    message?: string,
  ) {
    super(message ?? code);
    this.name = "GoogleCalendarError";
  }
}

type GoogleCalendarResource = {
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

type GoogleEventBody = {
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

type DesiredGoogleEvent = {
  sourceKey: string;
  signature: string;
  body: GoogleEventBody;
};

function addDaysToDateKey(dateKey: string, amount: number) {
  const date = new Date(`${dateKey}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function saoPauloDateKey(value: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: GOOGLE_CALENDAR_TIME_ZONE,
    year: "numeric",
  }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function openCommitmentRecurrence(
  startDate: string,
  startTime: string | null,
  completedAt: Date | null,
) {
  if (!completedAt) return ["RRULE:FREQ=DAILY"];
  const completedDate = saoPauloDateKey(completedAt);
  const untilDate = (completedDate < startDate ? startDate : completedDate).replaceAll("-", "");
  return [`RRULE:FREQ=DAILY;UNTIL=${startTime ? `${untilDate}T235959Z` : untilDate}`];
}

function addMinutesToLocalDateTime(dateKey: string, time: string, amount: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute + amount));
  return {
    dateKey: date.toISOString().slice(0, 10),
    time: date.toISOString().slice(11, 16),
  };
}

function eventPeriod(
  startDate: string,
  endDate: string,
  startTime: string | null,
  endTime: string | null,
) {
  if (!startTime) {
    return {
      start: { date: startDate },
      end: { date: addDaysToDateKey(endDate, 1) },
    };
  }

  const calculatedEnd = endTime
    ? { dateKey: endDate, time: endTime }
    : endDate !== startDate
      ? { dateKey: endDate, time: startTime }
      : addMinutesToLocalDateTime(startDate, startTime, 60);

  return {
    start: {
      dateTime: `${startDate}T${startTime}:00`,
      timeZone: GOOGLE_CALENDAR_TIME_ZONE,
    },
    end: {
      dateTime: `${calculatedEnd.dateKey}T${calculatedEnd.time}:00`,
      timeZone: GOOGLE_CALENDAR_TIME_ZONE,
    },
  };
}

function desiredEvent(
  sourceKey: string,
  values: Omit<GoogleEventBody, "extendedProperties">,
): DesiredGoogleEvent {
  const signature = createHash("sha256")
    .update(JSON.stringify(values), "utf8")
    .digest("hex")
    .slice(0, 32);

  return {
    sourceKey,
    signature,
    body: {
      ...values,
      extendedProperties: {
        private: {
          [MANAGED_PROPERTY]: "v1",
          [SOURCE_KEY_PROPERTY]: sourceKey,
          [SIGNATURE_PROPERTY]: signature,
        },
      },
    },
  };
}

async function desiredGoogleEvents(userId: string) {
  const [personalEvents, academicTasks] = await Promise.all([
    db.calendarEvent.findMany({
      where: { userId },
      orderBy: [{ startDate: "asc" }, { startTime: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        title: true,
        description: true,
        eventType: true,
        startDate: true,
        endDate: true,
        startTime: true,
        endTime: true,
        completedAt: true,
        subject: { select: { name: true } },
      },
    }),
    db.academicTask.findMany({
      where: { subject: { userId } },
      orderBy: [{ dueDate: "asc" }, { dueTime: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        title: true,
        description: true,
        dueDate: true,
        dueTime: true,
        priority: true,
        completedAt: true,
        source: true,
        sourceUrl: true,
        subject: { select: { name: true } },
      },
    }),
  ]);

  const official = academicCalendarEvents.map((event) => desiredEvent(
    `official:${event.id}`,
    {
      summary: `[IFPB] ${event.title}`,
      description: [
        academicCalendarCategories[event.category].label,
        `${academicCalendarMetadata.campus} · ${academicCalendarMetadata.audience}`,
        `Fonte: ${academicCalendarMetadata.title}`,
        "Sincronizado pelo AcadIA.",
      ].join("\n"),
      colorId: googleCalendarColorForAcademicEvent(event.category),
      ...eventPeriod(
        event.startDate,
        event.endDate ?? event.startDate,
        null,
        null,
      ),
      transparency: "transparent" as const,
      visibility: "private" as const,
      reminders: { useDefault: true },
    },
  ));

  const personal = personalEvents.map((event) => {
    const startDate = event.startDate.toISOString().slice(0, 10);
    const endDate = event.endDate?.toISOString().slice(0, 10) ?? startDate;
    const openEnded = event.endDate === null;
    const completed = event.completedAt !== null;
    const details = [
      event.subject ? `Disciplina: ${event.subject.name}` : null,
      `Tipo: ${CALENDAR_EVENT_TYPE_DETAILS[event.eventType].label}`,
      openEnded ? `Status: ${completed ? "ConcluÃ­do" : "Em aberto"}` : null,
      event.description,
      "Evento pessoal sincronizado pelo AcadIA.",
    ].filter((value): value is string => Boolean(value));

    return desiredEvent(`personal:${event.id}`, {
      summary: `${completed ? "âœ“ " : ""}${event.title}`,
      description: details.join("\n"),
      colorId: googleCalendarColorForPersonalEvent(event.eventType),
      ...eventPeriod(startDate, endDate, event.startTime, event.endTime),
      recurrence: openEnded
        ? openCommitmentRecurrence(startDate, event.startTime, event.completedAt)
        : undefined,
      transparency: "opaque" as const,
      visibility: "private" as const,
      reminders: { useDefault: true },
    });
  });

  const tasks = academicTasks.map((task) => {
    const dueDate = task.dueDate.toISOString().slice(0, 10);
    const completed = task.completedAt !== null;
    const classroom = task.source === "GOOGLE_CLASSROOM";
    const statusLabel = completed
      ? classroom ? "Enviada ou concluída" : "Concluída"
      : "Pendente";
    const details = [
      `Status: ${statusLabel}`,
      `Origem: ${classroom ? "Google Classroom" : "Agenda do AcadIA"}`,
      `Disciplina: ${task.subject.name}`,
      `Prioridade: ${TASK_PRIORITY_LABELS[task.priority]}`,
      task.description,
      task.sourceUrl ? `Abrir atividade: ${task.sourceUrl}` : null,
      "Atividade sincronizada pelo AcadIA.",
    ].filter((value): value is string => Boolean(value));

    return desiredEvent(`task:${task.id}`, {
      summary: `${completed ? "✓ " : ""}[${classroom ? "Classroom" : "Atividade"}] ${task.title}`,
      description: details.join("\n"),
      colorId: GOOGLE_CALENDAR_EVENT_COLOR_IDS.RED,
      ...eventPeriod(dueDate, dueDate, task.dueTime, null),
      transparency: "transparent" as const,
      visibility: "private" as const,
      reminders: { useDefault: !completed },
    });
  });

  return [...official, ...personal, ...tasks];
}

function calendarErrorCode(status: number): GoogleCalendarErrorCode {
  if (status === 401) return "AUTH_EXPIRED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404 || status === 410) return "NOT_FOUND";
  return "UPSTREAM_FAILURE";
}

async function calendarApiRequest<T>(
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
    );
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function calendarPath(calendarId: string, suffix = "") {
  return `/calendars/${encodeURIComponent(calendarId)}${suffix}`;
}

async function createGoogleCalendar(userId: string, accessToken: string) {
  const calendar = await calendarApiRequest<GoogleCalendarResource>(
    "/calendars",
    accessToken,
    {
      method: "POST",
      body: JSON.stringify({
        summary: GOOGLE_CALENDAR_NAME,
        description: "Eventos institucionais, pessoais e atividades sincronizados pelo AcadIA.",
        timeZone: GOOGLE_CALENDAR_TIME_ZONE,
      }),
    },
  );
  if (!calendar.id) throw new GoogleCalendarError("UPSTREAM_FAILURE");

  return db.googleCalendarIntegration.upsert({
    where: { userId },
    create: {
      userId,
      calendarId: calendar.id,
      calendarName: calendar.summary ?? GOOGLE_CALENDAR_NAME,
    },
    update: {
      calendarId: calendar.id,
      calendarName: calendar.summary ?? GOOGLE_CALENDAR_NAME,
      lastSyncError: null,
    },
    select: { id: true, calendarId: true, calendarName: true },
  });
}

async function ensureGoogleCalendar(userId: string, accessToken: string) {
  const existing = await db.googleCalendarIntegration.findUnique({
    where: { userId },
    select: { id: true, calendarId: true, calendarName: true },
  });

  if (existing) {
    try {
      await calendarApiRequest<GoogleCalendarResource>(
        calendarPath(existing.calendarId),
        accessToken,
      );
      return existing;
    } catch (error) {
      if (!(error instanceof GoogleCalendarError) || error.code !== "NOT_FOUND") {
        throw error;
      }
      await db.googleCalendarIntegration.delete({ where: { id: existing.id } });
    }
  }

  return createGoogleCalendar(userId, accessToken);
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
  await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, async () => {
    while (nextIndex < tasks.length) {
      const task = tasks[nextIndex];
      nextIndex += 1;
      await task();
    }
  }));
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
        await calendarApiRequest(
          calendarPath(calendarId, "/events"),
          accessToken,
          { method: "POST", body: JSON.stringify(event.body) },
        );
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
        { method: "PATCH", body: JSON.stringify(event.body) },
      );
      updatedCount += 1;
    });
  }

  for (const event of staleEvents) {
    if (!event.id) continue;
    tasks.push(async () => {
      await calendarApiRequest(
        calendarPath(calendarId, `/events/${encodeURIComponent(event.id!)}`),
        accessToken,
        { method: "DELETE" },
      );
      deletedCount += 1;
    });
  }

  await runWithConcurrency(tasks);
  return { createdCount, updatedCount, deletedCount, unchangedCount };
}

function permissionRequiredResult(): GoogleCalendarSyncResult {
  return {
    status: "permission-required",
    message: "Autorize o Google Agenda com seu e-mail institucional.",
    calendarName: null,
    eventCount: 0,
    createdCount: 0,
    updatedCount: 0,
    deletedCount: 0,
    unchangedCount: 0,
  };
}

function calendarErrorMessage(error: unknown) {
  if (error instanceof GoogleCalendarError) {
    if (error.code === "AUTH_EXPIRED") return "A autorização do Google expirou. Conecte novamente.";
    if (error.code === "FORBIDDEN") {
      const googleMessage = error.message.toLocaleLowerCase("en-US");
      if (
        googleMessage.includes("has not been used")
        || googleMessage.includes("it is disabled")
        || googleMessage.includes("access not configured")
      ) {
        return "A Google Calendar API está desativada no projeto Google Cloud do AcadIA.";
      }
      if (
        googleMessage.includes("administrator")
        || googleMessage.includes("admin policy")
        || googleMessage.includes("domain policy")
      ) {
        return "A política da conta institucional bloqueou o acesso ao Google Agenda.";
      }
      return "O Google bloqueou o Agenda ou a API Google Calendar ainda não foi liberada para o projeto.";
    }
    if (error.code === "NOT_FOUND") return "O calendário conectado não foi encontrado.";
  }
  return "Não foi possível sincronizar o Google Agenda agora.";
}

export async function getCurrentGoogleCalendarStatus(): Promise<GoogleCalendarStatusDTO> {
  const { googleSubject } = await requireCurrentIdentity();
  const user = await db.user.findUnique({
    where: { googleSubject },
    select: {
      googleCalendarCredential: {
        select: {
          accountEmail: true,
          grantedScopes: true,
        },
      },
      googleCalendarIntegration: {
        select: {
          calendarName: true,
          lastSyncedAt: true,
          lastSyncedEventCount: true,
          lastSyncError: true,
        },
      },
    },
  });
  const credential = user?.googleCalendarCredential;
  if (!credential || !grantedScopesIncludeGoogleCalendar(credential.grantedScopes)) {
    return {
      status: "permission-required",
      accountEmail: null,
      calendarName: null,
      eventCount: 0,
      lastSyncedAt: null,
      lastError: null,
    };
  }

  const integration = user?.googleCalendarIntegration;
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

export async function syncGoogleCalendarForGoogleSubject(
  googleSubject: string,
): Promise<GoogleCalendarSyncResult> {
  const user = await db.user.findUnique({
    where: { googleSubject },
    select: { id: true },
  });
  if (!user) return permissionRequiredResult();

  let accessToken: string;
  try {
    accessToken = await getGoogleCalendarAccessToken(googleSubject);
  } catch (error) {
    if (error instanceof GoogleCalendarConnectionError) return permissionRequiredResult();
    throw error;
  }

  let integration: { id: string; calendarId: string; calendarName: string } | null = null;
  try {
    integration = await ensureGoogleCalendar(user.id, accessToken);
    const desired = await desiredGoogleEvents(user.id);
    const counts = await reconcileGoogleEvents(
      integration.calendarId,
      accessToken,
      desired,
    );
    const syncedAt = new Date();
    await db.googleCalendarIntegration.update({
      where: { id: integration.id },
      data: {
        lastSyncedAt: syncedAt,
        lastSyncedEventCount: desired.length,
        lastSyncError: null,
      },
      select: { id: true },
    });

    return {
      status: "success",
      message: `${desired.length} evento(s) sincronizado(s) com o Google Agenda.`,
      calendarName: integration.calendarName,
      eventCount: desired.length,
      ...counts,
    };
  } catch (error) {
    const message = calendarErrorMessage(error);
    if (integration) {
      await db.googleCalendarIntegration.updateMany({
        where: { id: integration.id },
        data: { lastSyncError: message },
      });
    }
    return {
      status: "error",
      message,
      calendarName: integration?.calendarName ?? null,
      eventCount: 0,
      createdCount: 0,
      updatedCount: 0,
      deletedCount: 0,
      unchangedCount: 0,
    };
  }
}

export async function syncCurrentGoogleCalendar() {
  const { googleSubject } = await requireCurrentIdentity();
  return syncGoogleCalendarForGoogleSubject(googleSubject);
}
