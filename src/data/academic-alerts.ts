import "server-only";

import {
  academicCalendarEvents,
  getAcademicCalendarTodayKey,
} from "@/data/academic-calendar";
import { getAcademicTasksForUser } from "@/data/academic-tasks";
import { getCalendarEventsForUser } from "@/data/calendar-events";
import { requireCurrentIdentity } from "@/data/current-user";
import { getSubjectsForUser } from "@/data/subjects";
import { db } from "@/lib/db";
import {
  EvolutionApiError,
  isEvolutionApiConfigured,
  sendEvolutionTextMessage,
} from "@/lib/evolution-api";
import {
  ALERT_LOOKAHEAD_DAYS,
  DEFAULT_ALERT_PREFERENCES,
  addDaysToDateKey,
  buildAcademicAlertCenter,
} from "@/lib/academic-alerts";
import { decryptServerSecret, encryptServerSecret } from "@/lib/secret-box";
import type {
  AcademicAlertCategory,
  AcademicAlertCenterDTO,
  AcademicAlertDTO,
  AcademicAlertHistoryItemDTO,
  AcademicAlertPreferencesDTO,
  AcademicAlertSeverity,
  AcademicWhatsAppSettingsDTO,
} from "@/types/academic-alerts";

type AlertPreferenceValues = Omit<AcademicAlertPreferencesDTO, "browserNotifications">;

type AlertCalculationPreferences = Pick<
  AcademicAlertPreferencesDTO,
  "targetAverage" | "minimumAttendance"
>;

type WhatsAppPreferenceValues = {
  enabled: boolean;
  phone: string;
  consent: boolean;
};

const WHATSAPP_TEST_COOLDOWN_MS = 10 * 60 * 1_000;
export const WHATSAPP_TEST_COOLDOWN_MESSAGE =
  "Aguarde 10 minutos antes de enviar outro teste pelo WhatsApp.";

function databaseDate(value: string) {
  return new Date(`${value}T12:00:00.000Z`);
}

function toDateKey(date: Date | null) {
  return date?.toISOString().slice(0, 10) ?? null;
}

function preferenceDTO(
  preference: {
    targetAverage: number;
    minimumAttendance: number;
    gradesEnabled: boolean;
    attendanceEnabled: boolean;
    tasksEnabled: boolean;
    calendarEnabled: boolean;
    browserNotifications: boolean;
  } | null,
): AcademicAlertPreferencesDTO {
  return preference ?? DEFAULT_ALERT_PREFERENCES;
}

async function requireAlertUser() {
  const { googleSubject } = await requireCurrentIdentity();
  const user = await db.user.findUnique({
    where: { googleSubject },
    select: { id: true },
  });

  if (!user) throw new Error("Usuário acadêmico não encontrado.");
  return user;
}

function categoryIsEnabled(
  category: AcademicAlertCategory,
  preferences: AcademicAlertPreferencesDTO,
) {
  if (category === "grades") return preferences.gradesEnabled;
  if (category === "attendance") return preferences.attendanceEnabled;
  if (category === "tasks") return preferences.tasksEnabled;
  return preferences.calendarEnabled;
}

async function syncAlertRecords(userId: string, alerts: AcademicAlertDTO[]) {
  const existingRecords = await db.academicAlertRecord.findMany({
    where: { userId },
    select: {
      category: true,
      href: true,
      id: true,
      alertKey: true,
      severity: true,
      title: true,
      description: true,
      resolvedAt: true,
    },
  });
  const existingByKey = new Map(existingRecords.map((record) => [record.alertKey, record]));
  const activeKeys = alerts.map((alert) => alert.id);
  const detectedAt = new Date();
  const newAlerts = alerts.filter((alert) => !existingByKey.has(alert.id));
  const existingAlerts = alerts.filter((alert) => existingByKey.has(alert.id));

  await Promise.all([
    newAlerts.length > 0
      ? db.academicAlertRecord.createMany({
          data: newAlerts.map((alert) => ({
            userId,
            alertKey: alert.id,
            category: alert.category,
            severity: alert.severity,
            title: alert.title,
            description: alert.description,
            actionLabel: alert.actionLabel,
            href: alert.href,
            dateKey: alert.dateKey ? databaseDate(alert.dateKey) : null,
            accentColor: alert.accentColor,
            lastDetectedAt: detectedAt,
          })),
          skipDuplicates: true,
        })
      : Promise.resolve({ count: 0 }),
    ...existingAlerts.map((alert) => {
      const existing = existingByKey.get(alert.id)!;
      const recurring = existing.resolvedAt !== null;
      const contentChanged = existing.category !== alert.category
        || existing.severity !== alert.severity
        || existing.title !== alert.title
        || existing.description !== alert.description
        || existing.href !== alert.href;

      return db.academicAlertRecord.updateMany({
        where: { userId, alertKey: alert.id },
        data: {
          category: alert.category,
          severity: alert.severity,
          title: alert.title,
          description: alert.description,
          actionLabel: alert.actionLabel,
          href: alert.href,
          dateKey: alert.dateKey ? databaseDate(alert.dateKey) : null,
          accentColor: alert.accentColor,
          lastDetectedAt: detectedAt,
          resolvedAt: null,
          readAt: recurring || contentChanged ? null : undefined,
          dismissedAt: recurring ? null : undefined,
          snoozedUntil: recurring ? null : undefined,
          whatsappSentAt: recurring || contentChanged ? null : undefined,
          whatsappMessageId: recurring || contentChanged ? null : undefined,
          whatsappLastAttemptAt: recurring || contentChanged ? null : undefined,
          whatsappAttemptCount: recurring || contentChanged ? 0 : undefined,
          whatsappLastError: recurring || contentChanged ? null : undefined,
          browserPushGeneration: recurring || contentChanged ? { increment: 1 } : undefined,
        },
      });
    }),
    db.academicAlertRecord.updateMany({
      where: {
        userId,
        resolvedAt: null,
        ...(activeKeys.length > 0 ? { alertKey: { notIn: activeKeys } } : {}),
      },
      data: { resolvedAt: detectedAt },
    }),
  ]);
}

