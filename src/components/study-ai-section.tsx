import Image from "next/image";
import Link from "next/link";

import { ClassroomConnectButton } from "@/components/classroom-connect-button";
import { GradeValue } from "@/components/grade-value";
import { AiConsentControl } from "@/components/privacy-controls";
import { StudyAiChat } from "@/components/study-ai-chat";
import styles from "@/app/recomendacoes/recommendations.module.css";
import type {
  StudyRecommendationOverviewDTO,
  StudyVideoRecommendationDTO,
} from "@/types/study-recommendations";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

function RecommendationCard({ recommendation }: { recommendation: StudyVideoRecommendationDTO }) {
  return (
    <article className={styles.recommendationCard}>
      <a
        aria-label={`Assistir ${recommendation.videoTitle} no YouTube`}
        className={styles.thumbnailLink}
        href={recommendation.videoUrl}
        rel="noreferrer"
        target="_blank"
      >
        <Image
          alt=""
          height={360}
          sizes="(max-width: 720px) 100vw, (max-width: 1180px) 50vw, 33vw"
          src={recommendation.thumbnailUrl}
          width={640}
        />
        <span className={styles.playIcon} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="m9 7 8 5-8 5z" /></svg>
        </span>
      </a>

      <div className={styles.cardBody}>
        <div className={styles.subjectRow}>
          <span>
            <i style={{ backgroundColor: recommendation.subjectColor }} />
            {recommendation.subjectName}
          </span>
          <div>
            <small>Média</small>
            <GradeValue minimumFractionDigits={1} value={recommendation.averageScore} />
          </div>
        </div>

        <span className={styles.topicLabel}>Assunto recomendado</span>
        <h2>{recommendation.topic}</h2>
        <p className={styles.rationale}>{recommendation.rationale}</p>

        <div className={styles.classroomSource}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M6 3.5h8l4 4v13H6z" />
            <path d="M14 3.5v4h4M9 12h6M9 16h6" />
          </svg>
          <div>
            <small>Identificado no Classroom</small>
            <strong>{recommendation.sourceMaterialTitle}</strong>
          </div>
        </div>

        <div className={styles.videoMeta}>
          <div>
            <span>Vídeo sugerido</span>
            <strong>{recommendation.videoTitle}</strong>
            <small>{recommendation.channelTitle}</small>
          </div>
          <a href={recommendation.videoUrl} rel="noreferrer" target="_blank">
            Assistir
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M5 12h14M14 7l5 5-5 5" />
            </svg>
          </a>
        </div>
      </div>
    </article>
  );
}

