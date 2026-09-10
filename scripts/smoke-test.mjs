import assert from "node:assert/strict";
import { spawn } from "node:child_process";

const port = Number(process.env.SMOKE_PORT ?? 3199);
const origin = `http://localhost:${port}`;
const server = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "start", "--port", String(port)],
  {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NEXTAUTH_URL: origin,
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
let serverOutput = "";
server.stdout.on("data", (chunk) => { serverOutput += chunk.toString(); });
server.stderr.on("data", (chunk) => { serverOutput += chunk.toString(); });

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function waitForServer() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`O servidor encerrou antes do smoke test.\n${serverOutput}`);
    }
    try {
      const response = await fetch(`${origin}/api/health`, {
        cache: "no-store",
        signal: AbortSignal.timeout(1_500),
      });
      if (response.ok) return;
    } catch {
      // O servidor ainda está inicializando.
    }
    await delay(250);
  }
  throw new Error(`Tempo esgotado ao iniciar o servidor.\n${serverOutput}`);
}

async function checkProtectedRoute(pathname) {
  const response = await fetch(`${origin}${pathname}`, {
    redirect: "manual",
    signal: AbortSignal.timeout(5_000),
  });
  assert.equal(response.status, 307, `${pathname} deveria redirecionar`);
  assert.equal(new URL(response.headers.get("location"), origin).pathname, "/login");
}

async function run() {
  await waitForServer();

  const health = await fetch(`${origin}/api/health`, { cache: "no-store" });
  assert.equal(health.status, 200);
  assert.equal((await health.json()).status, "ok");
  assert.equal(health.headers.has("content-security-policy"), false);

  const unauthorizedReadiness = await fetch(`${origin}/api/health?ready=1`);
  assert.ok(
    unauthorizedReadiness.status === 401 || unauthorizedReadiness.status === 503,
    "A prontidão aprofundada não pode ficar pública",
  );

  const login = await fetch(`${origin}/login`);
  assert.equal(login.status, 200);
  assert.equal(login.headers.get("x-content-type-options"), "nosniff");
  assert.equal(login.headers.get("x-frame-options"), "DENY");
  const policy = login.headers.get("content-security-policy") ?? "";
  const policyNonce = policy.match(/'nonce-([^']+)'/)?.[1];
  assert.ok(policyNonce, "A CSP deveria conter um nonce");
  const html = await login.text();
  const scripts = html.match(/<script\b[^>]*>/g) ?? [];
  assert.ok(scripts.length > 0, "A página deveria conter scripts do Next.js");
  for (const script of scripts) {
    assert.equal(script.match(/\snonce="([^"]+)"/)?.[1], policyNonce);
  }

  const icon = await fetch(`${origin}/icon.jpeg`);
  assert.equal(icon.status, 200);
  assert.match(icon.headers.get("content-type") ?? "", /^image\/jpeg/);

  const serviceWorker = await fetch(`${origin}/sw.js`);
  assert.equal(serviceWorker.status, 200);
  assert.match(serviceWorker.headers.get("content-type") ?? "", /^application\/javascript/);
  assert.match(serviceWorker.headers.get("cache-control") ?? "", /no-store/);
  assert.match(serviceWorker.headers.get("content-security-policy") ?? "", /script-src 'self'/);

  const manifest = await fetch(`${origin}/manifest.webmanifest`);
  assert.equal(manifest.status, 200);
  assert.match(manifest.headers.get("content-type") ?? "", /^application\/manifest\+json/);

  const accountExport = await fetch(`${origin}/api/account/export`, { redirect: "manual" });
  assert.equal(accountExport.status, 401);

  await Promise.all([
    checkProtectedRoute("/perfil"),
    checkProtectedRoute("/atendimento"),
    checkProtectedRoute("/editais"),
  ]);

  process.stdout.write("Smoke test de produção aprovado.\n");
}

try {
  await run();
} finally {
  if (server.exitCode === null) server.kill("SIGTERM");
}
