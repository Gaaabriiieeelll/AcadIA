"use client";

import Link from "next/link";
import { useActionState } from "react";

import { saveAcademicProfileAction } from "@/app/profile-actions";
import {
  ACADEMIC_STAGES,
  ETIM_COURSES,
  resolveAcademicStage,
  resolveEtimCourse,
} from "@/lib/academic-profile-options";
import type {
  AcademicProfileField,
  AcademicProfileFormState,
  AcademicProfileValues,
} from "@/types/academic-profile";

type AcademicProfileFormProps = {
  mode: "create" | "edit";
  initialValues: AcademicProfileValues;
};

const initialState: AcademicProfileFormState = { status: "idle" };

export function AcademicProfileForm({ mode, initialValues }: AcademicProfileFormProps) {
  const [state, formAction, pending] = useActionState(
    saveAcademicProfileAction,
    initialState,
  );
  const initialCourse = resolveEtimCourse(initialValues.course);
  const initialAcademicStage = resolveAcademicStage(initialValues.academicStage);

  function fieldError(field: AcademicProfileField) {
    const errors = state.fieldErrors?.[field];
    if (!errors?.length) return null;

    return (
      <span className="profile-field-error" id={`${field}-error`}>
        {errors[0]}
      </span>
    );
  }

  return (
    <form className="profile-form" action={formAction} noValidate>
      {state.status === "error" && state.message ? (
        <div className="profile-form-alert" role="alert">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5M12 17h.01" />
          </svg>
          <span>{state.message}</span>
        </div>
      ) : null}

      <div className="profile-form-grid">
        <label className="profile-field">
          <span>Matrícula</span>
          <input
            aria-describedby={state.fieldErrors?.registrationNumber ? "registrationNumber-error" : undefined}
            aria-invalid={Boolean(state.fieldErrors?.registrationNumber)}
            autoComplete="off"
            defaultValue={initialValues.registrationNumber}
            inputMode="numeric"
            maxLength={30}
            name="registrationNumber"
            onInput={(event) => {
              event.currentTarget.value = event.currentTarget.value.replace(/\D/g, "");
            }}
            pattern="[0-9]*"
            placeholder="Informe sua matrícula"
            required
          />
          {fieldError("registrationNumber")}
        </label>

        <label className="profile-field">
          <span>Campus</span>
          <select
            aria-describedby={state.fieldErrors?.campus ? "campus-error" : undefined}
            aria-invalid={Boolean(state.fieldErrors?.campus)}
            defaultValue={initialValues.campus}
            name="campus"
            required
          >
            <option value="João Pessoa">João Pessoa</option>
          </select>
          {fieldError("campus")}
        </label>

        <label className="profile-field profile-field-wide">
          <span>Curso</span>
          <select
            aria-describedby={state.fieldErrors?.course ? "course-error" : undefined}
            aria-invalid={Boolean(state.fieldErrors?.course)}
            defaultValue={initialCourse}
            name="course"
            required
          >
            <option disabled value="">Selecione seu curso ETIM</option>
            {ETIM_COURSES.map((course) => (
              <option key={course} value={course}>{course}</option>
            ))}
          </select>
          {fieldError("course")}
        </label>

        <label className="profile-field">
          <span>Período ou ano atual</span>
          <select
            aria-describedby={state.fieldErrors?.academicStage ? "academicStage-error" : undefined}
            aria-invalid={Boolean(state.fieldErrors?.academicStage)}
            defaultValue={initialAcademicStage}
            name="academicStage"
            required
          >
            <option disabled value="">Selecione o ano atual</option>
            {ACADEMIC_STAGES.map((stage) => (
              <option key={stage} value={stage}>{stage}</option>
            ))}
          </select>
          {fieldError("academicStage")}
        </label>

        <label className="profile-field">
          <span>Turma <small>(opcional)</small></span>
          <input
            aria-describedby={state.fieldErrors?.classGroup ? "classGroup-error" : undefined}
            aria-invalid={Boolean(state.fieldErrors?.classGroup)}
            autoComplete="off"
            defaultValue={initialValues.classGroup ?? ""}
            maxLength={50}
            name="classGroup"
            placeholder="Ex.: 2026.1"
          />
          {fieldError("classGroup")}
        </label>
      </div>

      <div className="profile-form-actions">
        {mode === "edit" ? (
          <Link className="secondary-action" href="/dashboard">
            Cancelar
          </Link>
        ) : null}
        <button className="primary-action" disabled={pending} type="submit">
          {pending ? "Salvando…" : mode === "create" ? "Concluir perfil" : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}
