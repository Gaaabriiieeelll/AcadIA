import "server-only";

import { z } from "zod";

import { CALENDAR_EVENT_TYPES } from "@/types/calendar-events";

function isValidDateKey(value: string) {
  const date = new Date(`${value}T12:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const optionalTime = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || /^([01]\d|2[0-3]):[0-5]\d$/.test(value),
    "Informe um horário válido.",
  )
  .transform((value) => value || null);

const dateKey = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida.")
  .refine(isValidDateKey, "Informe uma data válida.");

export const calendarEventSchema = z
  .object({
    subjectId: z
      .string()
      .trim()
      .refine((value) => value === "" || z.uuid().safeParse(value).success, "Selecione uma disciplina válida.")
      .transform((value) => value || null),
    title: z
      .string()
      .trim()
      .min(1, "Título é obrigatório.")
      .max(140, "Título deve ter no máximo 140 caracteres."),
    description: z
      .string()
      .trim()
      .max(500, "Descrição deve ter no máximo 500 caracteres.")
      .transform((value) => value || null),
    eventType: z.enum(CALENDAR_EVENT_TYPES, { error: "Selecione um tipo de evento válido." }),
    startDate: dateKey,
    endDate: z
      .string()
      .trim()
      .refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), "Informe uma data válida.")
      .refine((value) => value === "" || isValidDateKey(value), "Informe uma data válida."),
    startTime: optionalTime,
    endTime: optionalTime,
  })
  .superRefine((values, context) => {
    const endDate = values.endDate || values.startDate;

    if (endDate < values.startDate) {
      context.addIssue({
        code: "custom",
        message: "A data final não pode ser anterior à inicial.",
        path: ["endDate"],
      });
    }

    if (values.endTime && !values.startTime) {
      context.addIssue({
        code: "custom",
        message: "Informe primeiro o horário inicial.",
        path: ["endTime"],
      });
    }

    if (
      endDate === values.startDate &&
      values.startTime &&
      values.endTime &&
      values.endTime <= values.startTime
    ) {
      context.addIssue({
        code: "custom",
        message: "O horário final deve ser posterior ao inicial.",
        path: ["endTime"],
      });
    }
  })
  .transform((values) => ({
    ...values,
    endDate: values.endDate || null,
  }));

export const calendarEventIdSchema = z.uuid();
