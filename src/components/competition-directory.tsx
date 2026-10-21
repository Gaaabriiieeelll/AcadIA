"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { saveCompetitionSubscription } from "@/app/olimpiadas/actions";
import { competitionStatusLabels, filterCompetitions, formatCompetitionDate, formatCompetitionStage, getCompetitionStatus, hasConfirmedStages, stageAccessLabels } from "@/lib/competitions";
import type { Competition, CompetitionFact, CompetitionSubscription } from "@/types/competitions";
import styles from "@/app/olimpiadas/competitions.module.css";

function Fact({ label, value, competition }: { label: string; value: CompetitionFact; competition: Competition }) {
  return <div><dt>{label}</dt><dd>{value.text}{value.sourceIds.map((id) => {
    const source = competition.sources.find((s) => s.id === id);
    return source ? <a className={styles.reference} key={id} href={source.url} target="_blank" rel="noreferrer" aria-label={`Fonte de ${label}: ${source.label}`}> ↗</a> : null;
  })}</dd></div>;
}
function FollowForm({ competition, subscription }: { competition: Competition; subscription?: CompetitionSubscription }) {
  const [following, setFollowing] = useState(Boolean(subscription));
  const [reminders, setReminders] = useState(subscription?.remindersEnabled ?? false);
  const [qualified, setQualified] = useState(subscription?.includeQualified ?? false);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  return <form className={styles.follow} aria-label={`Acompanhar ${competition.acronym}`} onSubmit={(event) => {
    event.preventDefault();
    setMessage("");
    startTransition(async () => {
      try {
        const result = await saveCompetitionSubscription({ competitionId: competition.id, following, remindersEnabled: following && reminders, includeQualified: following && qualified });
        setMessage(result.message);
      } catch { setMessage("Não foi possível salvar. Confira sua sessão e tente novamente."); }
    });
  }}>
    <fieldset disabled={pending}>
      <legend>Acompanhamento de {competition.acronym}</legend>
      <label><input type="checkbox" checked={following} onChange={(e) => setFollowing(e.target.checked)} /> Acompanhar esta edição</label>
      <label><input type="checkbox" checked={reminders} disabled={!following} onChange={(e) => setReminders(e.target.checked)} /> Ativar lembretes nas minhas preferências de calendário</label>
      {competition.stages.some((s) => s.access === "qualified") ? <label><input type="checkbox" checked={qualified} disabled={!following || !reminders} onChange={(e) => setQualified(e.target.checked)} /> Também lembrar etapas para classificados (confirme sua convocação)</label> : null}
      <button type="submit">{pending ? "Salvando…" : "Salvar acompanhamento"}</button>
    </fieldset>
    {!hasConfirmedStages(competition) ? <small>Lembretes só serão gerados quando houver etapas confirmadas nesta edição.</small> : null}
    <p role="status" aria-live="polite">{message}</p>
  </form>;
}
function CompetitionCard({ competition: c, subscription, now }: { competition: Competition; subscription?: CompetitionSubscription; now: Date }) {
  const confirmed = hasConfirmedStages(c);
  const status = getCompetitionStatus(c, now);
  return <article id={c.id} className={styles.card}>
    <header><div className={styles.tags}><span>{c.area}</span><span>{c.edition}</span><span data-status={status}>{competitionStatusLabels[status]}</span></div><h3>{c.acronym}</h3><p>{c.name}</p></header>
    <p>{c.description}</p>
    <p className={styles.meta}>{c.campuses.join(" · ")} · {c.levels.join(" / ")}</p>
    <p>{c.support.text}</p>
    {c.pending.length > 0 ? <div className={styles.pending}><strong>Pendências e cuidados</strong><ul>{c.pending.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}
    <details>
      <summary>Regras, datas e fontes de {c.acronym}</summary>
      <dl className={styles.facts}>
        <Fact label="Público elegível" value={c.eligibility} competition={c} />
        <Fact label="Participação" value={c.participation} competition={c} />
        <Fact label="Como se inscrever" value={c.registration} competition={c} />
        <Fact label="Preparação / responsável" value={c.support} competition={c} />
        <Fact label="Custo" value={c.cost ?? { text: "Não confirmado nesta conferência. Consulte o organizador.", sourceIds: [] }} competition={c} />
      </dl>
      {confirmed ? <ol className={styles.stages}>{c.stages.map((stage) => <li key={stage.id}>
        <strong>{stage.title}</strong><span>{formatCompetitionStage(stage)}</span><span>{stageAccessLabels[stage.access]} · {stage.location}</span>
        <a href={c.sources.find((s) => s.id === stage.sourceId)!.url} target="_blank" rel="noreferrer">Fonte da etapa ↗</a>
        <Link href={`/calendario?mes=${stage.startDate.slice(0, 7)}&data=${stage.startDate}&visao=dia`}>Ver no calendário</Link>
      </li>)}</ol> : <p>Sem etapas liberadas para o calendário. Nenhuma data foi estimada.</p>}
      <div className={styles.links}>
        {c.registrationUrl ? <a href={c.registrationUrl} target="_blank" rel="noreferrer">Portal de participação (confira a situação) ↗</a> : null}
        {c.regulationUrl ? <a href={c.regulationUrl} target="_blank" rel="noreferrer">Regulamento / documentos ↗</a> : null}
      </div>
      <h4>Fontes oficiais consultadas</h4>
      <ul>{c.sources.map((source) => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a> <small>Conferida em {formatCompetitionDate(source.checkedAt)}</small></li>)}</ul>
    </details>
    <FollowForm competition={c} subscription={subscription} />
    <small>Última conferência: {formatCompetitionDate(c.checkedAt)} · horários em America/Sao_Paulo.</small>
  </article>;
}
export function CompetitionDirectory({ catalog, subscriptions, nowIso }: { catalog: Competition[]; subscriptions: CompetitionSubscription[]; nowIso: string }) {
  const [currentIso, setCurrentIso] = useState(nowIso);
  useEffect(() => {
    const refresh = () => setCurrentIso(new Date().toISOString());
    const timer = window.setInterval(refresh, 30_000);
    window.addEventListener("focus", refresh);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, []);
  const [query, setQuery] = useState("");
  const [area, setArea] = useState("");
  const [campus, setCampus] = useState("");
  const [level, setLevel] = useState("");
  const [status, setStatus] = useState("");
  const now = new Date(currentIso);
  const filtered = filterCompetitions(catalog, { query, area, campus, level, status }, now);
  const options = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b, "pt-BR"));
  return <>
    <div className={styles.filters} role="search" aria-label="Filtrar competições">
      <label className={styles.search}>Buscar competição<input type="search" placeholder="Nome, sigla, grupo ou área" value={query} onChange={(e) => setQuery(e.target.value)} /></label>
      <label>Área<select aria-label="Área" value={area} onChange={(e) => setArea(e.target.value)}><option value="">Todas as áreas</option>{options(catalog.map((c) => c.area)).map((v) => <option key={v}>{v}</option>)}</select></label>
      <label>Campus<select aria-label="Campus" value={campus} onChange={(e) => setCampus(e.target.value)}><option value="">Todos os campi</option>{options(catalog.flatMap((c) => c.campuses)).map((v) => <option key={v}>{v}</option>)}</select></label>
      <label>Nível de ensino<select aria-label="Nível de ensino" value={level} onChange={(e) => setLevel(e.target.value)}><option value="">Todos os níveis</option>{options(catalog.flatMap((c) => c.levels)).map((v) => <option key={v}>{v}</option>)}</select></label>
      <label>Situação<select aria-label="Situação" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Todas as situações</option>{Object.entries(competitionStatusLabels).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label>
      <button type="button" onClick={() => { setQuery(""); setArea(""); setCampus(""); setLevel(""); setStatus(""); }}>Limpar filtros</button>
    </div>
    <p role="status" aria-live="polite">{filtered.length} competição(ões) encontrada(s)</p>
    {[true, false].map((confirmed) => {
      const items = filtered.filter((c) => hasConfirmedStages(c) === confirmed);
      return <section key={String(confirmed)} aria-labelledby={confirmed ? "confirmed-title" : "watch-title"} className={styles.section}>
        <h2 id={confirmed ? "confirmed-title" : "watch-title"}>{confirmed ? "Com datas confirmadas" : "Oportunidades a acompanhar"} <span>({items.length})</span></h2>
        <p>{confirmed ? "Inclui etapas passadas e futuras. Cada etapa informa se é para inscritos ou classificados; confira a situação antes de agir." : "Há pendências de datas, edição, regras ou participação local. Estas oportunidades não geram eventos."}</p>
        {items.length ? <div className={styles.grid}>{items.map((c) => <CompetitionCard key={c.id} competition={c} subscription={subscriptions.find((s) => s.competitionId === c.id)} now={now} />)}</div> : <p className={styles.empty}>Nenhuma competição corresponde aos filtros nesta seção.</p>}
      </section>;
    })}
  </>;
}
