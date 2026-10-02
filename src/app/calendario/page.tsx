import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  CalendarEventCreateForm,
  DeleteCalendarEventForm,
  ToggleOpenCalendarEventForm,
} from "@/components/calendar-event-forms";
import { GoogleCalendarControl } from "@/components/google-calendar-control";
import { AndroidWidgetSection } from "@/components/android-widget-section";
import { SyncClassroomTasksForm } from "@/components/academic-task-forms";
import { ProtectedShell } from "@/components/protected-shell";
import { getCurrentAcademicProfile } from "@/data/academic-profile";
import { getCurrentAcademicTasks } from "@/data/academic-tasks";
import {
  academicCalendarCategories,
  academicCalendarEvents,
  academicCalendarMetadata,
  academicCalendarPeriods,
  getAcademicCalendarTodayKey,
  type AcademicCalendarCategory,
} from "@/data/academic-calendar";
import { getCurrentCalendarEvents } from "@/data/calendar-events";
import { getCurrentClassroomTaskSyncStatus } from "@/data/google-classroom";
import { getCurrentGoogleCalendarStatus } from "@/data/google-calendar";
import { getNoticeCalendarDeadlines } from "@/data/notices";
import { getCurrentSubjects } from "@/data/subjects";
import { authOptions } from "@/lib/auth";
import type { AcademicTaskDTO } from "@/types/academic-tasks";
import {
  CALENDAR_EVENT_TYPE_DETAILS,
  type CalendarEventDTO,
} from "@/types/calendar-events";
import type { ClassroomTaskSyncDTO } from "@/types/google-classroom";
import type { GoogleCalendarConnectionStatus } from "@/types/google-calendar";

import styles from "./calendar.module.css";

export const metadata: Metadata = {
  title: "Calendário acadêmico",
};

type CalendarPageProps = {
  searchParams: Promise<{
    mes?: string | string[];
    visao?: string | string[];
    data?: string | string[];
    googleCalendar?: string | string[];
  }>;
};

type CalendarDisplayEvent = {
  id: string;
  source: "official" | "personal" | "classroom" | "notice";
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  color: string;
  categoryLabel: string;
  subjectName: string | null;
  completed: boolean;
  openEnded: boolean;
  href: string | null;
};

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

const OFFICIAL_CATEGORY_COLORS: Record<AcademicCalendarCategory, string> = {
  holiday: "#ef4444",
  recess: "#0ea5e9",
  milestone: "#16a34a",
  evaluation: "#8b5cf6",
  institutional: "#f59e0b",
};

const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  timeZone: "UTC",
  year: "numeric",
});

const fullDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
  year: "numeric",
});

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

function toDateKey(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, amount: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + amount);
  return result;
}

function capitalize(value: string) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function formatMonth(monthKey: string) {
  return capitalize(monthFormatter.format(parseDateKey(`${monthKey}-01`)));
}

function formatFullDate(dateKey: string) {
  return fullDateFormatter.format(parseDateKey(dateKey)).replace(" de ", " ");
}

function normalizeMonthKey(value: string | undefined, fallback: string) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return fallback;
  const [year, month] = value.split("-").map(Number);
  if (year < 2000 || year > 2100 || month < 1 || month > 12) return fallback;
  return value;
}

function normalizeDateKey(value: string | undefined, fallback: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return fallback;
  const date = parseDateKey(value);
  return toDateKey(date) === value && date.getUTCFullYear() >= 2000 && date.getUTCFullYear() <= 2100
    ? value : fallback;
}

function shiftMonth(monthKey: string, amount: number) {
  const [year, month] = monthKey.split("-").map(Number);
  const result = new Date(Date.UTC(year, month - 1 + amount, 1, 12));
  return toDateKey(result).slice(0, 7);
}

