import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ClassroomConnectButton } from "@/components/classroom-connect-button";
import { ProtectedShell } from "@/components/protected-shell";
import { getCurrentAcademicProfile } from "@/data/academic-profile";
import {
  ClassroomApiError,
  getCurrentClassroomOverview,
} from "@/data/google-classroom";
import { authOptions } from "@/lib/auth";
import { ClassroomConnectionError } from "@/lib/google-classroom-credentials";
import { resolveHifpbProfileSelection } from "@/lib/hifpb-courses";
import type { ClassroomMaterialDTO } from "@/types/google-classroom";

export const metadata: Metadata = {
  title: "Materiais",
};

type ConnectionIssue = {
  title: string;
  description: string;
  reconnect: boolean;
};

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

function connectionIssueFrom(error: unknown): ConnectionIssue | null {
  if (error instanceof ClassroomConnectionError) {
    if (error.code === "UPSTREAM_FAILURE") {
      return {
        title: "O Google Sala de Aula está temporariamente indisponível",
        description: "A consulta demorou demais para responder. Tente novamente em alguns instantes.",
        reconnect: false,
      };
    }

    if (error.code === "NOT_CONNECTED") {
      return {
        title: "Conecte sua conta do Google",
        description: "Autorize o AcadIA uma única vez para consultar suas turmas, materiais, avisos e contatos dos professores no Google Sala de Aula.",
        reconnect: false,
      };
    }

    if (error.code === "MISSING_PERMISSION") {
      return {
        title: "Autorize os contatos dos professores",
        description: "Reconecte o Google Sala de Aula e aceite a nova permissão somente de leitura para o AcadIA exibir os e-mails dos docentes.",
        reconnect: true,
      };
    }

    return {
      title: "A autorização expirou",
      description: "O Google solicitou uma nova confirmação. Seus dados locais continuam preservados.",
      reconnect: true,
    };
  }

  if (error instanceof ClassroomApiError) {
    if (error.code === "FORBIDDEN") {
      return {
        title: "O Google bloqueou o acesso às turmas",
        description: "A conta conectada não tem permissão para ler este Google Sala de Aula ou a instituição bloqueou aplicativos externos.",
        reconnect: true,
      };
    }

    return {
      title: "O Google Sala de Aula está indisponível",
      description: "Não foi possível consultar os materiais agora. Tente novamente em alguns instantes.",
      reconnect: false,
    };
  }

  return null;
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

export default async function MaterialsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const profile = await getCurrentAcademicProfile();
  if (!profile) redirect("/onboarding");
  const academicClassName = resolveHifpbProfileSelection(profile)?.className
    ?? `${profile.course} · ${profile.academicStage}`;

  let overview = null;
  let connectionIssue: ConnectionIssue | null = null;

  try {
    overview = await getCurrentClassroomOverview();
  } catch (error) {
    connectionIssue = connectionIssueFrom(error);
    if (!connectionIssue) throw error;
  }

  return (
    <ProtectedShell active="materials" user={session.user}>
      <div className="protected-main classroom-page-main">
        <span className="protected-kicker">{academicClassName} · conteúdo acadêmico</span>
        <h1>Materiais</h1>
        <p className="protected-lead">
          Consulte em um só lugar os professores, materiais e avisos publicados nas suas turmas ativas do Google Sala de Aula.
        </p>

        {connectionIssue ? (
          <section className="classroom-connect-card" aria-labelledby="classroom-connect-title">
            <span className="classroom-connect-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M6 3.5h8l4 4v13H6z" />
                <path d="M14 3.5v4h4M9 12h6M9 16h6" />
              </svg>
            </span>
            <div>
              <span>Integração somente de leitura</span>
              <h2 id="classroom-connect-title">{connectionIssue.title}</h2>
              <p>{connectionIssue.description}</p>
              <ClassroomConnectButton reconnect={connectionIssue.reconnect} />
            </div>
          </section>
        ) : overview ? (
          <>
            <section className="classroom-summary" aria-label="Resumo do Google Sala de Aula">
              <div>
                <span>Turmas ativas</span>
                <strong>{overview.courses.length}</strong>
              </div>
              <div>
                <span>Publicações encontradas</span>
                <strong>{overview.materials.length}</strong>
              </div>
              <div>
                <span>Professores</span>
                <strong>
                  {overview.courses.some((course) => course.teacherContactsRestricted)
                    ? "—"
                    : new Set(overview.courses.flatMap((course) => course.teachers.map((teacher) => teacher.id))).size}
                </strong>
              </div>
              <p>
                Atualizado em {formatDate(overview.synchronizedAt)}. O AcadIA não altera nenhum conteúdo no Google.
              </p>
            </section>

            {overview.courses.some((course) => course.teacherContactsRestricted) ? (
              <aside className="classroom-teacher-restriction" aria-label="Restrição institucional aos contatos">
                <span className="classroom-teacher-restriction-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 3 4.5 6v5.2c0 4.5 2.8 8 7.5 9.8 4.7-1.8 7.5-5.3 7.5-9.8V6z" />
                    <path d="M9.5 12h5M12 9.5v5" />
                  </svg>
                </span>
                <div>
                  <strong>Contatos protegidos pela política do IFPB</strong>
                  <p>
                    O Google autorizou a leitura, mas o domínio institucional recusou o acesso aos perfis dos docentes. Materiais, avisos e atividades continuam funcionando normalmente. A liberação dos e-mails depende da administração do Google Workspace do IFPB.
                  </p>
                </div>
              </aside>
            ) : null}

            {overview.courses.length === 0 ? (
              <section className="classroom-empty-state">
                <h2>Nenhuma turma ativa encontrada</h2>
                <p>Confira se esta conta do Google participa das turmas de {academicClassName}.</p>
                <ClassroomConnectButton reconnect />
              </section>
            ) : (
              <div className="classroom-course-list">
                {overview.courses.map((course) => {
                  const materials = overview.materials.filter(
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
            )}
          </>
        ) : null}

        <p className="classroom-privacy-note">
          A integração usa apenas permissões de leitura. Os contatos dos professores são consultados diretamente no Google e não são gravados no banco do AcadIA. Você pode revogar o acesso a qualquer momento na sua {" "}
          <Link href="https://myaccount.google.com/connections" target="_blank" rel="noreferrer">
            Conta Google
          </Link>.
        </p>
      </div>
    </ProtectedShell>
  );
}
