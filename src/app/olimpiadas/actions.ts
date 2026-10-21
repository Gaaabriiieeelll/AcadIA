"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { competitions } from "@/data/competitions";
import { requireCompetitionUser } from "@/data/competition-subscriptions";
import { db } from "@/lib/db";

const subscriptionSchema = z.object({
  competitionId: z.string().max(100), following: z.boolean(),
  remindersEnabled: z.boolean(), includeQualified: z.boolean(),
});
export async function saveCompetitionSubscription(input: {
  competitionId: string; following: boolean; remindersEnabled: boolean; includeQualified: boolean;
}): Promise<{ ok: boolean; message: string }> {
  const user = await requireCompetitionUser();
  const result = subscriptionSchema.safeParse(input);
  if (!result.success) return { ok: false, message: "Preferências inválidas." };
  const values = result.data;
  const competition = competitions.find((c) => c.id === values.competitionId);
  if (!competition) return { ok: false, message: "Competição não encontrada." };
  try {
    await db.$transaction(async (tx) => {
      const key = { userId: user.id, competitionId: competition.id };
      if (values.following) {
        const preferences = { remindersEnabled: values.remindersEnabled, includeQualified: values.includeQualified };
        await tx.competitionSubscription.upsert({
          where: { userId_competitionId: key }, create: { ...key, ...preferences }, update: preferences,
        });
      } else {
        await tx.competitionSubscription.deleteMany({ where: key });
      }
      // Immediately retire disabled reminders, including queued deliveries. Existing channel consent is untouched.
      const disabledKeys = competition.stages.filter((stage) => !values.following || !values.remindersEnabled
        || (stage.access === "qualified" && !values.includeQualified))
        .map((stage) => `competition:${competition.id}:${stage.id}`);
      await tx.academicAlertRecord.updateMany({
        where: { userId: user.id, resolvedAt: null, ...(!values.following || !values.remindersEnabled
          ? { alertKey: { startsWith: `competition:${competition.id}:` } }
          : { alertKey: { in: disabledKeys } }) },
        data: { resolvedAt: new Date() },
      });
    });
  } catch {
    return { ok: false, message: "Não foi possível salvar. Tente novamente." };
  }
  revalidatePath("/olimpiadas");
  revalidatePath("/alertas");
  return { ok: true, message: values.following ? "Acompanhamento salvo." : "Acompanhamento removido." };
}