async function calculateAcademicAlertsForUser(
  userId: string,
  preferences: AlertCalculationPreferences,
) {
  const todayDateKey = getAcademicCalendarTodayKey();
  const rangeEnd = addDaysToDateKey(todayDateKey, ALERT_LOOKAHEAD_DAYS);
  const [subjects, tasks, personalEvents] = await Promise.all([
    getSubjectsForUser(userId),
    getAcademicTasksForUser(userId),
    getCalendarEventsForUser(userId, todayDateKey, rangeEnd),
  ]);
  const officialEvents = academicCalendarEvents.filter(
    (event) => event.startDate <= rangeEnd
      && (event.endDate ?? event.startDate) >= todayDateKey,
  );

  return buildAcademicAlertCenter({
    subjects,
    tasks,
    personalEvents,
    officialEvents,
    todayDateKey,
    targetAverage: preferences.targetAverage,
    minimumAttendance: preferences.minimumAttendance,
  });
}

export async function refreshAcademicAlertRecordsForUser(
  userId: string,
  preferences: AlertCalculationPreferences,
) {
  const calculated = await calculateAcademicAlertsForUser(userId, preferences);
  await syncAlertRecords(userId, calculated.alerts);
  return calculated.alerts.length;
}

function historyStatus(record: {
  dismissedAt: Date | null;
  snoozedUntil: Date | null;
  resolvedAt: Date | null;
}) {
  if (record.resolvedAt) return "resolved" as const;
  if (record.dismissedAt) return "dismissed" as const;
  if (record.snoozedUntil) return "snoozed" as const;
  return "resolved" as const;
}

function historyOccurredAt(record: {
  dismissedAt: Date | null;
  snoozedUntil: Date | null;
  resolvedAt: Date | null;
  lastDetectedAt: Date;
}) {
  if (record.resolvedAt) return record.resolvedAt.toISOString();
  return (
    record.dismissedAt
    ?? record.lastDetectedAt
  ).toISOString();
}

