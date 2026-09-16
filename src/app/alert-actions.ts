"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  dismissCurrentAlert,
  markAllCurrentAlertsRead,
  markCurrentAlertRead,
  restoreCurrentAlert,
  sendCurrentWhatsAppTest,
  snoozeCurrentAlert,
  updateCurrentAlertPreferences,
  updateCurrentWhatsAppSettings,
  WHATSAPP_TEST_COOLDOWN_MESSAGE,
} from "@/data/academic-alerts";
import {
  registerCurrentBrowserPushSubscription,
  unregisterCurrentBrowserPushSubscription,
} from "@/data/browser-push";
import { AuthenticationRequiredError } from "@/data/current-user";
import { EvolutionApiError } from "@/lib/evolution-api";
import {
  alertKeySchema,
  alertPreferenceSchema,
  browserPushEndpointSchema,
  browserPushSubscriptionSchema,
  snoozeDaysSchema,
  whatsappPreferenceSchema,
} from "@/lib/validation/academic-alerts";
import type {
  AcademicAlertPreferenceFormState,
  AcademicWhatsAppFormState,
} from "@/types/academic-alerts";

function revalidateAlertPages() {
  revalidatePath("/alertas");
  revalidatePath("/dashboard");
}

function alertActionError(error: unknown) {
  if (error instanceof AuthenticationRequiredError) {
    return "Sua sessão expirou. Entre novamente para continuar.";
  }
  if (
    error instanceof Error
    && error.message === "Configure as chaves Web Push antes de ativar as notificações."
  ) {
    return error.message;
  }
  console.error("Falha ao atualizar a central de alertas", error);
  return "Não foi possível atualizar o alerta agora.";
}

export async function updateAlertPreferencesAction(
  _previousState: AcademicAlertPreferenceFormState,
  formData: FormData,
): Promise<AcademicAlertPreferenceFormState> {
  const parsed = alertPreferenceSchema.safeParse({
    targetAverage: formData.get("targetAverage"),
    minimumAttendance: formData.get("minimumAttendance"),
    gradesEnabled: formData.get("gradesEnabled") === "on",
    attendanceEnabled: formData.get("attendanceEnabled") === "on",
    tasksEnabled: formData.get("tasksEnabled") === "on",
    calendarEnabled: formData.get("calendarEnabled") === "on",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise as preferências informadas.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    await updateCurrentAlertPreferences(parsed.data);
  } catch (error) {
    return { status: "error", message: alertActionError(error) };
  }

  revalidateAlertPages();
  return { status: "success", message: "Preferências de alertas atualizadas." };
}

export async function registerBrowserPushSubscriptionAction(subscription: unknown) {
  const parsed = browserPushSubscriptionSchema.safeParse(subscription);
  if (!parsed.success) {
    return { status: "error" as const, message: "A assinatura deste navegador é inválida." };
  }

  try {
    await registerCurrentBrowserPushSubscription(parsed.data);
  } catch (error) {
    return { status: "error" as const, message: alertActionError(error) };
  }

  revalidateAlertPages();
  return {
    status: "success" as const,
    message: "Este navegador foi conectado aos alertas do AcadIA.",
  };
}

export async function unregisterBrowserPushSubscriptionAction(endpoint: unknown) {
  const parsed = browserPushEndpointSchema.safeParse(endpoint);
  if (!parsed.success) {
    return { status: "error" as const, message: "A assinatura deste navegador é inválida." };
  }

  try {
    await unregisterCurrentBrowserPushSubscription(parsed.data);
  } catch (error) {
    return { status: "error" as const, message: alertActionError(error) };
  }

  revalidateAlertPages();
  return {
    status: "success" as const,
    message: "Notificações desativadas neste navegador.",
  };
}

function whatsAppActionError(error: unknown) {
  if (error instanceof AuthenticationRequiredError) {
    return "Sua sessão expirou. Entre novamente para continuar.";
  }
  if (error instanceof EvolutionApiError) return error.message;
  if (error instanceof Error && error.message === "Informe o número que receberá os alertas.") {
    return error.message;
  }
  if (
    error instanceof Error
    && (
      error.message === "Ative e salve o WhatsApp antes de enviar o teste."
      || error.message === WHATSAPP_TEST_COOLDOWN_MESSAGE
    )
  ) {
    return error.message;
  }
  console.error("Falha ao atualizar as notificações por WhatsApp", error);
  return "Não foi possível atualizar o WhatsApp agora.";
}

export async function updateWhatsAppNotificationAction(
  _previousState: AcademicWhatsAppFormState,
  formData: FormData,
): Promise<AcademicWhatsAppFormState> {
  const parsed = whatsappPreferenceSchema.safeParse({
    enabled: formData.get("enabled") === "on",
    phone: formData.get("phone"),
    consent: formData.get("consent") === "on",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise a configuração do WhatsApp.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    await updateCurrentWhatsAppSettings(parsed.data);
  } catch (error) {
    return { status: "error", message: whatsAppActionError(error) };
  }

  revalidateAlertPages();
  return {
    status: "success",
    message: parsed.data.enabled
      ? "Notificações por WhatsApp ativadas. Envie um teste para confirmar."
      : "Preferência de WhatsApp salva.",
  };
}

export async function sendWhatsAppTestAction() {
  try {
    await sendCurrentWhatsAppTest();
  } catch (error) {
    return { status: "error" as const, message: whatsAppActionError(error) };
  }

  revalidateAlertPages();
  return {
    status: "success" as const,
    message: "Mensagem de teste enviada pela Evolution API.",
  };
}

export async function markAlertReadAction(alertKey: string) {
  const parsed = alertKeySchema.safeParse(alertKey);
  if (!parsed.success) return;
  await markCurrentAlertRead(parsed.data);
  revalidateAlertPages();
}

export async function markAllAlertsReadAction() {
  await markAllCurrentAlertsRead();
  revalidateAlertPages();
}

export async function snoozeAlertAction(alertKey: string, formData: FormData) {
  const parsed = z.tuple([alertKeySchema, snoozeDaysSchema]).safeParse([
    alertKey,
    formData.get("days"),
  ]);
  if (!parsed.success) return;
  await snoozeCurrentAlert(parsed.data[0], parsed.data[1]);
  revalidateAlertPages();
}

export async function dismissAlertAction(alertKey: string) {
  const parsed = alertKeySchema.safeParse(alertKey);
  if (!parsed.success) return;
  await dismissCurrentAlert(parsed.data);
  revalidateAlertPages();
}

export async function restoreAlertAction(alertKey: string) {
  const parsed = alertKeySchema.safeParse(alertKey);
  if (!parsed.success) return;
  await restoreCurrentAlert(parsed.data);
  revalidateAlertPages();
}
