"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

import {
  createCalendarEventAction,
  deleteCalendarEventAction,
  setCalendarEventCompletedAction,
} from "@/app/calendar-event-actions";
import styles from "@/app/calendario/calendar.module.css";
import {
  CALENDAR_EVENT_TYPES,
  CALENDAR_EVENT_TYPE_DETAILS,
  type CalendarEventFormField,
  type CalendarEventFormState,
} from "@/types/calendar-events";

const initialState: CalendarEventFormState = { status: "idle" };

function FieldError({
  field,
  state,
}: {
  field: CalendarEventFormField;
  state: CalendarEventFormState;
}) {
  const message = state.fieldErrors?.[field]?.[0];
  return message ? <span className="profile-field-error">{message}</span> : null;
}

export function CalendarEventCreateForm({
  subjects,
  defaultStartDate,
}: {
  subjects: Array<{ id: string; name: string }>;
  defaultStartDate: string;
}) {
  const [state, formAction, pending] = useActionState(createCalendarEventAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state.status]);

  return (
    <details className={styles.createDisclosure} open>
      <summary>
        <span className={styles.createIcon}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <rect x="3.5" y="5.5" width="17" height="15" rx="2" />
            <path d="M7.5 3v5M16.5 3v5M3.5 10h17M12 13v5M9.5 15.5h5" />
          </svg>
        </span>
        <span>
          <small>Novo evento pessoal</small>
          <strong>Adicionar ao calendário</strong>
        </span>
        <span className={styles.disclosureAction}>Preencher</span>
      </summary>

      <form className={styles.eventForm} action={formAction} ref={formRef} noValidate>
        {state.message && state.status !== "idle" ? (
          <p
            className={`subject-form-feedback subject-form-feedback-${state.status}`}
            role={state.status === "error" ? "alert" : "status"}
          >
            {state.message}
          </p>
        ) : null}

        <div className={styles.eventFormGrid}>
          <label className={`profile-field ${styles.titleField}`}>
            <span>Título</span>
            <input
              aria-invalid={Boolean(state.fieldErrors?.title)}
              maxLength={140}
              name="title"
              placeholder="Ex.: Prova de Física"
              required
            />
            <FieldError field="title" state={state} />
          </label>

          <label className="profile-field">
            <span>Tipo</span>
            <select
              aria-invalid={Boolean(state.fieldErrors?.eventType)}
              defaultValue="OTHER"
              name="eventType"
              required
            >
              {CALENDAR_EVENT_TYPES.map((eventType) => (
                <option key={eventType} value={eventType}>
                  {CALENDAR_EVENT_TYPE_DETAILS[eventType].label}
                </option>
              ))}
            </select>
            <FieldError field="eventType" state={state} />
          </label>

          <label className="profile-field">
            <span>Disciplina <small>(opcional)</small></span>
            <select
              aria-invalid={Boolean(state.fieldErrors?.subjectId)}
              defaultValue=""
              name="subjectId"
            >
              <option value="">Sem disciplina</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
            <FieldError field="subjectId" state={state} />
          </label>

          <label className="profile-field">
            <span>Data inicial</span>
            <input
              aria-invalid={Boolean(state.fieldErrors?.startDate)}
              defaultValue={defaultStartDate}
              name="startDate"
              required
              type="date"
            />
            <FieldError field="startDate" state={state} />
          </label>

          <label className="profile-field">
            <span>Data final <small>(opcional)</small></span>
            <input
              aria-invalid={Boolean(state.fieldErrors?.endDate)}
              name="endDate"
              type="date"
            />
            <FieldError field="endDate" state={state} />
            <small>Deixe vazia para manter o compromisso em aberto até concluí-lo.</small>
          </label>

          <label className="profile-field">
            <span>Hora inicial <small>(opcional)</small></span>
            <input
              aria-invalid={Boolean(state.fieldErrors?.startTime)}
              name="startTime"
              type="time"
            />
            <FieldError field="startTime" state={state} />
          </label>

          <label className="profile-field">
            <span>Hora final <small>(opcional)</small></span>
            <input
              aria-invalid={Boolean(state.fieldErrors?.endTime)}
              name="endTime"
              type="time"
            />
            <FieldError field="endTime" state={state} />
          </label>

          <label className={`profile-field ${styles.descriptionField}`}>
            <span>Descrição <small>(opcional)</small></span>
            <textarea
              aria-invalid={Boolean(state.fieldErrors?.description)}
              maxLength={500}
              name="description"
              placeholder="Inclua local, materiais necessários ou outras observações."
              rows={3}
            />
            <FieldError field="description" state={state} />
          </label>
        </div>

        <div className={styles.formFooter}>
          <p>Sem data final, o compromisso permanece no AcadIA até ser concluído.</p>
          <button className="primary-action" disabled={pending} type="submit">
            {pending ? "Salvando…" : "Adicionar evento"}
          </button>
        </div>
      </form>
    </details>
  );
}

export function ToggleOpenCalendarEventForm({
  completed,
  eventId,
}: {
  completed: boolean;
  eventId: string;
}) {
  const action = setCalendarEventCompletedAction.bind(null, eventId, !completed);
  return (
    <form action={action}>
      <button className={styles.toggleOpenEventButton} type="submit">
        {completed ? "Reabrir" : "Concluir"}
      </button>
    </form>
  );
}

function DeleteEventButton() {
  const { pending } = useFormStatus();
  return (
    <button className={styles.deleteEventButton} disabled={pending} type="submit">
      {pending ? "Excluindo…" : "Excluir"}
    </button>
  );
}

export function DeleteCalendarEventForm({
  eventId,
  eventTitle,
}: {
  eventId: string;
  eventTitle: string;
}) {
  const action = deleteCalendarEventAction.bind(null, eventId);

  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(`Excluir o evento “${eventTitle}”?`)) event.preventDefault();
      }}
    >
      <DeleteEventButton />
    </form>
  );
}
