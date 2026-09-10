import "server-only";

import { z } from "zod";

import { trustedBrowserPushEndpoint } from "@/lib/browser-push-utils";

const percentageInput = (label: string) =>
  z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const normalized = value.trim();
      return normalized === "" ? undefined : Number(normalized);
    },
    z
      .number({ error: `${label} deve ser um número.` })
      .int(`${label} deve ser um número inteiro.`)
      .min(0, `${label} deve ser no mínimo 0.`)
      .max(100, `${label} deve ser no máximo 100.`),
  );

export const alertKeySchema = z
  .string()
  .min(1)
  .max(255)
  .regex(/^[a-zA-Z0-9_-]+$/);

export const snoozeDaysSchema = z.preprocess(
  (value) => typeof value === "string" ? Number(value) : value,
  z.union([z.literal(1), z.literal(3), z.literal(7)]),
);

export const alertPreferenceSchema = z.object({
  targetAverage: percentageInput("Meta de média"),
  minimumAttendance: percentageInput("Frequência mínima"),
  gradesEnabled: z.boolean(),
  attendanceEnabled: z.boolean(),
  tasksEnabled: z.boolean(),
  calendarEnabled: z.boolean(),
});

const pushKeySchema = z
  .string()
  .min(16)
  .max(256)
  .regex(/^[A-Za-z0-9_-]+={0,2}$/, "Chave de assinatura push inválida.");

export const browserPushSubscriptionSchema = z.object({
  endpoint: z
    .url("Endpoint push inválido.")
    .max(2_048)
    .refine(
      trustedBrowserPushEndpoint,
      "O endpoint não pertence a um serviço Web Push aceito.",
    ),
  expirationTime: z.number().int().positive().nullable(),
  keys: z.object({
    auth: pushKeySchema,
    p256dh: pushKeySchema,
  }),
});

export const browserPushEndpointSchema = browserPushSubscriptionSchema.shape.endpoint;

function normalizeBrazilianPhone(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (!digits.startsWith("55") && (digits.length === 10 || digits.length === 11)) {
    digits = `55${digits}`;
  }
  return digits;
}

export const whatsappPhoneSchema = z
  .string()
  .trim()
  .transform(normalizeBrazilianPhone)
  .refine(
    (value) => value === "" || /^55\d{10,11}$/.test(value),
    "Informe um celular brasileiro com DDD.",
  );

export const whatsappPreferenceSchema = z
  .object({
    enabled: z.boolean(),
    phone: whatsappPhoneSchema,
    consent: z.boolean(),
  })
  .superRefine((value, context) => {
    if (value.enabled && !value.consent) {
      context.addIssue({
        code: "custom",
        message: "Confirme o consentimento para ativar o WhatsApp.",
        path: ["consent"],
      });
    }
  });