export async function getCurrentAcademicAlertCenter(): Promise<AcademicAlertCenterDTO> {
  const user = await requireAlertUser();
  const storedPreference = await db.academicAlertPreference.findUnique({
    where: { userId: user.id },
    select: {
      targetAverage: true,
      minimumAttendance: true,
      gradesEnabled: true,
      attendanceEnabled: true,
      tasksEnabled: true,
      calendarEnabled: true,
      browserNotifications: true,
    },
  });
  const preferences = preferenceDTO(storedPreference);
  const calculated = await calculateAcademicAlertsForUser(user.id, preferences);
  const { todayDateKey } = calculated;

  await syncAlertRecords(user.id, calculated.alerts);

  const records = await db.academicAlertRecord.findMany({
    where: { userId: user.id },
    orderBy: [{ lastDetectedAt: "desc" }, { createdAt: "desc" }],
    take: 80,
    select: {
      id: true,
      alertKey: true,
      category: true,
      severity: true,
      title: true,
      description: true,
      href: true,
      readAt: true,
      dismissedAt: true,
      snoozedUntil: true,
      resolvedAt: true,
      lastDetectedAt: true,
    },
  });
  const recordsByKey = new Map(records.map((record) => [record.alertKey, record]));
  const activeRecords = calculated.alerts.map((alert) => ({
    alert,
    record: recordsByKey.get(alert.id),
  }));
  const hidden = activeRecords.filter(({ record }) => record?.dismissedAt != null).length;
  const snoozed = activeRecords.filter(({ record }) => {
    const snoozedUntil = toDateKey(record?.snoozedUntil ?? null);
    return record?.dismissedAt == null
      && snoozedUntil !== null
      && snoozedUntil > todayDateKey;
  }).length;
  const alerts = activeRecords
    .filter(({ alert, record }) => {
      const snoozedUntil = toDateKey(record?.snoozedUntil ?? null);
      return categoryIsEnabled(alert.category, preferences)
        && record?.dismissedAt == null
        && (snoozedUntil === null || snoozedUntil <= todayDateKey);
    })
    .map(({ alert, record }) => ({ ...alert, read: record?.readAt != null }));
  const history: AcademicAlertHistoryItemDTO[] = records
    .filter((record) => {
      const snoozedUntil = toDateKey(record.snoozedUntil);
      return Boolean(
        record.dismissedAt
        || record.resolvedAt
        || (snoozedUntil && snoozedUntil > todayDateKey),
      );
    })
    .slice(0, 30)
    .map((record) => ({
      id: record.id,
      alertKey: record.alertKey,
      category: record.category as AcademicAlertCategory,
      severity: record.severity as AcademicAlertSeverity,
      title: record.title,
      description: record.description,
      status: historyStatus(record),
      occurredAt: historyOccurredAt(record),
      snoozedUntil: toDateKey(record.snoozedUntil),
      href: record.href,
    }));

  return {
    alerts,
    summary: {
      total: alerts.length,
      critical: alerts.filter((alert) => alert.severity === "critical").length,
      warning: alerts.filter((alert) => alert.severity === "warning").length,
      info: alerts.filter((alert) => alert.severity === "info").length,
      academic: alerts.filter((alert) => alert.category === "grades" || alert.category === "attendance").length,
      planning: alerts.filter((alert) => alert.category === "tasks" || alert.category === "calendar").length,
      unread: alerts.filter((alert) => !alert.read).length,
      snoozed,
      hidden,
    },
    todayDateKey,
    preferences,
    history,
  };
}

export async function getCurrentAlertPreferences(): Promise<AcademicAlertPreferencesDTO> {
  const user = await requireAlertUser();
  const preference = await db.academicAlertPreference.findUnique({
    where: { userId: user.id },
    select: {
      targetAverage: true,
      minimumAttendance: true,
      gradesEnabled: true,
      attendanceEnabled: true,
      tasksEnabled: true,
      calendarEnabled: true,
      browserNotifications: true,
    },
  });

  return preferenceDTO(preference);
}

export async function updateCurrentAlertPreferences(values: AlertPreferenceValues) {
  const user = await requireAlertUser();
  await db.academicAlertPreference.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...values },
    update: values,
    select: { id: true },
  });
}

export async function getCurrentWhatsAppSettings(): Promise<AcademicWhatsAppSettingsDTO> {
  const user = await requireAlertUser();
  const preference = await db.academicAlertPreference.findUnique({
    where: { userId: user.id },
    select: {
      whatsappEnabled: true,
      whatsappPhoneLastFour: true,
      whatsappConsentAt: true,
      whatsappVerifiedAt: true,
      whatsappLastTestAt: true,
    },
  });

  return {
    enabled: preference?.whatsappEnabled ?? false,
    phoneLastFour: preference?.whatsappPhoneLastFour ?? null,
    consentAt: preference?.whatsappConsentAt?.toISOString() ?? null,
    verifiedAt: preference?.whatsappVerifiedAt?.toISOString() ?? null,
    lastTestAt: preference?.whatsappLastTestAt?.toISOString() ?? null,
    serviceConfigured: isEvolutionApiConfigured(),
  };
}

