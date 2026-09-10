"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  createCurrentCalendarEvent,
  deleteCurrentCalendarEvent,
  setCurrentCalendarEventCompleted,
} from "@/data/calendar-events";
import { AuthenticationRequiredError } from "@/data/current-user";
import { syncCurrentGoogleCalendar } from "@/data/google-calendar";
import { AcademicResourceNotFoundError } from "@/data/subjects";
import {
  calendarEventIdSchema,
  calendarEventSchema,
} from "@/lib/validation/calendar-events";
import type { CalendarEventFormState } from "@/types/calendar-events";
import type { GoogleCalendarSyncFormState } from "@/types/google-calendar";

function revalidateCalendarPages() {
  revalidatePath("/calendario");
  revalidatePath("/agenda");
}

async function syncConnectedGoogleCalendar() {
  try {
    await syncCurrentGoogleCalendar();
  } catch (error) {
    console.error("Falha ao atualizar o Google Agenda após alterar um evento", error);
  }
}

export async function createCalendarEventAction(
  _previousState: CalendarEventFormState,
  formData: FormData,
): Promise<CalendarEventFormState> {
  const parsed = calendarEventSchema.safeParse({
    subjectId: formData.get("subjectId"),
    title: formData.get("title"),
    description: formData.get("description"),
    eventType: formData.get("eventType"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os dados do evento.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    await createCurrentCalendarEvent(parsed.data);
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      return { status: "error", message: "Sua sessão expirou. Entre novamente." };
    }
    if (error instanceof AcademicResourceNotFoundError) {
      return { status: "error", message: "A disciplina selecionada não pertence à sua conta." };
    }
    console.error("Falha ao criar evento do calendário", error);
    return { status: "error", message: "Não foi possível salvar o evento agora." };
  }

  await syncConnectedGoogleCalendar();
  revalidateCalendarPages();
  return { status: "success", message: "Evento adicionado ao calendário." };
}

export async function deleteCalendarEventAction(eventId: string) {
  const parsedId = calendarEventIdSchema.safeParse(eventId);
  if (!parsedId.success) return;

  await deleteCurrentCalendarEvent(parsedId.data);
  await syncConnectedGoogleCalendar();
  revalidateCalendarPages();
}

export async function setCalendarEventCompletedAction(eventId: string, completed: boolean) {
  const parsedId = calendarEventIdSchema.safeParse(eventId);
  if (!parsedId.success) return;

  await setCurrentCalendarEventCompleted(parsedId.data, completed);
  await syncConnectedGoogleCalendar();
  revalidateCalendarPages();
}

export async function syncGoogleCalendarAction(
  _previousState: GoogleCalendarSyncFormState,
): Promise<GoogleCalendarSyncFormState> {
  void _previousState;
  try {
    const result = await syncCurrentGoogleCalendar();
    revalidateCalendarPages();
    return {
      status: result.status === "success" ? "success" : "error",
      message: result.message,
    };
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      return { status: "error", message: "Sua sessão expirou. Entre novamente." };
    }
    console.error("Falha ao sincronizar o Google Agenda", error);
    return { status: "error", message: "Não foi possível sincronizar o Google Agenda agora." };
  }
}
