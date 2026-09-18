import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { ProtectedShell } from "@/components/protected-shell";
import { GradeValue } from "@/components/grade-value";
import { SubjectFilter } from "@/components/subject-filter";
import { SubjectSortControl } from "@/components/subject-sort-control";
import {
  AttendanceForm,
  BimesterGradesForm,
  DeleteSubjectForm,
  SubjectCreateForm,
} from "@/components/subject-forms";
import { getCurrentAcademicProfile } from "@/data/academic-profile";
import { getCurrentSubjects } from "@/data/subjects";
import { resolveAcademicClassGroup } from "@/lib/academic-profile-options";
import { authOptions } from "@/lib/auth";
import { resolveHifpbProfileSelection } from "@/lib/hifpb-courses";
import { SUBJECT_AREAS } from "@/lib/subject-areas";
import {
  EMPTY_SUBJECT_FILTER_VALUE,
  parseSubjectFilter,
  resolveSubjectFilter,
} from "@/lib/subject-filter";
import { parseSubjectSort, sortSubjects } from "@/lib/subject-sorting";

export const metadata: Metadata = {
  title: "Disciplinas",
};

function formatAttendance(value: number | null) {
  return value === null ? "—" : `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

export default async function SubjectsPage({
  searchParams,
}: {
  searchParams: Promise<{
    materias?: string | string[];
    sort?: string | string[];
  }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const profile = await getCurrentAcademicProfile();
  if (!profile) redirect("/onboarding");
  const academicClassGroup = resolveAcademicClassGroup(profile.classGroup);
  const academicClassName = resolveHifpbProfileSelection(profile)?.className
    ?? `${profile.course} · ${profile.academicStage}`;

  const parameters = await searchParams;
  const sortOption = parseSubjectSort(parameters.sort);
  const requestedSubjectIds = parseSubjectFilter(parameters.materias);
  const availableSubjects = await getCurrentSubjects();
  const { selectedIds, subjects: filteredSubjects } = resolveSubjectFilter(
    availableSubjects,
    requestedSubjectIds,
  );
  const subjects = sortSubjects(filteredSubjects, sortOption);

  return (
    <ProtectedShell active="subjects" user={session.user}>
      <div className="protected-main subjects-page-main">
        <span className="protected-kicker">{academicClassName} · acompanhamento acadêmico</span>
        <h1>Disciplinas</h1>
        <p className="protected-lead">
          Acompanhe notas bimestrais e frequência das disciplinas salvas para {academicClassName}.
        </p>

        <section className="hifpb-subject-sync" aria-label="Origem dos dados acadêmicos">
          <div>
            <span>Dados cadastrados no AcadIA · {profile.academicStage}</span>
            <h2>Acompanhamento de {academicClassName}</h2>
            <p>Notas e frequências permanecem sob seu controle. A grade pública do hIFPB é localizada pelo curso, ano e divisão do perfil.</p>
          </div>
          <strong className="subject-group-badge">
            {academicClassGroup ? `Divisão ${academicClassGroup}` : "Divisão pendente"}
          </strong>
        </section>

        <div className="subject-area-legend" aria-label="Cores por área de conhecimento">
          {Object.entries(SUBJECT_AREAS).map(([area, details]) => (
            <span key={area}>
              <i style={{ backgroundColor: details.color }} />
              {details.label}
            </span>
          ))}
        </div>

        <SubjectFilter
          emptySelection={requestedSubjectIds.includes(EMPTY_SUBJECT_FILTER_VALUE)}
          filterIsExplicit={requestedSubjectIds.length > 0}
          key={requestedSubjectIds.includes(EMPTY_SUBJECT_FILTER_VALUE)
            ? "none"
            : selectedIds.join(",") || "all"}
          selectedIds={selectedIds}
          subjects={availableSubjects.map(({ id, name, color }) => ({ id, name, color }))}
        />

        <section className="subject-create-card" aria-label="Cadastrar disciplina">
          <SubjectCreateForm />
        </section>

        <div className="subjects-section-heading">
          <div>
            <span>Período atual</span>
            <h2>Suas disciplinas</h2>
          </div>
          <div className="subjects-section-tools">
            <strong
              className="subjects-count"
              aria-label={`${subjects.length} de ${availableSubjects.length} disciplinas`}
            >
              {subjects.length}
            </strong>
            <SubjectSortControl value={sortOption} />
          </div>
        </div>

        {subjects.length === 0 ? (
          <section className="subjects-empty-state">
            <span className="protected-card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M4 5.5h6.5A3.5 3.5 0 0 1 14 9v10H7.5A3.5 3.5 0 0 0 4 22z" />
                <path d="M20 5.5h-2.5A3.5 3.5 0 0 0 14 9v10h2.5A3.5 3.5 0 0 1 20 22z" />
              </svg>
            </span>
            <h2>
              {availableSubjects.length === 0
                ? "Nenhuma disciplina cadastrada"
                : "Nenhuma matéria selecionada"}
            </h2>
            <p>
              {availableSubjects.length === 0
                ? "Use o formulário acima para adicionar a primeira disciplina deste período."
                : "Abra o filtro e marque as matérias que deseja acompanhar."}
            </p>
          </section>
        ) : (
          <div className="subjects-list">
            {subjects.map((subject) => (
              <article
                className="subject-card"
                id={`disciplina-${subject.id}`}
                key={subject.id}
                style={{ "--subject-color": subject.color } as CSSProperties}
              >
                <header className="subject-card-header">
                  <div className="subject-card-title">
                    <span className="subject-color-dot" />
                    <div>
                      <h2>{subject.name}</h2>
                      <p>{subject.teacher ?? "Professor não informado"}</p>
                      <div className="subject-data-badges">
                        {subject.academicStatus ? <span>{subject.academicStatus}</span> : null}
                        {subject.academicPeriod ? <span>{subject.academicPeriod}</span> : null}
                        {subject.dataSource === "SUAP_REPORT" ? <span>Boletim SUAP</span> : <span>Manual</span>}
                      </div>
                    </div>
                  </div>
                  <DeleteSubjectForm subjectId={subject.id} subjectName={subject.name} />
                </header>

                <div className="subject-metrics">
                  <div>
                    <span>Média atual</span>
                    <GradeValue value={subject.averageScore} />
                    <small>
                      {subject.bimesterGrades.filter((grade) => grade.score !== null).length}/{subject.bimesterCount} bimestres preenchidos
                    </small>
                  </div>
                  <div>
                    <span>Frequência</span>
                    <strong>{formatAttendance(subject.attendancePercentage)}</strong>
                    <small>{subject.absences} falta(s) em {subject.classesHeld} aula(s)</small>
                  </div>
                </div>

                <div className="subject-details-grid">
                  <section className="subject-detail-panel" aria-labelledby={`bimesters-${subject.id}`}>
                    <div className="subject-panel-heading">
                      <h3 id={`bimesters-${subject.id}`}>Notas por bimestre</h3>
                      <span>Escala de 0 a 100</span>
                    </div>

                    <BimesterGradesForm
                      bimesterCount={subject.bimesterCount}
                      grades={subject.bimesterGrades}
                      subjectId={subject.id}
                    />

                    <div className="bimester-summary" aria-label="Resumo das médias">
                      <div>
                        <span>Média parcial</span>
                        <GradeValue value={subject.bimesterAverage} />
                      </div>
                      {subject.officialAverage !== null ? (
                        <div>
                          <span>MD oficial</span>
                          <GradeValue value={subject.officialAverage} />
                        </div>
                      ) : null}
                      {subject.finalAssessmentScore !== null ? (
                        <div>
                          <span>NAF</span>
                          <GradeValue value={subject.finalAssessmentScore} />
                        </div>
                      ) : null}
                      {subject.finalAverage !== null ? (
                        <div>
                          <span>Média final</span>
                          <GradeValue value={subject.finalAverage} />
                        </div>
                      ) : null}
                    </div>
                  </section>

                  <section className="subject-detail-panel" aria-labelledby={`attendance-${subject.id}`}>
                    <div className="subject-panel-heading">
                      <h3 id={`attendance-${subject.id}`}>Frequência</h3>
                      <span>Atualização acumulada</span>
                    </div>
                    <p className="subject-panel-help">
                      Informe o total de aulas já ministradas e quantas faltas você acumulou.
                    </p>
                    <AttendanceForm
                      absences={subject.absences}
                      classesHeld={subject.classesHeld}
                      subjectId={subject.id}
                    />
                  </section>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </ProtectedShell>
  );
}
