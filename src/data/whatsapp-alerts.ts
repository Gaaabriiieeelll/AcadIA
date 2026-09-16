import "server-only";

import { refreshAcademicAlertRecordsForUser } from "@/data/academic-alerts";
import { getAcademicCalendarTodayKey } from "@/data/academic-calendar";
import { db } from "@/lib/db";
import { EvolutionApiError, sendEvolutionTextMessage } from "@/lib/evolution-api";
import { decryptServerSecret } from "@/lib/secret-box";
import type {
  AcademicAlertCategory,
  AcademicAlertSeverity,
} from "@/types/academic-alerts";

const MAX_DELIVERY_ATTEMPTS = 5;
const DELIVERY_CLAIM_TTL_MS = 10 * 60 * 1_000;

const categoryLabels: Record<AcademicAlertCategory, string> = {
  grades: "Notas",
  attendance: "Frequência",
  tasks: "Agenda",
  calendar: "Calendário",
};

const severityLabels: Record<AcademicAlertSeverity, string> = {
  critical: "Urgente",
  warning: "Atenção",
  info: "Informativo",
};

type DispatchPreference = {
  userId: string;
  encryptedWhatsappPhone: string | null;
  targetAverage: number;
  minimumAttendance: number;
  gradesEnabled: boolean;
  attendanceEnabled: boolean;
  tasksEnabled: boolean;
  calendarEnabled: boolean;
};

function categoryEnabled(category: string, preference: DispatchPreference) {
  if (category === "grades") return preference.gradesEnabled;
  if (category === "attendance") return preference.attendanceEnabled;
  if (category === "tasks") return preference.tasksEnabled;
  if (category === "calendar") return preference.calendarEnabled;
  return false;
}

function absoluteAlertUrl(href: string) {
  if (/^https?:\/\//i.test(href)) return href;
  const baseUrl = process.env.NEXTAUTH_URL?.trim().replace(/\/+$/, "");
  if (!baseUrl) return null;

  try {
    return new URL(href, `${baseUrl}/`).toString();
  } catch {
    return null;
  }
}

function alertMessage(alert: {
  category: string;
  severity: string;
  title: string;
  description: string;
  href: string;
}) {
  const category = categoryLabels[alert.category as AcademicAlertCategory] ?? "Acadêmico";
  const severity = severityLabels[alert.severity as AcademicAlertSeverity] ?? "Alerta";
  const link = absoluteAlertUrl(alert.href);

  return [
    `*AcadIA · ${severity}*`,
    `${category}: *${alert.title}*`,
    alert.description,
    link ? `Acesse: ${link}` : null,
    "\nVocê pode desativar estes envios na Central de alertas.",
  ].filter(Boolean).join("\n\n");
}

function deliveryError(error: unknown) {
  if (error instanceof EvolutionApiError) return error.message.slice(0, 500);
  console.error("Falha no job diário de alertas por WhatsApp", error);
  return "Falha inesperada ao enviar a notificação.";
}

async function refreshEligibleAlertRecords(preferences: DispatchPreference[]) {
  let failed = 0;
  const concurrency = 4;

  for (let index = 0; index < preferences.length; index += concurrency) {
    const batch = preferences.slice(index, index + concurrency);
    const results = await Promise.allSettled(
      batch.map((preference) => refreshAcademicAlertRecordsForUser(
        preference.userId,
        {
          targetAverage: preference.targetAverage,
          minimumAttendance: preference.minimumAttendance,
        },
      )),
    );
    failed += results.filter((result) => result.status === "rejected").length;
  }

  return failed;
}

export async function dispatchPendingWhatsAppAlerts(requestedLimit = 25) {
  const limit = Math.min(Math.max(Math.trunc(requestedLimit), 1), 100);
  const preferences = await db.academicAlertPreference.findMany({
    where: {
      whatsappEnabled: true,
      encryptedWhatsappPhone: { not: null },
      whatsappConsentAt: { not: null },
      whatsappVerifiedAt: { not: null },
    },
    select: {
      userId: true,
      encryptedWhatsappPhone: true,
      targetAverage: true,
      minimumAttendance: true,
      gradesEnabled: true,
      attendanceEnabled: true,
      tasksEnabled: true,
      calendarEnabled: true,
    },
  });

  if (preferences.length === 0) {
    return {
      eligible: 0,
      refreshed: 0,
      refreshFailed: 0,
      scanned: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
    };
  }

  const preferenceByUser = new Map(preferences.map((preference) => [preference.userId, preference]));
  const refreshFailed = await refreshEligibleAlertRecords(preferences);
  if (refreshFailed > 0) {
    console.error(`Falha ao recalcular alertas de ${refreshFailed} usuário(s) do WhatsApp.`);
  }
  const todayDateKey = getAcademicCalendarTodayKey();
  const today = new Date(`${todayDateKey}T12:00:00.000Z`);
  const staleClaimThreshold = new Date(Date.now() - DELIVERY_CLAIM_TTL_MS);
  const records = await db.academicAlertRecord.findMany({
    where: {
      userId: { in: preferences.map((preference) => preference.userId) },
      resolvedAt: null,
      dismissedAt: null,
      whatsappSentAt: null,
      whatsappAttemptCount: { lt: MAX_DELIVERY_ATTEMPTS },
      AND: [
        {
          OR: [
            { snoozedUntil: null },
            { snoozedUntil: { lte: today } },
          ],
        },
        {
          OR: [
            { whatsappLastAttemptAt: null },
            { whatsappLastAttemptAt: { lte: staleClaimThreshold } },
          ],
        },
      ],
    },
    orderBy: [
      { firstDetectedAt: "asc" },
      { createdAt: "asc" },
    ],
    take: limit * 4,
    select: {
      id: true,
      userId: true,
      category: true,
      severity: true,
      title: true,
      description: true,
      href: true,
      whatsappAttemptCount: true,
    },
  });

  let sent = 0;
  let failed = 0;
  let skipped = 0;
  let scanned = 0;

  for (const record of records) {
    if (scanned >= limit) break;
    const preference = preferenceByUser.get(record.userId);
    if (!preference || !categoryEnabled(record.category, preference)) {
      skipped += 1;
      continue;
    }

    scanned += 1;
    const attemptedAt = new Date();
    const claimed = await db.academicAlertRecord.updateMany({
      where: {
        id: record.id,
        whatsappSentAt: null,
        whatsappAttemptCount: record.whatsappAttemptCount,
        OR: [
          { whatsappLastAttemptAt: null },
          { whatsappLastAttemptAt: { lte: staleClaimThreshold } },
        ],
      },
      data: {
        whatsappAttemptCount: { increment: 1 },
        whatsappLastAttemptAt: attemptedAt,
        whatsappLastError: null,
      },
    });
    if (claimed.count === 0) {
      skipped += 1;
      continue;
    }

    try {
      const phone = decryptServerSecret(preference.encryptedWhatsappPhone!);
      const result = await sendEvolutionTextMessage({
        number: phone,
        text: alertMessage(record),
      });
      await db.academicAlertRecord.update({
        where: { id: record.id },
        data: {
          whatsappSentAt: new Date(),
          whatsappMessageId: result.messageId,
          whatsappLastError: null,
        },
        select: { id: true },
      });
      sent += 1;
    } catch (error) {
      await db.academicAlertRecord.update({
        where: { id: record.id },
        data: { whatsappLastError: deliveryError(error) },
        select: { id: true },
      });
      failed += 1;
    }
  }

  return {
    eligible: preferences.length,
    refreshed: preferences.length - refreshFailed,
    refreshFailed,
    scanned,
    sent,
    failed,
    skipped,
  };
}
