"use server";

import "server-only";

import { revalidatePath } from "next/cache";

import { importCurrentSuapReport } from "@/data/suap-report";
import { AuthenticationRequiredError } from "@/data/current-user";
import { Prisma } from "@/generated/prisma/client";
import { reportImportSchema } from "@/lib/validation/suap-report";
import type { SuapReportImportResult } from "@/types/suap-report";

export async function importSuapReportAction(input: unknown): Promise<SuapReportImportResult> {
  const parsed = reportImportSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: "Revise as notas e frequências antes de importar." };
  }

  try {
    const { created, updated } = await importCurrentSuapReport(parsed.data);
    for (const path of [
      "/dashboard",
      "/disciplinas",
      "/alertas",
      "/plano-de-estudos",
      "/recomendacoes",
    ]) revalidatePath(path);

    return {
      status: "success",
      message: `${created} disciplina(s) adicionada(s) e ${updated} atualizada(s).`,
      created,
      updated,
    };
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      return { status: "error", message: "Sua sessão expirou. Entre novamente." };
    }
    if (error instanceof Error && error.message === "ACADEMIC_PROFILE_REQUIRED") {
      return { status: "error", message: "Complete o perfil acadêmico antes de importar." };
    }
    if (error instanceof Error && error.message === "SUBJECT_NOT_FOUND") {
      return { status: "error", message: "Uma disciplina selecionada não pertence à sua conta." };
    }
    if (error instanceof Error && error.message === "DUPLICATE_SUBJECT") {
      return { status: "error", message: "Duas linhas apontam para a mesma disciplina. Revise os vínculos." };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { status: "error", message: "Uma disciplina já existe com esse nome. Vincule a linha à disciplina existente e tente novamente." };
    }
    console.error("Falha ao importar boletim SUAP", error);
    return { status: "error", message: "Não foi possível importar o boletim agora." };
  }
}
