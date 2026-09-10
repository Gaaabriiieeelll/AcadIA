import "server-only";

import { z } from "zod";

import { ACADEMIC_STAGES, ETIM_COURSES } from "@/lib/academic-profile-options";

const requiredText = (label: string, maximum: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} é obrigatório.`)
    .max(maximum, `${label} deve ter no máximo ${maximum} caracteres.`);

export const academicProfileSchema = z.object({
  registrationNumber: requiredText("Matrícula", 30).regex(
    /^\d+$/,
    "Use somente números na matrícula.",
  ),
  campus: z.literal("João Pessoa", {
    error: "O campus inicial do MVP deve ser João Pessoa.",
  }),
  course: z.enum(ETIM_COURSES, {
    error: "Selecione um curso ETIM válido do Campus João Pessoa.",
  }),
  classGroup: z
    .string()
    .trim()
    .max(50, "Turma deve ter no máximo 50 caracteres.")
    .transform((value) => value || null),
  academicStage: z.enum(ACADEMIC_STAGES, {
    error: "Selecione o ano atual, do 1º ao 4º.",
  }),
});
