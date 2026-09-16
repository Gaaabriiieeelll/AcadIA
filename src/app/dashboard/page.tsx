import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

import { GradeValue } from "@/components/grade-value";
import { ProtectedShell } from "@/components/protected-shell";
import { SubjectFilter } from "@/components/subject-filter";
import { getCurrentAlertPreferences } from "@/data/academic-alerts";
import { getCurrentAcademicProfile } from "@/data/academic-profile";
import { getCurrentTaskOverview } from "@/data/academic-tasks";
import { getCurrentAcademicDashboard } from "@/data/subjects";
import { authOptions } from "@/lib/auth";
import { getGradeColorStyle } from "@/lib/grade-colors";
import { resolveHifpbProfileSelection } from "@/lib/hifpb-courses";
import {
  EMPTY_SUBJECT_FILTER_VALUE,
  parseSubjectFilter,
} from "@/lib/subject-filter";
import { sortSubjects } from "@/lib/subject-sorting";
import { getSubjectBimesters, type SubjectDTO } from "@/types/subjects";

export const metadata: Metadata = {
  title: "Visão geral",
};

const IFPB_REGULATIONS_URL =
  "https://www.ifpb.edu.br/pro-reitoria/pre/assuntos/regulamentos";

function formatScore(value: number | null) {
  return value === null
    ? "—"
    : value.toLocaleString("pt-BR", { minimumFractionDigits: 1 });
}

function formatAttendance(value: number | null) {
  return value === null
    ? "—"
    : `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

function subjectHref(subject: SubjectDTO) {
  return `/disciplinas#disciplina-${subject.id}`;
}

