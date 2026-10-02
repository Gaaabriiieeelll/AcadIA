"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  createOpportunityAction,
  deleteOpportunityAction,
  setOpportunityFavoriteAction,
  updateOpportunityAction,
} from "@/app/opportunity-actions";
import styles from "@/app/oportunidades/opportunities.module.css";
import { courseMentioned, filterOpportunities, opportunityDeadlineState } from "@/lib/opportunity-utils";
import type {
  OpportunityDTO,
  OpportunityFormState,
  OpportunityKind,
  OpportunityModality,
} from "@/types/opportunities";

const kindLabels: Record<OpportunityKind, string> = {
  internship: "Estágio",
  job: "Emprego",
  trainee: "Trainee",
  academic: "Oportunidade acadêmica",
};

const modalityLabels: Record<OpportunityModality, string> = {
  unspecified: "Não informada",
  onsite: "Presencial",
  hybrid: "Híbrida",
  remote: "Remota",
};

const initialState: OpportunityFormState = { status: "idle" };

function formatDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

function FieldError({ field, state }: { field: keyof OpportunityDTO; state: OpportunityFormState }) {
  const message = state.fieldErrors?.[field as keyof NonNullable<OpportunityFormState["fieldErrors"]>]?.[0];
  return message ? <small className={styles.fieldError}>{message}</small> : null;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <button className={styles.submitButton} disabled={pending} type="submit">{pending ? "Salvando…" : label}</button>;
}

