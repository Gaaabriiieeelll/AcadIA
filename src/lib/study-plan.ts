import type { AcademicAlertPreferencesDTO } from "@/types/academic-alerts";
import type { AcademicTaskDTO } from "@/types/academic-tasks";
import type {
  StudyPlanPreferenceValues,
  StudySubjectPriorityDTO,
  StudyWeekday,
} from "@/types/study-plan";
import type { SubjectDTO } from "@/types/subjects";

export const DEFAULT_STUDY_PLAN_PREFERENCES = {
  weeklyGoalMinutes: 300,
  sessionDuration: 50,
  breakDuration: 10,
} as const;

type OccupiedStudyInterval = {
  scheduledDate: string;
  startTime: string;
  durationMinutes: number;
};

export type GeneratedStudySession = {
  subjectId: string;
  scheduledDate: string;
  startTime: string;
  durationMinutes: number;
  focus: string;
  rationale: string;
  priorityScore: number;
};

function parseDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function isValidDateKey(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = parseDateKey(value);
  return !Number.isNaN(date.getTime()) && toDateKey(date) === value;
}

export function addDaysToStudyDate(dateKey: string, amount: number) {
  const date = parseDateKey(dateKey);
  date.setUTCDate(date.getUTCDate() + amount);
  return toDateKey(date);
}

export function getStudyWeekStart(dateKey: string) {
  const date = parseDateKey(dateKey);
  const weekday = date.getUTCDay();
  const distanceFromMonday = weekday === 0 ? 6 : weekday - 1;
  date.setUTCDate(date.getUTCDate() - distanceFromMonday);
  return toDateKey(date);
}

export function getStudyWeekEnd(weekStart: string) {
  return addDaysToStudyDate(weekStart, 6);
}

export function shiftStudyWeek(weekStart: string, weeks: number) {
  return addDaysToStudyDate(weekStart, weeks * 7);
}

export function getSaoPauloTimeKey(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.hour === "24" ? "00" : values.hour}:${values.minute}`;
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(value: number) {
  const normalized = Math.max(0, Math.min(value, 23 * 60 + 59));
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`;
}

export function studySessionEndTime(startTime: string, durationMinutes: number) {
  return minutesToTime(timeToMinutes(startTime) + durationMinutes);
}

function taskDistanceLabel(task: AcademicTaskDTO, weekStart: string) {
  const weekEnd = getStudyWeekEnd(weekStart);
  if (task.dueDate < weekStart) return `a atividade “${task.title}” está atrasada`;
  if (task.dueDate <= weekEnd) return `a atividade “${task.title}” vence nesta semana`;
  return `a atividade “${task.title}” tem prazo próximo`;
}

export function rankStudySubjects(
  subjects: SubjectDTO[],
  tasks: AcademicTaskDTO[],
  preferences: AcademicAlertPreferencesDTO,
  weekStart: string,
): StudySubjectPriorityDTO[] {
  const weekEnd = getStudyWeekEnd(weekStart);
  const nearbyEnd = addDaysToStudyDate(weekEnd, 7);

  return subjects
    .map((subject) => {
      let score = 20;
      const reasons: string[] = [];
      const pendingTasks = tasks.filter(
        (task) => !task.completed
          && task.subject.id === subject.id
          && task.dueDate <= nearbyEnd,
      );

      if (subject.averageScore === null) {
        score += 8;
        reasons.push("ainda não há média consolidada");
      } else if (subject.averageScore < preferences.targetAverage) {
        const gap = preferences.targetAverage - subject.averageScore;
        score += 20 + Math.min(60, Math.round(gap * 2));
        reasons.push(
          `a média ${subject.averageScore.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} está abaixo da meta ${preferences.targetAverage}`,
        );
      } else if (subject.averageScore < preferences.targetAverage + 10) {
        score += 10;
        reasons.push("a média está próxima da meta definida");
      }

      for (const task of pendingTasks) {
        if (task.dueDate < weekStart) score += 45;
        else if (task.dueDate <= weekEnd) score += 32;
        else score += 14;
        if (task.priority === "HIGH") score += 8;
      }

      const taskReasons = pendingTasks.slice(0, 2).map((task) =>
        taskDistanceLabel(task, weekStart),
      );
      reasons.push(...taskReasons);

      const nextTask = pendingTasks[0];
      const suggestedFocus = nextTask
        ? `Avançar em: ${nextTask.title}`
        : subject.averageScore !== null && subject.averageScore < preferences.targetAverage
          ? "Revisar os conteúdos com maior dificuldade"
          : "Revisão e consolidação do conteúdo atual";

      return {
        subjectId: subject.id,
        name: subject.name,
        color: subject.color,
        score,
        reasons: reasons.length > 0
          ? reasons
          : ["distribuição equilibrada da meta semanal"],
        suggestedFocus,
      };
    })
    .sort((left, right) =>
      right.score - left.score || left.name.localeCompare(right.name, "pt-BR"),
    );
}

