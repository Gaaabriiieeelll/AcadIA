import "server-only";

import { calendarApiRequest, calendarPath, GoogleCalendarError, syncCategorizedGoogleEvents, type GoogleCalendarResource, type DesiredGoogleEvent, type GoogleEventBody } from "@/lib/google-calendar-sync";

import { inclusiveCalendarDays, taskCalendarPeriod } from "@/lib/google-calendar-period";
import { createHash, randomUUID } from "node:crypto";
import {
  GOOGLE_CALENDAR_CATEGORIES,
  personalCalendarCategory,
  readCategoryCalendarIds,
  type GoogleCalendarCategory,
} from "@/lib/google-calendar-categories";

import {
  academicCalendarCategories,
  academicCalendarEvents,
  academicCalendarMetadata,
} from "@/data/academic-calendar";
import { requireCurrentIdentity } from "@/data/current-user";
import { getNoticeCalendarDeadlines } from "@/data/notices";
import { db } from "@/lib/db";
import {
  getGoogleCalendarAccessToken,
  GoogleCalendarConnectionError,
  grantedScopesIncludeGoogleCalendar,
} from "@/lib/google-calendar-credentials";
import {
  GOOGLE_CALENDAR_REAUTH_MESSAGE,
  googleCalendarStatusFromStoredState,
} from "@/lib/google-calendar-status";
import { CALENDAR_EVENT_TYPE_DETAILS } from "@/types/calendar-events";
import type {
  GoogleCalendarStatusDTO,
  GoogleCalendarSyncResult,
} from "@/types/google-calendar";

const GOOGLE_CALENDAR_NAME = GOOGLE_CALENDAR_CATEGORIES.institutional.name;
const GOOGLE_CALENDAR_TIME_ZONE = "America/Sao_Paulo";
const MANAGED_PROPERTY = "acadiaManaged";
const SOURCE_KEY_PROPERTY = "acadiaSourceKey";
const SIGNATURE_PROPERTY = "acadiaSignature";
const TASK_PRIORITY_LABELS = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
} as const;

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
    return inclusiveCalendarDays(startDate, endDate);
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
  values: Omit<GoogleEventBody, "extendedProperties" | "colorId">,
  category: GoogleCalendarCategory,
): DesiredGoogleEvent {
  const coloredValues = { ...values, colorId: GOOGLE_CALENDAR_CATEGORIES[category].eventColorId };
  const signature = createHash("sha256")
    .update(JSON.stringify(coloredValues), "utf8")
    .digest("hex")
    .slice(0, 32);

  return {
    category,
    sourceKey,
    signature,
    body: {
      ...coloredValues,
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
        startDate: true,
        startDateSource: true,
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
        "Sincronizado pelo Conecta Campus.",
      ].join("\n"),
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
    "institutional",
  ));

  const noticeDeadlines = getNoticeCalendarDeadlines().map((deadline) => desiredEvent(
    `notice:${deadline.id}`,
    {
      summary: `[Edital IFPB] ${deadline.noticeNumber}: ${deadline.title}`,
      description: [
        "Prazo de edital do Campus João Pessoa.",
        "Confira requisitos, horários e possíveis retificações na publicação oficial.",
        deadline.officialUrl,
        "Sincronizado pelo Conecta Campus.",
      ].join("\n"),
      ...eventPeriod(deadline.startDate, deadline.endDate, null, null),
      transparency: "transparent" as const,
      visibility: "private" as const,
      reminders: { useDefault: true },
    },
    "notices",
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
      "Evento pessoal sincronizado pelo Conecta Campus.",
    ].filter((value): value is string => Boolean(value));

    return desiredEvent(`personal:${event.id}`, {
      summary: `${completed ? "âœ“ " : ""}${event.title}`,
      description: details.join("\n"),
      ...eventPeriod(startDate, endDate, event.startTime, event.endTime),
      recurrence: openEnded
        ? openCommitmentRecurrence(startDate, event.startTime, event.completedAt)
        : undefined,
      transparency: "opaque" as const,
      visibility: "private" as const,
      reminders: { useDefault: true },
    }, personalCalendarCategory(event.eventType));
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
      task.startDate ? `Início: ${task.startDate.toISOString().slice(0, 10)}${task.startDateSource === "CREATED" ? " (referência: criação no Classroom; pode anteceder a publicação)" : ""}` : null,
      `Prazo final: ${dueDate}${task.dueTime ? ` às ${task.dueTime} (America/Sao_Paulo)` : ""}`,
      `Origem: ${classroom ? "Google Classroom" : "Agenda do Conecta Campus"}`,
      `Disciplina: ${task.subject.name}`,
      `Prioridade: ${TASK_PRIORITY_LABELS[task.priority]}`,
      task.description,
      task.sourceUrl ? `Abrir atividade: ${task.sourceUrl}` : null,
      "Atividade sincronizada pelo Conecta Campus.",
    ].filter((value): value is string => Boolean(value));

    return desiredEvent(`task:${task.id}`, {
      summary: `${completed ? "✓ " : ""}[${classroom ? "Classroom" : "Atividade"}] ${task.title}`,
      description: details.join("\n"),
      ...taskCalendarPeriod(task.startDate?.toISOString().slice(0, 10) ?? null, dueDate, task.dueTime),
      transparency: "transparent" as const,
      visibility: "private" as const,
      reminders: { useDefault: !completed },
    }, "activities");
  });

  return [...official, ...noticeDeadlines, ...personal, ...tasks];
}

