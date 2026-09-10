import type { AcademicCalendarEvent } from "@/data/academic-calendar";
import type {
  AcademicAlertCenterDTO,
  AcademicAlertDTO,
  AcademicAlertPreferencesDTO,
  AcademicAlertSeverity,
} from "@/types/academic-alerts";
import type { AcademicTaskDTO } from "@/types/academic-tasks";
import {
  CALENDAR_EVENT_TYPE_DETAILS,
  type CalendarEventDTO,
} from "@/types/calendar-events";
import type { SubjectDTO } from "@/types/subjects";

export const ALERT_LOOKAHEAD_DAYS = 7;

export const DEFAULT_ALERT_PREFERENCES: AcademicAlertPreferencesDTO = {
  targetAverage: 70,
  minimumAttendance: 75,
  gradesEnabled: true,
  attendanceEnabled: true,
  tasksEnabled: true,
  calendarEnabled: true,
  browserNotifications: false,
};

type BuildAcademicAlertsInput = {
  subjects: SubjectDTO[];
  tasks: AcademicTaskDTO[];
  personalEvents: CalendarEventDTO[];
  officialEvents: AcademicCalendarEvent[];
  todayDateKey: string;
  targetAverage?: number;
  minimumAttendance?: number;
};

const severityOrder: Record<AcademicAlertSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

const taskPriorityLabels = {
  HIGH: "prioridade alta",
  MEDIUM: "prioridade média",
  LOW: "prioridade baixa",
} as const;

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

