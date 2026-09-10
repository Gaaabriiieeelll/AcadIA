import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  AcademicTaskCreateForm,
  DeleteTaskForm,
  SyncClassroomTasksForm,
  ToggleTaskForm,
} from "@/components/academic-task-forms";
import { ClassroomConnectButton } from "@/components/classroom-connect-button";
import { ProtectedShell } from "@/components/protected-shell";
import { getCurrentAcademicProfile } from "@/data/academic-profile";
import { getUpcomingAcademicCalendarEvents } from "@/data/academic-calendar";
import { getCurrentAcademicTasks } from "@/data/academic-tasks";
import { getCurrentClassroomTaskSyncStatus } from "@/data/google-classroom";
import { getCurrentSubjects } from "@/data/subjects";
import { authOptions } from "@/lib/auth";
import type { AcademicTaskDTO } from "@/types/academic-tasks";
import type { ClassroomTaskSyncDTO } from "@/types/google-classroom";

export const metadata: Metadata = {
  title: "Agenda acadêmica",
};

const priorityLabels = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
} as const;

const statusLabels = {
  overdue: "Atrasada",
  today: "Hoje",
  upcoming: "Próxima",
  completed: "Concluída",
} as const;

function formatDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

function formatSyncDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

function ClassroomSyncCard({
  sync,
  pendingCount,
  completedCount,
}: {
  sync: ClassroomTaskSyncDTO;
  pendingCount: number;
  completedCount: number;
}) {
  const needsConnection = sync.status === "not-connected";
  const needsPermission = sync.status === "permission-required";
  const unavailable = sync.status === "unavailable";
  const title = needsConnection
    ? "Conecte o Google Sala de Aula"
    : needsPermission
      ? "Autorize a leitura das atividades"
      : unavailable
        ? "Não foi possível sincronizar agora"
        : `${sync.taskCount} ${sync.taskCount === 1 ? "atividade sincronizada" : "atividades sincronizadas"}`;
  const description = needsConnection
    ? "A Agenda pode importar automaticamente atividades com prazo das suas turmas de Mecânica II."
    : needsPermission
      ? "Falta permitir a leitura das suas próprias atividades. A permissão é somente de leitura."
      : unavailable
        ? "Suas atividades já salvas continuam disponíveis. Tente novamente em alguns instantes."
        : sync.synchronizedAt
          ? `${pendingCount} ${pendingCount === 1 ? "pendente" : "pendentes"} · ${completedCount} ${completedCount === 1 ? "enviada ou concluída" : "enviadas ou concluídas"}. Última atualização em ${formatSyncDate(sync.synchronizedAt)}.`
          : "A sincronização automática está ativa.";

  return (
    <section className={`agenda-classroom-sync agenda-classroom-sync-${sync.status}`}>
      <span className="agenda-classroom-sync-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 5.5h16v13H4zM8 9h8M7 15c1.2-2.2 3-3.3 5-3.3s3.8 1.1 5 3.3" />
        </svg>
      </span>
      <div>
        <span>Google Sala de Aula · automático</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {needsConnection || needsPermission ? (
        <ClassroomConnectButton reconnect={needsPermission} />
      ) : <SyncClassroomTasksForm />}
    </section>
  );
}