function SubjectRanking({
  subjects,
  emptyMessage,
}: {
  subjects: SubjectDTO[];
  emptyMessage: string;
}) {
  if (subjects.length === 0) {
    return <p className="dashboard-empty-copy">{emptyMessage}</p>;
  }

  return (
    <ol className="dashboard-ranking-list">
      {subjects.map((subject, index) => (
        <li key={subject.id}>
          <span className="dashboard-ranking-position">{index + 1}</span>
          <i style={{ backgroundColor: subject.color }} />
          <Link href={subjectHref(subject)}>{subject.name}</Link>
          <GradeValue minimumFractionDigits={1} value={subject.averageScore} />
        </li>
      ))}
    </ol>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ materias?: string | string[] }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const profile = await getCurrentAcademicProfile();
  if (!profile) redirect("/onboarding");
  const academicClassName = resolveHifpbProfileSelection(profile)?.className
    ?? `${profile.course} · ${profile.academicStage}`;

  const requestedSubjectIds = parseSubjectFilter((await searchParams).materias);
  const [academicDashboard, taskOverview, alertPreferences] = await Promise.all([
    getCurrentAcademicDashboard(requestedSubjectIds),
    getCurrentTaskOverview(),
    getCurrentAlertPreferences(),
  ]);
  const {
    availableSubjects,
    selectedSubjectIds,
    overview,
    bimesters,
    subjects,
  } = academicDashboard;
  const firstName = session.user.name?.split(/\s+/)[0] ?? "estudante";
  const rankedSubjects = subjects.filter(
    (subject): subject is SubjectDTO & { averageScore: number } =>
      subject.averageScore !== null,
  );
  const highestAverages = sortSubjects(rankedSubjects, "average-desc").slice(0, 3);
  const lowestAverages = sortSubjects(rankedSubjects, "average-asc").slice(0, 3);
  const attentionSubjects = subjects
    .map((subject) => {
      const filledGrades = subject.bimesterGrades.filter(
        (grade) => grade.score !== null,
      ).length;
      const reasons: string[] = [];

      if (alertPreferences.gradesEnabled && filledGrades === 0) {
        reasons.push("Nenhuma nota cadastrada");
      }
      if (
        alertPreferences.gradesEnabled
        && subject.averageScore !== null
        && subject.averageScore < alertPreferences.targetAverage
      ) {
        reasons.push(`Média parcial ${formatScore(subject.averageScore)}`);
      }
      if (
        alertPreferences.attendanceEnabled
        && subject.attendancePercentage !== null
        && subject.attendancePercentage < alertPreferences.minimumAttendance
      ) {
        reasons.push(`Frequência ${formatAttendance(subject.attendancePercentage)}`);
      }

      return { subject, reasons };
    })
    .filter(({ reasons }) => reasons.length > 0)
    .sort((left, right) =>
      right.reasons.length - left.reasons.length
      || left.subject.name.localeCompare(right.subject.name, "pt-BR"),
    );

  return (
    <ProtectedShell active="dashboard" user={session.user}>
      <div className="protected-main dashboard-page-main">
        <span className="protected-kicker">{academicClassName} · painel acadêmico</span>
        <h1>Olá, {firstName}!</h1>
        <p className="protected-lead">
          Veja seu desempenho por bimestre, identifique prioridades e acesse rapidamente cada disciplina.
        </p>

        <SubjectFilter
          emptySelection={requestedSubjectIds.includes(EMPTY_SUBJECT_FILTER_VALUE)}
          filterIsExplicit={requestedSubjectIds.length > 0}
          key={requestedSubjectIds.includes(EMPTY_SUBJECT_FILTER_VALUE)
            ? "none"
            : selectedSubjectIds.join(",") || "all"}
          selectedIds={selectedSubjectIds}
          subjects={availableSubjects}
        />

        <section className="dashboard-overview" aria-labelledby="dashboard-overview-title">
          <div className="dashboard-overview-heading">
            <div>
              <span>Panorama do período</span>
              <h2 id="dashboard-overview-title">Seu acompanhamento em um só lugar</h2>
            </div>
            <strong>{profile.classGroup ?? "Turma não informada"}</strong>
          </div>

          <div className="dashboard-overview-metrics">
            <div>
              <span>Média geral</span>
              <GradeValue value={overview.averageScore} />
              <small>entre disciplinas com nota</small>
            </div>
            <div>
              <span>Frequência geral</span>
              <strong>{formatAttendance(overview.attendancePercentage)}</strong>
              <small>com base nas aulas registradas</small>
            </div>
            <div>
              <span>Notas lançadas</span>
              <strong>{overview.assessmentCount}/{overview.totalBimesterCount}</strong>
              <small>{overview.subjectsWithoutGrades} disciplina(s) sem nota</small>
            </div>
            <div className={attentionSubjects.length > 0 ? "dashboard-metric-attention" : undefined}>
              <span>Precisam de atenção</span>
              <strong>{attentionSubjects.length}</strong>
              <small>por nota, média ou frequência</small>
            </div>
          </div>

          <div className="dashboard-course-structure">
            <span><strong>{overview.subjectCount}</strong> disciplinas no período</span>
            <span><strong>{overview.fourBimesterSubjects}</strong> disciplina(s) com 4 bimestres</span>
            <span><strong>{overview.twoBimesterSubjects}</strong> disciplina(s) com 2 bimestres</span>
          </div>
        </section>

        <div className="dashboard-insights-grid">
          <section className="dashboard-panel" aria-labelledby="bimester-progress-title">
            <div className="dashboard-panel-heading">
              <div>
                <span>Comparativo</span>
                <h2 id="bimester-progress-title">Desempenho por bimestre</h2>
              </div>
            </div>

            <div className="dashboard-bimester-list">
              {bimesters.map((bimester) => (
                <div className="dashboard-bimester-row" key={bimester.bimester}>
                  <div>
                    <span>{bimester.bimester}º bimestre</span>
                    <small>{bimester.filledGrades}/{bimester.eligibleSubjects} notas</small>
                  </div>
                  <div
                    aria-label={bimester.averageScore === null
                      ? `${bimester.bimester}º bimestre sem média`
                      : `Média ${formatScore(bimester.averageScore)} no ${bimester.bimester}º bimestre`}
                    aria-valuemax={100}
                    aria-valuemin={0}
                    aria-valuenow={bimester.averageScore ?? undefined}
                    className="dashboard-progress-track"
                    role={bimester.averageScore === null ? undefined : "progressbar"}
                  >
                    <i
                      style={{
                        "--dashboard-progress": `${bimester.averageScore ?? 0}%`,
                        ...getGradeColorStyle(bimester.averageScore),
                      } as CSSProperties}
                    />
                  </div>
                  <GradeValue variant="text" value={bimester.averageScore} />
                </div>
              ))}
            </div>
          </section>

          <section className="dashboard-panel dashboard-attention-panel" aria-labelledby="attention-title">
            <div className="dashboard-panel-heading">
              <div>
                <span>Acompanhamento preventivo</span>
                <h2 id="attention-title">Atenção agora</h2>
              </div>
              <strong>{attentionSubjects.length}</strong>
            </div>

            {attentionSubjects.length === 0 ? (
              <div className="dashboard-all-good">
                <strong>Tudo em ordem</strong>
                <p>Não há indicadores acadêmicos abaixo das referências configuradas.</p>
              </div>
            ) : (
              <ul className="dashboard-attention-list">
                {attentionSubjects.map(({ subject, reasons }) => (
                  <li key={subject.id} style={{ "--subject-color": subject.color } as CSSProperties}>
                    <div>
                      <Link href={subjectHref(subject)}>{subject.name}</Link>
                      <span>{reasons.join(" · ")}</span>
                    </div>
                    <Link aria-label={`Editar ${subject.name}`} href={subjectHref(subject)}>Editar</Link>
                  </li>
                ))}
              </ul>
            )}

            <Link className="dashboard-alert-center-link" href="/alertas">
              Abrir central de alertas
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M5 12h14M14 7l5 5-5 5" />
              </svg>
            </Link>

            <p className="dashboard-rule-note">
              Referências preventivas: média {alertPreferences.targetAverage} e frequência {alertPreferences.minimumAttendance}%. O resultado oficial permanece no SUAP. {" "}
              <a href={IFPB_REGULATIONS_URL} rel="noreferrer" target="_blank">Consultar regimento</a>
            </p>
          </section>
        </div>

        <section className="dashboard-panel dashboard-ranking-panel" aria-labelledby="ranking-title">
          <div className="dashboard-panel-heading">
            <div>
              <span>Ranking atual</span>
              <h2 id="ranking-title">Maiores e menores médias</h2>
            </div>
            <small>Empates em ordem alfabética</small>
          </div>

          <div className="dashboard-ranking-grid">
            <div>
              <h3>Maiores médias</h3>
              <SubjectRanking
                emptyMessage="Adicione notas para gerar o ranking."
                subjects={highestAverages}
              />
            </div>
            <div>
              <h3>Menores médias</h3>
              <SubjectRanking
                emptyMessage="Adicione notas para gerar o ranking."
                subjects={lowestAverages}
              />
            </div>
          </div>
        </section>

        <section className="dashboard-subjects" aria-labelledby="dashboard-subjects-title">
          <div className="dashboard-section-heading">
            <div>
              <span>Visão detalhada</span>
              <h2 id="dashboard-subjects-title">
                {selectedSubjectIds.length > 0 ? "Disciplinas em foco" : "Todas as disciplinas"}
              </h2>
            </div>
            <Link className="secondary-action" href="/disciplinas">Gerenciar disciplinas</Link>
          </div>

          <div className="dashboard-subject-grid">
            {subjects.map((subject) => {
              const filledGrades = subject.bimesterGrades.filter(
                (grade) => grade.score !== null,
              ).length;

              return (
                <article
                  className="dashboard-subject-card"
                  key={subject.id}
                  style={{ "--subject-color": subject.color } as CSSProperties}
                >
                  <div className="dashboard-subject-heading">
                    <div>
                      <i />
                      <h3>{subject.name}</h3>
                    </div>
                    <Link aria-label={`Editar ${subject.name}`} href={subjectHref(subject)}>Editar</Link>
                  </div>

                  <div className="dashboard-subject-metrics">
                    <div><span>Média</span><GradeValue value={subject.averageScore} /></div>
                    <div><span>Frequência</span><strong>{formatAttendance(subject.attendancePercentage)}</strong></div>
                    <div><span>Notas</span><strong>{filledGrades}/{subject.bimesterCount}</strong></div>
                  </div>

                  <div className="dashboard-subject-bimesters" aria-label={`Notas de ${subject.name}`}>
                    {getSubjectBimesters(subject.bimesterCount).map((bimester) => {
                      const score = subject.bimesterGrades.find(
                        (grade) => grade.bimester === bimester,
                      )?.score ?? null;

                      return (
                        <span className={score === null ? "dashboard-bimester-empty" : undefined} key={bimester}>
                          <small>{bimester}º</small>
                          <GradeValue minimumFractionDigits={0} value={score} variant="text" />
                        </span>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <div className="dashboard-secondary-grid">
          <section className="protected-card" aria-labelledby="agenda-title">
            <div className="protected-card-heading">
              <span className="protected-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="15" rx="2" /><path d="M7.5 3v5M16.5 3v5M3.5 10h17M8 14h3M8 17h6" /></svg>
              </span>
              <div><span>Planejamento</span><h2 id="agenda-title">Agenda acadêmica</h2></div>
            </div>
            {taskOverview.pendingCount === 0 ? (
              <p>Nenhuma atividade pendente. Adicione provas e trabalhos para acompanhar seus prazos.</p>
            ) : (
              <div className="agenda-dashboard-summary">
                <div><strong>{taskOverview.pendingCount}</strong><span>pendente(s)</span></div>
                <div><strong>{taskOverview.dueSoonCount}</strong><span>nos próximos 7 dias</span></div>
                <div className={taskOverview.overdueCount > 0 ? "agenda-dashboard-alert" : undefined}><strong>{taskOverview.overdueCount}</strong><span>atrasada(s)</span></div>
              </div>
            )}
            {taskOverview.nextTask ? (
              <p className="agenda-next-task"><strong>Próxima:</strong> {taskOverview.nextTask.title} · {taskOverview.nextTask.subject.name}</p>
            ) : null}
            <div className="dashboard-card-links">
              <Link className="card-link" href="/agenda">
                {taskOverview.pendingCount === 0 ? "Adicionar atividade" : "Abrir agenda"}
              </Link>
              <Link className="card-link" href="/plano-de-estudos">Plano de estudos</Link>
            </div>
          </section>

          <section className="protected-card" aria-labelledby="academic-data-title">
            <div className="protected-card-heading">
              <span className="protected-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 6.5 12 3l8 3.5-8 3.5z" /><path d="M6.5 9v5.5c2.8 2 8.2 2 11 0V9M20 7v6" /></svg>
              </span>
              <div><span>Seu curso</span><h2 id="academic-data-title">Perfil acadêmico</h2></div>
            </div>
            <dl className="profile-summary">
              <div><dt>Curso</dt><dd>{profile.course}</dd></div>
              <div><dt>Etapa</dt><dd>{profile.academicStage}</dd></div>
              <div><dt>Turma</dt><dd>{profile.classGroup ?? "Não informada"}</dd></div>
              <div><dt>Campus</dt><dd>{profile.campus}</dd></div>
            </dl>
            <div className="dashboard-card-links">
              <Link className="card-link" href="/horarios">Ver horários</Link>
              <Link className="card-link" href="/calendario">Ver calendário</Link>
              <Link className="card-link" href="/horarios#perfil-academico">Revisar perfil</Link>
            </div>
          </section>
        </div>

        <footer className="dashboard-contact" aria-labelledby="dashboard-contact-title">
          <div className="dashboard-contact-heading">
            <span>Contato do projeto</span>
            <h2 id="dashboard-contact-title">Fale com Gabriel</h2>
            <p>Dúvidas, sugestões ou interesse em colaborar com o desenvolvimento do AcadIA.</p>
          </div>

          <address className="dashboard-contact-list">
            <a href="mailto:gabriel.jpb2009@gmail.com">
              <span aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
                  <path d="m5 7 7 5 7-5" />
                </svg>
              </span>
              <div><small>E-mail</small><strong>gabriel.jpb2009@gmail.com</strong></div>
            </a>

            <a href="tel:+5583986304936">
              <span aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M7.2 3.8 10 7.1 8.4 9.5c1.2 2.4 3.1 4.3 5.5 5.5l2.4-1.6 3.3 2.8-.8 3.1c-.2.8-1 1.3-1.8 1.2C9.7 19.6 4.4 14.3 3.5 7c-.1-.8.4-1.6 1.2-1.8z" />
                </svg>
              </span>
              <div><small>Telefone</small><strong>(83) 98630-4936</strong></div>
            </a>

            <a href="https://www.instagram.com/itz.gabz_09/" rel="noreferrer" target="_blank">
              <span aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
                  <circle cx="12" cy="12" r="3.5" />
                  <circle cx="17.4" cy="6.7" r=".7" fill="currentColor" stroke="none" />
                </svg>
              </span>
              <div><small>Instagram</small><strong>@itz.gabz_09</strong></div>
            </a>
          </address>
        </footer>
      </div>
    </ProtectedShell>
  );
}
