import "server-only";

import { getAcademicCalendarTodayKey } from "@/data/academic-calendar";
import { getCurrentAcademicTasks } from "@/data/academic-tasks";
import { getCurrentAlertPreferences } from "@/data/academic-alerts";
import { requireCurrentIdentity } from "@/data/current-user";
import { getCurrentSubjects } from "@/data/subjects";
import { db } from "@/lib/db";
import {
  DEFAULT_STUDY_PLAN_PREFERENCES,
  addDaysToStudyDate,
  generateWeeklyStudySessions,
  getSaoPauloTimeKey,
  getStudyWeekEnd,
  rankStudySubjects,
  studySessionEndTime,
} from "@/lib/study-plan";
import type {
  StudyPlanDTO,
  StudyPlanPreferenceValues,
  StudySessionDTO,
  StudySessionFormValues,
  StudyWeekday,
} from "@/types/study-plan";

export class StudyPlanConfigurationRequiredError extends Error {
  constructor() {
    super("Study plan configuration required");
    this.name = "StudyPlanConfigurationRequiredError";
  }
}

export class StudyPlanNoAvailableSlotError extends Error {
  constructor() {
    super("No available study slot");
    this.name = "StudyPlanNoAvailableSlotError";
  }
}

export class StudySessionConflictError extends Error {
  constructor() {
    super("Study session time conflict");
    this.name = "StudySessionConflictError";
  }
}

export class StudySessionNotFoundError extends Error {
  constructor() {
    super("Study session not found");
    this.name = "StudySessionNotFoundError";
  }
}

function databaseDate(value: string) {
  return new Date(`${value}T12:00:00.000Z`);
}

async function requireStudyUser() {
  const { googleSubject } = await requireCurrentIdentity();
  const user = await db.user.findUnique({
    where: { googleSubject },
    select: { id: true },
  });

  if (!user) throw new StudySessionNotFoundError();
  return user;
}

function mapSession(session: {
  id: string;
  scheduledDate: Date;
  startTime: string;
  durationMinutes: number;
  focus: string | null;
  rationale: string;
  priorityScore: number;
  status: "PLANNED" | "COMPLETED";
  source: "AUTOMATIC" | "MANUAL";
  completedAt: Date | null;
  subject: { id: string; name: string; color: string };
}): StudySessionDTO {
  return {
    ...session,
    scheduledDate: session.scheduledDate.toISOString().slice(0, 10),
    endTime: studySessionEndTime(session.startTime, session.durationMinutes),
    completedAt: session.completedAt?.toISOString() ?? null,
  };
}

export async function getCurrentStudyPlan(weekStart: string): Promise<StudyPlanDTO> {
  const user = await requireStudyUser();
  const weekEnd = getStudyWeekEnd(weekStart);
  const todayDateKey = getAcademicCalendarTodayKey();
  const [storedPreference, availability, storedSessions, subjects, tasks, alertPreferences] =
    await Promise.all([
      db.studyPlanPreference.findUnique({
        where: { userId: user.id },
        select: {
          weeklyGoalMinutes: true,
          sessionDuration: true,
          breakDuration: true,
        },
      }),
      db.studyAvailability.findMany({
        where: { userId: user.id },
        orderBy: { weekday: "asc" },
        select: { weekday: true, startTime: true, endTime: true },
      }),
      db.studySession.findMany({
        where: {
          userId: user.id,
          scheduledDate: {
            gte: databaseDate(weekStart),
            lte: databaseDate(weekEnd),
          },
        },
        orderBy: [{ scheduledDate: "asc" }, { startTime: "asc" }],
        select: {
          id: true,
          scheduledDate: true,
          startTime: true,
          durationMinutes: true,
          focus: true,
          rationale: true,
          priorityScore: true,
          status: true,
          source: true,
          completedAt: true,
          subject: { select: { id: true, name: true, color: true } },
        },
      }),
      getCurrentSubjects(),
      getCurrentAcademicTasks(),
      getCurrentAlertPreferences(),
    ]);
  const sessions = storedSessions.map(mapSession);
  const completedSessions = sessions.filter((session) => session.status === "COMPLETED");
  const weeklyGoalMinutes = storedPreference?.weeklyGoalMinutes
    ?? DEFAULT_STUDY_PLAN_PREFERENCES.weeklyGoalMinutes;
  const completedMinutes = completedSessions.reduce(
    (total, session) => total + session.durationMinutes,
    0,
  );

  return {
    weekStart,
    weekEnd,
    todayDateKey,
    preferences: {
      configured: storedPreference !== null,
      weeklyGoalMinutes,
      sessionDuration: storedPreference?.sessionDuration
        ?? DEFAULT_STUDY_PLAN_PREFERENCES.sessionDuration,
      breakDuration: storedPreference?.breakDuration
        ?? DEFAULT_STUDY_PLAN_PREFERENCES.breakDuration,
      availability: availability.map((item) => ({
        ...item,
        weekday: item.weekday as StudyWeekday,
      })),
    },
    sessions,
    priorities: rankStudySubjects(subjects, tasks, alertPreferences, weekStart),
    subjects: subjects.map((subject) => ({
      id: subject.id,
      name: subject.name,
      color: subject.color,
    })),
    summary: {
      totalSessions: sessions.length,
      completedSessions: completedSessions.length,
      plannedMinutes: sessions.reduce(
        (total, session) => total + session.durationMinutes,
        0,
      ),
      completedMinutes,
      goalMinutes: weeklyGoalMinutes,
      progressPercentage: weeklyGoalMinutes > 0
        ? Math.min(100, Math.round((completedMinutes / weeklyGoalMinutes) * 100))
        : 0,
    },
  };
}