function getMonthGrid(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const firstDay = new Date(Date.UTC(year, month - 1, 1, 12));
  const lastDay = new Date(Date.UTC(year, month, 0, 12));
  const gridStart = addDays(firstDay, -firstDay.getUTCDay());
  const gridEnd = addDays(lastDay, 6 - lastDay.getUTCDay());
  const days: Date[] = [];

  for (let day = gridStart; day <= gridEnd; day = addDays(day, 1)) {
    days.push(day);
  }

  const weeks = Array.from({ length: Math.ceil(days.length / 7) }, (_, index) =>
    days.slice(index * 7, index * 7 + 7),
  );

  return {
    firstDate: toDateKey(firstDay),
    lastDate: toDateKey(lastDay),
    gridStart: toDateKey(gridStart),
    gridEnd: toDateKey(gridEnd),
    weeks,
  };
}

function toOfficialDisplayEvents(rangeStart: string, rangeEnd: string): CalendarDisplayEvent[] {
  return academicCalendarEvents
    .filter((event) => event.startDate <= rangeEnd && (event.endDate ?? event.startDate) >= rangeStart)
    .map((event) => ({
      id: `official-${event.id}`,
      source: "official" as const,
      title: event.title,
      description: null,
      startDate: event.startDate,
      endDate: event.endDate ?? event.startDate,
      startTime: null,
      endTime: null,
      color: OFFICIAL_CATEGORY_COLORS[event.category],
      categoryLabel: academicCalendarCategories[event.category].shortLabel,
      subjectName: null,
      completed: false,
      openEnded: false,
      href: null,
    }));
}

function toNoticeDisplayEvents(rangeStart: string, rangeEnd: string): CalendarDisplayEvent[] {
  return getNoticeCalendarDeadlines()
    .filter((item) => item.startDate <= rangeEnd && item.endDate >= rangeStart)
    .map((item) => ({
      id: `notice-${item.id}`,
      source: "notice" as const,
      title: `${item.noticeNumber}: ${item.title}`,
      description: "Prazo do edital. Confira as regras e eventuais retificações na publicação oficial.",
      startDate: item.startDate,
      endDate: item.endDate,
      startTime: null,
      endTime: null,
      color: "#d97706",
      categoryLabel: "Prazo de edital",
      subjectName: null,
      completed: false,
      openEnded: false,
      href: item.officialUrl,
    }));
}

function completionDateKey(completedAt: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
    year: "numeric",
  }).formatToParts(new Date(completedAt));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function toPersonalDisplayEvents(
  events: CalendarEventDTO[],
  openRangeEnd: string,
): CalendarDisplayEvent[] {
  return events.map((event) => ({
    id: event.id,
    source: "personal" as const,
    title: event.title,
    description: event.description,
    startDate: event.startDate,
    endDate: event.endDate
      ?? (event.completedAt ? completionDateKey(event.completedAt) : openRangeEnd),
    startTime: event.startTime,
    endTime: event.endTime,
    color: event.subject?.color ?? CALENDAR_EVENT_TYPE_DETAILS[event.eventType].color,
    categoryLabel: CALENDAR_EVENT_TYPE_DETAILS[event.eventType].label,
    subjectName: event.subject?.name ?? null,
    completed: event.completedAt !== null,
    openEnded: event.endDate === null,
    href: null,
  }));
}

function toClassroomDisplayEvents(
  tasks: AcademicTaskDTO[],
  rangeStart: string,
  rangeEnd: string,
): CalendarDisplayEvent[] {
  return tasks
    .filter((task) => (
      task.source === "GOOGLE_CLASSROOM"
      && task.dueDate >= rangeStart
      && task.dueDate <= rangeEnd
    ))
    .map((task) => ({
      id: `classroom-${task.id}`,
      source: "classroom" as const,
      title: task.title,
      description: task.description,
      startDate: task.dueDate,
      endDate: task.dueDate,
      startTime: task.dueTime,
      endTime: null,
      color: task.subject.color,
      categoryLabel: task.completed ? "Enviada/concluída" : "Atividade do Classroom",
      subjectName: task.subject.name,
      completed: task.completed,
      openEnded: false,
      href: task.sourceUrl,
    }));
}