function TaskList({ tasks, title }: { tasks: AcademicTaskDTO[]; title: string }) {
  if (tasks.length === 0) return null;

  return (
    <section className="task-group" aria-labelledby={`task-group-${title}`}>
      <div className="task-group-heading">
        <h2 id={`task-group-${title}`}>{title}</h2>
        <span>{tasks.length}</span>
      </div>
      <div className="task-list">
        {tasks.map((task) => (
          <article
            className={`task-card task-card-${task.status}`}
            key={task.id}
            style={{ "--task-subject-color": task.subject.color } as CSSProperties}
          >
            <div className="task-card-marker" />
            <div className="task-card-content">
              <div className="task-card-topline">
                <span className="task-subject">{task.subject.name}</span>
                {task.source === "GOOGLE_CLASSROOM" ? (
                  <span className="task-source-classroom">Google Sala de Aula</span>
                ) : null}
                <span className={`task-status task-status-${task.status}`}>
                  {task.completed && task.source === "GOOGLE_CLASSROOM"
                    ? "Enviada"
                    : statusLabels[task.status]}
                </span>
                <span className={`task-priority task-priority-${task.priority.toLowerCase()}`}>
                  Prioridade {priorityLabels[task.priority].toLowerCase()}
                </span>
              </div>
              <h3>{task.title}</h3>
              {task.description ? <p>{task.description}</p> : null}
              <div className="task-deadline">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <rect x="3.5" y="5.5" width="17" height="15" rx="2" />
                  <path d="M7.5 3v5M16.5 3v5M3.5 10h17" />
                </svg>
                <span>{formatDate(task.dueDate)}{task.dueTime ? ` às ${task.dueTime}` : ""}</span>
              </div>
            </div>
            <div className="task-card-actions">
              {task.source === "GOOGLE_CLASSROOM" ? (
                task.sourceUrl ? (
                  <a className="task-classroom-link" href={task.sourceUrl} rel="noreferrer" target="_blank">
                    Abrir no Classroom
                  </a>
                ) : null
              ) : (
                <>
                  <ToggleTaskForm completed={task.completed} taskId={task.id} />
                  <DeleteTaskForm taskId={task.id} taskTitle={task.title} />
                </>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default async function AgendaPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const profile = await getCurrentAcademicProfile();
  if (!profile) redirect("/onboarding");

  const classroomSync = await getCurrentClassroomTaskSyncStatus();
  const [subjects, tasks] = await Promise.all([
    getCurrentSubjects(),
    getCurrentAcademicTasks(),
  ]);
  const pending = tasks.filter((task) => !task.completed);
  const completed = tasks.filter((task) => task.completed);
  const classroomTasks = tasks.filter((task) => task.source === "GOOGLE_CLASSROOM");
  const classroomPending = classroomTasks.filter((task) => !task.completed).length;
  const classroomCompleted = classroomTasks.filter((task) => task.completed).length;
  const dueToday = pending.filter((task) => task.status === "today").length;
  const overdue = pending.filter((task) => task.status === "overdue").length;
  const nextCalendarEvent = getUpcomingAcademicCalendarEvents()[0];

  return (
    <ProtectedShell active="agenda" user={session.user}>
      <div className="protected-main agenda-page-main">
        <span className="protected-kicker">Planejamento acadêmico</span>
        <h1>Agenda</h1>
        <p className="protected-lead">
          Organize provas, trabalhos e atividades com prazos associados às suas disciplinas.
        </p>

        <ClassroomSyncCard
          sync={classroomSync}
          pendingCount={classroomPending}
          completedCount={classroomCompleted}
        />

        <section className="agenda-summary" aria-label="Resumo da agenda">
          <div><span>Pendentes</span><strong>{pending.length}</strong><small>atividade(s) aberta(s)</small></div>
          <div><span>Para hoje</span><strong>{dueToday}</strong><small>prazo(s) no dia</small></div>
          <div className={overdue > 0 ? "agenda-summary-alert" : undefined}><span>Atrasadas</span><strong>{overdue}</strong><small>precisam de atenção</small></div>
          <div><span>Concluídas/enviadas</span><strong>{completed.length}</strong><small>fora das pendências</small></div>
        </section>

        <Link className="agenda-calendar-banner" href="/calendario">
          <span className="agenda-calendar-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <rect x="3.5" y="5.5" width="17" height="15" rx="2" />
              <path d="M7.5 3v5M16.5 3v5M3.5 10h17M8 14h3M13 14h3M8 17h3" />
            </svg>
          </span>
          <div>
            <span className="agenda-calendar-kicker">Proposta anual do IFPB</span>
            <h2>Consulte as datas acadêmicas de 2026</h2>
            <p>
              {nextCalendarEvent
                ? `Próximo evento: ${nextCalendarEvent.title} - ${formatDate(nextCalendarEvent.startDate)}.`
                : "Veja os dois semestres, feriados, recessos, conselhos e demais eventos."}
            </p>
          </div>
          <strong className="agenda-calendar-action">
            Ver calendário
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M5 12h14M14 7l5 5-5 5" />
            </svg>
          </strong>
        </Link>

        {subjects.length === 0 ? (
          <section className="agenda-needs-subject">
            <h2>Cadastre uma disciplina primeiro</h2>
            <p>As atividades da agenda precisam estar ligadas a uma disciplina.</p>
            <Link className="primary-action" href="/disciplinas">Ir para disciplinas</Link>
          </section>
        ) : (
          <section className="task-create-card" aria-label="Adicionar atividade">
            <AcademicTaskCreateForm
              subjects={subjects.map((subject) => ({ id: subject.id, name: subject.name }))}
            />
          </section>
        )}

        {tasks.length === 0 ? (
          <section className="tasks-empty-state">
            <span className="protected-card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <rect x="4" y="5" width="16" height="16" rx="2" />
                <path d="M8 3v4M16 3v4M4 10h16M8 14h3M8 17h6" />
              </svg>
            </span>
            <h2>Sua agenda está livre</h2>
            <p>Adicione uma atividade para começar a acompanhar seus próximos prazos.</p>
          </section>
        ) : (
          <div className="task-groups">
            <TaskList tasks={pending} title="Atividades pendentes" />
            <TaskList tasks={completed} title="Atividades concluídas ou enviadas" />
          </div>
        )}
      </div>
    </ProtectedShell>
  );
}