export async function updateCurrentStudyPlanPreferences(
  values: StudyPlanPreferenceValues,
) {
  const user = await requireStudyUser();

  await db.$transaction(async (transaction) => {
    await transaction.studyPlanPreference.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        weeklyGoalMinutes: values.weeklyGoalMinutes,
        sessionDuration: values.sessionDuration,
        breakDuration: values.breakDuration,
      },
      update: {
        weeklyGoalMinutes: values.weeklyGoalMinutes,
        sessionDuration: values.sessionDuration,
        breakDuration: values.breakDuration,
      },
      select: { id: true },
    });
    await transaction.studyAvailability.deleteMany({ where: { userId: user.id } });
    if (values.availability.length > 0) {
      await transaction.studyAvailability.createMany({
        data: values.availability.map((item) => ({ userId: user.id, ...item })),
      });
    }
  }, { timeout: 20000 });
}

export async function generateCurrentWeeklyStudyPlan(weekStart: string) {
  const user = await requireStudyUser();
  const weekEnd = getStudyWeekEnd(weekStart);
  const todayDateKey = getAcademicCalendarTodayKey();
  const [preference, availability, existingSessions, subjects, tasks, alertPreferences] =
    await Promise.all([
      db.studyPlanPreference.findUnique({
        where: { userId: user.id },
        select: {
          weeklyGoalMinutes: true,
          sessionDuration: true,
          breakDuration: true,
        },
      }),
      db.studyAvailability.findMany({
        where: { userId: user.id },
        orderBy: { weekday: "asc" },
        select: { weekday: true, startTime: true, endTime: true },
      }),
      db.studySession.findMany({
        where: {
          userId: user.id,
          scheduledDate: {
            gte: databaseDate(weekStart),
            lte: databaseDate(weekEnd),
          },
        },
        select: {
          id: true,
          scheduledDate: true,
          startTime: true,
          durationMinutes: true,
          status: true,
          source: true,
        },
      }),
      getCurrentSubjects(),
      getCurrentAcademicTasks(),
      getCurrentAlertPreferences(),
    ]);

  if (!preference || availability.length === 0) {
    throw new StudyPlanConfigurationRequiredError();
  }

  const replaceableSessionIds = existingSessions
    .filter((session) =>
      session.source === "AUTOMATIC"
      && session.status === "PLANNED"
      && session.scheduledDate.toISOString().slice(0, 10) >= todayDateKey,
    )
    .map((session) => session.id);
  const replaceableIds = new Set(replaceableSessionIds);
  const occupied = existingSessions
    .filter((session) => !replaceableIds.has(session.id))
    .map((session) => ({
      scheduledDate: session.scheduledDate.toISOString().slice(0, 10),
      startTime: session.startTime,
      durationMinutes: session.durationMinutes,
    }));
  const preferences: StudyPlanPreferenceValues = {
    ...preference,
    availability: availability.map((item) => ({
      ...item,
      weekday: item.weekday as StudyWeekday,
    })),
  };
  const priorities = rankStudySubjects(subjects, tasks, alertPreferences, weekStart);
  const generated = generateWeeklyStudySessions({
    preferences,
    priorities,
    weekStart,
    todayDateKey,
    currentTime: getSaoPauloTimeKey(),
    occupied,
  });
  const occupiedMinutes = occupied.reduce(
    (total, session) => total + session.durationMinutes,
    0,
  );

  if (generated.length === 0 && occupiedMinutes < preference.weeklyGoalMinutes) {
    throw new StudyPlanNoAvailableSlotError();
  }

  await db.$transaction(async (transaction) => {
    if (replaceableSessionIds.length > 0) {
      await transaction.studySession.deleteMany({
        where: { userId: user.id, id: { in: replaceableSessionIds } },
      });
    }
    if (generated.length > 0) {
      await transaction.studySession.createMany({
        data: generated.map((session) => ({
          userId: user.id,
          ...session,
          scheduledDate: databaseDate(session.scheduledDate),
          source: "AUTOMATIC" as const,
        })),
      });
    }
  }, { timeout: 20000 });

  return { created: generated.length, goalAlreadyCovered: generated.length === 0 };
}

