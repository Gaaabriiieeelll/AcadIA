import "server-only";

import webPush from "web-push";

import type { BrowserPushNotificationPayload } from "@/lib/browser-push-utils";
import type { BrowserPushSubscriptionInput } from "@/types/academic-alerts";

const PUSH_TIMEOUT_MS = 12_000;
const PUSH_TTL_SECONDS = 24 * 60 * 60;

type VapidConfiguration = {
  privateKey: string;
  publicKey: string;
  subject: string;
};

function getVapidConfiguration(): VapidConfiguration | null {
  const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.WEB_PUSH_VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.WEB_PUSH_VAPID_SUBJECT?.trim();

  if (!publicKey || !privateKey || !subject) return null;
  if (!/^[A-Za-z0-9_-]{80,100}$/.test(publicKey)) return null;
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(privateKey)) return null;
  if (!/^(mailto:[^\s@]+@[^\s@]+|https:\/\/[^\s]+)$/i.test(subject)) return null;
  return { publicKey, privateKey, subject };
}

export function getBrowserPushPublicConfiguration() {
  const configuration = getVapidConfiguration();
  return {
    publicKey: configuration?.publicKey ?? null,
    serviceConfigured: configuration !== null,
  };
}

export function isBrowserPushConfigured() {
  return getVapidConfiguration() !== null;
}

export async function sendBrowserPushNotification(
  subscription: BrowserPushSubscriptionInput,
  payload: BrowserPushNotificationPayload,
  severity: string,
) {
  const vapidDetails = getVapidConfiguration();
  if (!vapidDetails) throw new Error("Web Push não foi configurado no servidor.");

  return webPush.sendNotification(subscription, JSON.stringify(payload), {
    TTL: PUSH_TTL_SECONDS,
    timeout: PUSH_TIMEOUT_MS,
    topic: payload.tag,
    urgency: severity === "critical" ? "high" : "normal",
    vapidDetails,
  });
}

export function browserPushStatusCode(error: unknown) {
  return error instanceof webPush.WebPushError ? error.statusCode : null;
}