function OpportunityForm({ opportunity }: { opportunity?: OpportunityDTO }) {
  const action = opportunity
    ? updateOpportunityAction.bind(null, opportunity.id)
    : createOpportunityAction;
  const [state, formAction] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success" && !opportunity) formRef.current?.reset();
  }, [state.status, opportunity]);

  return (
    <form action={formAction} className={styles.opportunityForm} ref={formRef}>
      {state.message ? (
        <p className={state.status === "error" ? styles.formError : styles.formSuccess}
          role={state.status === "error" ? "alert" : "status"}>{state.message}</p>
      ) : null}
      <div className={styles.formGrid}>
        <label>
          <span>Nome da oportunidade</span>
          <input defaultValue={opportunity?.title} maxLength={140} name="title" required />
          <FieldError field="title" state={state} />
        </label>
        <label>
          <span>Instituição ou empresa</span>
          <input defaultValue={opportunity?.organization} maxLength={120} name="organization" required />
          <FieldError field="organization" state={state} />
        </label>
        <label>
          <span>Tipo</span>
          <select defaultValue={opportunity?.kind ?? "internship"} name="kind">
            {Object.entries(kindLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <FieldError field="kind" state={state} />
        </label>
        <label>
          <span>Modalidade</span>
          <select defaultValue={opportunity?.modality ?? "unspecified"} name="modality">
            {Object.entries(modalityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <FieldError field="modality" state={state} />
        </label>
        <label>
          <span>Cursos mencionados no anúncio</span>
          <input defaultValue={opportunity?.acceptedCourses ?? ""} maxLength={250} name="acceptedCourses" placeholder="Ex.: Mecânica, Eletrônica" />
          <FieldError field="acceptedCourses" state={state} />
        </label>
        <label>
          <span>Local</span>
          <input defaultValue={opportunity?.location ?? ""} maxLength={120} name="location" placeholder="Ex.: João Pessoa" />
          <FieldError field="location" state={state} />
        </label>
        <label>
          <span>Prazo de inscrição</span>
          <input defaultValue={opportunity?.deadline ?? ""} name="deadline" type="date" />
          <FieldError field="deadline" state={state} />
        </label>
        <label>
          <span>Link do anúncio original</span>
          <input defaultValue={opportunity?.sourceUrl} maxLength={2000} name="sourceUrl" placeholder="https://..." required type="url" />
          <FieldError field="sourceUrl" state={state} />
        </label>
        <label className={styles.wideField}>
          <span>Requisitos</span>
          <textarea defaultValue={opportunity?.requirements ?? ""} maxLength={1500} name="requirements" rows={2} />
          <FieldError field="requirements" state={state} />
        </label>
        <label className={styles.wideField}>
          <span>Documentos necessários</span>
          <textarea defaultValue={opportunity?.documents ?? ""} maxLength={1500} name="documents" rows={2} />
          <FieldError field="documents" state={state} />
        </label>
        <label className={styles.wideField}>
          <span>Suas anotações</span>
          <textarea defaultValue={opportunity?.notes ?? ""} maxLength={1000} name="notes" rows={2} />
          <FieldError field="notes" state={state} />
        </label>
      </div>
      <label className={styles.reminderChoice}>
        <input defaultChecked={opportunity?.hasReminder ?? true} name="reminder" type="checkbox" />
        <span>Colocar o prazo no calendário quando houver uma data</span>
      </label>
      <SubmitButton label={opportunity ? "Salvar alterações" : "Salvar oportunidade"} />
    </form>
  );
}

export function OpportunityBoard({
  opportunities,
  profileCourse,
  today,
}: {
  opportunities: OpportunityDTO[];
  profileCourse: string;
  today: string;
}) {
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState("");
  const [modality, setModality] = useState("");
  const [location, setLocation] = useState("");
  const [courseOnly, setCourseOnly] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [hidePast, setHidePast] = useState(false);

  const visible = useMemo(() => filterOpportunities(opportunities, {
    search, kind, modality, location, courseOnly, favoritesOnly, hidePast,
  }, profileCourse, today), [
    opportunities, search, kind, modality, location, courseOnly, favoritesOnly, hidePast, profileCourse, today,
  ]);

  return (
    <section className={styles.board} aria-labelledby="saved-opportunities-title">
      <div className={styles.sectionHeading}>
        <div>
          <span className={styles.eyebrow}>Acompanhamento pessoal</span>
          <h2 id="saved-opportunities-title">Suas oportunidades salvas</h2>
        </div>
        <p>{opportunities.length} oportunidade(s) no seu perfil</p>
      </div>
      <p className={styles.boardExplanation}>
        Ao encontrar uma vaga, cadastre o link e os dados importantes. As informações são suas anotações;
        confira sempre os requisitos e possíveis alterações no anúncio original.
      </p>

      <details className={styles.createDisclosure}>
        <summary>Adicionar oportunidade</summary>
        <OpportunityForm />
      </details>

      {opportunities.length > 0 ? (
        <>
          <div className={styles.filters} role="group" aria-label="Filtrar oportunidades salvas">
            <label><span>Pesquisar</span><input onChange={(event) => setSearch(event.target.value)} placeholder="Nome, empresa ou requisito" type="search" value={search} /></label>
            <label><span>Tipo</span><select onChange={(event) => setKind(event.target.value)} value={kind}><option value="">Todos</option>{Object.entries(kindLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label><span>Modalidade</span><select onChange={(event) => setModality(event.target.value)} value={modality}><option value="">Todas</option>{Object.entries(modalityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label><span>Local</span><input onChange={(event) => setLocation(event.target.value)} placeholder="Cidade ou região" type="search" value={location} /></label>
            <label className={styles.filterCheck}><input checked={courseOnly} onChange={(event) => setCourseOnly(event.target.checked)} type="checkbox" />Curso citado</label>
            <label className={styles.filterCheck}><input checked={favoritesOnly} onChange={(event) => setFavoritesOnly(event.target.checked)} type="checkbox" />Favoritas</label>
            <label className={styles.filterCheck}><input checked={hidePast} onChange={(event) => setHidePast(event.target.checked)} type="checkbox" />Ocultar prazos passados</label>
          </div>
          <p aria-live="polite" className={styles.resultCount}>{visible.length} resultado(s) com os filtros atuais.</p>
          {visible.length > 0 ? (
            <div className={styles.savedGrid}>
              {visible.map((opportunity) => {
                const deadlineState = opportunityDeadlineState(opportunity.deadline, today);
                const courseIsMentioned = courseMentioned(opportunity.acceptedCourses, profileCourse);
                return (
                  <article className={styles.savedCard} key={opportunity.id}>
                    <div className={styles.savedTop}>
                      <span className={styles.kindBadge}>{kindLabels[opportunity.kind]}</span>
                      <form action={setOpportunityFavoriteAction.bind(null, opportunity.id, !opportunity.favorite)}>
                        <button aria-label={opportunity.favorite ? `Remover ${opportunity.title} dos favoritos` : `Favoritar ${opportunity.title}`}
                          aria-pressed={opportunity.favorite} className={styles.favoriteButton} type="submit">
                          {opportunity.favorite ? "★ Favorita" : "☆ Favoritar"}
                        </button>
                      </form>
                    </div>
                    <h3>{opportunity.title}</h3>
                    <p className={styles.organization}>{opportunity.organization}</p>
                    <div className={styles.savedMeta}>
                      <span>{modalityLabels[opportunity.modality]}</span>
                      {opportunity.location ? <span>{opportunity.location}</span> : null}
                      <span>{opportunity.deadline ? `${deadlineState === "past" ? "Prazo informado passou" : "Prazo informado"}: ${formatDate(opportunity.deadline)}` : "Prazo não informado"}</span>
                      {opportunity.hasReminder ? <span>Prazo no calendário</span> : null}
                    </div>
                    <p className={styles.matchNote}>
                      {courseIsMentioned
                        ? `Seu curso (${profileCourse}) aparece entre os cursos anotados. Confirme as demais exigências no anúncio.`
                        : opportunity.acceptedCourses
                          ? `Cursos anotados: ${opportunity.acceptedCourses}. Confira se seu curso é aceito.`
                          : "Cursos aceitos não informados. Confira no anúncio."}
                    </p>
                    {opportunity.requirements ? <p><strong>Requisitos:</strong> {opportunity.requirements}</p> : null}
                    {opportunity.documents ? <p><strong>Documentos:</strong> {opportunity.documents}</p> : null}
                    {opportunity.notes ? <p><strong>Anotações:</strong> {opportunity.notes}</p> : null}
                    <a className={styles.sourceLink} href={opportunity.sourceUrl} rel="noreferrer" target="_blank">Abrir anúncio original ↗</a>
                    <div className={styles.savedActions}>
                      <details className={styles.editDisclosure}>
                        <summary>Editar</summary>
                        <OpportunityForm opportunity={opportunity} />
                      </details>
                      <form action={deleteOpportunityAction.bind(null, opportunity.id)}
                        onSubmit={(event) => { if (!window.confirm(`Excluir “${opportunity.title}” da sua lista?`)) event.preventDefault(); }}>
                        <button className={styles.deleteButton} type="submit">Excluir</button>
                      </form>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : <p className={styles.emptyState}>Nenhuma oportunidade corresponde aos filtros.</p>}
        </>
      ) : <p className={styles.emptyState}>Você ainda não salvou uma oportunidade. Use os canais oficiais abaixo para começar.</p>}
    </section>
  );
}
