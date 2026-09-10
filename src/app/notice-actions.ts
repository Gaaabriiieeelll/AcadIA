"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { setCurrentNoticeChecklistItem } from "@/data/notices";
import {
  noticeChecklistCompletedSchema,
  noticeChecklistKeySchema,
} from "@/lib/validation/notices";

const noticeChecklistUpdateSchema = z.tuple([
  noticeChecklistKeySchema,
  noticeChecklistKeySchema,
  noticeChecklistCompletedSchema,
]);

export async function updateNoticeChecklistAction(
  noticeKey: string,
  itemKey: string,
  completed: boolean,
) {
  const parsed = noticeChecklistUpdateSchema.safeParse([noticeKey, itemKey, completed]);
  if (!parsed.success) return;

  await setCurrentNoticeChecklistItem(...parsed.data);
  revalidatePath("/editais");
}
