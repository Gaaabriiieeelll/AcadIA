import "server-only";

import { db } from "@/lib/db";
import {
  createAndroidPairingCode,
  hashAndroidWidgetSecret,
  normalizeAndroidPairingCode,
} from "@/lib/android-widget-auth";
import { CALENDAR_EVENT_TYPE_DETAILS } from "@/types/calendar-events";
import type {
  AndroidWidgetCommitmentDTO,
  AndroidWidgetCredentialDTO,
} from "@/types/android-widget";

import { requireCurrentIdentity } from "./current-user";

const PAIRING_LIFETIME_MS = 10 * 60 * 1000;

async function requireWidgetUser() {
  const { googleSubject } = await requireCurrentIdentity();
  const user = await db.user.findUnique({
    where: { googleSubject },
    select: { id: true },
  });
  if (!user) throw new Error("Conta acadêmica não encontrada.");
  return user;
}

export async function getCurrentAndroidWidgetCredentials(): Promise<AndroidWidgetCredentialDTO[]> {
  const user = await requireWidgetUser();
  const now = new Date();
  const credentials = await db.androidWidgetCredential.findMany({
    where: { userId: user.id, revokedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      deviceName: true,
      pairingExpiresAt: true,
      activatedAt: true,
      lastUsedAt: true,
      createdAt: true,
    },
  });
  return credentials.map((credential) => {
    const status = credential.activatedAt
      ? "connected" as const
      : credential.pairingExpiresAt <= now ? "expired" as const : "pending" as const;
    return {
      ...credential,
      pairingExpiresAt: credential.pairingExpiresAt.toISOString(),
      activatedAt: credential.activatedAt?.toISOString() ?? null,
      lastUsedAt: credential.lastUsedAt?.toISOString() ?? null,
      createdAt: credential.createdAt.toISOString(),
      status,
    };
  });
}

export async function createCurrentAndroidWidgetPairing(deviceName: string) {
  const user = await requireWidgetUser();
  const now = new Date();
  await db.androidWidgetCredential.deleteMany({
    where: {
      userId: user.id,
      activatedAt: null,
    },
  });

  const pairingCode = createAndroidPairingCode();
  const pairingExpiresAt = new Date(now.getTime() + PAIRING_LIFETIME_MS);
  await db.androidWidgetCredential.create({
    data: {
      userId: user.id,
      deviceName,
      pairingCodeHash: hashAndroidWidgetSecret(
        "pairing",
        normalizeAndroidPairingCode(pairingCode),
      ),
      pairingExpiresAt,
    },
    select: { id: true },
  });
  return { pairingCode, pairingExpiresAt };
}

export async function revokeCurrentAndroidWidgetCredential(credentialId: string) {
  const user = await requireWidgetUser();
  await db.androidWidgetCredential.updateMany({
    where: { id: credentialId, userId: user.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function activateAndroidWidgetCredential(input: {
  code: string;
  deviceName: string;
  token: string;
}) {
  const now = new Date();
  const pairingCodeHash = hashAndroidWidgetSecret(
    "pairing",
    normalizeAndroidPairingCode(input.code),
  );
  const credential = await db.androidWidgetCredential.findUnique({
    where: { pairingCodeHash },
    select: {
      id: true,
      activatedAt: true,
      pairingExpiresAt: true,
      revokedAt: true,
    },
  });
  if (
    !credential
    || credential.activatedAt
    || credential.revokedAt
    || credential.pairingExpiresAt <= now
  ) {
    return false;
  }

  const updated = await db.androidWidgetCredential.updateMany({
    where: {
      id: credential.id,
      activatedAt: null,
      revokedAt: null,
      pairingExpiresAt: { gt: now },
    },
    data: {
      activatedAt: now,
      tokenHash: hashAndroidWidgetSecret("token", input.token),
    },
  });
  return updated.count === 1;
}

export async function authenticateAndroidWidgetToken(token: string) {
  const credential = await db.androidWidgetCredential.findUnique({
    where: { tokenHash: hashAndroidWidgetSecret("token", token) },
    select: {
      id: true,
      userId: true,
      revokedAt: true,
      lastUsedAt: true,
    },
  });
  if (!credential || credential.revokedAt) return null;

  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  if (!credential.lastUsedAt || credential.lastUsedAt.getTime() < oneHourAgo) {
    await db.androidWidgetCredential.update({
      where: { id: credential.id },
      data: { lastUsedAt: new Date() },
      select: { id: true },
    });
  }
  return { userId: credential.userId };
}

export async function getOpenCommitmentsForAndroidWidget(
  userId: string,
): Promise<AndroidWidgetCommitmentDTO[]> {
  const commitments = await db.calendarEvent.findMany({
    where: {
      userId,
      endDate: null,
      completedAt: null,
    },
    orderBy: [{ startDate: "asc" }, { startTime: "asc" }, { createdAt: "asc" }],
    take: 20,
    select: {
      id: true,
      title: true,
      description: true,
      eventType: true,
      startDate: true,
      startTime: true,
      subject: { select: { name: true, color: true } },
    },
  });
  return commitments.map((commitment) => ({
    id: commitment.id,
    title: commitment.title,
    description: commitment.description,
    eventType: commitment.eventType,
    startDate: commitment.startDate.toISOString().slice(0, 10),
    startTime: commitment.startTime,
    subjectName: commitment.subject?.name ?? null,
    color: commitment.subject?.color
      ?? CALENDAR_EVENT_TYPE_DETAILS[commitment.eventType].color,
    href: `/calendario?mes=${commitment.startDate.toISOString().slice(0, 7)}#evento-${commitment.id}`,
  }));
}
