"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

import {
  createStudySessionAction,
  deleteStudySessionAction,
  generateStudyPlanAction,
  postponeStudySessionAction,
  rescheduleStudySessionAction,
  toggleStudySessionAction,
  updateStudyPlanPreferencesAction,
} from "@/app/study-plan-actions";
import type {
  StudyPlanGenerateState,
  StudyPlanPreferenceDTO,
  StudyPlanPreferenceFormField,
  StudyPlanPreferenceFormState,
  StudySessionDTO,
  StudySessionFormField,
  StudySessionFormState,
} from "@/types/study-plan";
import { STUDY_WEEKDAYS } from "@/types/study-plan";

const initialPreferenceState: StudyPlanPreferenceFormState = { status: "idle" };
const initialGenerateState: StudyPlanGenerateState = { status: "idle" };
const initialSessionState: StudySessionFormState = { status: "idle" };

function Feedback({ state }: { state: StudyPlanGenerateState }) {
  if (!state.message || state.status === "idle") return null;
  return (
    <p
      className={`subject-form-feedback subject-form-feedback-${state.status}`}
      role={state.status === "error" ? "alert" : "status"}
    >
      {state.message}
    </p>
  );
}

function PreferenceError({
  field,
  state,
}: {
  field: StudyPlanPreferenceFormField;
  state: StudyPlanPreferenceFormState;
}) {
  const message = state.fieldErrors?.[field]?.[0];
  return message ? <span className="profile-field-error">{message}</span> : null;
}

function SessionError({
  field,
  state,
}: {
  field: StudySessionFormField;
  state: StudySessionFormState;
}) {
  const message = state.fieldErrors?.[field]?.[0];
  return message ? <span className="profile-field-error">{message}</span> : null;
}

export function StudyPlanPreferencesForm({
  preferences,
}: {
  preferences: StudyPlanPreferenceDTO;
}) {
  const [state, action, pending] = useActionState(
    updateStudyPlanPreferencesAction,
    initialPreferenceState,
  );
  const availability = new Map(
    preferences.availability.map((item) => [item.weekday, item]),
  );

  return (
    <form action={action} className="study-preferences-form" noValidate>
      <div className="study-preference-metrics">
        <label className="profile-field">
          <span>Meta semanal</span>
          <div className="study-hours-input">
            <input
              aria-invalid={Boolean(state.fieldErrors?.weeklyGoalHours)}
              defaultValue={preferences.weeklyGoalMinutes / 60}
              inputMode="decimal"
              max="20"
              min="0.5"
              name="weeklyGoalHours"
              required
              step="0.5"
              type="number"
            />
            <span>horas</span>
          </div>
          <PreferenceError field="weeklyGoalHours" state={state} />
        </label>
        <label className="profile-field">
          <span>Duração da sessão</span>
          <select defaultValue={String(preferences.sessionDuration)} name="sessionDuration">
            <option value="30">30 minutos</option>
            <option value="45">45 minutos</option>
            <option value="50">50 minutos</option>
            <option value="60">60 minutos</option>
            <option value="90">90 minutos</option>
          </select>
          <PreferenceError field="sessionDuration" state={state} />
        </label>
        <label className="profile-field">
          <span>Intervalo</span>
          <select defaultValue={String(preferences.breakDuration)} name="breakDuration">
            <option value="0">Sem intervalo</option>
            <option value="5">5 minutos</option>
            <option value="10">10 minutos</option>
            <option value="15">15 minutos</option>
          </select>
          <PreferenceError field="breakDuration" state={state} />
        </label>
      </div>

      <fieldset className="study-availability-grid">
        <legend>Quando você pode estudar?</legend>
        {STUDY_WEEKDAYS.map((day) => {
          const saved = availability.get(day.value);
          return (
            <div className="study-availability-row" key={day.value}>
              <label className="study-day-toggle">
                <input
                  defaultChecked={Boolean(saved)}
                  name={`enabled-${day.value}`}
                  type="checkbox"
                />
                <span>{day.shortLabel}</span>
              </label>
              <label>
                <span className="sr-only">Início em {day.label}</span>
                <input
                  aria-label={`Horário inicial de ${day.label}`}
                  defaultValue={saved?.startTime ?? "18:00"}
                  name={`start-${day.value}`}
                  type="time"
                />
              </label>
              <span>até</span>
              <label>
                <span className="sr-only">Fim em {day.label}</span>
                <input
                  aria-label={`Horário final de ${day.label}`}
                  defaultValue={saved?.endTime ?? "20:00"}
                  name={`end-${day.value}`}
                  type="time"
                />
              </label>
            </div>
          );
        })}
        <PreferenceError field="availability" state={state} />
      </fieldset>

      <Feedback state={state} />
      <button className="primary-action" disabled={pending} type="submit">
        {pending ? "Salvando…" : "Salvar disponibilidade"}
      </button>
    </form>
  );
}

