"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  addAssessmentAction,
  createSubjectAction,
  deleteAssessmentAction,
  deleteSubjectAction,
  importHifpbSubjectsAction,
  updateAttendanceAction,
  updateBimesterGradesAction,
} from "@/app/subject-actions";
import { getGradeColorStyle } from "@/lib/grade-colors";
import {
  SUBJECT_COLORS,
  type AssessmentFormField,
  type AssessmentFormState,
  type AttendanceFormField,
  type AttendanceFormState,
  type BimesterGradeDTO,
  type BimesterCount,
  type BimesterGradesFormField,
  type BimesterGradesFormState,
  type FormActionState,
  type HifpbSubjectImportState,
  type SubjectFormField,
  type SubjectFormState,
  getSubjectBimesters,
} from "@/types/subjects";

const subjectInitialState: SubjectFormState = { status: "idle" };
const hifpbImportInitialState: HifpbSubjectImportState = { status: "idle" };
const assessmentInitialState: AssessmentFormState = { status: "idle" };
const bimesterGradesInitialState: BimesterGradesFormState = { status: "idle" };
const attendanceInitialState: AttendanceFormState = { status: "idle" };

function ActionFeedback<Field extends string>({ state }: { state: FormActionState<Field> }) {
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

function FieldError<Field extends string>({
  field,
  state,
}: {
  field: Field;
  state: FormActionState<Field>;
}) {
  const message = state.fieldErrors?.[field]?.[0];
  return message ? <span className="profile-field-error">{message}</span> : null;
}

export function SubjectCreateForm() {
  const [state, formAction, pending] = useActionState(
    createSubjectAction,
    subjectInitialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state.status]);

  return (
    <form className="subject-create-form" action={formAction} ref={formRef} noValidate>
      <div className="subject-form-heading">
        <div>
          <span>Nova disciplina</span>
          <h2>O que você está estudando?</h2>
        </div>
        <button className="primary-action" disabled={pending} type="submit">
          {pending ? "Cadastrando…" : "Cadastrar disciplina"}
        </button>
      </div>

      <ActionFeedback state={state} />

      <div className="subject-create-grid">
        <label className="profile-field">
          <span>Nome da disciplina</span>
          <input
            aria-invalid={Boolean(state.fieldErrors?.name)}
            maxLength={120}
            name="name"
            placeholder="Ex.: Banco de Dados"
            required
          />
          <FieldError<SubjectFormField> field="name" state={state} />
        </label>

        <label className="profile-field">
          <span>Professor <small>(opcional)</small></span>
          <input
            aria-invalid={Boolean(state.fieldErrors?.teacher)}
            maxLength={120}
            name="teacher"
            placeholder="Nome do professor"
          />
          <FieldError<SubjectFormField> field="teacher" state={state} />
        </label>

        <fieldset className="subject-color-field">
          <legend>Cor de identificação</legend>
          <div>
            {SUBJECT_COLORS.map((color, index) => (
              <label key={color} title={color}>
                <input
                  defaultChecked={index === 0}
                  name="color"
                  type="radio"
                  value={color}
                />
                <span style={{ backgroundColor: color }} />
              </label>
            ))}
          </div>
          <FieldError<SubjectFormField> field="color" state={state} />
        </fieldset>
      </div>
    </form>
  );
}

export function HifpbSubjectsImportForm() {
  const [state, formAction, pending] = useActionState(
    importHifpbSubjectsAction,
    hifpbImportInitialState,
  );

  return (
    <form className="hifpb-subject-import-form" action={formAction}>
      <button className="secondary-action" disabled={pending} type="submit">
        {pending ? "Consultando hIFPB…" : "Sincronizar disciplinas"}
      </button>
      <ActionFeedback state={state} />
    </form>
  );
}

export function AssessmentForm({ subjectId }: { subjectId: string }) {
  const action = addAssessmentAction.bind(null, subjectId);
  const [state, formAction, pending] = useActionState(action, assessmentInitialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state.status]);

  return (
    <form className="assessment-form" action={formAction} ref={formRef} noValidate>
      <h4>Adicionar avaliação</h4>
      <div className="assessment-form-grid">
        <label className="profile-field assessment-name-field">
          <span>Avaliação</span>
          <input
            aria-invalid={Boolean(state.fieldErrors?.assessmentName)}
            maxLength={100}
            name="assessmentName"
            placeholder="Ex.: Prova 1"
            required
          />
          <FieldError<AssessmentFormField> field="assessmentName" state={state} />
        </label>
        <label className="profile-field">
          <span>Nota</span>
          <input
            aria-invalid={Boolean(state.fieldErrors?.score)}
            inputMode="decimal"
            max="100"
            min="0"
            name="score"
            placeholder="0–100"
            required
            step="0.01"
            type="number"
          />
          <FieldError<AssessmentFormField> field="score" state={state} />
        </label>
        <label className="profile-field">
          <span>Peso</span>
          <input
            aria-invalid={Boolean(state.fieldErrors?.weight)}
            defaultValue="1"
            inputMode="decimal"
            max="100"
            min="0.01"
            name="weight"
            required
            step="0.01"
            type="number"
          />
          <FieldError<AssessmentFormField> field="weight" state={state} />
        </label>
        <button className="compact-action" disabled={pending} type="submit">
          {pending ? "Salvando…" : "Adicionar"}
        </button>
      </div>
      <ActionFeedback state={state} />
    </form>
  );
}

