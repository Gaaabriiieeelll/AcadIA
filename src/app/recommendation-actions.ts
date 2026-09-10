"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { ClassroomApiError } from "@/data/google-classroom";
import { AuthenticationRequiredError } from "@/data/current-user";
import { AiConsentRequiredError } from "@/data/privacy";
import {
  RecommendationAIError,
  StudyRecommendationError,
  YouTubeSearchError,
  answerCurrentStudyChat,
  generateCurrentStudyRecommendations,
} from "@/data/study-recommendations";
import { ClassroomConnectionError } from "@/lib/google-classroom-credentials";
import type {
  StudyChatResponse,
  StudyRecommendationGenerateState,
} from "@/types/study-recommendations";

const studyChatRequestSchema = z.object({
  message: z.string().trim().min(1).max(500),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().trim().min(1).max(1800),
  })).max(8),
});

function recommendationErrorMessage(error: unknown) {
  if (error instanceof AuthenticationRequiredError) {
    return "Sua sessão expirou. Entre novamente para continuar.";
  }
  if (error instanceof AiConsentRequiredError) {
    return "Autorize o uso dos dados acadêmicos pela IA antes de continuar.";
  }
  if (error instanceof ClassroomConnectionError) {
    if (error.code === "UPSTREAM_FAILURE") {
      return "O Google Sala de Aula demorou demais para responder. Tente novamente.";
    }
    return error.code === "NOT_CONNECTED"
      ? "Conecte o Google Sala de Aula antes de gerar recomendações."
      : "Autorize novamente o Google Sala de Aula para continuar.";
  }
  if (error instanceof ClassroomApiError) {
    return error.code === "FORBIDDEN"
      ? "O Google não permitiu consultar as publicações desta conta."
      : "O Google Sala de Aula está indisponível agora.";
  }
  if (error instanceof RecommendationAIError) {
    if (error.code === "NOT_CONFIGURED") return "Configure a chave da OpenAI no servidor.";
    if (error.code === "INVALID_RESPONSE") return "A IA não conseguiu organizar os assuntos desta vez. Tente novamente.";
    return "A análise por IA está indisponível agora. Tente novamente em instantes.";
  }
  if (error instanceof YouTubeSearchError) {
    return error.code === "NOT_CONFIGURED"
      ? "Configure a chave da YouTube Data API no servidor."
      : "A busca de vídeos no YouTube está indisponível agora.";
  }
  if (error instanceof StudyRecommendationError) {
    if (error.code === "NO_SUBJECTS") return "Cadastre suas disciplinas e notas antes de continuar.";
    if (error.code === "NO_CLASSROOM_CONTENT") {
      return "Não encontramos publicações do Classroom relacionadas às disciplinas cadastradas.";
    }
    return "Não encontramos vídeos adequados para os assuntos analisados. Tente novamente mais tarde.";
  }
  return null;
}

export async function generateStudyRecommendationsAction(
  previousState: StudyRecommendationGenerateState,
  formData: FormData,
): Promise<StudyRecommendationGenerateState> {
  void previousState;
  void formData;

  try {
    const result = await generateCurrentStudyRecommendations();
    revalidatePath("/plano-de-estudos");
    return {
      status: "success",
      message: `${result.created} recomendação(ões) atualizada(s) com base nas suas notas e publicações.`,
    };
  } catch (error) {
    const message = recommendationErrorMessage(error);
    if (message) return { status: "error", message };
    console.error("Falha ao gerar recomendações de estudo", error);
    return {
      status: "error",
      message: "Não foi possível gerar as recomendações agora.",
    };
  }
}

export async function sendStudyChatMessageAction(input: unknown): Promise<StudyChatResponse> {
  const parsed = studyChatRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Escreva uma pergunta de até 500 caracteres.",
      videos: [],
    };
  }

  try {
    return await answerCurrentStudyChat(parsed.data.message, parsed.data.history);
  } catch (error) {
    const message = recommendationErrorMessage(error);
    if (message) return { status: "error", message, videos: [] };
    console.error("Falha no bate-papo de estudos", error);
    return {
      status: "error",
      message: "Não consegui responder agora. Tente novamente em instantes.",
      videos: [],
    };
  }
}
