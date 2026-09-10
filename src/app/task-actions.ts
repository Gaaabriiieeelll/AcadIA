"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  createCurrentAcademicTask,
  deleteCurrentAcademicTask,
  toggleCurrentAcademicTask,
} from "@/data/academic-tasks";
import { AuthenticationRequiredError } from "@/data/current-user";
import { syncCurrentGoogleCalendar } from "@/data/google-calendar";
import { syncCurrentClassroomTasks } from "@/data/google-classroom";
import { AcademicResourceNotFoundError } from "@/data/subjects";
import { academicTaskSchema, taskIdSchema } from "@/lib/validation/academic-tasks";
import type { AcademicTaskFormState } from "@/types/academic-tasks";

function revalidateTaskPages() {
  revalidatePath("/agenda");
  revalidatePath("/alertas");
  revalidatePath("/calendario");
  revalidatePath("/dashboard");
  revalidatePath("/plano-de-estudos");
}

async function syncConnectedGoogleCalendar() {
  try {
    await syncCurrentGoogleCalendar();
  } catch (error) {
    console.error("Falha ao atualizar o Google Agenda após alterar atividades", error);
  }
}

export async function syncClassroomTasksAction() {
  const result = await syncCurrentClassroomTasks({ force: true });
  if (result.status === "synced") await syncConnectedGoogleCalendar();
  revalidateTaskPages();
}

export async function syncClassroomTasksInBackgroundAction() {
  const result = await syncCurrentClassroomTasks();
  if (result.status === "synced") {
    await syncConnectedGoogleCalendar();
    revalidateTaskPages();
  }
  return result.status;
}

export async function createAcademicTaskAction(
  _previousState: AcademicTaskFormState,
  formData: FormData,
): Promise<AcademicTaskFormState> {
  const parsed = academicTaskSchema.safeParse({
    subjectId: formData.get("subjectId"),
    title: formData.get("title"),
    description: formData.get("description"),
    dueDate: formData.get("dueDate"),
    dueTime: formData.get("dueTime"),
    priority: formData.get("priority"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os dados da atividade.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    await createCurrentAcademicTask(parsed.data);
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      return { status: "error", message: "Sua sessão expirou. Entre novamente." };
    }
    if (error instanceof AcademicResourceNotFoundError) {
      return { status: "error", message: "A disciplina selecionada não pertence à sua conta." };
    }
    console.error("Falha ao criar atividade acadêmica", error);
    return { status: "error", message: "Não foi possível salvar a atividade agora." };
  }

  await syncConnectedGoogleCalendar();
  revalidateTaskPages();
  return { status: "success", message: "Atividade adicionada à agenda." };
}

export async function toggleAcademicTaskAction(taskId: string) {
  const parsedId = taskIdSchema.safeParse(taskId);
  if (!parsedId.success) return;

  await toggleCurrentAcademicTask(parsedId.data);
  await syncConnectedGoogleCalendar();
  revalidateTaskPages();
}

export async function deleteAcademicTaskAction(taskId: string) {
  const parsedId = taskIdSchema.safeParse(taskId);
  if (!parsedId.success) return;

  await deleteCurrentAcademicTask(parsedId.data);
  await syncConnectedGoogleCalendar();
  revalidateTaskPages();
}
