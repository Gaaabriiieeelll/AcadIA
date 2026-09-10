import { timingSafeEqual } from "node:crypto";

import { db } from "@/lib/db";
import { isAuthConfigured } from "@/lib/auth";
import { isEvolutionApiConfigured } from "@/lib/evolution-api";
import { isBrowserPushConfigured } from "@/lib/browser-push";

export const dynamic = "force-dynamic";

const DATABASE_TIMEOUT_MS = 5_000;

function response(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store, max-age=0",
      "x-content-type-options": "nosniff",
    },
  });
}

function secureEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length
    && timingSafeEqual(leftBuffer, rightBuffer);
}

function authorized(request: Request, secret: string) {
  const authorization = request.headers.get("authorization") ?? "";
  return secureEquals(authorization, `Bearer ${secret}`);
}

async function databaseIsReady() {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      db.$queryRaw`SELECT 1`,
      new Promise((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error("Database readiness timeout")),
          DATABASE_TIMEOUT_MS,
        );
      }),
    ]);
    return true;
  } catch {
    return false;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("ready") !== "1") {
    return response({
      status: "ok",
      service: "acadia",
      version: process.env.APP_VERSION?.trim() || "development",
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  }

  const secret = process.env.HEALTHCHECK_SECRET?.trim();
  if (!secret) {
    return response({ status: "unavailable" }, 503);
  }
  if (!authorized(request, secret)) {
    return response({ status: "unauthorized" }, 401);
  }

  const [database, authentication] = await Promise.all([
    databaseIsReady(),
    Promise.resolve(isAuthConfigured()),
  ]);
  const ready = database && authentication;

  return response({
    status: ready ? "ready" : "degraded",
    checks: { database, authentication },
    optionalIntegrations: {
      openAI: Boolean(process.env.OPENAI_API_KEY?.trim()),
      browserPush: isBrowserPushConfigured(),
      youtube: Boolean(process.env.YOUTUBE_API_KEY?.trim()),
      whatsapp: isEvolutionApiConfigured(),
    },
    timestamp: new Date().toISOString(),
  }, ready ? 200 : 503);
}
