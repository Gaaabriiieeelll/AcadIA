"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { AuthenticationRequiredError } from "@/data/current-user";
import {
  StudyPlanConfigurationRequiredError,
  StudyPlanNoAvailableSlotError,
  StudySessionConflictError,
  StudySessionNotFoundError,
  createCurrentStudySession,
  deleteCurrentStudySession,
  generateCurrentWeeklyStudyPlan,
  postponeCurrentStudySession,
  rescheduleCurrentStudySession,
  toggleCurrentStudySession,
  updateCurrentStudyPlanPreferences,
} from "@/data/study-plan";
import {
  studyAvailabilityFromFormData,
  studyPlanPreferenceSchema,
  studySessionIdSchema,
  studySessionRescheduleSchema,
  studySessionSchema,
  studyWeekStartSchema,
} from "@/lib/validation/study-plan";
import type {
  StudyPlanGenerateState,
  StudyPlanPreferenceFormState,
  StudySessionFormState,
} from "@/types/study-plan";

function revalidateStudyPlanPages() {
  revalidatePath("/plano-de-estudos");
  revalidatePath("/dashboard");
}

function studyPlanErrorMessage(error: unknown) {
  if (error instanceof AuthenticationRequiredError) {
    return "Sua sessão expirou. Entre novamente para continuar.";
  }
  if (error instanceof StudyPlanConfigurationRequiredError) {
    return "Salve sua disponibilidade antes de gerar o plano.";
  }
  if (error instanceof StudyPlanNoAvailableSlotError) {
    return "Não há horários livres suficientes nesta semana. Amplie a disponibilidade ou reduza a meta.";
  }
  if (error instanceof StudySessionConflictError) {
    return "Já existe uma sessão nesse dia e horário.";
  }
  if (error instanceof StudySessionNotFoundError) {
    return "A sessão ou disciplina não foi encontrada na sua conta.";
  }
  return null;
}

export async function updateStudyPlanPreferencesAction(
  _previousState: StudyPlanPreferenceFormState,
  formData: FormData,
): Promise<StudyPlanPreferenceFormState> {
  const parsed = studyPlanPreferenceSchema.safeParse({
    weeklyGoalHours: formData.get("weeklyGoalHours"),
    sessionDuration: formData.get("sessionDuration"),
    breakDuration: formData.get("breakDuration"),
    availability: studyAvailabilityFromFormData(formData),
  });

  if (!parsed.success) {
    const messagesFor = (field: string) => parsed.error.issues
      .filter((issue) => issue.path[0] === field)
      .map((issue) => issue.message);
    return {
      status: "error",
      message: "Revise sua meta e os horários disponíveis.",
      fieldErrors: {
        weeklyGoalHours: messagesFor("weeklyGoalHours"),
        sessionDuration: messagesFor("sessionDuration"),
        breakDuration: messagesFor("breakDuration"),
        availability: messagesFor("availability"),
      },
    };
  }

  try {
    await updateCurrentStudyPlanPreferences(parsed.data);
  } catch (error) {
    const message = studyPlanErrorMessage(error);
    if (message) return { status: "error", message };
    console.error("Falha ao salvar preferências do plano de estudos", error);
    return { status: "error", message: "Não foi possível salvar sua disponibilidade agora." };
  }

  revalidateStudyPlanPages();
  return { status: "success", message: "Disponibilidade e meta semanal salvas." };
}

export async function generateStudyPlanAction(
  weekStart: string,
  _previousState: StudyPlanGenerateState,
  _formData: FormData,
): Promise<StudyPlanGenerateState> {
  void _previousState;
  void _formData;
  const parsedWeek = studyWeekStartSchema.safeParse(weekStart);
  if (!parsedWeek.success) return { status: "error", message: "Semana inválida." };

  try {
    const result = await generateCurrentWeeklyStudyPlan(parsedWeek.data);
    revalidateStudyPlanPages();
    return result.goalAlreadyCovered
      ? { status: "success", message: "A meta desta semana já está coberta pelas sessões existentes." }
      : { status: "success", message: `${result.created} sessão(ões) distribuída(s) na semana.` };
  } catch (error) {
    const message = studyPlanErrorMessage(error);
    if (message) return { status: "error", message };
    console.error("Falha ao gerar plano de estudos", error);
    return { status: "error", message: "Não foi possível gerar o plano agora." };
  }
}

export async function createStudySessionAction(
  _previousState: StudySessionFormState,
  formData: FormData,
): Promise<StudySessionFormState> {
  const parsed = studySessionSchema.safeParse({
    subjectId: formData.get("subjectId"),
    scheduledDate: formData.get("scheduledDate"),
    startTime: formData.get("startTime"),
    durationMinutes: formData.get("durationMinutes"),
    focus: formData.get("focus"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os dados da sessão.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    await createCurrentStudySession(parsed.data);
  } catch (error) {
    const message = studyPlanErrorMessage(error);
    if (message) return { status: "error", message };
    console.error("Falha ao criar sessão de estudo", error);
    return { status: "error", message: "Não foi possível adicionar a sessão agora." };
  }

  revalidateStudyPlanPages();
  return { status: "success", message: "Sessão adicionada ao plano." };
}

export async function rescheduleStudySessionAction(
  sessionId: string,
  _previousState: StudySessionFormState,
  formData: FormData,
): Promise<StudySessionFormState> {
  const parsed = z.tuple([
    studySessionIdSchema,
    studySessionRescheduleSchema,
  ]).safeParse([
    sessionId,
    {
      scheduledDate: formData.get("scheduledDate"),
      startTime: formData.get("startTime"),
      durationMinutes: formData.get("durationMinutes"),
    },
  ]);

  if (!parsed.success) {
    return { status: "error", message: "Revise a nova data e o horário." };
  }

  try {
    await rescheduleCurrentStudySession(parsed.data[0], parsed.data[1]);
  } catch (error) {
    const message = studyPlanErrorMessage(error);
    if (message) return { status: "error", message };
    console.error("Falha ao reagendar sessão de estudo", error);
    return { status: "error", message: "Não foi possível reagendar a sessão." };
  }

  revalidateStudyPlanPages();
  return { status: "success", message: "Sessão reagendada." };
}

export async function toggleStudySessionAction(sessionId: string) {
  const parsed = studySessionIdSchema.safeParse(sessionId);
  if (!parsed.success) return;
  await toggleCurrentStudySession(parsed.data);
  revalidateStudyPlanPages();
}

export async function postponeStudySessionAction(
  sessionId: string,
  _previousState: StudyPlanGenerateState,
  _formData: FormData,
): Promise<StudyPlanGenerateState> {
  void _previousState;
  void _formData;
  const parsed = studySessionIdSchema.safeParse(sessionId);
  if (!parsed.success) return { status: "error", message: "Sessão inválida." };

  try {
    await postponeCurrentStudySession(parsed.data);
  } catch (error) {
    const message = studyPlanErrorMessage(error);
    if (message) return { status: "error", message };
    console.error("Falha ao adiar sessão de estudo", error);
    return { status: "error", message: "Não foi possível adiar a sessão." };
  }

  revalidateStudyPlanPages();
  return { status: "success", message: "Sessão adiada em um dia." };
}

export async function deleteStudySessionAction(sessionId: string) {
  const parsed = studySessionIdSchema.safeParse(sessionId);
  if (!parsed.success) return;
  await deleteCurrentStudySession(parsed.data);
  revalidateStudyPlanPages();
}