export function addDaysToDateKey(dateKey: string, days: number) {
  const date = parseDateKey(dateKey);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function dateDistance(startDateKey: string, endDateKey: string) {
  return Math.round(
    (parseDateKey(endDateKey).getTime() - parseDateKey(startDateKey).getTime()) / 86400000,
  );
}

function formatScore(value: number) {
  return value.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
}

function formatDate(dateKey: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(parseDateKey(dateKey));
}

function taskDateLabel(task: AcademicTaskDTO, todayDateKey: string) {
  if (task.status === "overdue") {
    const days = Math.abs(dateDistance(todayDateKey, task.dueDate));
    return days === 1 ? "Atrasada há 1 dia" : `Atrasada há ${days} dias`;
  }
  if (task.status === "today") return task.dueTime ? `Hoje, ${task.dueTime}` : "Hoje";

  const days = dateDistance(todayDateKey, task.dueDate);
  if (days === 1) return task.dueTime ? `Amanhã, ${task.dueTime}` : "Amanhã";
  return task.dueTime ? `${formatDate(task.dueDate)}, ${task.dueTime}` : formatDate(task.dueDate);
}

function eventDateLabel(startDate: string, endDate: string, todayDateKey: string) {
  if (startDate <= todayDateKey && endDate >= todayDateKey) return "Hoje";
  const days = dateDistance(todayDateKey, startDate);
  if (days === 1) return "Amanhã";
  return formatDate(startDate);
}

function subjectAlerts(
  subject: SubjectDTO,
  targetAverage: number,
  minimumAttendance: number,
): AcademicAlertDTO[] {
  const alerts: AcademicAlertDTO[] = [];
  const scores = subject.bimesterGrades
    .map((grade) => grade.score)
    .filter((score): score is number => score !== null);
  const remainingGrades = subject.bimesterCount - scores.length;
  const subjectHref = `/disciplinas#disciplina-${subject.id}`;

  if (scores.length === 0) {
    alerts.push({
      id: `subject-${subject.id}-no-grades`,
      severity: "warning",
      category: "grades",
      eyebrow: "Notas",
      title: `${subject.name} está sem notas`,
      description: `Preencha os ${subject.bimesterCount} bimestres à medida que as notas forem divulgadas para acompanhar sua média.`,
      actionLabel: "Adicionar notas",
      href: subjectHref,
      dateKey: null,
      dateLabel: null,
      accentColor: subject.color,
      read: false,
    });
  } else if (subject.averageScore !== null && subject.averageScore < targetAverage) {
    const scoreTotal = scores.reduce((total, score) => total + score, 0);
    const neededAverage = remainingGrades > 0
      ? (targetAverage * subject.bimesterCount - scoreTotal) / remainingGrades
      : null;
    let projection: string;
    let severity: AcademicAlertSeverity = "warning";

    if (neededAverage === null) {
      projection = "Todos os bimestres regulares estão preenchidos. Consulte as possibilidades de recuperação previstas para a disciplina.";
      severity = "critical";
    } else if (neededAverage > 100) {
      projection = `A média ${targetAverage} não pode ser alcançada apenas com as notas bimestrais restantes; verifique as possibilidades de recuperação.`;
      severity = "critical";
    } else {
      const remainingLabel = remainingGrades === 1 ? "nota restante" : "notas restantes";
      const remainingPreposition = remainingGrades === 1 ? "na" : "nas";
      projection = `Para alcançar ${targetAverage} nos bimestres regulares, você precisa de média ${formatScore(Math.max(0, neededAverage))} ${remainingPreposition} ${remainingGrades} ${remainingLabel}.`;
    }

    alerts.push({
      id: `subject-${subject.id}-low-average`,
      severity,
      category: "grades",
      eyebrow: "Média parcial",
      title: `${subject.name} está com média ${formatScore(subject.averageScore)}`,
      description: projection,
      actionLabel: "Revisar notas",
      href: subjectHref,
      dateKey: null,
      dateLabel: null,
      accentColor: subject.color,
      read: false,
    });
  }

  if (
    subject.attendancePercentage !== null
    && subject.attendancePercentage < minimumAttendance
  ) {
    alerts.push({
      id: `subject-${subject.id}-attendance-critical`,
      severity: "critical",
      category: "attendance",
      eyebrow: "Frequência",
      title: `${subject.name} está abaixo de ${minimumAttendance}%`,
      description: `A frequência registrada é ${formatScore(subject.attendancePercentage)}%. Confira aulas e faltas lançadas; o resultado oficial permanece no SUAP.`,
      actionLabel: "Conferir frequência",
      href: subjectHref,
      dateKey: null,
      dateLabel: null,
      accentColor: subject.color,
      read: false,
    });
  } else if (
    subject.attendancePercentage !== null
    && subject.attendancePercentage < Math.min(100, minimumAttendance + 5)
  ) {
    alerts.push({
      id: `subject-${subject.id}-attendance-warning`,
      severity: "warning",
      category: "attendance",
      eyebrow: "Frequência preventiva",
      title: `${subject.name} está próxima do limite`,
      description: `A frequência registrada é ${formatScore(subject.attendancePercentage)}%. A referência mínima configurada é ${minimumAttendance}%.`,
      actionLabel: "Conferir frequência",
      href: subjectHref,
      dateKey: null,
      dateLabel: null,
      accentColor: subject.color,
      read: false,
    });
  }

  return alerts;
}

function taskAlert(task: AcademicTaskDTO, todayDateKey: string): AcademicAlertDTO | null {
  if (task.completed || task.status === "completed") return null;
  const daysUntilDue = dateDistance(todayDateKey, task.dueDate);
  if (task.status === "upcoming" && daysUntilDue > ALERT_LOOKAHEAD_DAYS) return null;

  const severity: AcademicAlertSeverity = task.status === "overdue" || task.status === "today"
    ? "critical"
    : task.priority === "LOW" ? "info" : "warning";
  const timing = task.status === "overdue"
    ? "passou do prazo"
    : task.status === "today" ? "vence hoje" : "está próxima do prazo";

  return {
    id: `task-${task.id}`,
    severity,
    category: "tasks",
    eyebrow: "Atividade",
    title: `${task.title} ${timing}`,
    description: `${task.subject.name} · ${taskPriorityLabels[task.priority]}${task.description ? ` · ${task.description}` : ""}`,
    actionLabel: task.source === "GOOGLE_CLASSROOM" ? "Abrir no Classroom" : "Abrir agenda",
    href: task.sourceUrl ?? "/agenda",
    dateKey: task.dueDate,
    dateLabel: taskDateLabel(task, todayDateKey),
    accentColor: task.subject.color,
    read: false,
  };
}

function personalEventAlert(
  event: CalendarEventDTO,
  todayDateKey: string,
): AcademicAlertDTO | null {
  const openEnded = event.endDate === null;
  if (openEnded && event.completedAt) return null;

  const endDate = event.endDate ?? todayDateKey;
  const isToday = event.startDate <= todayDateKey && endDate >= todayDateKey;
  const isExam = event.eventType === "EXAM";
  const typeDetails = CALENDAR_EVENT_TYPE_DETAILS[event.eventType];
  const severity: AcademicAlertSeverity = isToday && isExam
    ? "critical"
    : isToday || isExam ? "warning" : "info";

  return {
    id: `event-${event.id}`,
    severity,
    category: "calendar",
    eyebrow: typeDetails.label,
    title: openEnded && isToday
      ? `${event.title} continua em aberto`
      : isToday ? `${event.title} acontece hoje` : event.title,
    description: event.subject
      ? `${event.subject.name}${event.description ? ` · ${event.description}` : ""}`
      : event.description ?? "Evento pessoal do seu calendário acadêmico.",
    actionLabel: "Ver calendário",
    href: `/calendario?mes=${event.startDate.slice(0, 7)}`,
    dateKey: event.startDate,
    dateLabel: openEnded && isToday
      ? `Em aberto desde ${formatDate(event.startDate)}`
      : eventDateLabel(event.startDate, endDate, todayDateKey),
    accentColor: event.subject?.color ?? typeDetails.color,
    read: false,
  };
}

function officialEventAlert(
  event: AcademicCalendarEvent,
  todayDateKey: string,
): AcademicAlertDTO {
  const endDate = event.endDate ?? event.startDate;
  const isToday = event.startDate <= todayDateKey && endDate >= todayDateKey;

  return {
    id: `official-event-${event.id}`,
    severity: event.category === "evaluation" && isToday ? "warning" : "info",
    category: "calendar",
    eyebrow: "Calendário IFPB",
    title: isToday ? `${event.title} acontece hoje` : event.title,
    description: "Data institucional da proposta anual do calendário acadêmico adicionada ao AcadIA.",
    actionLabel: "Ver calendário",
    href: `/calendario?mes=${event.startDate.slice(0, 7)}`,
    dateKey: event.startDate,
    dateLabel: eventDateLabel(event.startDate, endDate, todayDateKey),
    accentColor: null,
    read: false,
  };
}

export function buildAcademicAlertCenter({
  subjects,
  tasks,
  personalEvents,
  officialEvents,
  todayDateKey,
  targetAverage = DEFAULT_ALERT_PREFERENCES.targetAverage,
  minimumAttendance = DEFAULT_ALERT_PREFERENCES.minimumAttendance,
}: BuildAcademicAlertsInput): AcademicAlertCenterDTO {
  const alerts = [
    ...subjects.flatMap((subject) => subjectAlerts(
      subject,
      targetAverage,
      minimumAttendance,
    )),
    ...tasks.map((task) => taskAlert(task, todayDateKey)).filter((alert): alert is AcademicAlertDTO => alert !== null),
    ...personalEvents
      .map((event) => personalEventAlert(event, todayDateKey))
      .filter((alert): alert is AcademicAlertDTO => alert !== null),
    ...officialEvents.map((event) => officialEventAlert(event, todayDateKey)),
  ].sort((left, right) =>
    severityOrder[left.severity] - severityOrder[right.severity]
    || (left.dateKey ?? "9999-12-31").localeCompare(right.dateKey ?? "9999-12-31")
    || left.title.localeCompare(right.title, "pt-BR"),
  );

  return {
    alerts,
    summary: {
      total: alerts.length,
      critical: alerts.filter((alert) => alert.severity === "critical").length,
      warning: alerts.filter((alert) => alert.severity === "warning").length,
      info: alerts.filter((alert) => alert.severity === "info").length,
      academic: alerts.filter((alert) => alert.category === "grades" || alert.category === "attendance").length,
      planning: alerts.filter((alert) => alert.category === "tasks" || alert.category === "calendar").length,
      unread: alerts.length,
      snoozed: 0,
      hidden: 0,
    },
    todayDateKey,
    preferences: {
      ...DEFAULT_ALERT_PREFERENCES,
      targetAverage,
      minimumAttendance,
    },
    history: [],
  };
}
