import "server-only";
import { randomUUID } from "node:crypto";
import { requireCurrentIdentity } from "@/data/current-user";
import { db } from "@/lib/db";
import { getGoogleCalendarAccessToken, GoogleCalendarConnectionError } from "@/lib/google-calendar-credentials";
import { readCategoryCalendarIds } from "@/lib/google-calendar-categories";
import { calendarVisibility, hasCalendarFilterPermission, syncCalendarVisibility, visibilityPatch, type CalendarVisibilityPatch } from "@/lib/google-calendar-filters";
import { GoogleCalendarError } from "@/lib/google-calendar-sync";

export async function getCurrentCalendarFilters() {
  const { googleSubject } = await requireCurrentIdentity();
  const user = await db.user.findUniqueOrThrow({ where: { googleSubject }, select: {
    calendarVisibility: true, calendarVisibilityPending: true,
    googleCalendarCredential: { select: { grantedScopes: true } },
    googleCalendarIntegration: { select: { id: true } },
  } });
  return {
    visibility: calendarVisibility(user.calendarVisibility),
    hasPermission: hasCalendarFilterPermission(user.googleCalendarCredential?.grantedScopes ?? ""),
    connected: Boolean(user.googleCalendarIntegration),
    pending: Object.keys(visibilityPatch(user.calendarVisibilityPending)).length > 0,
  };
}

export async function updateCurrentCalendarFilters(changes: CalendarVisibilityPatch = {}) {
  const { googleSubject } = await requireCurrentIdentity();
  const user = await db.user.findUniqueOrThrow({ where: { googleSubject }, select: { id: true } });
  const token = randomUUID();
  const lease = await db.user.updateMany({
    where: { id: user.id, OR: [{ calendarSyncLeaseUntil: null }, { calendarSyncLeaseUntil: { lt: new Date() } }] },
    data: { calendarSyncLeaseToken: token, calendarSyncLeaseUntil: new Date(Date.now() + 15 * 60_000) },
  });
  if (!lease.count) return { status: "error" as const, message: "Há uma sincronização em andamento. Aguarde e tente novamente.", changed: false };
  let changed = false;
  try {
    const stored = await db.user.findUniqueOrThrow({ where: { id: user.id }, select: {
      calendarVisibility: true, calendarVisibilityPending: true,
      googleCalendarCredential: { select: { grantedScopes: true } },
      googleCalendarIntegration: { select: { calendarId: true, categoryCalendars: true } },
    } });
    const visibility = calendarVisibility(stored.calendarVisibility);
    const pending = { ...visibilityPatch(stored.calendarVisibilityPending), ...visibilityPatch(changes) };
    const before = JSON.stringify(visibility);
    Object.assign(visibility, visibilityPatch(changes));
    // Save the user's choice before attempting Google; failed writes stay pending.
    await db.user.update({ where: { id: user.id }, data: {
      calendarVisibility: visibility, calendarVisibilityPending: pending,
    } });
    changed = before !== JSON.stringify(visibility);
    if (!hasCalendarFilterPermission(stored.googleCalendarCredential?.grantedScopes ?? "")) {
      return { status: "permission-required" as const, message: "Filtros salvos no site. Ative a integração dos filtros para aplicar a seleção ao Google Agenda.", changed };
    }
    if (!stored.googleCalendarIntegration) {
      return { status: "error" as const, message: "Filtros salvos. Sincronize os eventos para criar as agendas antes de integrar os filtros.", changed };
    }
    const ids = readCategoryCalendarIds(stored.googleCalendarIntegration.categoryCalendars);
    ids.institutional = stored.googleCalendarIntegration.calendarId;
    const accessToken = await getGoogleCalendarAccessToken(googleSubject);
    await syncCalendarVisibility(ids, pending, accessToken, async (category, visible) => {
      changed ||= visibility[category] !== visible || pending[category] !== undefined;
      visibility[category] = visible;
      delete pending[category];
      await db.user.update({ where: { id: user.id }, data: {
        calendarVisibility: visibility, calendarVisibilityPending: pending,
      } });
    });
    if (Object.keys(pending).length) {
      return { status: "error" as const, message: "Algumas agendas ainda não foram criadas. Sincronize os eventos e depois atualize os filtros.", changed };
    }
    return { status: "success" as const, message: "Filtros sincronizados com o Google Agenda.", changed };
  } catch (error) {
    const needsPermission = (error instanceof GoogleCalendarError && (error.code === "AUTH_EXPIRED" || error.code === "FORBIDDEN"))
      || error instanceof GoogleCalendarConnectionError && error.code !== "UPSTREAM_FAILURE";
    return { status: needsPermission ? "permission-required" as const : "error" as const,
      message: needsPermission
        ? "O Google não autorizou os filtros. Ative ou renove a integração dos filtros. Suas escolhas locais foram preservadas."
        : "Não foi possível atualizar os filtros no Google agora. Suas escolhas locais foram preservadas para a próxima tentativa.", changed };
  } finally {
    await db.user.updateMany({ where: { id: user.id, calendarSyncLeaseToken: token }, data: {
      calendarSyncLeaseToken: null, calendarSyncLeaseUntil: null,
    } });
  }
}
