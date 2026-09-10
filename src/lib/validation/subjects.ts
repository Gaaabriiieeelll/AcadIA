import "server-only";

import { z } from "zod";

import { SUBJECT_COLORS } from "@/types/subjects";

const requiredText = (label: string, maximum: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} é obrigatório.`)
    .max(maximum, `${label} deve ter no máximo ${maximum} caracteres.`);

const optionalText = (label: string, maximum: number) =>
  z
    .string()
    .trim()
    .max(maximum, `${label} deve ter no máximo ${maximum} caracteres.`)
    .transform((value) => value || null);

const decimalInput = (label: string, minimum: number, maximum: number) =>
  z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const normalized = value.trim().replace(",", ".");
      return normalized === "" ? undefined : Number(normalized);
    },
    z
      .number({ error: `${label} deve ser um número.` })
      .finite(`${label} deve ser um número válido.`)
      .min(minimum, `${label} deve ser no mínimo ${minimum}.`)
      .max(maximum, `${label} deve ser no máximo ${maximum}.`),
  );

const optionalDecimalInput = (label: string, minimum: number, maximum: number) =>
  z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const normalized = value.trim().replace(",", ".");
      return normalized === "" ? null : Number(normalized);
    },
    z
      .number({ error: `${label} deve ser um número.` })
      .finite(`${label} deve ser um número válido.`)
      .min(minimum, `${label} deve ser no mínimo ${minimum}.`)
      .max(maximum, `${label} deve ser no máximo ${maximum}.`)
      .nullable(),
  );

const integerInput = (label: string) =>
  z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const normalized = value.trim();
      return normalized === "" ? undefined : Number(normalized);
    },
    z
      .number({ error: `${label} deve ser um número inteiro.` })
      .int(`${label} deve ser um número inteiro.`)
      .min(0, `${label} não pode ser negativo.`)
      .max(10000, `${label} ultrapassou o limite permitido.`),
  );

export const subjectSchema = z.object({
  name: requiredText("Nome da disciplina", 120),
  teacher: optionalText("Professor", 120),
  color: z.enum(SUBJECT_COLORS, { error: "Selecione uma cor válida." }),
});

export const assessmentSchema = z.object({
  name: requiredText("Nome da avaliação", 100),
  score: decimalInput("Nota", 0, 100),
  weight: decimalInput("Peso", 0.01, 100),
});

export const bimesterGradesSchema = z.object({
  bimester1: optionalDecimalInput("Nota do 1º bimestre", 0, 100),
  bimester2: optionalDecimalInput("Nota do 2º bimestre", 0, 100),
  bimester3: optionalDecimalInput("Nota do 3º bimestre", 0, 100),
  bimester4: optionalDecimalInput("Nota do 4º bimestre", 0, 100),
});

export const attendanceSchema = z
  .object({
    classesHeld: integerInput("Aulas ministradas"),
    absences: integerInput("Faltas"),
  })
  .superRefine((values, context) => {
    if (values.absences > values.classesHeld) {
      context.addIssue({
        code: "custom",
        message: "Faltas não podem superar as aulas ministradas.",
        path: ["absences"],
      });
    }
  });

export const resourceIdSchema = z.string().uuid();
