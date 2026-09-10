"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

import { updateNoticeChecklistAction } from "@/app/notice-actions";
import styles from "@/app/editais/notices.module.css";
import type {
  NoticeCategory,
  NoticeChecklistStateDTO,
  NoticeDTO,
  NoticeStatus,
} from "@/types/notices";

const categoryLabels: Record<NoticeCategory, string> = {
  assistance: "Assistência estudantil",
  research: "Pesquisa e inovação",
};

const statusLabels: Record<NoticeStatus, string> = {
  open: "Inscrições abertas",
  action: "Ação necessária",
  review: "Em andamento",
  result: "Resultado",
  active: "Em vigência",
  closed: "Encerrado",
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt-BR");
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

function ChecklistSubmitButton({ completed }: { completed: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      aria-pressed={completed}
      className={completed ? styles.checklistCompleted : undefined}
      disabled={pending}
      type="submit"
    >
      <span aria-hidden="true">{pending ? "…" : completed ? "✓" : ""}</span>
      <strong>{pending ? "Salvando" : completed ? "Concluído" : "Marcar"}</strong>
    </button>
  );
}

function NoticeChecklist({
  completedItems,
  notice,
}: {
  completedItems: string[];
  notice: NoticeDTO;
}) {
  const completedCount = notice.checklist.filter((item) => completedItems.includes(item.id)).length;
  const progress = Math.round((completedCount / notice.checklist.length) * 100);

  return (
    <section className={styles.checklist} aria-labelledby={`checklist-${notice.id}`}>
      <div className={styles.checklistHeading}>
        <div>
          <span>Seu acompanhamento</span>
          <h4 id={`checklist-${notice.id}`}>Checklist pessoal</h4>
        </div>
        <strong>{completedCount}/{notice.checklist.length}</strong>
      </div>
      <div className={styles.progressTrack} aria-label={`${progress}% do checklist concluído`}>
        <span style={{ width: `${progress}%` }} />
      </div>
      <ul>
        {notice.checklist.map((item) => {
          const completed = completedItems.includes(item.id);
          const action = updateNoticeChecklistAction.bind(null, notice.id, item.id, !completed);

          return (
            <li className={completed ? styles.completedItem : undefined} key={item.id}>
              <div>
                <strong>{item.label}</strong>
                {item.detail ? <span>{item.detail}</span> : null}
              </div>
              <form action={action}>
                <ChecklistSubmitButton completed={completed} />
              </form>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function NoticeCard({
  completedItems,
  notice,
}: {
  completedItems: string[];
  notice: NoticeDTO;
}) {
  const nextSchedule = notice.schedule.find((item) => item.highlighted);

  return (
    <article className={`${styles.noticeCard} ${styles[`status_${notice.status}`]}`}>
      <header className={styles.cardHeader}>
        <div className={styles.cardTopline}>
          <span className={styles.noticeNumber}>{notice.number}</span>
          <span className={`${styles.statusBadge} ${styles[`badge_${notice.status}`]}`}>
            {notice.statusLabel}
          </span>
        </div>
        <span className={styles.noticeCategory}>{categoryLabels[notice.category]}</span>
        <h2>{notice.title}</h2>
        <p>{notice.summary}</p>
      </header>

      <div className={styles.statusCallout}>
        <span aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3.5" y="5.5" width="17" height="15" rx="2" /><path d="M7.5 3v5M16.5 3v5M3.5 10h17" /></svg>
        </span>
        <div>
          <strong>{nextSchedule ? nextSchedule.label : notice.statusLabel}</strong>
          <p>{nextSchedule?.dateLabel ?? notice.statusDetail}</p>
        </div>
      </div>

      <div className={styles.quickFacts}>
        <div>
          <span>Quem deve olhar</span>
          <p>{notice.audience}</p>
        </div>
        <div>
          <span>O que oferece</span>
          <p>{notice.benefit}</p>
        </div>
      </div>

      <details className={styles.noticeDetails}>
        <summary>
          <span>Entender este edital</span>
          <strong>Requisitos, documentos e passo a passo</strong>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m7 9 5 5 5-5" /></svg>
        </summary>

        <div className={styles.detailsContent}>
          <div className={styles.infoGrid}>
            <section>
              <span className={styles.infoIcon} aria-hidden="true">1</span>
              <h3>Posso participar?</h3>
              <ul>{notice.eligibility.map((item) => <li key={item}>{item}</li>)}</ul>
            </section>
            <section>
              <span className={styles.infoIcon} aria-hidden="true">2</span>
              <h3>Documentos importantes</h3>
              <ul>{notice.documents.map((item) => <li key={item}>{item}</li>)}</ul>
            </section>
          </div>

          <section className={styles.stepsSection}>
            <div className={styles.sectionTitle}>
              <span>Roteiro simples</span>
              <h3>O que fazer agora</h3>
            </div>
            <ol>
              {notice.steps.map((step, index) => (
                <li key={step}><span>{index + 1}</span><p>{step}</p></li>
              ))}
            </ol>
          </section>

          <section className={styles.timeline} aria-labelledby={`timeline-${notice.id}`}>
            <div className={styles.sectionTitle}>
              <span>Cronograma</span>
              <h3 id={`timeline-${notice.id}`}>Datas que merecem atenção</h3>
            </div>
            <ol>
              {notice.schedule.map((item) => (
                <li className={item.highlighted ? styles.highlightedDate : undefined} key={`${item.label}-${item.startDate}`}>
                  <span aria-hidden="true" />
                  <div><strong>{item.label}</strong><time dateTime={item.startDate}>{item.dateLabel}</time></div>
                </li>
              ))}
            </ol>
          </section>

          <NoticeChecklist completedItems={completedItems} notice={notice} />

          <aside className={styles.caution}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 10.5V17M12 7.2v.2" /></svg>
            <p>{notice.caution}</p>
          </aside>
        </div>
      </details>

      <footer className={styles.cardFooter}>
        <div>
          <span>Publicado em {formatDate(notice.publishedAt)}</span>
          <span>Conferido em {formatDate(notice.verifiedAt)}</span>
        </div>
        <a href={notice.officialUrl} rel="noreferrer" target="_blank">
          Acessar edital oficial
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M14 5h5v5M19 5l-8 8M18 13v6H5V6h6" /></svg>
        </a>
      </footer>
    </article>
  );
}

export function NoticeDirectory({
  checklistState,
  notices,
}: {
  checklistState: NoticeChecklistStateDTO;
  notices: NoticeDTO[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<NoticeCategory | "all">("all");
  const [status, setStatus] = useState<NoticeStatus | "all">("all");

  const visibleNotices = useMemo(() => {
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    return notices.filter((notice) => {
      if (category !== "all" && notice.category !== category) return false;
      if (status !== "all" && notice.status !== status) return false;
      if (terms.length === 0) return true;

      const searchable = normalize([
        notice.number,
        notice.title,
        notice.summary,
        notice.audience,
        notice.benefit,
        ...notice.eligibility,
      ].join(" "));
      return terms.every((term) => searchable.includes(term));
    });
  }, [category, notices, query, status]);

  const availableStatuses = Array.from(new Set(notices.map((notice) => notice.status)));

  return (
    <>
      <section className={styles.filters} aria-labelledby="notice-filter-title">
        <div className={styles.filterHeading}>
          <div>
            <span>Busca guiada</span>
            <h2 id="notice-filter-title">Encontre o processo certo</h2>
          </div>
          <strong>{visibleNotices.length} {visibleNotices.length === 1 ? "edital" : "editais"}</strong>
        </div>

        <div className={styles.filterControls}>
          <label className={styles.searchControl}>
            <span className="sr-only">Pesquisar editais</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></svg>
            <input onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar por IVS, auxílio, bolsa..." type="search" value={query} />
          </label>
          <label>
            <span>Categoria</span>
            <select onChange={(event) => setCategory(event.target.value as NoticeCategory | "all")} value={category}>
              <option value="all">Todas</option>
              {(Object.entries(categoryLabels) as Array<[NoticeCategory, string]>).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
          </label>
          <label>
            <span>Situação</span>
            <select onChange={(event) => setStatus(event.target.value as NoticeStatus | "all")} value={status}>
              <option value="all">Todas</option>
              {availableStatuses.map((item) => <option key={item} value={item}>{statusLabels[item]}</option>)}
            </select>
          </label>
        </div>
      </section>

      {visibleNotices.length > 0 ? (
        <div className={styles.noticeList} aria-live="polite">
          {visibleNotices.map((notice) => (
            <NoticeCard
              completedItems={checklistState[notice.id] ?? []}
              key={notice.id}
              notice={notice}
            />
          ))}
        </div>
      ) : (
        <section className={styles.emptyState} aria-live="polite">
          <span aria-hidden="true">⌕</span>
          <h2>Nenhum edital corresponde aos filtros</h2>
          <p>Limpe a busca ou selecione outra categoria e situação.</p>
          <button onClick={() => { setQuery(""); setCategory("all"); setStatus("all"); }} type="button">Limpar filtros</button>
        </section>
      )}
    </>
  );
}
