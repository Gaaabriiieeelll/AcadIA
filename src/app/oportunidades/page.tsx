import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

import { OpportunityBoard } from "@/components/opportunity-board";
import { ProtectedShell } from "@/components/protected-shell";
import { getCurrentAcademicProfile } from "@/data/academic-profile";
import { getOfficialNotices } from "@/data/notices";
import { getCurrentOpportunities } from "@/data/opportunities";
import { authOptions } from "@/lib/auth";

import styles from "./opportunities.module.css";

export const metadata: Metadata = {
  title: "Estágios e oportunidades",
};

const officialSources = [
  {
    title: "Coordenação de Estágios",
    description: "Orientações, documentos, notícias e contato da equipe do Campus João Pessoa.",
    href: "https://www.ifpb.edu.br/campus/joaopessoa/ensino/estagio",
    linkLabel: "Abrir a página da Coordenação",
  },
  {
    title: "Vagas de estágio",
    description: "Arquivo público de vagas divulgadas pelo campus. Confira a data de cada publicação.",
    href: "https://www.ifpb.edu.br/campus/joaopessoa/ensino/estagio/vagas-de-estagio",
    linkLabel: "Consultar vagas de estágio",
  },
  {
    title: "Vagas de emprego",
    description: "Publicações de emprego reunidas no portal do campus; algumas são antigas.",
    href: "https://www.ifpb.edu.br/campus/joaopessoa/ensino/estagio/vagas-de-emprego",
    linkLabel: "Consultar vagas de emprego",
  },
  {
    title: "SUAP",
    description: "Acesse os avisos e processos disponíveis na sua conta institucional.",
    href: "https://suap.ifpb.edu.br/",
    linkLabel: "Abrir o SUAP",
  },
] as const;

function formatDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

function todayInSaoPaulo() {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export default async function OpportunitiesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const [profile, opportunities] = await Promise.all([
    getCurrentAcademicProfile(),
    getCurrentOpportunities(),
  ]);
  if (!profile) redirect("/onboarding");

  const academicOpportunities = getOfficialNotices()
    .filter((notice) => notice.category === "research" || notice.category === "opportunity")
    .sort((first, second) => second.publishedAt.localeCompare(first.publishedAt));

  return (
    <ProtectedShell active="opportunities" user={session.user}>
      <div className={`protected-main ${styles.pageMain}`}>
        <span className="protected-kicker">Seu próximo passo</span>
        <h1>Estágios e oportunidades</h1>
        <p className="protected-lead">
          Encontre os canais oficiais, acompanhe seleções acadêmicas e organize os prazos que interessam a você.
        </p>

        <section className={styles.intro} aria-labelledby="opportunities-intro-title">
          <div>
            <span className={styles.eyebrow}>Campus João Pessoa</span>
            <h2 id="opportunities-intro-title">Comece pelo seu curso</h2>
            <p>
              Seu perfil informa <strong>{profile.course}</strong>. Antes de se candidatar,
              confira no anúncio oficial o curso aceito, o período, a modalidade, o local,
              os documentos e a data limite. O Conecta Campus ainda não verifica esses requisitos automaticamente.
            </p>
          </div>
          <div className={styles.profileBadge}>
            <span>Seu perfil</span>
            <strong>{profile.course}</strong>
            <small>{profile.academicStage}</small>
          </div>
        </section>

        <OpportunityBoard opportunities={opportunities} profileCourse={profile.course} today={todayInSaoPaulo()} />

        <section className={styles.sourceSection} aria-labelledby="opportunities-sources-title">
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.eyebrow}>Onde procurar</span>
              <h2 id="opportunities-sources-title">Fontes oficiais</h2>
            </div>
            <p>Confira sempre a data e as instruções de candidatura na página de origem.</p>
          </div>
          <div className={styles.sourceGrid}>
            {officialSources.map((source) => (
              <article className={styles.sourceCard} key={source.href}>
                <h3>{source.title}</h3>
                <p>{source.description}</p>
                <a href={source.href} rel="noreferrer" target="_blank">
                  {source.linkLabel} ↗
                </a>
              </article>
            ))}
          </div>
          <p className={styles.verificationNote}>
            Na conferência de 02/10/2026, o arquivo público de vagas de estágio do campus
            listava anos até 2023. Por isso, estas páginas são caminhos de consulta;
            não representam vagas abertas confirmadas pelo Conecta Campus.
          </p>
        </section>

        <section className={styles.noticeSection} aria-labelledby="opportunities-notices-title">
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.eyebrow}>Também no Conecta Campus</span>
              <h2 id="opportunities-notices-title">Oportunidades acadêmicas acompanhadas</h2>
            </div>
            <Link href="/editais">Ver todos os editais →</Link>
          </div>
          {academicOpportunities.length > 0 ? (
            <div className={styles.noticeGrid}>
              {academicOpportunities.map((notice) => (
                <article className={styles.noticeCard} key={notice.id}>
                  <div className={styles.noticeMeta}>
                    <span>{notice.statusLabel}</span>
                    <time dateTime={notice.publishedAt}>Publicado em {formatDate(notice.publishedAt)}</time>
                  </div>
                  <h3>{notice.title}</h3>
                  <p>{notice.summary}</p>
                  <p className={styles.statusDetail}>{notice.statusDetail}</p>
                  <a href={notice.officialUrl} rel="noreferrer" target="_blank">
                    Conferir publicação oficial ↗
                  </a>
                </article>
              ))}
            </div>
          ) : (
            <p className={styles.emptyState}>Ainda não há editais de oportunidade acompanhados.</p>
          )}
        </section>

        <aside className={styles.nextSteps} aria-labelledby="opportunities-next-title">
          <div>
            <span className={styles.eyebrow}>Achou uma vaga?</span>
            <h2 id="opportunities-next-title">Guarde a oportunidade e o prazo</h2>
            <p>
              Use o formulário acima para salvar a vaga e colocar o prazo no calendário. Consulte a Coordenação de Estágios
              se precisar de orientação sobre os documentos ou a formalização.
            </p>
          </div>
          <div className={styles.nextActions}>
            <Link href="/calendario">Adicionar prazo ao calendário</Link>
            <a href="mailto:coejp@ifpb.edu.br">Escrever à Coordenação</a>
          </div>
        </aside>
      </div>
    </ProtectedShell>
  );
}
