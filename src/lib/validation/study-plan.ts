import "server-only";

import { z } from "zod";

import { getStudyWeekStart, isValidDateKey } from "@/lib/study-plan";
import { STUDY_WEEKDAYS } from "@/types/study-plan";

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Informe um horário válido.");

const dateSchema = z
  .string()
  .refine(isValidDateKey, "Informe uma data válida.");

const durationSchema = z.preprocess(
  (value) => typeof value === "string" ? Number(value) : value,
  z.union([z.literal(30), z.literal(45), z.literal(50), z.literal(60), z.literal(90)]),
);

const breakSchema = z.preprocess(
  (value) => typeof value === "string" ? Number(value) : value,
  z.union([z.literal(0), z.literal(5), z.literal(10), z.literal(15)]),
);

const availabilitySchema = z
  .array(z.object({
    weekday: z.union([
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
      z.literal(5),
      z.literal(6),
      z.literal(7),
    ]),
    startTime: timeSchema,
    endTime: timeSchema,
  }))
  .min(1, "Selecione pelo menos um dia disponível.")
  .superRefine((items, context) => {
    items.forEach((item, index) => {
      if (item.startTime >= item.endTime) {
        context.addIssue({
          code: "custom",
          message: "O horário final deve ser posterior ao inicial.",
          path: [index, "endTime"],
        });
      }
    });
  });

export const studyPlanPreferenceSchema = z.object({
  weeklyGoalHours: z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const normalized = value.trim().replace(",", ".");
      return normalized === "" ? undefined : Number(normalized);
    },
    z
      .number({ error: "A meta semanal deve ser um número." })
      .min(0.5, "A meta semanal deve ser de pelo menos 30 minutos.")
      .max(20, "A meta semanal deve ser de no máximo 20 horas."),
  ),
  sessionDuration: durationSchema,
  breakDuration: breakSchema,
  availability: availabilitySchema,
}).transform((values) => ({
  weeklyGoalMinutes: Math.round(values.weeklyGoalHours * 60),
  sessionDuration: values.sessionDuration,
  breakDuration: values.breakDuration,
  availability: values.availability,
}));

export function studyAvailabilityFromFormData(formData: FormData) {
  return STUDY_WEEKDAYS
    .filter((day) => formData.get(`enabled-${day.value}`) === "on")
    .map((day) => ({
      weekday: day.value,
      startTime: formData.get(`start-${day.value}`),
      endTime: formData.get(`end-${day.value}`),
    }));
}

export const studySessionSchema = z.object({
  subjectId: z.string().uuid("Selecione uma disciplina válida."),
  scheduledDate: dateSchema,
  startTime: timeSchema,
  durationMinutes: durationSchema,
  focus: z
    .string()
    .trim()
    .max(160, "O foco deve ter no máximo 160 caracteres.")
    .transform((value) => value || null),
});

export const studySessionRescheduleSchema = studySessionSchema.pick({
  scheduledDate: true,
  startTime: true,
  durationMinutes: true,
});

export const studySessionIdSchema = z.string().uuid();

export const studyWeekStartSchema = dateSchema.transform(getStudyWeekStart);
