import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  CreateStudySessionForm,
  GenerateStudyPlanForm,
  StudyPlanPreferencesForm,
  StudySessionControls,
} from "@/components/study-plan-forms";
import { MecBooksSection } from "@/components/mec-books-section";
import { ProtectedShell } from "@/components/protected-shell";
import { StudyAiSection } from "@/components/study-ai-section";
import { getAcademicCalendarTodayKey } from "@/data/academic-calendar";
import { getCurrentAcademicProfile } from "@/data/academic-profile";
import { getCurrentStudyPlan } from "@/data/study-plan";
import { getCurrentStudyRecommendationOverview } from "@/data/study-recommendations";
import { authOptions } from "@/lib/auth";
import {
  addDaysToStudyDate,
  getStudyWeekStart,
  isValidDateKey,
  shiftStudyWeek,
} from "@/lib/study-plan";
import { STUDY_WEEKDAYS, type StudySessionDTO } from "@/types/study-plan";

import styles from "./study-plan.module.css";

export const metadata: Metadata = {
  title: "Plano de estudos",
};

type StudyPlanPageProps = {
  searchParams: Promise<{ semana?: string | string[] }>;
};

function parseDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

function formatDate(value: string, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
    ...options,
  }).format(parseDateKey(value));
}

function formatWeek(start: string, end: string) {
  return `${formatDate(start)} – ${formatDate(end, { day: "2-digit", month: "short", year: "numeric" })}`;
}

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours === 0) return `${remainder} min`;
  if (remainder === 0) return `${hours}h`;
  return `${hours}h ${remainder}min`;
}

function SessionCard({ session }: { session: StudySessionDTO }) {
  const completed = session.status === "COMPLETED";

  return (
    <article
      className={`${styles.sessionCard}${completed ? ` ${styles.completedSession}` : ""}`}
      style={{ "--study-subject-color": session.subject.color } as CSSProperties}
    >
      <div className={styles.sessionTopline}>
        <time dateTime={`${session.scheduledDate}T${session.startTime}`}>
          {session.startTime}–{session.endTime}
        </time>
        <span>{session.durationMinutes} min</span>
        <span>{session.source === "AUTOMATIC" ? "Automático" : "Manual"}</span>
      </div>
      <h3>{session.subject.name}</h3>
      <strong>{session.focus ?? "Revisão do conteúdo atual"}</strong>
      <p>{session.rationale}</p>
      {completed ? <span className={styles.completedBadge}>Concluída</span> : null}
      <StudySessionControls session={session} />
    </article>
  );
}

