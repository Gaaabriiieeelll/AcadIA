"use client";

import { useActionState } from "react";

import { syncGoogleCalendarAction } from "@/app/calendar-event-actions";
import styles from "@/app/calendario/calendar.module.css";
import type {
  GoogleCalendarStatusDTO,
  GoogleCalendarSyncFormState,
} from "@/types/google-calendar";

const initialState: GoogleCalendarSyncFormState = { status: "idle" };

function lastSyncLabel(lastSyncedAt: string | null) {
  if (!lastSyncedAt) return null;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(lastSyncedAt));
}

export function GoogleCalendarControl({
  accountEmail,
  connectionMessage,
  status,
}: {
  accountEmail: string | null;
  connectionMessage: string | null;
  status: GoogleCalendarStatusDTO;
}) {
  const [state, action, pending] = useActionState(syncGoogleCalendarAction, initialState);
  const lastSync = lastSyncLabel(status.lastSyncedAt);
  const needsPermission = status.status === "permission-required";

  return (
    <aside className={styles.googleCalendarNotice} aria-label="Integração com o Google Agenda">
      <span className={styles.googleCalendarIcon} aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path fill="#4285F4" d="M6 2h12a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4Z" />
          <path fill="#fff" d="M7 6h10v12H7z" />
          <path fill="#34A853" d="M7 14h5v4H7z" />
          <path fill="#FBBC04" d="M12 14h5v4h-5z" />
          <path fill="#EA4335" d="M7 6h5v4H7z" />
          <path fill="#fff" d="M12 10h5v4h-5z" />
          <path fill="#4285F4" d="M12 6h5v4h-5zM7 10h5v4H7z" />
        </svg>
      </span>

      <div className={styles.googleCalendarCopy}>
        <strong>
          {status.status === "connected"
            ? `${status.calendarName} conectado`
            : "Levar o AcadIA para o Google Agenda"}
        </strong>
        <p>
          {needsPermission
            ? "Autorize a integração usando seu e-mail @academico.ifpb.edu.br."
            : status.status === "error"
              ? status.lastError
              : status.status === "connected"
                ? `${status.eventCount} evento(s) no calendário de ${accountEmail ?? "sua conta institucional"}${lastSync ? ` · atualizado em ${lastSync}` : ""}.`
                : `Crie um calendário privado do AcadIA em ${accountEmail ?? "sua conta institucional"}.`}
        </p>
        <small>
          Inclui planejamento anual, eventos pessoais e atividades da Agenda e do Classroom.
        </small>
        {connectionMessage ? <p className={styles.googleCalendarFeedback}>{connectionMessage}</p> : null}
        {state.message ? (
          <p
            className={`${styles.googleCalendarFeedback} ${state.status === "error" ? styles.googleCalendarFeedbackError : ""}`}
            role={state.status === "error" ? "alert" : "status"}
          >
            {state.message}
          </p>
        ) : null}
      </div>

      <div className={styles.googleCalendarActions}>
        {needsPermission ? (
          <a className={styles.googleCalendarButton} href="/api/classroom/connect?target=calendar">
            Conectar Google Agenda
          </a>
        ) : (
          <form action={action}>
            <button className={styles.googleCalendarButton} disabled={pending} type="submit">
              {pending
                ? "Sincronizando…"
                : status.status === "not-connected"
                  ? "Criar calendário"
                  : "Sincronizar agora"}
            </button>
          </form>
        )}
        {status.status === "error" ? (
          <a className={styles.googleCalendarReconnect} href="/api/classroom/connect?target=calendar">
            Autorizar novamente
          </a>
        ) : null}
      </div>
    </aside>
  );
}
