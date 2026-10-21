import "server-only";
import { requireCurrentIdentity } from "@/data/current-user";
import { db } from "@/lib/db";
import type { CompetitionSubscription } from "@/types/competitions";

export async function requireCompetitionUser() {
  const { googleSubject } = await requireCurrentIdentity();
  const user = await db.user.findUnique({ where: { googleSubject }, select: { id: true } });
  if (!user) throw new Error("Usuário acadêmico não encontrado.");
  return user;
}
export async function getCompetitionSubscriptionsForUser(userId: string): Promise<CompetitionSubscription[]> {
  return db.competitionSubscription.findMany({
    where: { userId }, select: { competitionId: true, remindersEnabled: true, includeQualified: true },
  });
}
export async function getCurrentCompetitionSubscriptions() {
  const user = await requireCompetitionUser();
  return getCompetitionSubscriptionsForUser(user.id);
}
