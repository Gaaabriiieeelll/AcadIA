import "server-only";

import { db } from "@/lib/db";
import type { CalendarEventDTO, CalendarEventFormValues } from "@/types/calendar-events";

import { requireCurrentIdentity } from "./current-user";
import { AcademicResourceNotFoundError } from "./subjects";

function databaseDate(dateKey: string) {
  return new Date(`${dateKey}T12:00:00.000Z`);
}

function dateKeyInSaoPaulo(value: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
    year: "numeric",
  }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

async function requireCalendarUser() {
  const { googleSubject } = await requireCurrentIdentity();
  const user = await db.user.findUnique({
    where: { googleSubject },
    select: { id: true },
  });

  if (!user) throw new AcademicResourceNotFoundError();
  return user;
}

export async function getCalendarEventsForUser(
  userId: string,
  rangeStart: string,
  rangeEnd: string,
): Promise<CalendarEventDTO[]> {
  const events = await db.calendarEvent.findMany({
    where: {
      userId,
      startDate: { lte: databaseDate(rangeEnd) },
      OR: [
        { endDate: { gte: databaseDate(rangeStart) } },
        { endDate: null },
      ],
    },
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
      subject: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
  });

  return events.map((event) => ({
    ...event,
    startDate: event.startDate.toISOString().slice(0, 10),
    endDate: event.endDate?.toISOString().slice(0, 10) ?? null,
    completedAt: event.completedAt?.toISOString() ?? null,
  })).filter((event) => {
    const effectiveEndDate = event.endDate
      ?? (event.completedAt ? dateKeyInSaoPaulo(new Date(event.completedAt)) : rangeEnd);
    return effectiveEndDate >= rangeStart;
  });
}

export async function getCurrentCalendarEvents(
  rangeStart: string,
  rangeEnd: string,
): Promise<CalendarEventDTO[]> {
  const user = await requireCalendarUser();
  return getCalendarEventsForUser(user.id, rangeStart, rangeEnd);
}

export async function createCurrentCalendarEvent(values: CalendarEventFormValues) {
  const user = await requireCalendarUser();
  let subjectId: string | null = null;

  if (values.subjectId) {
    const subject = await db.subject.findFirst({
      where: { id: values.subjectId, userId: user.id },
      select: { id: true },
    });

    if (!subject) throw new AcademicResourceNotFoundError();
    subjectId = subject.id;
  }

  await db.calendarEvent.create({
    data: {
      userId: user.id,
      subjectId,
      title: values.title,
      description: values.description,
      eventType: values.eventType,
      startDate: databaseDate(values.startDate),
      endDate: values.endDate ? databaseDate(values.endDate) : null,
      startTime: values.startTime,
      endTime: values.endTime,
    },
    select: { id: true },
  });
}

export async function setCurrentCalendarEventCompleted(eventId: string, completed: boolean) {
  const user = await requireCalendarUser();
  const result = await db.calendarEvent.updateMany({
    where: {
      id: eventId,
      userId: user.id,
      endDate: null,
    },
    data: { completedAt: completed ? new Date() : null },
  });

  if (result.count === 0) throw new AcademicResourceNotFoundError();
}

export async function deleteCurrentCalendarEvent(eventId: string) {
  const user = await requireCalendarUser();
  const result = await db.calendarEvent.deleteMany({
    where: { id: eventId, userId: user.id },
  });

  if (result.count === 0) throw new AcademicResourceNotFoundError();
}
