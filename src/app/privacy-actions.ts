"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";

import {
  AccountNotFoundError,
  deleteCurrentAccount,
  disconnectCurrentClassroom,
  setCurrentAiConsent,
} from "@/data/privacy";
import { AuthenticationRequiredError } from "@/data/current-user";
import { authOptions } from "@/lib/auth";
import { accountDeletionSchema, aiConsentIntentSchema } from "@/lib/privacy";
import type { PrivacyActionState } from "@/types/privacy";

function privacyErrorMessage(error: unknown) {
  if (error instanceof AuthenticationRequiredError) {
    return "Sua sessão expirou. Entre novamente para continuar.";
  }
  if (error instanceof AccountNotFoundError) {
    return "A conta autenticada não foi encontrada.";
  }
  console.error("Falha ao atualizar os controles de privacidade", error);
  return "Não foi possível concluir esta ação agora.";
}

function revalidatePrivacyPages() {
  revalidatePath("/perfil");
  revalidatePath("/materiais");
  revalidatePath("/agenda");
  revalidatePath("/alertas");
  revalidatePath("/calendario");
  revalidatePath("/dashboard");
  revalidatePath("/plano-de-estudos");
}

export async function updateAiConsentAction(
  _previousState: PrivacyActionState,
  formData: FormData,
): Promise<PrivacyActionState> {
  void _previousState;
  const parsed = aiConsentIntentSchema.safeParse(formData.get("consent"));
  if (!parsed.success) {
    return { status: "error", message: "A escolha de consentimento é inválida." };
  }

  try {
    await setCurrentAiConsent(parsed.data === "grant");
  } catch (error) {
    return { status: "error", message: privacyErrorMessage(error) };
  }

  revalidatePrivacyPages();
  return {
    status: "success",
    message: parsed.data === "grant"
      ? "Consentimento registrado. A análise por IA está disponível."
      : "Consentimento revogado. Nenhum novo dado acadêmico será enviado à IA.",
  };
}

export async function disconnectClassroomAction(
  _previousState: PrivacyActionState,
  _formData: FormData,
): Promise<PrivacyActionState> {
  void _previousState;
  void _formData;
  try {
    const disconnected = await disconnectCurrentClassroom();
    revalidatePrivacyPages();
    return {
      status: "success",
      message: disconnected
        ? "Classroom desconectado e dados importados removidos deste ambiente."
        : "Nenhuma conexão local do Classroom estava ativa.",
    };
  } catch (error) {
    return { status: "error", message: privacyErrorMessage(error) };
  }
}

export async function deleteAccountAction(
  _previousState: PrivacyActionState,
  formData: FormData,
): Promise<PrivacyActionState> {
  void _previousState;
  const parsed = accountDeletionSchema.safeParse({
    email: formData.get("email"),
    confirmation: formData.get("confirmation"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Confira o e-mail e a frase de confirmação.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const session = await getServerSession(authOptions);
  const sessionEmail = session?.user?.email?.trim().toLocaleLowerCase("pt-BR");
  if (!session?.user?.id || !sessionEmail) {
    return { status: "error", message: "Sua sessão expirou. Entre novamente para continuar." };
  }
  if (parsed.data.email !== sessionEmail) {
    return {
      status: "error",
      message: "O e-mail informado não corresponde à conta desta sessão.",
      fieldErrors: { email: ["Digite o mesmo e-mail exibido no topo da página."] },
    };
  }

  try {
    await deleteCurrentAccount();
  } catch (error) {
    return { status: "error", message: privacyErrorMessage(error) };
  }

  return {
    status: "success",
    message: "Conta e dados locais excluídos. Encerrando sua sessão…",
  };
}
