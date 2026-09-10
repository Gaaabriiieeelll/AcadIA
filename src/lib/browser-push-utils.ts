import { createHash } from "node:crypto";

type CategoryPreference = {
  attendanceEnabled: boolean;
  calendarEnabled: boolean;
  gradesEnabled: boolean;
  tasksEnabled: boolean;
};

const trustedPushHosts = new Set([
  "android.googleapis.com",
  "fcm.googleapis.com",
  "updates.push.services.mozilla.com",
  "web.push.apple.com",
]);

export function trustedBrowserPushEndpoint(endpoint: string) {
  try {
    const url = new URL(endpoint);
    const hostname = url.hostname.toLowerCase();
    return url.protocol === "https:"
      && url.username === ""
      && url.password === ""
      && (trustedPushHosts.has(hostname) || hostname.endsWith(".notify.windows.com"));
  } catch {
    return false;
  }
}

export function hashBrowserPushEndpoint(endpoint: string) {
  return createHash("sha256").update(endpoint, "utf8").digest("hex");
}

export function browserPushCategoryEnabled(
  category: string,
  preference: CategoryPreference,
) {
  if (category === "grades") return preference.gradesEnabled;
  if (category === "attendance") return preference.attendanceEnabled;
  if (category === "tasks") return preference.tasksEnabled;
  if (category === "calendar") return preference.calendarEnabled;
  return false;
}

export function browserPushTopic(alertKey: string) {
  return createHash("sha256").update(alertKey, "utf8").digest("base64url").slice(0, 32);
}

export function safeBrowserPushHref(href: string) {
  if (!href.startsWith("/") || href.startsWith("//")) return "/alertas";

  try {
    const parsed = new URL(href, "https://acadia.invalid");
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/alertas";
  }
}

export function browserPushNotificationTitle(severity: string, title: string) {
  const prefix: Record<string, string> = {
    critical: "Urgente",
    warning: "Atenção",
    info: "AcadIA",
  };
  return `${prefix[severity] ?? "AcadIA"} · ${title}`;
}

export type BrowserPushNotificationPayload = {
  body: string;
  href: string;
  icon: string;
  tag: string;
  title: string;
};

export function buildBrowserPushPayload(alert: {
  alertKey: string;
  description: string;
  href: string;
  severity: string;
  title: string;
}): BrowserPushNotificationPayload {
  return {
    title: browserPushNotificationTitle(alert.severity, alert.title),
    body: alert.description,
    href: safeBrowserPushHref(alert.href),
    icon: "/acadia-logo.jpeg",
    tag: browserPushTopic(alert.alertKey),
  };
}
