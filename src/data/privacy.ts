import "server-only";

import { requireCurrentIdentity } from "@/data/current-user";
import { db } from "@/lib/db";
import {
  AI_ACADEMIC_ANALYSIS_PURPOSE,
  AI_CONSENT_VERSION,
} from "@/lib/privacy-constants";
import { decryptServerSecret } from "@/lib/secret-box";
import type { AccountPrivacyOverviewDTO } from "@/types/privacy";

export class AiConsentRequiredError extends Error {
  constructor() {
    super("AI academic analysis consent required");
    this.name = "AiConsentRequiredError";
  }
}

export class AccountNotFoundError extends Error {
  constructor() {
    super("Authenticated account not found");
    this.name = "AccountNotFoundError";
  }
}

async function requirePrivacyUser() {
  const { googleSubject } = await requireCurrentIdentity();
  const user = await db.user.findUnique({
    where: { googleSubject },
    select: { id: true },
  });

  if (!user) throw new AccountNotFoundError();
  return user;
}

export async function getCurrentAccountPrivacyOverview(): Promise<AccountPrivacyOverviewDTO> {
  const { googleSubject } = await requireCurrentIdentity();
  const user = await db.user.findUnique({
    where: { googleSubject },
    select: {
      createdAt: true,
      classroomCredential: {
        select: { lastTaskSyncAt: true },
      },
      alertPreference: {
        select: {
          whatsappEnabled: true,
          whatsappPhoneLastFour: true,
        },
      },
      privacyConsents: {
        where: {
          purpose: AI_ACADEMIC_ANALYSIS_PURPOSE,
          version: AI_CONSENT_VERSION,
          revokedAt: null,
        },
        orderBy: { grantedAt: "desc" },
        select: { grantedAt: true },
        take: 1,
      },
    },
  });

  if (!user) throw new AccountNotFoundError();
  const consent = user.privacyConsents[0] ?? null;

  return {
    accountCreatedAt: user.createdAt.toISOString(),
    aiConsent: {
      granted: Boolean(consent),
      grantedAt: consent?.grantedAt.toISOString() ?? null,
      version: AI_CONSENT_VERSION,
    },
    classroom: {
      connected: Boolean(user.classroomCredential),
      lastSyncAt: user.classroomCredential?.lastTaskSyncAt?.toISOString() ?? null,
    },
    whatsapp: {
      enabled: user.alertPreference?.whatsappEnabled ?? false,
      phoneLastFour: user.alertPreference?.whatsappPhoneLastFour ?? null,
    },
  };
}

export async function hasCurrentAiConsent() {
  const { googleSubject } = await requireCurrentIdentity();
  const consent = await db.privacyConsent.findFirst({
    where: {
      user: { googleSubject },
      purpose: AI_ACADEMIC_ANALYSIS_PURPOSE,
      version: AI_CONSENT_VERSION,
      revokedAt: null,
    },
    select: { id: true },
  });

  return Boolean(consent);
}

export async function requireCurrentAiConsent() {
  if (!(await hasCurrentAiConsent())) throw new AiConsentRequiredError();
}

export async function setCurrentAiConsent(granted: boolean) {
  const user = await requirePrivacyUser();
  const now = new Date();

  if (granted) {
    await db.privacyConsent.upsert({
      where: {
        userId_purpose_version: {
          userId: user.id,
          purpose: AI_ACADEMIC_ANALYSIS_PURPOSE,
          version: AI_CONSENT_VERSION,
        },
      },
      create: {
        userId: user.id,
        purpose: AI_ACADEMIC_ANALYSIS_PURPOSE,
        version: AI_CONSENT_VERSION,
        grantedAt: now,
      },
      update: {
        grantedAt: now,
        revokedAt: null,
      },
      select: { id: true },
    });
    return;
  }

  await db.$transaction([
    db.privacyConsent.updateMany({
      where: {
        userId: user.id,
        purpose: AI_ACADEMIC_ANALYSIS_PURPOSE,
        revokedAt: null,
      },
      data: { revokedAt: now },
    }),
    db.studyVideoRecommendation.deleteMany({
      where: { userId: user.id },
    }),
  ]);
}

export async function disconnectCurrentClassroom() {
  const user = await requirePrivacyUser();
  const result = await db.$transaction(async (transaction) => {
    await transaction.academicTask.deleteMany({
      where: {
        source: "GOOGLE_CLASSROOM",
        subject: { userId: user.id },
      },
    });
    await transaction.studyVideoRecommendation.deleteMany({
      where: { userId: user.id },
    });
    return transaction.googleClassroomCredential.deleteMany({
      where: { userId: user.id },
    });
  });

  return result.count > 0;
}

