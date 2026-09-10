import { z } from "zod";

export const noticeChecklistKeySchema = z.string().trim().min(1).max(80).regex(/^[a-z0-9-]+$/);
export const noticeChecklistCompletedSchema = z.boolean();
