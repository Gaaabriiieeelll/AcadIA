"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentAcademicProfile } from "@/data/academic-profile";
import {
  AcademicProfileRequiredError,
  AcademicResourceNotFoundError,
  addCurrentAssessment,
  createCurrentSubject,
  deleteCurrentAssessment,
  deleteCurrentSubject,
  synchronizeCurrentSubjects,
  updateCurrentAttendance,
  updateCurrentBimesterGrades,
} from "@/data/subjects";
import { AuthenticationRequiredError } from "@/data/current-user";
import { getHifpbScheduleForSelection } from "@/data/hifpb";
import { Prisma } from "@/generated/prisma/client";
import { resolveAcademicClassGroup } from "@/lib/academic-profile-options";
import { resolveHifpbProfileSelection } from "@/lib/hifpb-courses";
import { getHifpbSubjects } from "@/lib/hifpb-subjects";
import {
  assessmentSchema,
  attendanceSchema,
  bimesterGradesSchema,
  resourceIdSchema,
  subjectSchema,
} from "@/lib/validation/subjects";
import type {
  AssessmentFormState,
  AttendanceFormState,
  BimesterGradesFormState,
  HifpbSubjectImportState,
  SubjectFormState,
} from "@/types/subjects";

function revalidateAcademicPages() {
  revalidatePath("/agenda");
  revalidatePath("/alertas");
  revalidatePath("/dashboard");
  revalidatePath("/disciplinas");
  revalidatePath("/plano-de-estudos");
}

function mutationErrorMessage(error: unknown) {
  if (error instanceof AuthenticationRequiredError) {
    return "Sua sessão expirou. Entre novamente para continuar.";
  }
  if (error instanceof AcademicProfileRequiredError) {
    return "Complete seu perfil acadêmico antes de cadastrar disciplinas.";
  }
  if (error instanceof AcademicResourceNotFoundError) {
    return "O registro não foi encontrado ou não pertence à sua conta.";
  }
  return null;
}

export async function createSubjectAction(
  _previousState: SubjectFormState,
  formData: FormData,
): Promise<SubjectFormState> {
  const parsed = subjectSchema.safeParse({
    name: formData.get("name"),
    teacher: formData.get("teacher"),
    color: formData.get("color"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os dados da disciplina.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    await createCurrentSubject(parsed.data);
  } catch (error) {
    const message = mutationErrorMessage(error);
    if (message) return { status: "error", message };

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        status: "error",
        message: "Você já cadastrou uma disciplina com esse nome.",
        fieldErrors: { name: ["Use um nome diferente."] },
      };
    }

    console.error("Falha ao criar disciplina", error);
    return { status: "error", message: "Não foi possível cadastrar a disciplina agora." };
  }

  revalidateAcademicPages();
  return { status: "success", message: "Disciplina cadastrada." };
}

export async function importHifpbSubjectsAction(
  _previousState: HifpbSubjectImportState,
  _formData: FormData,
): Promise<HifpbSubjectImportState> {
  void _previousState;
  void _formData;

  try {
    const profile = await getCurrentAcademicProfile();
    const selection = profile ? resolveHifpbProfileSelection(profile) : null;
    const academicClassGroup = resolveAcademicClassGroup(profile?.classGroup);

    if (!profile || !selection || !academicClassGroup) {
      return {
        status: "error",
        message: "Revise o curso, o ano e a divisão no perfil antes de sincronizar.",
      };
    }

    const schedule = await getHifpbScheduleForSelection(selection);
    const subjects = getHifpbSubjects(schedule, academicClassGroup);

    if (subjects.length === 0) {
      return {
        status: "error",
        message: "O hIFPB não publicou disciplinas para esta divisão.",
      };
    }

    const { created, updated } = await synchronizeCurrentSubjects(subjects);

    revalidateAcademicPages();

    if (created === 0 && updated === 0) {
      return {
        status: "success",
        message: `As disciplinas de ${selection.className} · divisão ${academicClassGroup} já estão atualizadas.`,
      };
    }

    const changes = [
      created > 0
        ? `${created} ${created === 1 ? "disciplina adicionada" : "disciplinas adicionadas"}`
        : null,
      updated > 0
        ? `${updated} ${updated === 1 ? "professor atualizado" : "professores atualizados"}`
        : null,
    ].filter((change): change is string => Boolean(change));

    return {
      status: "success",
      message: `${changes.join(" e ")}. Notas e frequências foram preservadas.`,
    };
  } catch (error) {
    const message = mutationErrorMessage(error);
    if (message) return { status: "error", message };

    console.error("Falha ao importar disciplinas do hIFPB", error);
    return {
      status: "error",
      message: "Não foi possível consultar o hIFPB agora. Tente novamente em instantes.",
    };
  }
}