export default async function StudyPlanPage({ searchParams }: StudyPlanPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const profile = await getCurrentAcademicProfile();
  if (!profile) redirect("/onboarding");

  const parameters = await searchParams;
  const requested = Array.isArray(parameters.semana) ? parameters.semana[0] : parameters.semana;
  const todayDateKey = getAcademicCalendarTodayKey();
  const referenceDate = requested && isValidDateKey(requested) ? requested : todayDateKey;
  const weekStart = getStudyWeekStart(referenceDate);
  const [studyPlan, recommendationOverview] = await Promise.all([
    getCurrentStudyPlan(weekStart),
    getCurrentStudyRecommendationOverview(),
  ]);
  const currentWeekStart = getStudyWeekStart(todayDateKey);
  const previousWeek = shiftStudyWeek(weekStart, -1);
  const nextWeek = shiftStudyWeek(weekStart, 1);
  const defaultSessionDate = todayDateKey >= studyPlan.weekStart
    && todayDateKey <= studyPlan.weekEnd
    ? todayDateKey
    : studyPlan.weekStart;
  const hasReplaceableSessions = studyPlan.sessions.some(
    (item) => item.source === "AUTOMATIC"
      && item.status === "PLANNED"
      && item.scheduledDate >= todayDateKey,
  );

  return (
    <ProtectedShell active="study" user={session.user}>
      <div className={`protected-main ${styles.pageMain}`}>
        <span className="protected-kicker">Organização personalizada</span>
        <h1>Plano de estudos</h1>
        <p className="protected-lead">
          Transforme suas metas, notas e atividades em uma rotina semanal clara e ajustável.
        </p>

        <section className={styles.hero} aria-labelledby="study-overview-title">
          <div className={styles.heroHeading}>
            <div>
              <span>Semana selecionada</span>
              <h2 id="study-overview-title">{formatWeek(studyPlan.weekStart, studyPlan.weekEnd)}</h2>
              <p>
                {studyPlan.preferences.configured
                  ? "O plano usa sua disponibilidade e explica cada prioridade."
                  : "Configure seus horários para gerar a primeira distribuição automática."}
              </p>
            </div>
            <div className={styles.weekNavigation} aria-label="Navegar entre semanas">
              <Link href={`/plano-de-estudos?semana=${previousWeek}`} aria-label="Semana anterior">←</Link>
              {weekStart !== currentWeekStart ? (
                <Link href={`/plano-de-estudos?semana=${currentWeekStart}`}>Semana atual</Link>
              ) : <span>Semana atual</span>}
              <Link href={`/plano-de-estudos?semana=${nextWeek}`} aria-label="Próxima semana">→</Link>
            </div>
          </div>

          <div className={styles.heroMetrics}>
            <div>
              <span>Meta</span>
              <strong>{formatMinutes(studyPlan.summary.goalMinutes)}</strong>
              <small>nesta semana</small>
            </div>
            <div>
              <span>Planejado</span>
              <strong>{formatMinutes(studyPlan.summary.plannedMinutes)}</strong>
              <small>{studyPlan.summary.totalSessions} sessão(ões)</small>
            </div>
            <div>
              <span>Concluído</span>
              <strong>{formatMinutes(studyPlan.summary.completedMinutes)}</strong>
              <small>{studyPlan.summary.completedSessions} finalizada(s)</small>
            </div>
            <div>
              <span>Progresso</span>
              <strong>{studyPlan.summary.progressPercentage}%</strong>
              <div
                aria-label={`${studyPlan.summary.progressPercentage}% da meta concluída`}
                aria-valuemax={100}
                aria-valuemin={0}
                aria-valuenow={studyPlan.summary.progressPercentage}
                className={styles.progressTrack}
                role="progressbar"
              >
                <i style={{ width: `${studyPlan.summary.progressPercentage}%` }} />
              </div>
            </div>
          </div>
        </section>

        <section className={styles.configurationSection} aria-labelledby="study-settings-title">
          <div className={styles.sectionHeading}>
            <div>
              <span>Antes de gerar</span>
              <h2 id="study-settings-title">Sua disponibilidade</h2>
              <p>Escolha os períodos em que o AcadIA pode distribuir sessões.</p>
            </div>
          </div>
          <div className={styles.configurationGrid}>
            <div className={styles.settingsCard}>
              <StudyPlanPreferencesForm preferences={studyPlan.preferences} />
            </div>
            <aside className={styles.priorityCard}>
              <div className={styles.priorityHeading}>
                <span>Critérios transparentes</span>
                <h3>Prioridades desta semana</h3>
                <p>Médias abaixo da meta e atividades próximas recebem mais espaço.</p>
              </div>
              {studyPlan.priorities.length === 0 ? (
                <p className={styles.noPriorities}>Cadastre disciplinas para calcular prioridades.</p>
              ) : (
                <ol className={styles.priorityList}>
                  {studyPlan.priorities.slice(0, 4).map((priority, index) => (
                    <li key={priority.subjectId}>
                      <span>{index + 1}</span>
                      <i style={{ backgroundColor: priority.color }} />
                      <div>
                        <strong>{priority.name}</strong>
                        <small>{priority.reasons.join(" · ")}</small>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
              <GenerateStudyPlanForm
                disabled={studyPlan.priorities.length === 0}
                hasReplaceableSessions={hasReplaceableSessions}
                weekStart={studyPlan.weekStart}
              />
            </aside>
          </div>
        </section>

        <section className={styles.weekSection} aria-labelledby="study-week-title">
          <div className={styles.sectionHeading}>
            <div>
              <span>Rotina semanal</span>
              <h2 id="study-week-title">Sessões planejadas</h2>
              <p>Conclua, adie ou edite qualquer sessão sem perder o restante do plano.</p>
            </div>
          </div>

          <div className={styles.weekBoard} tabIndex={0} aria-label="Plano semanal de estudos">
            {STUDY_WEEKDAYS.map((day) => {
              const date = addDaysToStudyDate(studyPlan.weekStart, day.value - 1);
              const daySessions = studyPlan.sessions.filter(
                (item) => item.scheduledDate === date,
              );
              const isToday = date === studyPlan.todayDateKey;

              return (
                <section
                  className={`${styles.dayColumn}${isToday ? ` ${styles.todayColumn}` : ""}`}
                  key={day.value}
                  aria-labelledby={`study-day-${date}`}
                >
                  <header>
                    <div>
                      <span>{day.shortLabel}</span>
                      <h3 id={`study-day-${date}`}>{formatDate(date)}</h3>
                    </div>
                    {isToday ? <strong>Hoje</strong> : null}
                  </header>
                  <div className={styles.daySessions}>
                    {daySessions.length > 0
                      ? daySessions.map((item) => <SessionCard key={item.id} session={item} />)
                      : <p className={styles.emptyDay}>Sem sessões</p>}
                  </div>
                </section>
              );
            })}
          </div>
        </section>

        <section className={styles.manualSection} aria-labelledby="manual-session-title">
          <div className={styles.sectionHeading}>
            <div>
              <span>Ajuste manual</span>
              <h2 id="manual-session-title">Adicionar uma sessão</h2>
              <p>Inclua uma revisão extra sem alterar as sessões geradas automaticamente.</p>
            </div>
          </div>
          {studyPlan.subjects.length === 0 ? (
            <div className={styles.needsSubjects}>
              <p>Você precisa cadastrar uma disciplina antes de adicionar sessões.</p>
              <Link className="primary-action" href="/disciplinas">Ir para disciplinas</Link>
            </div>
          ) : (
            <div className={styles.manualCard}>
              <CreateStudySessionForm
                defaultDate={defaultSessionDate}
                subjects={studyPlan.subjects.map(({ id, name }) => ({ id, name }))}
              />
            </div>
          )}
        </section>

        <footer className={styles.methodNote}>
          <strong>Como a recomendação funciona</strong>
          <p>
            O AcadIA compara suas médias com a meta pessoal e considera atividades pendentes ou próximas. A pontuação serve apenas para organizar o estudo; ela não prevê aprovação e pode ser ajustada por você a qualquer momento.
          </p>
        </footer>

        <StudyAiSection overview={recommendationOverview} />
        <MecBooksSection />
      </div>
    </ProtectedShell>
  );
}
