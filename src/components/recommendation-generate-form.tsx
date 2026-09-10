"use client";

import { useActionState } from "react";

import { generateStudyRecommendationsAction } from "@/app/recommendation-actions";
import type { StudyRecommendationGenerateState } from "@/types/study-recommendations";

const initialState: StudyRecommendationGenerateState = { status: "idle" };

export function RecommendationGenerateForm({
  disabled,
  hasRecommendations,
}: {
  disabled: boolean;
  hasRecommendations: boolean;
}) {
  const [state, action, pending] = useActionState(
    generateStudyRecommendationsAction,
    initialState,
  );

  return (
    <form action={action} className="recommendation-generate-form">
      <button className="primary-action" disabled={disabled || pending} type="submit">
        {pending
          ? "Analisando notas e conteúdos…"
          : hasRecommendations
            ? "Atualizar recomendações"
            : "Gerar minhas recomendações"}
      </button>
      {state.message ? (
        <p
          className={`subject-form-feedback subject-form-feedback-${state.status}`}
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
