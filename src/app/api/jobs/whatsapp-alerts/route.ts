import { dispatchPendingWhatsAppAlerts } from "@/data/whatsapp-alerts";
import { isEvolutionApiConfigured } from "@/lib/evolution-api";
import {
  hasConfiguredJobSecret,
  isBearerRequestAuthorized,
} from "@/lib/job-authorization";

export const dynamic = "force-dynamic";

function response(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store, max-age=0",
      "x-content-type-options": "nosniff",
    },
  });
}

async function runWhatsAppJob(request: Request) {
  const jobSecrets = [process.env.CRON_SECRET, process.env.WHATSAPP_JOB_SECRET];
  if (!hasConfiguredJobSecret(jobSecrets)) {
    return response({ error: "Job diário não configurado." }, 503);
  }
  if (!isBearerRequestAuthorized(request, jobSecrets)) {
    return response({ error: "Não autorizado." }, 401);
  }
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
