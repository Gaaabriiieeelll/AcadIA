import "server-only";

import { z } from "zod";

import { TASK_PRIORITIES } from "@/types/academic-tasks";

function isValidDateKey(value: string) {
  const date = new Date(`${value}T12:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export const academicTaskSchema = z.object({
  subjectId: z.string().uuid("Selecione uma disciplina válida."),
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
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida.")
    .refine(isValidDateKey, "Informe uma data válida."),
  dueTime: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || /^([01]\d|2[0-3]):[0-5]\d$/.test(value),
      "Informe um horário válido.",
    )
    .transform((value) => value || null),
  priority: z.enum(TASK_PRIORITIES, { error: "Selecione uma prioridade válida." }),
});

export const taskIdSchema = z.string().uuid();