function classroomSyncMessage(
  sync: ClassroomTaskSyncDTO,
  pendingCount: number,
  completedCount: number,
) {
  if (sync.status === "not-connected") return "Conecte o Google Classroom para importar atividades.";
  if (sync.status === "permission-required") return "Reconecte o Classroom para autorizar a leitura das entregas.";
  if (sync.status === "unavailable") return "A atualização automática falhou; as atividades já salvas continuam visíveis.";
  if (!sync.synchronizedAt) return "As atividades do Classroom serão atualizadas automaticamente.";

  const updatedAt = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(sync.synchronizedAt));
  return `${pendingCount} pendente(s) · ${completedCount} enviada(s) ou concluída(s). Última atualização: ${updatedAt}.`;
}

function googleCalendarConnectionMessage(
  status: string | undefined,
  currentStatus: GoogleCalendarConnectionStatus,
) {
  if (status === "connected" && currentStatus !== "connected") return null;
  if (status === "sync-error" && currentStatus === "connected") return null;
  if (status === "connected") return "Google Agenda conectado e primeira sincronização concluída.";
  if (status === "denied") return "A autorização do Google Agenda foi cancelada.";
  if (status === "account-mismatch") {
    return "Use uma conta Google do domínio @academico.ifpb.edu.br para conectar o calendário.";
  }
  if (status === "sync-error") {
    return "A autorização foi recebida, mas a sincronização com o Google Agenda não foi concluída.";
  }
  if (status === "not-configured") return "A integração do Google ainda não foi configurada no servidor.";
  if (status === "invalid-state") return "A autorização expirou. Inicie a conexão novamente.";
  if (status === "identity-error" || status === "token-timeout" || status === "token-error") {
    return "O Google não concluiu a autorização. Tente novamente.";
  }
  return null;
}

function sortEvents(left: CalendarDisplayEvent, right: CalendarDisplayEvent) {
  return (
    left.startDate.localeCompare(right.startDate) ||
    (left.startTime ?? "99:99").localeCompare(right.startTime ?? "99:99") ||
    left.title.localeCompare(right.title, "pt-BR")
  );
}

function formatEventPeriod(event: CalendarDisplayEvent) {
  if (event.openEnded) {
    return event.completed
      ? `Em aberto de ${formatFullDate(event.startDate)} a ${formatFullDate(event.endDate)}`
      : `Em aberto desde ${formatFullDate(event.startDate)}`;
  }

  const date = event.startDate === event.endDate
    ? formatFullDate(event.startDate)
    : `${formatFullDate(event.startDate)} a ${formatFullDate(event.endDate)}`;

  if (!event.startTime) return date;
  const time = event.endTime ? `${event.startTime} - ${event.endTime}` : event.startTime;
  return `${date}, ${time}`;
}

function eventOccursOn(event: CalendarDisplayEvent, dateKey: string) {
  return event.startDate <= dateKey && event.endDate >= dateKey;
}

function EventPill({ event }: { event: CalendarDisplayEvent }) {
  const timeLabel = event.startTime ? `${event.startTime} ` : "";
  const completedLabel = event.source === "classroom" ? "enviada/concluída" : "concluída";
  const className = [
    styles.eventPill,
    event.source === "personal"
      ? styles.personalPill
      : event.source === "classroom"
        ? styles.classroomPill
        : styles.officialPill,
    event.completed ? styles.completedPill : "",
  ].filter(Boolean).join(" ");
  const content = (
    <>
      <i aria-hidden="true" />
      <span>{timeLabel}{event.title}{event.completed ? ` · ${completedLabel}` : ""}</span>
    </>
  );

  if ((event.source === "classroom" || event.source === "notice") && event.href) {
    return (
      <a
        aria-label={`Abrir ${event.title} na fonte oficial`}
        className={className}
        href={event.href}
        rel="noreferrer"
        style={{ "--calendar-event-color": event.color } as CSSProperties}
        target="_blank"
        title={`${timeLabel}${event.title}${event.completed ? ` (${completedLabel})` : ""}`}
      >
        {content}
      </a>
    );
  }

  return (
    <span
      className={className}
      style={{ "--calendar-event-color": event.color } as CSSProperties}
      title={`${timeLabel}${event.title}`}
    >
      {content}
    </span>
  );
}

