import "server-only";

import { getAcademicCalendarTodayKey } from "@/data/academic-calendar";
import { requireCurrentIdentity } from "@/data/current-user";
import {
  browserPushStatusCode,
  getBrowserPushPublicConfiguration,
  sendBrowserPushNotification,
} from "@/lib/browser-push";
import {
  browserPushCategoryEnabled,
  buildBrowserPushPayload,
  hashBrowserPushEndpoint,
  trustedBrowserPushEndpoint,
} from "@/lib/browser-push-utils";
import { db } from "@/lib/db";
import { decryptServerSecret, encryptServerSecret } from "@/lib/secret-box";
import type {
  AcademicBrowserPushSettingsDTO,
  BrowserPushSubscriptionInput,
} from "@/types/academic-alerts";

const MAX_DELIVERY_ATTEMPTS = 5;
const MAX_RECORD_SCAN = 500;

async function requireBrowserPushUser() {
  const { googleSubject } = await requireCurrentIdentity();
  const user = await db.user.findUnique({
    where: { googleSubject },
    select: { id: true },
  });
  if (!user) throw new Error("Usuário acadêmico não encontrado.");
  return user;
}

function subscriptionExpiration(expirationTime: number | null) {
  if (expirationTime === null) return null;
  const expirationAt = new Date(expirationTime);
  return Number.isNaN(expirationAt.getTime()) ? null : expirationAt;
}

export async function getCurrentBrowserPushSettings(): Promise<AcademicBrowserPushSettingsDTO> {
  const user = await requireBrowserPushUser();
  const [activeDeviceCount, configuration] = await Promise.all([
    db.browserPushSubscription.count({
      where: {
        userId: user.id,
        disabledAt: null,
        OR: [{ expirationAt: null }, { expirationAt: { gt: new Date() } }],
      },
    }),
    Promise.resolve(getBrowserPushPublicConfiguration()),
  ]);

  return { activeDeviceCount, ...configuration };
}

export async function registerCurrentBrowserPushSubscription(
  values: BrowserPushSubscriptionInput,
) {
  if (!trustedBrowserPushEndpoint(values.endpoint)) {
    throw new Error("O endpoint não pertence a um serviço Web Push aceito.");
  }
  const configuration = getBrowserPushPublicConfiguration();
  if (!configuration.serviceConfigured) {
    throw new Error("Configure as chaves Web Push antes de ativar as notificações.");
  }

  const user = await requireBrowserPushUser();
  const endpointHash = hashBrowserPushEndpoint(values.endpoint);
  const now = new Date();

  return db.$transaction(async (transaction) => {
    const existing = await transaction.browserPushSubscription.findUnique({
      where: { endpointHash },
      select: { disabledAt: true, id: true, userId: true },
    });
    if (existing && existing.userId !== user.id) {
      await transaction.browserPushSubscription.delete({ where: { id: existing.id } });
    }

    const subscription = await transaction.browserPushSubscription.upsert({
      where: { endpointHash },
      create: {
        userId: user.id,
        endpointHash,
        encryptedEndpoint: encryptServerSecret(values.endpoint),
        encryptedP256dh: encryptServerSecret(values.keys.p256dh),
        encryptedAuth: encryptServerSecret(values.keys.auth),
        expirationAt: subscriptionExpiration(values.expirationTime),
      },
      update: {
        userId: user.id,
        encryptedEndpoint: encryptServerSecret(values.endpoint),
        encryptedP256dh: encryptServerSecret(values.keys.p256dh),
        encryptedAuth: encryptServerSecret(values.keys.auth),
        expirationAt: subscriptionExpiration(values.expirationTime),
        disabledAt: null,
        failureCount: 0,
        lastError: null,
      },
      select: { id: true },
    });

    await transaction.academicAlertPreference.upsert({
      where: { userId: user.id },
      create: { userId: user.id, browserNotifications: true },
      update: { browserNotifications: true },
      select: { id: true },
    });

    const isNewActivation = !existing || existing.userId !== user.id || existing.disabledAt !== null;
    if (isNewActivation) {
      const currentAlerts = await transaction.academicAlertRecord.findMany({
        where: { userId: user.id, resolvedAt: null },
        select: { browserPushGeneration: true, id: true },
      });
      if (currentAlerts.length > 0) {
        await transaction.browserPushDelivery.createMany({
          data: currentAlerts.map((alert) => ({
            alertRecordId: alert.id,
            subscriptionId: subscription.id,
            generation: alert.browserPushGeneration,
            suppressedAt: now,
          })),
          skipDuplicates: true,
        });
      }
    }

    return subscription;
  });
}

