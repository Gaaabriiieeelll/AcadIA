import { timingSafeEqual } from "node:crypto";

import { dispatchPendingWhatsAppAlerts } from "@/data/whatsapp-alerts";
import { isEvolutionApiConfigured } from "@/lib/evolution-api";

export const dynamic = "force-dynamic";

function secureEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function authorized(request: Request, secret: string) {
  const authorization = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  return secureEquals(authorization, expected);
}

function response(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

async function runWhatsAppJob(request: Request) {
  const jobSecret = process.env.WHATSAPP_JOB_SECRET?.trim();
  if (!jobSecret) return response({ error: "Job diário não configurado." }, 503);
  if (!authorized(request, jobSecret)) return response({ error: "Não autorizado." }, 401);
  if (!isEvolutionApiConfigured()) {
    return response({ error: "Evolution API não configurada." }, 503);
  }

  const rawLimit = new URL(request.url).searchParams.get("limit");
  const parsedLimit = rawLimit ? Number(rawLimit) : 25;
  const result = await dispatchPendingWhatsAppAlerts(
    Number.isFinite(parsedLimit) ? parsedLimit : 25,
  );

  return response({ ok: true, ...result });
}

export async function GET(request: Request) {
  return runWhatsAppJob(request);
}

export async function POST(request: Request) {
  return runWhatsAppJob(request);
}
