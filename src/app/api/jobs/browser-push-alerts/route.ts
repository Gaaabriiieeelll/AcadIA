import { timingSafeEqual } from "node:crypto";

import { dispatchPendingBrowserPushAlerts } from "@/data/browser-push";
import { isBrowserPushConfigured } from "@/lib/browser-push";

export const dynamic = "force-dynamic";

function secureEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function authorized(request: Request, secret: string) {
  const authorization = request.headers.get("authorization") ?? "";
  return secureEquals(authorization, `Bearer ${secret}`);
}

function response(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store, max-age=0",
      "x-content-type-options": "nosniff",
    },
  });
}

async function runBrowserPushJob(request: Request) {
  const jobSecret = process.env.BROWSER_PUSH_JOB_SECRET?.trim();
  if (!jobSecret) return response({ error: "Job Web Push não configurado." }, 503);
  if (!authorized(request, jobSecret)) return response({ error: "Não autorizado." }, 401);
  if (!isBrowserPushConfigured()) {
    return response({ error: "Chaves VAPID não configuradas." }, 503);
  }

  const rawLimit = new URL(request.url).searchParams.get("limit");
  const parsedLimit = rawLimit ? Number(rawLimit) : 50;
  const result = await dispatchPendingBrowserPushAlerts(
    Number.isFinite(parsedLimit) ? parsedLimit : 50,
  );

  return response({ ok: true, ...result });
}

export async function GET(request: Request) {
  return runBrowserPushJob(request);
}

export async function POST(request: Request) {
  return runBrowserPushJob(request);
}