function availabilityDate(weekStart: string, weekday: StudyWeekday) {
  return addDaysToStudyDate(weekStart, weekday - 1);
}

function intervalsOverlap(
  start: number,
  end: number,
  occupiedStart: number,
  occupiedEnd: number,
) {
  return start < occupiedEnd && end > occupiedStart;
}

export function generateWeeklyStudySessions({
  preferences,
  priorities,
  weekStart,
  todayDateKey,
  currentTime,
  occupied,
}: {
  preferences: StudyPlanPreferenceValues;
  priorities: StudySubjectPriorityDTO[];
  weekStart: string;
  todayDateKey: string;
  currentTime: string;
  occupied: OccupiedStudyInterval[];
}): GeneratedStudySession[] {
  if (priorities.length === 0 || preferences.availability.length === 0) return [];

  const occupiedByDate = new Map<string, Array<{ start: number; end: number }>>();
  for (const interval of occupied) {
    const dateIntervals = occupiedByDate.get(interval.scheduledDate) ?? [];
    const start = timeToMinutes(interval.startTime);
    dateIntervals.push({ start, end: start + interval.durationMinutes });
    occupiedByDate.set(interval.scheduledDate, dateIntervals);
  }

  const slots: Array<{ scheduledDate: string; startTime: string }> = [];
  const orderedAvailability = [...preferences.availability].sort(
    (left, right) => left.weekday - right.weekday,
  );

  for (const availability of orderedAvailability) {
    const scheduledDate = availabilityDate(weekStart, availability.weekday);
    if (scheduledDate < todayDateKey) continue;
    const end = timeToMinutes(availability.endTime);
    const step = preferences.sessionDuration + preferences.breakDuration;

    for (
      let start = timeToMinutes(availability.startTime);
      start + preferences.sessionDuration <= end;
      start += step
    ) {
      const startTime = minutesToTime(start);
      if (scheduledDate === todayDateKey && startTime <= currentTime) continue;
      const overlaps = (occupiedByDate.get(scheduledDate) ?? []).some((interval) =>
        intervalsOverlap(
          start,
          start + preferences.sessionDuration,
          interval.start,
          interval.end,
        ),
      );
      if (!overlaps) slots.push({ scheduledDate, startTime });
    }
  }

  const occupiedMinutes = occupied.reduce(
    (total, interval) => total + interval.durationMinutes,
    0,
  );
  const remainingGoal = Math.max(0, preferences.weeklyGoalMinutes - occupiedMinutes);
  const requiredSessions = Math.ceil(remainingGoal / preferences.sessionDuration);
  const selectedSlots = slots.slice(0, requiredSessions);
  const allocations = new Map<string, number>();
  let previousSubjectId: string | null = null;

  return selectedSlots.map((slot) => {
    const candidates = priorities
      .map((priority) => ({
        priority,
        adjustedScore: priority.score / (1 + (allocations.get(priority.subjectId) ?? 0) * 0.7),
      }))
      .sort((left, right) =>
        right.adjustedScore - left.adjustedScore
        || left.priority.name.localeCompare(right.priority.name, "pt-BR"),
      );
    const selected = candidates.find(
      ({ priority }) => priority.subjectId !== previousSubjectId,
    )?.priority ?? candidates[0].priority;
    allocations.set(selected.subjectId, (allocations.get(selected.subjectId) ?? 0) + 1);
    previousSubjectId = selected.subjectId;

    return {
      subjectId: selected.subjectId,
      scheduledDate: slot.scheduledDate,
      startTime: slot.startTime,
      durationMinutes: preferences.sessionDuration,
      focus: selected.suggestedFocus,
      rationale: `Priorizada porque ${selected.reasons.join(" e ")}.`,
      priorityScore: selected.score,
    };
  });
}
