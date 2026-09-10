import "server-only";

import { db } from "@/lib/db";
import type {
  AcademicTaskDTO,
  AcademicTaskFormValues,
  AcademicTaskOverviewDTO,
  AcademicTaskStatus,
} from "@/types/academic-tasks";

import { requireCurrentIdentity } from "./current-user";
import { AcademicResourceNotFoundError } from "./subjects";

function saoPauloDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function taskStatus(dueDate: string, completed: boolean): AcademicTaskStatus {
  if (completed) return "completed";
  const today = saoPauloDateKey();
  if (dueDate < today) return "overdue";
  if (dueDate === today) return "today";
  return "upcoming";
}

export async function getCurrentAcademicTasks(): Promise<AcademicTaskDTO[]> {
  const { googleSubject } = await requireCurrentIdentity();
  const tasks = await db.academicTask.findMany({
    where: { subject: { user: { googleSubject } } },
    orderBy: [{ dueDate: "asc" }, { dueTime: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      title: true,
      description: true,
      dueDate: true,
      dueTime: true,
      priority: true,
      source: true,
      sourceUrl: true,
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

  return tasks
    .map((task) => {
      const completed = task.completedAt !== null;
      const dueDate = task.dueDate.toISOString().slice(0, 10);
      return {
        id: task.id,
        title: task.title,
        description: task.description,
        dueDate,
        dueTime: task.dueTime,
        priority: task.priority,
        source: task.source,
        sourceUrl: task.sourceUrl,
        completed,
        completedAt: task.completedAt?.toISOString() ?? null,
        status: taskStatus(dueDate, completed),
        subject: task.subject,
      };
    })
    .sort((left, right) => {
      if (left.completed !== right.completed) {
        return Number(left.completed) - Number(right.completed);
      }

      if (left.completed && right.completed) {
        return (
          (right.completedAt ?? "").localeCompare(left.completedAt ?? "") ||
          right.dueDate.localeCompare(left.dueDate) ||
          (right.dueTime ?? "").localeCompare(left.dueTime ?? "")
        );
      }

      return (
        left.dueDate.localeCompare(right.dueDate) ||
        (left.dueTime ?? "").localeCompare(right.dueTime ?? "")
      );
    });
}

export async function getCurrentTaskOverview(): Promise<AcademicTaskOverviewDTO> {
  const tasks = await getCurrentAcademicTasks();
  const pending = tasks.filter((task) => !task.completed);
  const today = saoPauloDateKey();
  const todayTime = Date.parse(`${today}T12:00:00.000Z`);
  const dueSoon = pending.filter((task) => {
    const distance = (Date.parse(`${task.dueDate}T12:00:00.000Z`) - todayTime) / 86400000;
    return distance >= 0 && distance <= 7;
  });

  return {
    pendingCount: pending.length,
    dueTodayCount: pending.filter((task) => task.status === "today").length,
    overdueCount: pending.filter((task) => task.status === "overdue").length,
    dueSoonCount: dueSoon.length,
    nextTask: pending[0] ?? null,
  };
}

export async function createCurrentAcademicTask(values: AcademicTaskFormValues) {
  const { googleSubject } = await requireCurrentIdentity();
  const subject = await db.subject.findFirst({
    where: { id: values.subjectId, user: { googleSubject } },
    select: { id: true },
  });

  if (!subject) throw new AcademicResourceNotFoundError();

  await db.academicTask.create({
    data: {
      subjectId: subject.id,
      title: values.title,
      description: values.description,
      dueDate: new Date(`${values.dueDate}T12:00:00.000Z`),
      dueTime: values.dueTime,
      priority: values.priority,
    },
    select: { id: true },
  });
}

export async function toggleCurrentAcademicTask(taskId: string) {
  const { googleSubject } = await requireCurrentIdentity();
  const task = await db.academicTask.findFirst({
    where: {
      id: taskId,
      source: "MANUAL",
      subject: { user: { googleSubject } },
    },
    select: { id: true, completedAt: true },
  });

  if (!task) throw new AcademicResourceNotFoundError();

  await db.academicTask.update({
    where: { id: task.id },
    data: { completedAt: task.completedAt ? null : new Date() },
    select: { id: true },
  });
}

export async function deleteCurrentAcademicTask(taskId: string) {
  const { googleSubject } = await requireCurrentIdentity();
  const result = await db.academicTask.deleteMany({
    where: {
      id: taskId,
      source: "MANUAL",
      subject: { user: { googleSubject } },
    },
  });

  if (result.count === 0) throw new AcademicResourceNotFoundError();
}
