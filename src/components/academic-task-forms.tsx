"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

import {
  createAcademicTaskAction,
  deleteAcademicTaskAction,
  syncClassroomTasksAction,
  toggleAcademicTaskAction,
} from "@/app/task-actions";
import type {
  AcademicTaskFormField,
  AcademicTaskFormState,
} from "@/types/academic-tasks";

const initialState: AcademicTaskFormState = { status: "idle" };

function FieldError({
  field,
  state,
}: {
  field: AcademicTaskFormField;
  state: AcademicTaskFormState;
}) {
  const message = state.fieldErrors?.[field]?.[0];
  return message ? <span className="profile-field-error">{message}</span> : null;
}

export function AcademicTaskCreateForm({
  subjects,
}: {
  subjects: Array<{ id: string; name: string }>;
}) {
  const [state, formAction, pending] = useActionState(createAcademicTaskAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state.status]);

  return (
    <form className="task-create-form" action={formAction} ref={formRef} noValidate>
      <div className="subject-form-heading">
        <div>
          <span>Nova atividade</span>
          <h2>Adicione um compromisso acadêmico</h2>
        </div>
        <button className="primary-action" disabled={pending} type="submit">
          {pending ? "Adicionando…" : "Adicionar à agenda"}
        </button>
      </div>

      {state.message && state.status !== "idle" ? (
        <p
          className={`subject-form-feedback subject-form-feedback-${state.status}`}
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}

      <div className="task-create-grid">
        <label className="profile-field task-title-field">
          <span>Título</span>
          <input
            aria-invalid={Boolean(state.fieldErrors?.title)}
            maxLength={140}
            name="title"
            placeholder="Ex.: Entregar lista de exercícios"
            required
          />
          <FieldError field="title" state={state} />
        </label>

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
          <FieldError field="subjectId" state={state} />
        </label>

        <label className="profile-field">
          <span>Data</span>
          <input
            aria-invalid={Boolean(state.fieldErrors?.dueDate)}
            name="dueDate"
            required
            type="date"
          />
          <FieldError field="dueDate" state={state} />
        </label>

        <label className="profile-field">
          <span>Horário <small>(opcional)</small></span>
          <input
            aria-invalid={Boolean(state.fieldErrors?.dueTime)}
            name="dueTime"
            type="time"
          />
          <FieldError field="dueTime" state={state} />
        </label>

        <label className="profile-field">
          <span>Prioridade</span>
          <select
            aria-invalid={Boolean(state.fieldErrors?.priority)}
            defaultValue="MEDIUM"
            name="priority"
            required
          >
            <option value="LOW">Baixa</option>
            <option value="MEDIUM">Média</option>
            <option value="HIGH">Alta</option>
          </select>
          <FieldError field="priority" state={state} />
        </label>

        <label className="profile-field task-description-field">
          <span>Descrição <small>(opcional)</small></span>
          <textarea
            aria-invalid={Boolean(state.fieldErrors?.description)}
            maxLength={500}
            name="description"
            placeholder="Inclua orientações ou observações importantes."
            rows={3}
          />
          <FieldError field="description" state={state} />
        </label>
      </div>
    </form>
  );
}

function TaskSubmitButton({ completed }: { completed: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button className="task-toggle-button" disabled={pending} type="submit">
      {pending ? "Atualizando…" : completed ? "Reabrir" : "Concluir"}
    </button>
  );
}

function DeleteTaskSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="task-delete-button" disabled={pending} type="submit">
      {pending ? "Excluindo…" : "Excluir"}
    </button>
  );
}

export function ToggleTaskForm({ taskId, completed }: { taskId: string; completed: boolean }) {
  const action = toggleAcademicTaskAction.bind(null, taskId);
  return (
    <form action={action}>
      <TaskSubmitButton completed={completed} />
    </form>
  );
}

export function DeleteTaskForm({ taskId, taskTitle }: { taskId: string; taskTitle: string }) {
  const action = deleteAcademicTaskAction.bind(null, taskId);
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(`Excluir a atividade “${taskTitle}”?`)) event.preventDefault();
      }}
    >
      <DeleteTaskSubmitButton />
    </form>
  );
}

function SyncClassroomSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="secondary-action" disabled={pending} type="submit">
      {pending ? "Sincronizando…" : "Atualizar agora"}
    </button>
  );
}

export function SyncClassroomTasksForm() {
  return (
    <form action={syncClassroomTasksAction}>
      <SyncClassroomSubmitButton />
    </form>
  );
}