export function StudyAiSection({ overview }: { overview: StudyRecommendationOverviewDTO }) {
  const readyForChat = overview.classroomConnected
    && overview.aiConsentGranted
    && overview.openAIConfigured;

  return (
    <section className={styles.embeddedAiSection} id="bate-papo-ia" aria-labelledby="study-ai-title">
      <header className={styles.embeddedAiHeading}>
        <span>Orientação personalizada</span>
        <h2 id="study-ai-title">Bate-papo com a IA</h2>
        <p>
          Converse sobre suas notas, descubra o que priorizar e peça videoaulas relacionadas aos conteúdos do Google Sala de Aula.
        </p>
      </header>

      <div className={styles.aiWorkspace}>
        <StudyAiChat
          classroomConnected={overview.classroomConnected}
          aiConsentGranted={overview.aiConsentGranted}
          openAIConfigured={overview.openAIConfigured}
          youtubeConfigured={overview.youtubeConfigured}
        />

        <aside className={styles.contextPanel} aria-labelledby="context-title">
          <div className={styles.contextHeading}>
            <div>
              <span>Contexto da conversa</span>
              <h2 id="context-title">Fontes conectadas</h2>
            </div>
            <strong className={readyForChat ? styles.readyBadge : styles.pendingBadge}>
              {readyForChat ? "Pronto" : "Pendente"}
            </strong>
          </div>

          <div className={styles.contextList}>
            <article>
              <span className={overview.classroomConnected ? styles.sourceReady : styles.sourcePending}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M4 19.5V6a2 2 0 0 1 2-2h12v15.5H6A2 2 0 0 0 4 21.5" />
                  <path d="M8 8h8M8 12h6" />
                </svg>
              </span>
              <div>
                <strong>Google Sala de Aula</strong>
                <small>{overview.classroomConnected ? "Conteúdos disponíveis" : "Conexão necessária"}</small>
              </div>
              {overview.classroomConnected ? <i>Ativo</i> : <ClassroomConnectButton />}
            </article>

            <article>
              <span className={overview.openAIConfigured ? styles.sourceReady : styles.sourcePending}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="m12 3 1.3 3.7L17 8l-3.7 1.3L12 13l-1.3-3.7L7 8l3.7-1.3z" />
                  <path d="M5 16v4h14v-4" />
                </svg>
              </span>
              <div>
                <strong>OpenAI</strong>
                <small>{overview.openAIConfigured ? "Conversa disponível" : "Chave não configurada"}</small>
              </div>
              <i>{overview.openAIConfigured ? "Ativa" : "Pendente"}</i>
            </article>

            <article>
              <span className={overview.aiConsentGranted ? styles.sourceReady : styles.sourcePending}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M12 3 5 6v5c0 4.6 2.7 8.2 7 10 4.3-1.8 7-5.4 7-10V6z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </span>
              <div>
                <strong>Autorização de dados</strong>
                <small>{overview.aiConsentGranted ? "Consentimento registrado" : "Consentimento necessário"}</small>
              </div>
              <i>{overview.aiConsentGranted ? "Ativa" : "Pendente"}</i>
            </article>

            <article>
              <span className={overview.youtubeConfigured ? styles.sourceReady : styles.sourcePending}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <rect x="3" y="6" width="18" height="12" rx="3" />
                  <path d="m10 9 5 3-5 3z" />
                </svg>
              </span>
              <div>
                <strong>YouTube</strong>
                <small>{overview.youtubeConfigured ? "Videoaulas disponíveis" : "Busca indisponível"}</small>
              </div>
              <i>{overview.youtubeConfigured ? "Ativo" : "Pendente"}</i>
            </article>
          </div>

          <div className={styles.privacyNote}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <rect x="5" y="10" width="14" height="10" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
            <p>
              <strong>Uso informado</strong> A análise envia à OpenAI nomes de disciplinas,
              notas e conteúdo textual do Classroom. E-mail, matrícula, telefone e tokens
              de acesso não são enviados, e a opção de armazenamento fica desativada.
            </p>
          </div>

          <div className={styles.consentPanel}>
            <AiConsentControl granted={overview.aiConsentGranted} />
          </div>
        </aside>
      </div>

      {overview.recommendations.length > 0 ? (
        <section className={styles.resultsSection} aria-labelledby="results-title">
          <div className={styles.sectionHeading}>
            <div>
              <span>Selecionados anteriormente</span>
              <h2 id="results-title">Sua biblioteca de videoaulas</h2>
              <p>
                Conteúdos já separados para revisão
                {overview.generatedAt ? ` · atualizados em ${formatDate(overview.generatedAt)}` : ""}.
              </p>
            </div>
            <Link href="/materiais">Revisar materiais</Link>
          </div>
          <div className={styles.recommendationGrid}>
            {overview.recommendations.map((recommendation) => (
              <RecommendationCard key={recommendation.id} recommendation={recommendation} />
            ))}
          </div>
        </section>
      ) : (
        <section className={styles.emptyState}>
          <span aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 19.5V6a2 2 0 0 1 2-2h12v15.5H6A2 2 0 0 0 4 21.5" />
              <path d="M8 8h8M8 12h6M8 16h4" />
            </svg>
          </span>
          <div>
            <h2>{readyForChat ? "Comece uma conversa" : "Conclua a conexão e a autorização"}</h2>
            <p>
              {readyForChat
                ? "Peça à AcadIA para recomendar videoaulas ou identificar quais conteúdos merecem atenção."
                : "Quando o Classroom, a OpenAI e sua autorização estiverem prontos, o bate-papo será liberado."}
            </p>
          </div>
        </section>
      )}

      <footer className={styles.methodNote}>
        <strong>Orientação importante</strong>
        <p>
          Os vídeos são apoio para revisão e não substituem as orientações dos professores ou os materiais oficiais. Você continua decidindo o que assistir e quando estudar.
        </p>
      </footer>
    </section>
  );
}
