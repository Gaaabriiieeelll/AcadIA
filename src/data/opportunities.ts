import "server-only";

import { db } from "@/lib/db";
import type { OpportunityDTO, OpportunityValues } from "@/types/opportunities";

import { requireCurrentIdentity } from "./current-user";

export class OpportunityNotFoundError extends Error {}
export class OpportunityLimitError extends Error {}

function databaseDate(value: string) {
  return new Date(`${value}T12:00:00.000Z`);
}

function reminderDetails(values: OpportunityValues) {
  return {
    title: `Prazo: ${values.title}`.slice(0, 140),
    description: `Candidatura de oportunidade salva no AcadIA. Fonte: ${values.sourceUrl}`.slice(0, 500),
    eventType: "OTHER" as const,
    startDate: databaseDate(values.deadline!),
    endDate: databaseDate(values.deadline!),
  };
}

async function requireOpportunityUser() {
  const { googleSubject } = await requireCurrentIdentity();
  const user = await db.user.findUnique({
    where: { googleSubject },
    select: { id: true },
  });
  if (!user) throw new OpportunityNotFoundError();
  return user;
}

export async function getCurrentOpportunities(): Promise<OpportunityDTO[]> {
  const user = await requireOpportunityUser();
  const records = await db.opportunity.findMany({
    where: { userId: user.id },
    orderBy: [{ favorite: "desc" }, { deadline: "asc" }, { createdAt: "desc" }],
  });
  return records.map((record) => ({
    id: record.id,
    title: record.title,
    organization: record.organization,
    kind: record.kind as OpportunityDTO["kind"],
    acceptedCourses: record.acceptedCourses,
    modality: record.modality as OpportunityDTO["modality"],
    location: record.location,
    deadline: record.deadline?.toISOString().slice(0, 10) ?? null,
    sourceUrl: record.sourceUrl,
    requirements: record.requirements,
    documents: record.documents,
    notes: record.notes,
    favorite: record.favorite,
    hasReminder: Boolean(record.reminderEventId),
    createdAt: record.createdAt.toISOString(),
  }));
}

function recordValues(values: OpportunityValues) {
  return {
    title: values.title,
    organization: values.organization,
    kind: values.kind,
    acceptedCourses: values.acceptedCourses,
    modality: values.modality,
    location: values.location,
    deadline: values.deadline ? databaseDate(values.deadline) : null,
    sourceUrl: values.sourceUrl,
    requirements: values.requirements,
    documents: values.documents,
    notes: values.notes,
  };
}

export async function createCurrentOpportunity(values: OpportunityValues) {
  const user = await requireOpportunityUser();
  await db.$transaction(async (transaction) => {
    const count = await transaction.opportunity.count({ where: { userId: user.id } });
    if (count >= 100) throw new OpportunityLimitError();

    const reminder = values.reminder && values.deadline
      ? await transaction.calendarEvent.create({
        data: { userId: user.id, ...reminderDetails(values) },
        select: { id: true },
      })
      : null;

    await transaction.opportunity.create({
      data: {
        userId: user.id,
        ...recordValues(values),
        reminderEventId: reminder?.id ?? null,
      },
    });
  });
}

export async function updateCurrentOpportunity(id: string, values: OpportunityValues) {
  const user = await requireOpportunityUser();
  await db.$transaction(async (transaction) => {
    const existing = await transaction.opportunity.findFirst({
      where: { id, userId: user.id },
      select: { reminderEventId: true },
    });
    if (!existing) throw new OpportunityNotFoundError();

    let reminderEventId = existing.reminderEventId;
    if (values.reminder && values.deadline) {
      if (reminderEventId) {
        const updated = await transaction.calendarEvent.updateMany({
          where: { id: reminderEventId, userId: user.id },
          data: reminderDetails(values),
        });
        if (updated.count === 0) reminderEventId = null;
      }
      if (!reminderEventId) {
        const reminder = await transaction.calendarEvent.create({
          data: { userId: user.id, ...reminderDetails(values) },
          select: { id: true },
        });
        reminderEventId = reminder.id;
      }
    } else {
      reminderEventId = null;
    }

    const updated = await transaction.opportunity.updateMany({
      where: { id, userId: user.id },
      data: { ...recordValues(values), reminderEventId },
    });
    if (updated.count === 0) throw new OpportunityNotFoundError();

    if (existing.reminderEventId && !reminderEventId) {
      await transaction.calendarEvent.deleteMany({
        where: { id: existing.reminderEventId, userId: user.id },
      });
    }
  });
}

export async function setCurrentOpportunityFavorite(id: string, favorite: boolean) {
  const user = await requireOpportunityUser();
  const updated = await db.opportunity.updateMany({
    where: { id, userId: user.id },
    data: { favorite },
  });
  if (updated.count === 0) throw new OpportunityNotFoundError();
}

export async function deleteCurrentOpportunity(id: string) {
  const user = await requireOpportunityUser();
  await db.$transaction(async (transaction) => {
    const existing = await transaction.opportunity.findFirst({
      where: { id, userId: user.id },
      select: { reminderEventId: true },
    });
    if (!existing) throw new OpportunityNotFoundError();

    await transaction.opportunity.deleteMany({ where: { id, userId: user.id } });
    if (existing.reminderEventId) {
      await transaction.calendarEvent.deleteMany({
        where: { id: existing.reminderEventId, userId: user.id },
      });
    }
  });
}