export async function addAssessmentAction(
  subjectId: string,
  _previousState: AssessmentFormState,
  formData: FormData,
): Promise<AssessmentFormState> {
  if (!resourceIdSchema.safeParse(subjectId).success) {
    return { status: "error", message: "Disciplina inválida." };
  }

  const parsed = assessmentSchema.safeParse({
    name: formData.get("assessmentName"),
    score: formData.get("score"),
    weight: formData.get("weight"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os dados da avaliação.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    await addCurrentAssessment(subjectId, parsed.data);
  } catch (error) {
    const message = mutationErrorMessage(error);
    if (message) return { status: "error", message };
    console.error("Falha ao adicionar avaliação", error);
    return { status: "error", message: "Não foi possível salvar esta avaliação." };
  }

  revalidateAcademicPages();
  return { status: "success", message: "Avaliação adicionada." };
}

export async function updateAttendanceAction(
  subjectId: string,
  _previousState: AttendanceFormState,
  formData: FormData,
): Promise<AttendanceFormState> {
  if (!resourceIdSchema.safeParse(subjectId).success) {
    return { status: "error", message: "Disciplina inválida." };
  }

  const parsed = attendanceSchema.safeParse({
    classesHeld: formData.get("classesHeld"),
    absences: formData.get("absences"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os dados de frequência.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    await updateCurrentAttendance(subjectId, parsed.data);
  } catch (error) {
    const message = mutationErrorMessage(error);
    if (message) return { status: "error", message };
    console.error("Falha ao atualizar frequência", error);
    return { status: "error", message: "Não foi possível atualizar a frequência." };
  }

  revalidateAcademicPages();
  return { status: "success", message: "Frequência atualizada." };
}

export async function updateBimesterGradesAction(
  subjectId: string,
  _previousState: BimesterGradesFormState,
  formData: FormData,
): Promise<BimesterGradesFormState> {
  if (!resourceIdSchema.safeParse(subjectId).success) {
    return { status: "error", message: "Disciplina inválida." };
  }

  const parsed = bimesterGradesSchema.safeParse({
    bimester1: formData.get("bimester1"),
    bimester2: formData.get("bimester2"),
    bimester3: formData.get("bimester3"),
    bimester4: formData.get("bimester4"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise as notas dos bimestres.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    await updateCurrentBimesterGrades(subjectId, parsed.data);
  } catch (error) {
    const message = mutationErrorMessage(error);
    if (message) return { status: "error", message };
    console.error("Falha ao atualizar notas bimestrais", error);
    return { status: "error", message: "Não foi possível atualizar as notas." };
  }

  revalidateAcademicPages();
  return { status: "success", message: "Notas bimestrais atualizadas." };
}

export async function deleteAssessmentAction(subjectId: string, assessmentId: string) {
  const ids = z.tuple([resourceIdSchema, resourceIdSchema]).safeParse([
    subjectId,
    assessmentId,
  ]);
  if (!ids.success) return;

  await deleteCurrentAssessment(ids.data[0], ids.data[1]);
  revalidateAcademicPages();
}

export async function deleteSubjectAction(subjectId: string) {
  const parsedId = resourceIdSchema.safeParse(subjectId);
  if (!parsedId.success) return;

  await deleteCurrentSubject(parsedId.data);
  revalidateAcademicPages();
}
