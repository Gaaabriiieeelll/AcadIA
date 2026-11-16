"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { refreshCalendarFiltersAction, saveCalendarFiltersAction } from "@/app/calendar-filter-actions";
import { GOOGLE_CALENDAR_CATEGORIES, type GoogleCalendarCategory } from "@/lib/google-calendar-categories";
import type { CalendarVisibility } from "@/lib/google-calendar-filters";
import styles from "@/app/calendario/calendar.module.css";

type Feedback = { status: string; message: string };
export function CalendarCategoryFilters({ visibility, hasPermission, connected, pending: queued }: {
  visibility: CalendarVisibility; hasPermission: boolean; connected: boolean; pending: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const busy = useRef(false);
  const dirty = useRef(false);
  const lastRefresh = useRef(0);
  useEffect(() => {
    if (!hasPermission || !connected) return;
    const refresh = () => {
      if (document.visibilityState !== "visible" || busy.current || dirty.current || Date.now() - lastRefresh.current < 30_000) return;
      lastRefresh.current = Date.now();
      busy.current = true;
      startTransition(async () => {
        try { setFeedback(await refreshCalendarFiltersAction()); }
        catch { setFeedback({ status: "error", message: "Não foi possível atualizar os filtros. Tente novamente." }); }
        finally { busy.current = false; }
      });
    };
    refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [hasPermission, connected]);

  const run = (form?: FormData) => {
    if (busy.current) return;
    busy.current = true;
    startTransition(async () => {
      try {
        const result = form ? await saveCalendarFiltersAction(form) : await refreshCalendarFiltersAction();
        setFeedback(result);
        if (result.status !== "error") dirty.current = false;
      } catch { setFeedback({ status: "error", message: "Não foi possível salvar os filtros. Tente novamente." }); }
      finally { busy.current = false; }
    });
  };
  return (
    <section className={styles.categoryFilters} aria-label="Filtros do calendário">
      <h2>O que mostrar no calendário</h2>
      <p>Escolha as categorias. Ocultar uma categoria não exclui seus eventos.</p>
      <form action={(form) => run(form)}>
        <fieldset disabled={pending} key={JSON.stringify(visibility)} onChange={() => { dirty.current = true; }}>
          <legend>Categorias de eventos</legend>
          <input type="hidden" name="baseline" value={JSON.stringify(visibility)} />
          {(Object.keys(GOOGLE_CALENDAR_CATEGORIES) as GoogleCalendarCategory[]).map((category) => (
            <label key={category}>
              <input type="checkbox" name={category} defaultChecked={visibility[category]} />
              {GOOGLE_CALENDAR_CATEGORIES[category].name.replace("Conecta Campus · ", "")}
            </label>
          ))}
        </fieldset>
        <div className={styles.categoryFilterActions}>
          <button type="submit" className={styles.googleCalendarButton} disabled={pending}>{pending ? "Atualizando…" : "Aplicar filtros"}</button>
          {hasPermission && connected ? <button type="button" className={styles.googleCalendarButton} disabled={pending} onClick={() => run()}>Atualizar filtros do Google</button> : null}
        </div>
      </form>
      <p>{hasPermission
        ? "As mudanças feitas no Google são verificadas ao abrir esta página, ao voltar para esta aba ou ao atualizar os filtros. Alterações ainda não enviadas pelo site têm prioridade."
        : "Os filtros já funcionam no site. Para sincronizar a seleção nos dois sentidos, autorize o acesso à lista de agendas do Google."}</p>
      <small>Competições usam o filtro próprio desta página e não participam desta sincronização.</small>
      {(!hasPermission || feedback?.status === "permission-required") ? (
        <div>
          <p>O Google concede acesso à lista das agendas que você acompanha. O Conecta Campus usará esse acesso somente para consultar e alterar a seleção das suas cinco agendas do aplicativo.</p>
          <a className={styles.googleCalendarButton} href="/api/classroom/connect?target=calendar-filters">Ativar integração dos filtros</a>
        </div>
      ) : null}
      {queued ? <p>Há escolhas salvas no site aguardando envio ao Google.</p> : null}
      {feedback ? <p role={feedback.status === "error" ? "alert" : "status"}>{feedback.message}</p> : null}
    </section>
  );
}
