"use client";

import { useState } from "react";
import { filterMaterials } from "@/lib/material-search";
import type { ClassroomOverviewDTO, ClassroomMaterialDTO } from "@/types/google-classroom";

const attachmentLabels = {
  drive: "Arquivo",
  youtube: "Vídeo",
  link: "Link",
  form: "Formulário",
} as const;

function formatDate(value: string | null) {
  if (!value) return "Data não informada";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

function MaterialCard({ material }: { material: ClassroomMaterialDTO }) {
  const repeatedDescription = material.description === material.title;

  return (
    <article className="classroom-material-card">
      <div className="classroom-material-meta">
        <span>{material.source === "material" ? "Material" : "Aviso"}</span>
        <time dateTime={material.updatedAt ?? material.publishedAt ?? undefined}>
          {formatDate(material.updatedAt ?? material.publishedAt)}
        </time>
      </div>
      <h3>{material.title}</h3>
      {material.description && !repeatedDescription ? <p>{material.description}</p> : null}

      {material.attachments.length > 0 ? (
        <div className="classroom-attachments" aria-label="Anexos">
          {material.attachments.map((attachment, index) => (
            <a
              href={attachment.url}
              key={`${attachment.type}:${attachment.url}:${index}`}
              rel="noreferrer"
              target="_blank"
            >
              <span>{attachmentLabels[attachment.type]}</span>
              <strong>{attachment.title}</strong>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M14 5h5v5M10 14 19 5M19 14v5H5V5h5" />
              </svg>
            </a>
          ))}
        </div>
      ) : null}

      {material.alternateLink ? (
        <a className="classroom-open-link" href={material.alternateLink} rel="noreferrer" target="_blank">
          Abrir no Google Sala de Aula
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M5 12h14M14 7l5 5-5 5" />
          </svg>
        </a>
      ) : null}
    </article>
  );
}

export function MaterialLibrary({ overview }: { overview: ClassroomOverviewDTO }) {
  const [query, setQuery] = useState("");
  const [courseId, setCourseId] = useState("");
  const [kind, setKind] = useState("");
  const [order, setOrder] = useState("newest");
  const filtered = filterMaterials(overview.materials, { query, courseId, kind, order });
  const filtering = Boolean(query.trim() || courseId || kind);
  const matchingCourses = new Set(filtered.map((material) => material.courseId));
  const visibleCourses = overview.courses.filter((course) =>
    (!courseId || course.id === courseId) && (!filtering || matchingCourses.has(course.id)),
  );
  return (
    <>
      <section className="material-filters" aria-label="Buscar e filtrar materiais">
        <label><span>Buscar materiais</span>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Assunto, título ou anexo" />
        </label>
        <label><span>Turma</span>
          <select value={courseId} onChange={(event) => setCourseId(event.target.value)}>
            <option value="">Todas as turmas</option>
            {overview.courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}
          </select>
        </label>
        <label><span>Tipo de conteúdo</span>
          <select value={kind} onChange={(event) => setKind(event.target.value)}>
            <option value="">Todos os conteúdos</option>
            <option value="material">Materiais</option><option value="announcement">Avisos</option>
            <option value="drive">Com arquivos</option><option value="youtube">Com vídeos</option>
            <option value="link">Com links</option><option value="form">Com formulários</option>
          </select>
        </label>
        <label><span>Ordenar em cada turma</span>
          <select value={order} onChange={(event) => setOrder(event.target.value)}>
            <option value="newest">Mais recentes</option><option value="oldest">Mais antigos</option><option value="title">Título (A–Z)</option>
          </select>
        </label>
        <p role="status">{filtered.length} de {overview.materials.length} publicações</p>
        <button type="button" className="secondary-action" onClick={() => { setQuery(""); setCourseId(""); setKind(""); setOrder("newest"); }}>Limpar filtros</button>
      </section>
      {visibleCourses.length === 0 ? <section className="classroom-empty-state"><h2>Nenhum resultado</h2><p>Tente outro assunto ou limpe os filtros para ver todas as turmas.</p></section> : null}
              <div className="classroom-course-list">
                {visibleCourses.map((course) => {
                  const materials = filtered.filter(
                    (material) => material.courseId === course.id,
                  );

                  return (
                    <section className="classroom-course" key={course.id} aria-labelledby={`course-${course.id}`}>
                      <header>
                        <div>
                          <span>{course.section ?? "Turma ativa"}</span>
                          <h2 id={`course-${course.id}`}>{course.name}</h2>
                        </div>
                        {course.alternateLink ? (
                          <a href={course.alternateLink} rel="noreferrer" target="_blank">Abrir turma</a>
                        ) : null}
                      </header>

                      {course.teachers.length > 0 ? (
                        <div className="classroom-teacher-list" aria-label={`Professores de ${course.name}`}>
                          {course.teachers.map((teacher) => (
                            <article className="classroom-teacher-contact" key={teacher.id}>
                              <span className="classroom-teacher-icon" aria-hidden="true">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                  <circle cx="12" cy="8" r="3.5" />
                                  <path d="M5 20c.7-4 3.1-6 7-6s6.3 2 7 6" />
                                </svg>
                              </span>
                              <div>
                                <span>Professor(a)</span>
                                <strong>{teacher.name}</strong>
                                {teacher.email ? (
                                  <a href={`mailto:${teacher.email}`}>{teacher.email}</a>
                                ) : (
                                  <small>E-mail não disponibilizado pelo Google</small>
                                )}
                              </div>
                            </article>
                          ))}
                        </div>
                      ) : course.teacherContactsRestricted ? (
                        <p className="classroom-teacher-empty">Contato do professor protegido pela política institucional do IFPB.</p>
                      ) : (
                        <p className="classroom-teacher-empty">Professor não informado pelo Google Sala de Aula.</p>
                      )}

                      {materials.length === 0 ? (
                        <p className="classroom-course-empty">Nenhum material ou aviso publicado nesta turma.</p>
                      ) : (
                        <div className="classroom-material-grid">
                          {materials.map((material) => (
                            <MaterialCard key={material.id} material={material} />
                          ))}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
    </>
  );
}