export function GenerateStudyPlanForm({
  weekStart,
  hasReplaceableSessions,
  disabled = false,
}: {
  weekStart: string;
  hasReplaceableSessions: boolean;
  disabled?: boolean;
}) {
  const action = generateStudyPlanAction.bind(null, weekStart);
  const [state, formAction, pending] = useActionState(action, initialGenerateState);

  return (
    <form
      action={formAction}
      className="study-generate-form"
      onSubmit={(event) => {
        if (
          hasReplaceableSessions
          && !window.confirm("Atualizar o plano automático desta semana? Sessões manuais e concluídas serão preservadas.")
        ) {
          event.preventDefault();
        }
      }}
    >
      <button className="primary-action" disabled={pending || disabled} type="submit">
        {pending
          ? "Organizando…"
          : disabled
            ? "Cadastre disciplinas primeiro"
            : hasReplaceableSessions ? "Atualizar plano automático" : "Gerar plano da semana"}
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function CreateStudySessionForm({
  subjects,
  defaultDate,
}: {
  subjects: Array<{ id: string; name: string }>;
  defaultDate: string;
}) {
  const [state, action, pending] = useActionState(
    createStudySessionAction,
    initialSessionState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state.status]);

  return (
    <form action={action} className="study-manual-form" noValidate ref={formRef}>
      <div className="study-manual-fields">
        <label className="profile-field">
          <span>Disciplina</span>
          <select
            aria-invalid={Boolean(state.fieldErrors?.subjectId)}
            defaultValue=""
            name="subjectId"
            required
          >
            <option disabled value="">Selecione</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>{subject.name}</option>
            ))}
          </select>
          <SessionError field="subjectId" state={state} />
        </label>
        <label className="profile-field">
          <span>Data</span>
          <input defaultValue={defaultDate} name="scheduledDate" required type="date" />
          <SessionError field="scheduledDate" state={state} />
        </label>
        <label className="profile-field">
          <span>Início</span>
          <input defaultValue="18:00" name="startTime" required type="time" />
          <SessionError field="startTime" state={state} />
        </label>
        <label className="profile-field">
          <span>Duração</span>
          <select defaultValue="50" name="durationMinutes">
            <option value="30">30 min</option>
            <option value="45">45 min</option>
            <option value="50">50 min</option>
            <option value="60">60 min</option>
            <option value="90">90 min</option>
          </select>
          <SessionError field="durationMinutes" state={state} />
        </label>
        <label className="profile-field study-focus-field">
          <span>Foco <small>(opcional)</small></span>
          <input
            maxLength={160}
            name="focus"
            placeholder="Ex.: revisar lista de exercícios"
          />
          <SessionError field="focus" state={state} />
        </label>
      </div>
      <Feedback state={state} />
      <button className="secondary-action" disabled={pending} type="submit">
        {pending ? "Adicionando…" : "Adicionar sessão"}
      </button>
    </form>
  );
}

function StudyActionButton({ idle, pendingLabel, className }: {
  idle: string;
  pendingLabel: string;
  className: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button className={className} disabled={pending} type="submit">
      {pending ? pendingLabel : idle}
    </button>
  );
}

export function StudySessionControls({ session }: { session: StudySessionDTO }) {
  const toggleAction = toggleStudySessionAction.bind(null, session.id);
  const postponeAction = postponeStudySessionAction.bind(null, session.id);
  const deleteAction = deleteStudySessionAction.bind(null, session.id);
  const rescheduleAction = rescheduleStudySessionAction.bind(null, session.id);
  const [rescheduleState, formAction, pending] = useActionState(
    rescheduleAction,
    initialSessionState,
  );
  const [postponeState, postponeFormAction] = useActionState(
    postponeAction,
    initialGenerateState,
  );

  return (
    <div className="study-session-controls">
      <div className="study-session-action-row">
        <form action={toggleAction}>
          <StudyActionButton
            className="study-session-action study-session-complete"
            idle={session.status === "COMPLETED" ? "Reabrir" : "Concluir"}
            pendingLabel="Atualizando…"
          />
        </form>
        <form action={postponeFormAction}>
          <StudyActionButton
            className="study-session-action"
            idle="Adiar 1 dia"
            pendingLabel="Adiando…"
          />
        </form>
        <form
          action={deleteAction}
          onSubmit={(event) => {
            if (!window.confirm("Excluir esta sessão de estudo?")) event.preventDefault();
          }}
        >
          <StudyActionButton
            className="study-session-action study-session-delete"
            idle="Excluir"
            pendingLabel="Excluindo…"
          />
        </form>
      </div>
      <Feedback state={postponeState} />

      <details className="study-reschedule-details">
        <summary>Editar data e horário</summary>
        <form action={formAction} className="study-reschedule-form" noValidate>
          <label>
            <span>Data</span>
            <input defaultValue={session.scheduledDate} name="scheduledDate" required type="date" />
          </label>
          <label>
            <span>Início</span>
            <input defaultValue={session.startTime} name="startTime" required type="time" />
          </label>
          <label>
            <span>Duração</span>
            <select defaultValue={String(session.durationMinutes)} name="durationMinutes">
              <option value="30">30 min</option>
              <option value="45">45 min</option>
              <option value="50">50 min</option>
              <option value="60">60 min</option>
              <option value="90">90 min</option>
            </select>
          </label>
          <button disabled={pending} type="submit">
            {pending ? "Salvando…" : "Salvar"}
          </button>
        </form>
        <Feedback state={rescheduleState} />
      </details>
    </div>
  );
}
