"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { AuthenticationRequiredError } from "@/data/current-user";
import { syncCurrentGoogleCalendar } from "@/data/google-calendar";
import {
  createCurrentOpportunity,
  deleteCurrentOpportunity,
  OpportunityLimitError,
  OpportunityNotFoundError,
  setCurrentOpportunityFavorite,
  updateCurrentOpportunity,
} from "@/data/opportunities";
import { opportunityIdSchema, opportunitySchema } from "@/lib/validation/opportunities";
import type { OpportunityFormState } from "@/types/opportunities";

function revalidateOpportunityPages() {
  revalidatePath("/oportunidades");
  revalidatePath("/calendario");
  revalidatePath("/agenda");
  revalidatePath("/dashboard");
}

async function syncCalendar() {
  try {
    await syncCurrentGoogleCalendar();
  } catch (error) {
    console.error("Falha ao sincronizar o Google Agenda após alterar uma oportunidade", error);
  }
}

function parseForm(formData: FormData) {
  return opportunitySchema.safeParse({
    title: formData.get("title"),
    organization: formData.get("organization"),
    kind: formData.get("kind"),
    acceptedCourses: formData.get("acceptedCourses"),
    modality: formData.get("modality"),
    location: formData.get("location"),
    deadline: formData.get("deadline"),
    sourceUrl: formData.get("sourceUrl"),
    requirements: formData.get("requirements"),
    documents: formData.get("documents"),
    notes: formData.get("notes"),
    reminder: formData.get("reminder") === "on",
  });
}

export async function createOpportunityAction(
  _previousState: OpportunityFormState,
  formData: FormData,
): Promise<OpportunityFormState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os dados da oportunidade.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    await createCurrentOpportunity(parsed.data);
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) return { status: "error", message: "Sua sessão expirou. Entre novamente." };
    if (error instanceof OpportunityLimitError) return { status: "error", message: "Limite de 100 oportunidades salvas atingido." };
    console.error("Falha ao salvar oportunidade", error);
    return { status: "error", message: "Não foi possível salvar a oportunidade agora." };
  }

  await syncCalendar();
  revalidateOpportunityPages();
  return { status: "success", message: "Oportunidade salva no seu perfil." };
}

export async function updateOpportunityAction(
  id: string,
  _previousState: OpportunityFormState,
  formData: FormData,
): Promise<OpportunityFormState> {
  if (!opportunityIdSchema.safeParse(id).success) return { status: "error", message: "Oportunidade inválida." };
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os dados da oportunidade.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    await updateCurrentOpportunity(id, parsed.data);
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) return { status: "error", message: "Sua sessão expirou. Entre novamente." };
    if (error instanceof OpportunityNotFoundError) return { status: "error", message: "Oportunidade não encontrada na sua conta." };
    console.error("Falha ao atualizar oportunidade", error);
    return { status: "error", message: "Não foi possível atualizar a oportunidade agora." };
  }

  await syncCalendar();
  revalidateOpportunityPages();
  return { status: "success", message: "Oportunidade atualizada." };
}

export async function setOpportunityFavoriteAction(id: string, favorite: boolean) {
  if (!opportunityIdSchema.safeParse(id).success || typeof favorite !== "boolean") return;
  await setCurrentOpportunityFavorite(id, favorite);
  revalidatePath("/oportunidades");
}

export async function deleteOpportunityAction(id: string) {
  if (!opportunityIdSchema.safeParse(id).success) return;
  await deleteCurrentOpportunity(id);
  await syncCalendar();
  revalidateOpportunityPages();
}
