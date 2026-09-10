"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { saveCurrentAcademicProfile } from "@/data/academic-profile";
import { AuthenticationRequiredError } from "@/data/current-user";
import { Prisma } from "@/generated/prisma/client";
import { academicProfileSchema } from "@/lib/validation/academic-profile";
import type { AcademicProfileFormState } from "@/types/academic-profile";

export async function saveAcademicProfileAction(
  _previousState: AcademicProfileFormState,
  formData: FormData,
): Promise<AcademicProfileFormState> {
  const parsed = academicProfileSchema.safeParse({
    registrationNumber: formData.get("registrationNumber"),
    campus: formData.get("campus"),
    course: formData.get("course"),
    classGroup: formData.get("classGroup"),
    academicStage: formData.get("academicStage"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos destacados antes de continuar.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    await saveCurrentAcademicProfile(parsed.data);
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      return {
        status: "error",
        message: "Sua sessão expirou. Entre novamente para salvar o perfil.",
      };
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        status: "error",
        message: "Esta matrícula já está associada a outro perfil.",
        fieldErrors: {
          registrationNumber: ["Informe uma matrícula diferente."],
        },
      };
    }

    console.error("Falha ao salvar o perfil acadêmico", error);
    return {
      status: "error",
      message: "Não foi possível salvar o perfil agora. Tente novamente.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/horarios");
  redirect("/dashboard");
}
