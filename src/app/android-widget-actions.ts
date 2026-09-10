"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  createCurrentAndroidWidgetPairing,
  revokeCurrentAndroidWidgetCredential,
} from "@/data/android-widget";
import type { AndroidWidgetPairingFormState } from "@/types/android-widget";

const deviceNameSchema = z.string().trim().min(1).max(80);
const credentialIdSchema = z.uuid();

export async function createAndroidWidgetPairingAction(
  _previousState: AndroidWidgetPairingFormState,
  formData: FormData,
): Promise<AndroidWidgetPairingFormState> {
  const deviceName = deviceNameSchema.safeParse(formData.get("deviceName"));
  if (!deviceName.success) {
    return { status: "error", message: "Informe um nome para identificar o celular." };
  }

  try {
    const result = await createCurrentAndroidWidgetPairing(deviceName.data);
    revalidatePath("/calendario");
    return {
      status: "success",
      message: "Código criado. Use-o no aplicativo Android em até 10 minutos.",
      pairingCode: result.pairingCode,
      expiresAt: result.pairingExpiresAt.toISOString(),
    };
  } catch (error) {
    console.error("Falha ao criar pareamento do widget Android", error);
    return { status: "error", message: "Não foi possível criar o código agora." };
  }
}

export async function revokeAndroidWidgetCredentialAction(credentialId: string) {
  const parsed = credentialIdSchema.safeParse(credentialId);
  if (!parsed.success) return;
  await revokeCurrentAndroidWidgetCredential(parsed.data);
  revalidatePath("/calendario");
}