export async function unregisterCurrentBrowserPushSubscription(endpoint: string) {
  const user = await requireBrowserPushUser();
  const endpointHash = hashBrowserPushEndpoint(endpoint);

  return db.$transaction(async (transaction) => {
    const deleted = await transaction.browserPushSubscription.deleteMany({
      where: { endpointHash, userId: user.id },
    });
    const remaining = await transaction.browserPushSubscription.count({
      where: { userId: user.id, disabledAt: null },
    });
    if (remaining === 0) {
      await transaction.academicAlertPreference.updateMany({
        where: { userId: user.id },
        data: { browserNotifications: false },
      });
    }
    return deleted.count > 0;
  });
}

type DeliveryRecord = {
  attemptCount: number;
  deliveredAt: Date | null;
  id: string;
  suppressedAt: Date | null;
};

function deliveryKey(alertRecordId: string, subscriptionId: string, generation: number) {
  return `${alertRecordId}:${subscriptionId}:${generation}`;
}

function uniqueConstraintError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

function pushErrorMessage(error: unknown) {
  const statusCode = browserPushStatusCode(error);
  if (statusCode) return `Serviço push respondeu com HTTP ${statusCode}.`;
  if (error instanceof Error) return error.message.slice(0, 500);
  return "Falha inesperada ao enviar a notificação.";
}

async function disablePreferenceWithoutActiveDevices(userId: string) {
  const active = await db.browserPushSubscription.count({
    where: { userId, disabledAt: null },
  });
  if (active === 0) {
    await db.academicAlertPreference.updateMany({
      where: { userId },
      data: { browserNotifications: false },
    });
  }
}