export default async function AcademicCalendarPage({ searchParams }: CalendarPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const profile = await getCurrentAcademicProfile();
  if (!profile) redirect("/onboarding");

  const todayKey = getAcademicCalendarTodayKey();
  const parameters = await searchParams;
  const requestedMonth = Array.isArray(parameters.mes) ? parameters.mes[0] : parameters.mes;
  const requestedView = Array.isArray(parameters.visao) ? parameters.visao[0] : parameters.visao;
  const requestedDate = Array.isArray(parameters.data) ? parameters.data[0] : parameters.data;
  const view = requestedView === "dia" || requestedView === "semana" ? requestedView : "mes";
  const googleCalendarParameter = Array.isArray(parameters.googleCalendar)
    ? parameters.googleCalendar[0]
    : parameters.googleCalendar;
  const baseMonth = normalizeMonthKey(requestedMonth, todayKey.slice(0, 7));
  const selectedDate = normalizeDateKey(requestedDate, baseMonth === todayKey.slice(0, 7) ? todayKey : `${baseMonth}-01`);
  const monthKey = view === "mes" ? baseMonth : selectedDate.slice(0, 7);
  const monthGrid = getMonthGrid(monthKey);
  const weekStart = addDays(parseDateKey(selectedDate), -parseDateKey(selectedDate).getUTCDay());
  const visibleDays = view === "dia"
    ? [parseDateKey(selectedDate)]
    : view === "semana"
      ? Array.from({ length: 7 }, (_, index) => addDays(weekStart, index))
      : [];
  const previousHref = view === "mes"
    ? `/calendario?mes=${shiftMonth(monthKey, -1)}`
    : `/calendario?visao=${view}&data=${toDateKey(addDays(parseDateKey(selectedDate), view === "dia" ? -1 : -7))}`;
  const nextHref = view === "mes"
    ? `/calendario?mes=${shiftMonth(monthKey, 1)}`
    : `/calendario?visao=${view}&data=${toDateKey(addDays(parseDateKey(selectedDate), view === "dia" ? 1 : 7))}`;
  const todayHref = view === "mes" ? `/calendario?mes=${todayKey.slice(0, 7)}` : `/calendario?visao=${view}&data=${todayKey}`;
  const periodTitle = view === "mes" ? formatMonth(monthKey)
    : view === "dia" ? formatFullDate(selectedDate)
      : `${formatFullDate(toDateKey(weekStart))} a ${formatFullDate(toDateKey(addDays(weekStart, 6)))}`;
  const periodLabel = view === "mes" ? "Mês selecionado" : view === "dia" ? "Dia selecionado" : "Semana selecionada";
  const [
    classroomSync,
    googleCalendarStatus,
    subjects,
    personalEvents,
    academicTasks,
  ] = await Promise.all([
    getCurrentClassroomTaskSyncStatus(),
    getCurrentGoogleCalendarStatus(),
    getCurrentSubjects(),
    getCurrentCalendarEvents(monthGrid.gridStart, monthGrid.gridEnd),
    getCurrentAcademicTasks(),
  ]);
  const officialEvents = toOfficialDisplayEvents(monthGrid.gridStart, monthGrid.gridEnd);
  const noticeEvents = toNoticeDisplayEvents(monthGrid.gridStart, monthGrid.gridEnd);
  const classroomEvents = toClassroomDisplayEvents(
    academicTasks,
    monthGrid.gridStart,
    monthGrid.gridEnd,
  );
  const allEvents = [
    ...officialEvents,
    ...noticeEvents,
    ...toPersonalDisplayEvents(personalEvents, monthGrid.gridEnd),
    ...classroomEvents,
  ].sort(sortEvents);
  const monthEvents = allEvents.filter(
    (event) => event.startDate <= monthGrid.lastDate && event.endDate >= monthGrid.firstDate,
  );
  const personalMonthEvents = monthEvents.filter((event) => event.source === "personal");
  const officialMonthEvents = monthEvents.filter((event) => event.source === "official");
  const classroomMonthEvents = monthEvents.filter((event) => event.source === "classroom");
  const noticeMonthEvents = monthEvents.filter((event) => event.source === "notice");
  const periodEvents = view === "mes" ? monthEvents : allEvents.filter((event) =>
    visibleDays.some((day) => eventOccursOn(event, toDateKey(day))));
  const classroomTasks = academicTasks.filter((task) => task.source === "GOOGLE_CLASSROOM");
  const classroomPending = classroomTasks.filter((task) => !task.completed).length;
  const classroomCompleted = classroomTasks.filter((task) => task.completed).length;
  const defaultStartDate = view !== "mes" ? selectedDate : monthKey === todayKey.slice(0, 7) ? todayKey : monthGrid.firstDate;

  return (
    <ProtectedShell active="agenda" user={session.user}>
      <div className={`protected-main ${styles.page}`}>
        <Link className={styles.backLink} href="/agenda">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Voltar para a agenda
        </Link>

        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className="protected-kicker">Semanas, dias e compromissos</span>
            <h1>Calendário acadêmico</h1>
            <p>
              Consulte os eventos da proposta anual do IFPB e organize provas, aulas de campo,
              apresentações e outros compromissos pessoais.
            </p>
          </div>
          <div className={styles.heroMetrics} aria-label="Resumo do mês selecionado">
            <div><strong>{officialMonthEvents.length}</strong><span>eventos do documento</span></div>
            <div><strong>{personalMonthEvents.length}</strong><span>eventos pessoais</span></div>
            <div><strong>{classroomMonthEvents.length}</strong><span>atividades do Classroom</span></div>
            <div><strong>{noticeMonthEvents.length}</strong><span>prazos de editais</span></div>
          </div>
        </header>

        <aside className={styles.classroomNotice} aria-label="Sincronização com o Google Classroom">
          <span className={styles.classroomIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 7.5h16v11H4z" />
              <path d="m2 6 10-4 10 4-10 4zM8 10v4.5c2.4 1.7 5.6 1.7 8 0V10" />
            </svg>
          </span>
          <div>
            <strong>Google Classroom sincronizado com o calendário</strong>
            <p>{classroomSyncMessage(classroomSync, classroomPending, classroomCompleted)}</p>
            <small>
              Ao voltar da aba do Classroom, o AcadIA confere o status novamente. Use o botão para verificar imediatamente.
            </small>
          </div>
          <SyncClassroomTasksForm />
        </aside>

        <GoogleCalendarControl
          accountEmail={googleCalendarStatus.accountEmail}
          connectionMessage={googleCalendarConnectionMessage(
            googleCalendarParameter,
            googleCalendarStatus.status,
          )}
          status={googleCalendarStatus}
        />

        <AndroidWidgetSection />

        <aside className={styles.proposalNotice} aria-label="Situação do documento acadêmico">
          <span className={styles.noticeIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 10v6M12 7h.01" />
            </svg>
          </span>
          <div>
            <strong>Eventos institucionais vindos de uma proposta</strong>
            <p>
              O PDF foi atualizado em {academicCalendarMetadata.sourceUpdatedAt} e ainda contém campos de
              aprovação sem preenchimento. Seus eventos pessoais aparecem identificados separadamente.
            </p>
          </div>
        </aside>

        <nav className={styles.periodNavigation} aria-label="Atalhos do ano letivo">
          {academicCalendarPeriods.map((period) => (
            <Link href={`/calendario?mes=${period.months[0]}`} key={period.id}>
              <span>{period.title}</span>
              <small>{period.subtitle}</small>
            </Link>
          ))}
        </nav>

        <CalendarEventCreateForm
          defaultStartDate={defaultStartDate}
          subjects={subjects.map((subject) => ({ id: subject.id, name: subject.name }))}
        />

        <nav className={styles.viewNavigation} aria-label="Visão do calendário">
          <Link aria-current={view === "mes" ? "page" : undefined} href={`/calendario?mes=${monthKey}`}>Mês</Link>
          <Link aria-current={view === "semana" ? "page" : undefined} href={`/calendario?visao=semana&data=${selectedDate}`}>Semana</Link>
          <Link aria-current={view === "dia" ? "page" : undefined} href={`/calendario?visao=dia&data=${selectedDate}`}>Dia</Link>
        </nav>

        <section className={styles.calendarPanel} aria-labelledby="calendar-month-title">
          <header className={styles.calendarToolbar}>
            <Link
              aria-label={`Ver período anterior`}
              className={styles.monthArrow}
              href={previousHref}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </Link>

            <div>
              <span>{periodLabel}</span>
              <h2 id="calendar-month-title">{periodTitle}</h2>
            </div>

            <div className={styles.toolbarActions}>
              <Link className={styles.todayLink} href={todayHref}>Hoje</Link>
              <Link
                aria-label="Ver próximo período"
                className={styles.monthArrow}
                href={nextHref}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </Link>
            </div>
          </header>

          {view === "mes" ? <div className={styles.calendarViewport}>
            <div className={styles.weekdayRow} role="row">
              {WEEKDAYS.map((weekday) => (
                <span key={weekday} role="columnheader">{weekday}</span>
              ))}
            </div>

            <div className={styles.weeks} role="grid" aria-label={`Calendário de ${formatMonth(monthKey)}`}>
              {monthGrid.weeks.map((week, weekIndex) => (
                <div className={styles.weekRow} role="row" key={toDateKey(week[0])}>
                  {week.map((day) => {
                    const dateKey = toDateKey(day);
                    const dayEvents = allEvents.filter((event) => eventOccursOn(event, dateKey));
                    const isOutsideMonth = dateKey.slice(0, 7) !== monthKey;
                    const isToday = dateKey === todayKey;
                    const isWeekend = day.getUTCDay() === 0 || day.getUTCDay() === 6;

                    return (
                      <article
                        aria-label={`${formatFullDate(dateKey)}${dayEvents.length ? `, ${dayEvents.length} evento(s)` : ", sem eventos"}`}
                        className={`${styles.dayCell} ${isOutsideMonth ? styles.outsideMonth : ""} ${isToday ? styles.today : ""} ${isWeekend ? styles.weekend : ""}`}
                        key={dateKey}
                        role="gridcell"
                      >
                        <div className={styles.dayHeading}>
                          <Link aria-label={`Ver eventos de ${formatFullDate(dateKey)}`} href={`/calendario?visao=dia&data=${dateKey}`}><time dateTime={dateKey}>{day.getUTCDate()}</time></Link>
                          {weekIndex === 0 && isOutsideMonth ? <small>{formatMonth(dateKey.slice(0, 7)).split(" ")[0].slice(0, 3)}</small> : null}
                        </div>
                        <div className={styles.dayEvents}>
                          {dayEvents.slice(0, 3).map((event) => (
                            <EventPill event={event} key={`${dateKey}-${event.id}`} />
                          ))}
                          {dayEvents.length > 3 ? (
                            <span className={styles.moreEvents}>+{dayEvents.length - 3} evento(s)</span>
                          ) : null}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ))}
            </div>
          </div> : (
            <div className={`${styles.focusDays} ${view === "dia" ? styles.singleDay : ""}`}>
              {visibleDays.map((day) => {
                const dateKey = toDateKey(day);
                const dayEvents = allEvents.filter((event) => eventOccursOn(event, dateKey));
                return (
                  <section className={`${styles.focusDay} ${dateKey === todayKey ? styles.focusToday : ""}`} key={dateKey} aria-label={formatFullDate(dateKey)}>
                    <h3><Link href={`/calendario?visao=dia&data=${dateKey}`}><time dateTime={dateKey}>{WEEKDAYS[day.getUTCDay()]}, {formatFullDate(dateKey)}</time></Link></h3>
                    {dayEvents.length === 0 ? <p>Sem eventos</p> : (
                      <div className={styles.focusEvents}>{dayEvents.map((event) => <EventPill event={event} key={`${dateKey}-${event.id}`} />)}</div>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </section>

        <div className={styles.legend} aria-label="Legenda do calendário">
          <span><i className={styles.personalLegend} />Evento pessoal</span>
          <span><i className={styles.classroomLegend} />Atividade do Google Classroom</span>
          <span><i className={styles.noticeLegend} />Prazo de edital</span>
          <span><i className={styles.completedLegend} />Atividade enviada/concluída</span>
          {Object.entries(academicCalendarCategories).map(([category, details]) => (
            <span key={category}>
              <i style={{ background: OFFICIAL_CATEGORY_COLORS[category as AcademicCalendarCategory] }} />
              {details.label}
            </span>
          ))}
        </div>

        <section className={styles.monthEventsSection} aria-labelledby="month-events-title">
          <div className={styles.sectionHeading}>
            <div>
              <span>Detalhes do período</span>
              <h2 id="month-events-title">Eventos: {periodTitle}</h2>
            </div>
            <p>{periodEvents.length} evento(s)</p>
          </div>

          {periodEvents.length === 0 ? (
            <div className={styles.emptyEvents}>
              <strong>Nenhum evento neste período</strong>
              <p>Use o formulário acima para adicionar seu primeiro compromisso.</p>
            </div>
          ) : (
            <div className={styles.monthEventList}>
              {periodEvents.map((event) => (
                <article
                  className={`${styles.monthEventCard} ${event.completed ? styles.completedEventCard : ""}`}
                  id={event.source === "personal" ? `evento-${event.id}` : undefined}
                  key={event.id}
                  style={{ "--calendar-event-color": event.color } as CSSProperties}
                >
                  <span className={styles.eventCardMarker} aria-hidden="true" />
                  <div className={styles.eventCardContent}>
                    <div className={styles.eventCardTopline}>
                      <span className={event.source === "personal"
                        ? styles.personalBadge
                        : event.source === "classroom"
                          ? styles.classroomBadge
                          : event.source === "notice"
                            ? styles.noticeBadge
                            : styles.officialBadge}
                      >
                        {event.source === "personal"
                          ? "Pessoal"
                          : event.source === "classroom"
                            ? "Google Classroom"
                            : event.source === "notice"
                              ? "Edital IFPB"
                              : "Documento IFPB"}
                      </span>
                      <span>{event.categoryLabel}</span>
                      {event.openEnded ? (
                        <span>{event.completed ? "Concluído" : "Em aberto"}</span>
                      ) : null}
                      {event.subjectName ? <span>{event.subjectName}</span> : null}
                    </div>
                    <h3>{event.title}</h3>
                    {event.description ? <p>{event.description}</p> : null}
                    <time dateTime={event.startDate}>{formatEventPeriod(event)}</time>
                  </div>
                  {event.source === "personal" ? (
                    <div className={styles.eventCardActions}>
                      {event.openEnded ? (
                        <ToggleOpenCalendarEventForm
                          completed={event.completed}
                          eventId={event.id}
                        />
                      ) : null}
                      <DeleteCalendarEventForm eventId={event.id} eventTitle={event.title} />
                    </div>
                  ) : (event.source === "classroom" || event.source === "notice") && event.href ? (
                    <a
                      className={styles.classroomEventLink}
                      href={event.href}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {event.source === "notice" ? "Abrir edital" : "Abrir no Classroom"}
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M14 5h5v5M13 11l6-6M19 13v6H5V5h6" />
                      </svg>
                    </a>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className={styles.sourceNote}>
          <strong>Fontes dos eventos institucionais e editais</strong>
          <p>
            {academicCalendarMetadata.title} - {academicCalendarMetadata.campus} - {academicCalendarMetadata.audience}.
            Os prazos de editais vêm das publicações oficiais do Campus João Pessoa; confira eventuais retificações na página de cada edital.
            Eventos criados por você são privados e armazenados separadamente no banco de dados.
          </p>
        </footer>
      </div>
    </ProtectedShell>
  );
}