async function createGoogleCalendar(userId: string, accessToken: string) {
  const calendar = await calendarApiRequest<GoogleCalendarResource>(
    "/calendars",
    accessToken,
    {
      method: "POST",
      body: JSON.stringify({
        summary: GOOGLE_CALENDAR_NAME,
        description: "Calendário institucional sincronizado pelo Conecta Campus.",
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
      const calendar = await calendarApiRequest<GoogleCalendarResource>(
        calendarPath(existing.calendarId),
        accessToken,
      );
      // Rename only the original app label; preserve names chosen by the user.
      if (calendar.summary === "AcadIA · Calendário acadêmico" || calendar.summary === "Conecta Campus · Calendário acadêmico") {
        await calendarApiRequest<GoogleCalendarResource>(
          calendarPath(existing.calendarId),
          accessToken,
          {
            method: "PATCH",
            body: JSON.stringify({ summary: GOOGLE_CALENDAR_NAME }),
          },
        );
        calendar.summary = GOOGLE_CALENDAR_NAME;
      }
      if (calendar.summary && calendar.summary !== existing.calendarName) {
        return db.googleCalendarIntegration.update({
          where: { id: existing.id },
          data: { calendarName: calendar.summary },
          select: { id: true, calendarId: true, calendarName: true },
        });
      }
      return existing;
    } catch (error) {
      if (!(error instanceof GoogleCalendarError) || error.code !== "NOT_FOUND") {
        throw error;
      }
      // Keep the other category IDs when only the institutional calendar was removed.
    }
  }

  return createGoogleCalendar(userId, accessToken);
}

async function ensureCategoryCalendars(
  integration: { id: string; calendarId: string },
  accessToken: string,
) {
  const stored = await db.googleCalendarIntegration.findUniqueOrThrow({
    where: { id: integration.id }, select: { categoryCalendars: true },
  });
  const ids = readCategoryCalendarIds(stored.categoryCalendars);
  const metadata = stored.categoryCalendars as Record<string, unknown>;
  const pendingColors = new Set<GoogleCalendarCategory>(
    Array.isArray(metadata._pendingColors)
      ? metadata._pendingColors.filter((key): key is GoogleCalendarCategory => typeof key === "string" && key in GOOGLE_CALENDAR_CATEGORIES)
      : [],
  );
  const persistIds = () => db.googleCalendarIntegration.update({
    where: { id: integration.id }, data: { categoryCalendars: { ...ids, _pendingColors: [...pendingColors] } },
  });
  if (ids.institutional !== integration.calendarId) {
    pendingColors.add("institutional");
  }
  ids.institutional = integration.calendarId;
  for (const category of Object.keys(GOOGLE_CALENDAR_CATEGORIES) as GoogleCalendarCategory[]) {
    if (category === "institutional") continue;
    if (ids[category]) {
      try {
        await calendarApiRequest(calendarPath(ids[category]!), accessToken);
        continue;
      } catch (error) {
        if (!(error instanceof GoogleCalendarError) || error.code !== "NOT_FOUND") throw error;
      }
    }
    const settings = GOOGLE_CALENDAR_CATEGORIES[category];
    const calendar = await calendarApiRequest<GoogleCalendarResource>("/calendars", accessToken, {
      method: "POST",
      body: JSON.stringify({ summary: settings.name, description: "Sincronizado pelo Conecta Campus.", timeZone: GOOGLE_CALENDAR_TIME_ZONE }),
    });
    if (!calendar.id) throw new GoogleCalendarError("UPSTREAM_FAILURE");
    ids[category] = calendar.id;
    pendingColors.add(category);
    // Persist each ID immediately so a later failed request can be resumed.
    await persistIds();
  }
  await persistIds();
  for (const category of pendingColors) {
    await calendarApiRequest(`/users/me/calendarList/${encodeURIComponent(ids[category]!)}?colorRgbFormat=true`, accessToken, {
      method: "PATCH",
      body: JSON.stringify({ backgroundColor: GOOGLE_CALENDAR_CATEGORIES[category].color, foregroundColor: "#ffffff" }),
    });
    pendingColors.delete(category);
    await persistIds();
  }
  return ids as Record<GoogleCalendarCategory, string>;
}

function permissionRequiredResult(
  message = "Autorize o Google Agenda com seu e-mail institucional.",
): GoogleCalendarSyncResult {
  return {
    status: "permission-required",
    message,
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
    if (error.code === "AUTH_EXPIRED") return GOOGLE_CALENDAR_REAUTH_MESSAGE;
    if (error.code === "FORBIDDEN") {
      const googleMessage = error.message.toLocaleLowerCase("en-US");
      if (
        googleMessage.includes("has not been used")
        || googleMessage.includes("it is disabled")
        || googleMessage.includes("access not configured")
      ) {
        return "A Google Calendar API está desativada no projeto Google Cloud do Conecta Campus.";
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
          accessTokenExpiresAt: true,
          encryptedRefreshToken: true,
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
  return googleCalendarStatusFromStoredState(
    credential
      ? {
          accountEmail: credential.accountEmail,
          hasCalendarPermission: grantedScopesIncludeGoogleCalendar(credential.grantedScopes),
          accessTokenExpiresAt: credential.accessTokenExpiresAt,
          hasRefreshToken: Boolean(credential.encryptedRefreshToken),
        }
      : null,
    user?.googleCalendarIntegration ?? null,
  );
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
    if (error instanceof GoogleCalendarConnectionError) {
      const authorizationExpired = error.code === "AUTH_EXPIRED";
      const message = error.code === "UPSTREAM_FAILURE"
        ? "Não foi possível acessar o Google Agenda agora. Tente sincronizar novamente."
        : authorizationExpired
          ? GOOGLE_CALENDAR_REAUTH_MESSAGE
          : "Autorize o Google Agenda com seu e-mail institucional.";
      await db.googleCalendarIntegration.updateMany({
        where: { userId: user.id },
        data: { lastSyncError: message },
      });
      return error.code === "UPSTREAM_FAILURE"
        ? {
            status: "error",
            message,
            calendarName: null,
            eventCount: 0,
            createdCount: 0,
            updatedCount: 0,
            deletedCount: 0,
            unchangedCount: 0,
          }
        : permissionRequiredResult(message);
    }
    throw error;
  }

  let integration: { id: string; calendarId: string; calendarName: string } | null = null;
  const leaseToken = randomUUID();
  let leaseAcquired = false;
  try {
    const lease = await db.user.updateMany({
      where: { id: user.id, OR: [{ calendarSyncLeaseUntil: null }, { calendarSyncLeaseUntil: { lt: new Date() } }] },
      data: { calendarSyncLeaseToken: leaseToken, calendarSyncLeaseUntil: new Date(Date.now() + 15 * 60_000) },
    });
    if (!lease.count) {
      return { ...permissionRequiredResult(), status: "error", message: "Já existe uma sincronização em andamento. Aguarde e atualize a página." };
    }
    leaseAcquired = true;
    integration = await ensureGoogleCalendar(user.id, accessToken);
    const calendarIds = await ensureCategoryCalendars(integration, accessToken);
    const desired = await desiredGoogleEvents(user.id);
    const counts = await syncCategorizedGoogleEvents(
      calendarIds,
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
      message: `${desired.length} evento(s) sincronizado(s) em 5 agendas. No Google Agenda, marque ou desmarque as agendas do Conecta Campus para filtrar.`,
      calendarName: integration.calendarName,
      eventCount: desired.length,
      ...counts,
    };
  } catch (error) {
    if (error instanceof GoogleCalendarError) {
      console.error("Google Calendar sync failed", {
        code: error.code,
        message: error.message,
        stage: integration ? "events" : "calendar",
      });
    }
    const message = calendarErrorMessage(error);
    await db.googleCalendarIntegration.updateMany({
      where: { userId: user.id },
      data: { lastSyncError: message },
    });
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
  } finally {
    if (leaseAcquired) {
      await db.user.updateMany({
        where: { id: user.id, calendarSyncLeaseToken: leaseToken },
        data: { calendarSyncLeaseToken: null, calendarSyncLeaseUntil: null },
      });
    }
  }
}

export async function syncCurrentGoogleCalendar() {
  const { googleSubject } = await requireCurrentIdentity();
  return syncGoogleCalendarForGoogleSubject(googleSubject);
}