export async function updateCurrentWhatsAppSettings(values: WhatsAppPreferenceValues) {
  const user = await requireAlertUser();
  const existing = await db.academicAlertPreference.findUnique({
    where: { userId: user.id },
    select: {
      whatsappEnabled: true,
      encryptedWhatsappPhone: true,
      whatsappPhoneLastFour: true,
      whatsappVerifiedAt: true,
      whatsappLastTestAt: true,
    },
  });

  if (values.enabled && !isEvolutionApiConfigured()) {
    throw new EvolutionApiError("Configure a Evolution API antes de ativar os envios.");
  }

  const encryptedPhone = values.phone
    ? encryptServerSecret(values.phone)
    : existing?.encryptedWhatsappPhone ?? null;
  if (values.enabled && !encryptedPhone) {
    throw new Error("Informe o número que receberá os alertas.");
  }

  let phoneChanged = false;
  if (values.phone) {
    if (!existing?.encryptedWhatsappPhone) {
      phoneChanged = true;
    } else {
      try {
        phoneChanged = decryptServerSecret(existing.encryptedWhatsappPhone) !== values.phone;
      } catch {
        phoneChanged = true;
      }
    }
  }

  const now = new Date();
  const data = {
    whatsappEnabled: values.enabled,
    encryptedWhatsappPhone: encryptedPhone,
    whatsappPhoneLastFour: values.phone.slice(-4) || existing?.whatsappPhoneLastFour || null,
    whatsappConsentAt: values.enabled && values.consent ? now : null,
    whatsappVerifiedAt: phoneChanged ? null : existing?.whatsappVerifiedAt ?? null,
    whatsappLastTestAt: phoneChanged ? null : existing?.whatsappLastTestAt ?? null,
  };

  await db.$transaction(async (transaction) => {
    await transaction.academicAlertPreference.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...data },
      update: data,
      select: { id: true },
    });

    if (values.enabled && !existing?.whatsappEnabled) {
      await transaction.academicAlertRecord.updateMany({
        where: {
          userId: user.id,
          resolvedAt: null,
          whatsappSentAt: null,
        },
        data: {
          whatsappSentAt: now,
          whatsappMessageId: "activation-baseline",
          whatsappLastError: null,
        },
      });
    }
  });
}

export async function sendCurrentWhatsAppTest() {
  const user = await requireAlertUser();
  const preference = await db.academicAlertPreference.findUnique({
    where: { userId: user.id },
    select: {
      whatsappEnabled: true,
      encryptedWhatsappPhone: true,
      whatsappConsentAt: true,
      whatsappLastTestAt: true,
    },
  });

  if (
    !preference?.whatsappEnabled
    || !preference.encryptedWhatsappPhone
    || !preference.whatsappConsentAt
  ) {
    throw new Error("Ative e salve o WhatsApp antes de enviar o teste.");
  }

  const testedAt = new Date();
  const cooldownThreshold = new Date(testedAt.getTime() - WHATSAPP_TEST_COOLDOWN_MS);
  const claimed = await db.academicAlertPreference.updateMany({
    where: {
      userId: user.id,
      whatsappEnabled: true,
      encryptedWhatsappPhone: { not: null },
      whatsappConsentAt: { not: null },
      OR: [
        { whatsappLastTestAt: null },
        { whatsappLastTestAt: { lte: cooldownThreshold } },
      ],
    },
    data: { whatsappLastTestAt: testedAt },
  });
  if (claimed.count === 0) throw new Error(WHATSAPP_TEST_COOLDOWN_MESSAGE);

  const baseUrl = process.env.NEXTAUTH_URL?.trim().replace(/\/+$/, "");
  const alertUrl = baseUrl ? `\n\nAcesse: ${baseUrl}/alertas` : "";
  const result = await sendEvolutionTextMessage({
    number: decryptServerSecret(preference.encryptedWhatsappPhone),
    text: `✅ *AcadIA conectado*\n\nAs notificações acadêmicas via WhatsApp foram ativadas com sucesso.${alertUrl}`,
  });

  await db.academicAlertPreference.update({
    where: { userId: user.id },
    data: {
      whatsappVerifiedAt: testedAt,
    },
    select: { id: true },
  });

  return result;
}

export async function markCurrentAlertRead(alertKey: string) {
  const user = await requireAlertUser();
  await db.academicAlertRecord.updateMany({
    where: { userId: user.id, alertKey, resolvedAt: null },
    data: { readAt: new Date() },
  });
}

export async function markAllCurrentAlertsRead() {
  const user = await requireAlertUser();
  await db.academicAlertRecord.updateMany({
    where: { userId: user.id, resolvedAt: null, dismissedAt: null },
    data: { readAt: new Date() },
  });
}

export async function snoozeCurrentAlert(alertKey: string, days: number) {
  const user = await requireAlertUser();
  const todayDateKey = getAcademicCalendarTodayKey();
  await db.academicAlertRecord.updateMany({
    where: { userId: user.id, alertKey, resolvedAt: null },
    data: {
      readAt: new Date(),
      dismissedAt: null,
      snoozedUntil: databaseDate(addDaysToDateKey(todayDateKey, days)),
    },
  });
}

export async function dismissCurrentAlert(alertKey: string) {
  const user = await requireAlertUser();
  await db.academicAlertRecord.updateMany({
    where: { userId: user.id, alertKey, resolvedAt: null },
    data: { readAt: new Date(), dismissedAt: new Date(), snoozedUntil: null },
  });
}

export async function restoreCurrentAlert(alertKey: string) {
  const user = await requireAlertUser();
  await db.academicAlertRecord.updateMany({
    where: { userId: user.id, alertKey, resolvedAt: null },
    data: { readAt: null, dismissedAt: null, snoozedUntil: null },
  });
}