export function BimesterGradesForm({
  subjectId,
  grades,
  bimesterCount,
}: {
  subjectId: string;
  grades: BimesterGradeDTO[];
  bimesterCount: BimesterCount;
}) {
  const action = updateBimesterGradesAction.bind(null, subjectId);
  const [state, formAction, pending] = useActionState(
    action,
    bimesterGradesInitialState,
  );

  function getScore(bimester: number) {
    return grades.find((grade) => grade.bimester === bimester)?.score ?? null;
  }

  return (
    <form className="bimester-form" action={formAction} noValidate>
      <div className={`bimester-form-grid bimester-form-grid-${bimesterCount}`}>
        {getSubjectBimesters(bimesterCount).map((bimester) => {
          const field = `bimester${bimester}` as BimesterGradesFormField;
          const initialScore = getScore(bimester);

          return (
            <label className="profile-field" key={bimester}>
              <span>{bimester}º bimestre</span>
              <BimesterGradeInput
                field={field}
                initialScore={initialScore}
                invalid={Boolean(state.fieldErrors?.[field])}
              />
              <FieldError<BimesterGradesFormField> field={field} state={state} />
            </label>
          );
        })}
        <button className="compact-action" disabled={pending} type="submit">
          {pending ? "Salvando…" : "Salvar notas"}
        </button>
      </div>
      <p className="bimester-form-help">
        Use a escala de 0 a 100. Campos vazios permanecem em aberto.
      </p>
      <ActionFeedback state={state} />
    </form>
  );
}

function BimesterGradeInput({
  field,
  initialScore,
  invalid,
}: {
  field: BimesterGradesFormField;
  initialScore: number | null;
  invalid: boolean;
}) {
  const [score, setScore] = useState<number | null>(initialScore);

  return (
    <input
      aria-invalid={invalid}
      className={score === null ? undefined : "grade-input"}
      defaultValue={initialScore ?? ""}
      inputMode="decimal"
      max="100"
      min="0"
      name={field}
      onChange={(event) => {
        const nextScore = event.currentTarget.valueAsNumber;
        setScore(Number.isFinite(nextScore) ? nextScore : null);
      }}
      placeholder="Em aberto"
      step="0.01"
      style={getGradeColorStyle(score)}
      type="number"
    />
  );
}

export function AttendanceForm({
  subjectId,
  classesHeld,
  absences,
}: {
  subjectId: string;
  classesHeld: number;
  absences: number;
}) {
  const action = updateAttendanceAction.bind(null, subjectId);
  const [state, formAction, pending] = useActionState(action, attendanceInitialState);

  return (
    <form className="attendance-form" action={formAction} noValidate>
      <h4>Atualizar frequência</h4>
      <div className="attendance-form-grid">
        <label className="profile-field">
          <span>Aulas ministradas</span>
          <input
            aria-invalid={Boolean(state.fieldErrors?.classesHeld)}
            defaultValue={classesHeld}
            inputMode="numeric"
            max="10000"
            min="0"
            name="classesHeld"
            required
            type="number"
          />
          <FieldError<AttendanceFormField> field="classesHeld" state={state} />
        </label>
        <label className="profile-field">
          <span>Faltas</span>
          <input
            aria-invalid={Boolean(state.fieldErrors?.absences)}
            defaultValue={absences}
            inputMode="numeric"
            max="10000"
            min="0"
            name="absences"
            required
            type="number"
          />
          <FieldError<AttendanceFormField> field="absences" state={state} />
        </label>
        <button className="compact-action" disabled={pending} type="submit">
          {pending ? "Atualizando…" : "Atualizar"}
        </button>
      </div>
      <ActionFeedback state={state} />
    </form>
  );
}

function DeleteSubmitButton({ label, compact = false }: { label: string; compact?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      className={compact ? "assessment-delete-button" : "subject-delete-button"}
      disabled={pending}
      type="submit"
    >
      {pending ? "Removendo…" : label}
    </button>
  );
}

export function DeleteAssessmentForm({
  subjectId,
  assessmentId,
}: {
  subjectId: string;
  assessmentId: string;
}) {
  const action = deleteAssessmentAction.bind(null, subjectId, assessmentId);
  return (
    <form action={action}>
      <DeleteSubmitButton compact label="Remover" />
    </form>
  );
}

export function DeleteSubjectForm({ subjectId, subjectName }: { subjectId: string; subjectName: string }) {
  const action = deleteSubjectAction.bind(null, subjectId);
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(`Remover a disciplina “${subjectName}” e todas as suas avaliações?`)) {
          event.preventDefault();
        }
      }}
    >
      <DeleteSubmitButton label="Excluir disciplina" />
    </form>
  );
}