async function requireOwnedSubject(userId: string, subjectId: string) {
  const subject = await db.subject.findFirst({
    where: { id: subjectId, userId },
    select: { id: true },
  });
  if (!subject) throw new StudySessionNotFoundError();
  return subject;
}

export async function createCurrentStudySession(values: StudySessionFormValues) {
  const user = await requireStudyUser();
  await requireOwnedSubject(user.id, values.subjectId);

  try {
    await db.studySession.create({
      data: {
        userId: user.id,
        subjectId: values.subjectId,
        scheduledDate: databaseDate(values.scheduledDate),
        startTime: values.startTime,
        durationMinutes: values.durationMinutes,
        focus: values.focus,
        rationale: "Sessão adicionada manualmente por você.",
        source: "MANUAL",
      },
      select: { id: true },
    });
  } catch (error) {
    if (
      typeof error === "object"
      && error !== null
      && "code" in error
      && error.code === "P2002"
    ) {
      throw new StudySessionConflictError();
    }
    throw error;
  }
}

export async function toggleCurrentStudySession(sessionId: string) {
  const user = await requireStudyUser();
  const session = await db.studySession.findFirst({
    where: { id: sessionId, userId: user.id },
    select: { id: true, status: true },
  });
  if (!session) throw new StudySessionNotFoundError();

  const completing = session.status !== "COMPLETED";
  await db.studySession.update({
    where: { id: session.id },
    data: {
      status: completing ? "COMPLETED" : "PLANNED",
      completedAt: completing ? new Date() : null,
    },
    select: { id: true },
  });
}

export async function rescheduleCurrentStudySession(
  sessionId: string,
  values: Pick<StudySessionFormValues, "scheduledDate" | "startTime" | "durationMinutes">,
) {
  const user = await requireStudyUser();
  const session = await db.studySession.findFirst({
    where: { id: sessionId, userId: user.id },
    select: { id: true },
  });
  if (!session) throw new StudySessionNotFoundError();

  try {
    await db.studySession.update({
      where: { id: session.id },
      data: {
        scheduledDate: databaseDate(values.scheduledDate),
        startTime: values.startTime,
        durationMinutes: values.durationMinutes,
      },
      select: { id: true },
    });
  } catch (error) {
    if (
      typeof error === "object"
      && error !== null
      && "code" in error
      && error.code === "P2002"
    ) {
      throw new StudySessionConflictError();
    }
    throw error;
  }
}

export async function postponeCurrentStudySession(sessionId: string) {
  const user = await requireStudyUser();
  const session = await db.studySession.findFirst({
    where: { id: sessionId, userId: user.id },
    select: { id: true, scheduledDate: true },
  });
  if (!session) throw new StudySessionNotFoundError();

  const nextDate = addDaysToStudyDate(
    session.scheduledDate.toISOString().slice(0, 10),
    1,
  );
  try {
    await db.studySession.update({
      where: { id: session.id },
      data: { scheduledDate: databaseDate(nextDate), status: "PLANNED", completedAt: null },
      select: { id: true },
    });
  } catch (error) {
    if (
      typeof error === "object"
      && error !== null
      && "code" in error
      && error.code === "P2002"
    ) {
      throw new StudySessionConflictError();
    }
    throw error;
  }
}

export async function deleteCurrentStudySession(sessionId: string) {
  const user = await requireStudyUser();
  const result = await db.studySession.deleteMany({
    where: { id: sessionId, userId: user.id },
  });
  if (result.count === 0) throw new StudySessionNotFoundError();
}