export async function dispatchPendingBrowserPushAlerts(requestedLimit = 50) {
  const limit = Math.min(Math.max(Math.trunc(requestedLimit), 1), 100);
  const now = new Date();
  const subscriptions = await db.browserPushSubscription.findMany({
    where: {
      disabledAt: null,
      OR: [{ expirationAt: null }, { expirationAt: { gt: now } }],
      user: { alertPreference: { browserNotifications: true } },
    },
    select: {
      encryptedAuth: true,
      encryptedEndpoint: true,
      encryptedP256dh: true,
      id: true,
      userId: true,
      user: {
        select: {
          alertPreference: {
            select: {
              attendanceEnabled: true,
              calendarEnabled: true,
              gradesEnabled: true,
              tasksEnabled: true,
            },
          },
        },
      },
    },
  });
  if (subscriptions.length === 0) {
    return { eligible: 0, scanned: 0, sent: 0, failed: 0, stale: 0, skipped: 0 };
  }

  const subscriptionsByUser = new Map<string, typeof subscriptions>();
  for (const subscription of subscriptions) {
    const current = subscriptionsByUser.get(subscription.userId) ?? [];
    current.push(subscription);
    subscriptionsByUser.set(subscription.userId, current);
  }

  const todayDateKey = getAcademicCalendarTodayKey();
  const today = new Date(`${todayDateKey}T12:00:00.000Z`);
  const records = await db.academicAlertRecord.findMany({
    where: {
      userId: { in: [...subscriptionsByUser.keys()] },
      resolvedAt: null,
      dismissedAt: null,
      OR: [{ snoozedUntil: null }, { snoozedUntil: { lte: today } }],
    },
    orderBy: [{ firstDetectedAt: "asc" }, { createdAt: "asc" }],
    take: MAX_RECORD_SCAN,
    select: {
      alertKey: true,
      browserPushGeneration: true,
      category: true,
      description: true,
      href: true,
      id: true,
      severity: true,
      title: true,
      userId: true,
    },
  });
  const deliveries = records.length === 0
    ? []
    : await db.browserPushDelivery.findMany({
        where: {
          alertRecordId: { in: records.map((record) => record.id) },
          subscriptionId: { in: subscriptions.map((subscription) => subscription.id) },
        },
        select: {
          alertRecordId: true,
          attemptCount: true,
          deliveredAt: true,
          generation: true,
          id: true,
          subscriptionId: true,
          suppressedAt: true,
        },
      });
  const deliveryByKey = new Map(
    deliveries.map((delivery) => [
      deliveryKey(delivery.alertRecordId, delivery.subscriptionId, delivery.generation),
      delivery,
    ]),
  );

  let scanned = 0;
  let sent = 0;
  let failed = 0;
  let stale = 0;
  let skipped = 0;
  const disabledSubscriptionIds = new Set<string>();

  for (const record of records) {
    const userSubscriptions = subscriptionsByUser.get(record.userId) ?? [];
    for (const subscription of userSubscriptions) {
      if (scanned >= limit) break;
      if (disabledSubscriptionIds.has(subscription.id)) {
        skipped += 1;
        continue;
      }
      const preference = subscription.user.alertPreference;
      if (!preference || !browserPushCategoryEnabled(record.category, preference)) {
        skipped += 1;
        continue;
      }

      const key = deliveryKey(record.id, subscription.id, record.browserPushGeneration);
      const existing = deliveryByKey.get(key) as DeliveryRecord | undefined;
      if (
        existing?.deliveredAt
        || existing?.suppressedAt
        || (existing?.attemptCount ?? 0) >= MAX_DELIVERY_ATTEMPTS
      ) {
        skipped += 1;
        continue;
      }

      const attemptedAt = new Date();
      let deliveryId: string;
      if (existing) {
        const claimed = await db.browserPushDelivery.updateMany({
          where: {
            id: existing.id,
            attemptCount: existing.attemptCount,
            deliveredAt: null,
            suppressedAt: null,
          },
          data: {
            attemptCount: { increment: 1 },
            lastAttemptAt: attemptedAt,
            lastError: null,
          },
        });
        if (claimed.count === 0) {
          skipped += 1;
          continue;
        }
        deliveryId = existing.id;
      } else {
        try {
          const created = await db.browserPushDelivery.create({
            data: {
              alertRecordId: record.id,
              subscriptionId: subscription.id,
              generation: record.browserPushGeneration,
              attemptCount: 1,
              lastAttemptAt: attemptedAt,
            },
            select: { id: true },
          });
          deliveryId = created.id;
        } catch (error) {
          if (!uniqueConstraintError(error)) throw error;
          skipped += 1;
          continue;
        }
      }

      scanned += 1;
      try {
        await sendBrowserPushNotification({
          endpoint: decryptServerSecret(subscription.encryptedEndpoint),
          expirationTime: null,
          keys: {
            auth: decryptServerSecret(subscription.encryptedAuth),
            p256dh: decryptServerSecret(subscription.encryptedP256dh),
          },
        }, buildBrowserPushPayload(record), record.severity);

        await db.$transaction([
          db.browserPushDelivery.update({
            where: { id: deliveryId },
            data: { deliveredAt: new Date(), lastError: null },
            select: { id: true },
          }),
          db.browserPushSubscription.update({
            where: { id: subscription.id },
            data: { failureCount: 0, lastError: null, lastSuccessAt: new Date() },
            select: { id: true },
          }),
        ]);
        sent += 1;
      } catch (error) {
        const statusCode = browserPushStatusCode(error);
        const expired = statusCode === 404 || statusCode === 410;
        const message = pushErrorMessage(error);
        await db.$transaction([
          db.browserPushDelivery.update({
            where: { id: deliveryId },
            data: { lastError: message },
            select: { id: true },
          }),
          db.browserPushSubscription.update({
            where: { id: subscription.id },
            data: {
              disabledAt: expired ? new Date() : undefined,
              failureCount: { increment: 1 },
              lastError: message,
            },
            select: { id: true },
          }),
        ]);
        if (expired) {
          disabledSubscriptionIds.add(subscription.id);
          stale += 1;
          await disablePreferenceWithoutActiveDevices(subscription.userId);
        } else {
          failed += 1;
        }
      }
    }
    if (scanned >= limit) break;
  }

  return { eligible: subscriptions.length, scanned, sent, failed, stale, skipped };
}