export async function deleteCurrentAccount() {
  const { googleSubject } = await requireCurrentIdentity();
  const result = await db.user.deleteMany({ where: { googleSubject } });
  if (result.count === 0) throw new AccountNotFoundError();
}

export async function getCurrentAccountExport(): Promise<Record<string, unknown>> {
  const { googleSubject } = await requireCurrentIdentity();
  const user = await db.user.findUnique({
    where: { googleSubject },
    select: {
      googleSubject: true,
      createdAt: true,
      updatedAt: true,
      profile: true,
      classroomCredential: {
        select: {
          accessTokenExpiresAt: true,
          grantedScopes: true,
          lastTaskSyncAt: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      privacyConsents: {
        orderBy: { createdAt: "asc" },
        select: {
          purpose: true,
          version: true,
          grantedAt: true,
          revokedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      browserPushSubscriptions: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          expirationAt: true,
          disabledAt: true,
          lastSuccessAt: true,
          failureCount: true,
          lastError: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      androidWidgetCredentials: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          deviceName: true,
          pairingExpiresAt: true,
          activatedAt: true,
          lastUsedAt: true,
          revokedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      alertPreference: {
        select: {
          targetAverage: true,
          minimumAttendance: true,
          gradesEnabled: true,
          attendanceEnabled: true,
          tasksEnabled: true,
          calendarEnabled: true,
          browserNotifications: true,
          whatsappEnabled: true,
          encryptedWhatsappPhone: true,
          whatsappPhoneLastFour: true,
          whatsappConsentAt: true,
          whatsappVerifiedAt: true,
          whatsappLastTestAt: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      alertRecords: {
        orderBy: { createdAt: "asc" },
        select: {
          alertKey: true,
          category: true,
          severity: true,
          title: true,
          description: true,
          actionLabel: true,
          href: true,
          dateKey: true,
          firstDetectedAt: true,
          lastDetectedAt: true,
          readAt: true,
          dismissedAt: true,
          snoozedUntil: true,
          resolvedAt: true,
          whatsappSentAt: true,
          whatsappAttemptCount: true,
          whatsappLastAttemptAt: true,
          whatsappLastError: true,
          browserPushGeneration: true,
          browserPushDeliveries: {
            orderBy: { createdAt: "asc" },
            select: {
              subscriptionId: true,
              generation: true,
              attemptCount: true,
              lastAttemptAt: true,
              deliveredAt: true,
              suppressedAt: true,
              lastError: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
      },
      studyPlanPreference: true,
      studyAvailabilities: { orderBy: { weekday: "asc" } },
      studySessions: { orderBy: [{ scheduledDate: "asc" }, { startTime: "asc" }] },
      videoRecommendations: { orderBy: { createdAt: "asc" } },
      noticeChecklistItems: { orderBy: { createdAt: "asc" } },
      subjects: {
        orderBy: { name: "asc" },
        include: {
          assessments: { orderBy: { createdAt: "asc" } },
          bimesterGrades: { orderBy: { bimester: "asc" } },
          tasks: { orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }] },
        },
      },
      calendarEvents: { orderBy: [{ startDate: "asc" }, { createdAt: "asc" }] },
    },
  });

  if (!user) throw new AccountNotFoundError();

  const { alertPreference, ...account } = user;
  let whatsappPhone: string | null = null;
  if (alertPreference?.encryptedWhatsappPhone) {
    try {
      whatsappPhone = decryptServerSecret(alertPreference.encryptedWhatsappPhone);
    } catch {
      whatsappPhone = null;
    }
  }

  const safeAlertPreference = alertPreference
    ? {
      ...alertPreference,
      encryptedWhatsappPhone: undefined,
      whatsappPhone,
    }
    : null;

  return JSON.parse(JSON.stringify({
    format: "acadia-account-export",
    formatVersion: 2,
    generatedAt: new Date().toISOString(),
    account: {
      ...account,
      alertPreference: safeAlertPreference,
    },
    excludedSecrets: [
      "Google OAuth access token",
      "Google OAuth refresh token",
      "endpoints e chaves de assinatura Web Push",
      "códigos e tokens de autenticação do widget Android",
      "segredos e chaves do servidor",
    ],
  })) as Record<string, unknown>;
}
