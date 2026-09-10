import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const baseUrl = process.env.NEXTAUTH_URL?.trim().replace(/\/+$/, "");
const secret = process.env.BROWSER_PUSH_JOB_SECRET?.trim();
const requestedLimit = Number(process.argv[2] ?? 50);
const limit = Number.isFinite(requestedLimit)
  ? Math.min(Math.max(Math.trunc(requestedLimit), 1), 100)
  : 50;

if (!baseUrl) throw new Error("NEXTAUTH_URL não foi configurada.");
if (!secret) throw new Error("BROWSER_PUSH_JOB_SECRET não foi configurado.");

const response = await fetch(`${baseUrl}/api/jobs/browser-push-alerts?limit=${limit}`, {
  headers: { authorization: `Bearer ${secret}` },
  signal: AbortSignal.timeout(30_000),
});
const body = await response.json().catch(() => ({ error: "Resposta inválida do job." }));

if (!response.ok) {
  throw new Error(`Job Web Push respondeu com HTTP ${response.status}: ${body.error ?? "falha"}`);
}

process.stdout.write(`${JSON.stringify(body)}\n`);
