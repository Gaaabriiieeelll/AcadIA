// Optional local-only integration check. Install embedded-postgres, playwright and
// @axe-core/playwright in a temporary folder and set COMPETITION_TEST_TOOLS to it.
// Uses a fresh PostgreSQL cluster, explicit local DB settings and synthetic sessions.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { encode } from "next-auth/jwt";

if (!process.env.COMPETITION_TEST_TOOLS) throw new Error("Set COMPETITION_TEST_TOOLS to the temporary test-tool directory.");
const requireTools = createRequire(join(resolve(process.env.COMPETITION_TEST_TOOLS), "package.json"));
const { default: EmbeddedPostgres } = await import(pathToFileURL(requireTools.resolve("embedded-postgres")).href);
const { chromium } = requireTools("playwright");
const dir = await mkdtemp(join(tmpdir(), "conecta-competitions-e2e-"));
const databasePort = 55439;
const port = 3207;
const origin = `http://localhost:${port}`;
const password = randomUUID();
const secret = randomUUID();
const pg = new EmbeddedPostgres({ databaseDir: join(dir, "pg"), user: "postgres", password, port: databasePort, persistent: true, postgresFlags: ["-h", "127.0.0.1"], onLog: () => {}, onError: () => {} });
const env = {
  // Explicitly construct an environment to exclude remote DB credentials and delivery channels.
  PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, TEMP: process.env.TEMP, TMP: process.env.TMP,
  USERPROFILE: process.env.USERPROFILE, LOCALAPPDATA: process.env.LOCALAPPDATA,
  NODE_ENV: "production", NEXT_TELEMETRY_DISABLED: "1",
  DATABASE_URL: `postgresql://postgres:${password}@127.0.0.1:${databasePort}/competition_test`,
  DIRECT_URL: `postgresql://postgres:${password}@127.0.0.1:${databasePort}/competition_test`,
  AUTH_SECRET: secret, AUTH_GOOGLE_ID: "local-test", AUTH_GOOGLE_SECRET: "local-test",
  ALLOW_ANY_GOOGLE_EMAIL: "true", NEXTAUTH_URL: origin, ANDROID_WIDGET_ENABLED: "false",
};
function run(args) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(process.execPath, args, { cwd: process.cwd(), env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    child.stdout.on("data", (chunk) => { output += chunk; });
    child.stderr.on("data", (chunk) => { output += chunk; });
    child.once("error", reject);
    child.once("exit", (code) => code === 0 ? resolveRun(output) : reject(new Error(output)));
  });
}
let server, browser, client;
let serverOutput = "";
try {
  await pg.initialise();
  await pg.start();
  await pg.createDatabase("competition_test");
  await run(["node_modules/prisma/build/index.js", "migrate", "deploy"]);
  const { Client } = requireTools("pg");
  client = new Client({ connectionString: env.DATABASE_URL });
  await client.connect();
  const userId = randomUUID();
  const secondUser = randomUUID();
  await client.query('INSERT INTO users (id, google_subject, updated_at) VALUES ($1,$2,NOW()),($3,$4,NOW())', [userId, "competition-test-user", secondUser, "competition-test-other"]);
  await client.query('INSERT INTO academic_profiles (id,user_id,registration_number,campus,course,academic_stage,updated_at) VALUES ($1,$2,$3,$4,$5,$6,NOW())', [randomUUID(), userId, "TEST-COMP-001", "João Pessoa", "Técnico em Mecânica Integrado ao Ensino Médio", "2º ano"]);
  await client.query('INSERT INTO calendar_events (id,user_id,title,event_type,start_date,end_date,updated_at) VALUES ($1,$2,$3,$4,$5,$5,NOW())', [randomUUID(), userId, "Evento pessoal preservado", "OTHER", "2026-12-05"]);
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], { cwd: process.cwd(), env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
  server.stdout.on("data", (chunk) => { serverOutput += chunk; });
  server.stderr.on("data", (chunk) => { serverOutput += chunk; });
  for (let attempt = 0; attempt < 60; attempt++) {
    try { if ((await fetch(`${origin}/api/health`)).ok) break; } catch { /* starting */ }
    await new Promise((done) => setTimeout(done, 300));
  }
  browser = await chromium.launch({ channel: process.env.COMPETITION_TEST_BROWSER ?? "msedge", headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const token = await encode({ secret, token: { sub: "competition-test-user", name: "Estudante de teste", email: "test@example.invalid" }, maxAge: 3600 });
  await context.addCookies([{ name: "next-auth.session-token", value: token, url: origin, httpOnly: true, sameSite: "Lax" }]);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${origin}/olimpiadas`);
  await page.getByRole("heading", { name: "Olimpíadas e Competições", exact: true }).waitFor();
  const nav = page.locator(".protected-sidebar nav");
  const links = await nav.locator("a").evaluateAll((items) => items.map((item) => ({ href: item.getAttribute("href"), text: item.textContent })));
  const courseIndex = links.findIndex((link) => link.href === "/horarios");
  assert.equal(links[courseIndex].text, "Mecânica II");
  assert.equal(links[courseIndex + 1].href, "/olimpiadas");
  await client.query('UPDATE academic_profiles SET course=$1, academic_stage=$2 WHERE user_id=$3', ["Técnico em Informática Integrado ao Ensino Médio", "3º ano", userId]);
  await page.reload();
  assert.equal(await nav.locator('a[href="/horarios"]').textContent(), "Informática III");
  assert.equal(await nav.locator('a[href="/horarios"] + a').getAttribute("href"), "/olimpiadas");
  await page.getByRole("searchbox").fill("historia paraiba");
  assert.equal(await page.locator("article").count(), 1);
  await page.getByLabel("Área", { exact: true }).selectOption("Robótica");
  assert.equal(await page.locator("article").count(), 0);
  await page.getByRole("button", { name: "Limpar filtros" }).click();
  await page.getByLabel("Situação", { exact: true }).selectOption("open");
  assert.equal(await page.locator("article").count(), 0);
  await page.getByRole("button", { name: "Limpar filtros" }).click();
  await page.getByLabel("Campus", { exact: true }).selectOption("João Pessoa");
  await page.getByLabel("Nível de ensino", { exact: true }).selectOption("Superior");
  assert.ok(await page.locator("#sbc-2026").isVisible());
  assert.equal(await page.locator("#dhpb-2026").count(), 0);
  await page.getByRole("button", { name: "Limpar filtros" }).click();
  const card = page.locator("#dhpb-2026");
  await card.getByLabel("Acompanhar esta edição", { exact: true }).check();
  await card.getByLabel("Ativar lembretes", { exact: false }).check();
  await card.getByRole("button", { name: "Salvar acompanhamento" }).click();
  await card.getByText("Acompanhamento salvo.", { exact: true }).waitFor();
  await page.reload();
  assert.ok(await card.getByLabel("Acompanhar esta edição", { exact: true }).isChecked());
  assert.ok(await card.getByLabel("Ativar lembretes", { exact: false }).isChecked());
  assert.equal(await card.getByLabel("Também lembrar etapas", { exact: false }).isChecked(), false);
  await card.getByRole("button", { name: "Salvar acompanhamento" }).click();
  await card.getByText("Acompanhamento salvo.", { exact: true }).waitFor();
  assert.equal((await client.query('SELECT count(*) FROM competition_subscriptions WHERE user_id=$1', [userId])).rows[0].count, "1");
  assert.equal((await client.query('SELECT count(*) FROM competition_subscriptions WHERE user_id=$1', [secondUser])).rows[0].count, "0");
  await page.screenshot({ path: join(dir, "desktop.png"), fullPage: false });
  // Exercise the real alert data flow with a longer existing lookahead (synthetic preference).
  await client.query('INSERT INTO academic_alert_preferences (id,user_id,reminder_days,calendar_enabled,updated_at) VALUES ($1,$2,30,true,NOW())', [randomUUID(), userId]);
  await page.goto(`${origin}/alertas`);
  await page.getByRole("heading", { name: /alertas/i }).first().waitFor();
  const records = await client.query("SELECT alert_key FROM academic_alert_records WHERE user_id=$1 AND alert_key LIKE 'competition:%' AND resolved_at IS NULL", [userId]);
  assert.ok(records.rows.some((r) => r.alert_key === "competition:dhpb-2026:final-call"));
  assert.equal(new Set(records.rows.map((r) => r.alert_key)).size, records.rowCount);
  await page.reload();
  assert.equal((await client.query("SELECT count(*) FROM academic_alert_records WHERE user_id=$1 AND alert_key LIKE 'competition:%'", [userId])).rows[0].count, String(records.rowCount));
  await client.query('UPDATE academic_alert_preferences SET calendar_enabled=false WHERE user_id=$1', [userId]);
  await page.reload();
  assert.equal(await page.locator('a[href="/olimpiadas#dhpb-2026"]').count(), 0);
  await client.query('UPDATE academic_alert_preferences SET calendar_enabled=true WHERE user_id=$1', [userId]);
  const exported = await context.request.get(`${origin}/api/account/export`);
  assert.equal(exported.status(), 200);
  assert.equal((await exported.json()).account.competitionSubscriptions.length, 1);
  await page.goto(`${origin}/calendario?mes=2026-12&visao=dia&data=2026-12-05`);
  await page.getByRole("heading", { name: "Calendário acadêmico", exact: true }).waitFor();
  assert.ok(await page.getByRole("heading", { name: /DHPB: Final presencial/ }).isVisible());
  assert.ok(await page.getByRole("heading", { name: "Evento pessoal preservado" }).isVisible());
  await page.getByRole("link", { name: "Ocultar Olimpíadas e Competições", exact: true }).click();
  await page.getByRole("heading", { name: /DHPB: Final presencial/ }).waitFor({ state: "detached" });
  assert.equal(await page.getByRole("heading", { name: /DHPB: Final presencial/ }).count(), 0);
  assert.ok(await page.getByRole("heading", { name: "Evento pessoal preservado" }).isVisible());
  await page.getByRole("link", { name: "Ver próximo período", exact: true }).click();
  await page.waitForURL(/data=2026-12-06/);
  assert.ok(page.url().includes("competicoes=ocultar"));
  await page.getByRole("link", { name: "Exibir Olimpíadas e Competições", exact: true }).click();
  await page.getByRole("heading", { name: /DHPB: Premiação/ }).waitFor();
  assert.ok(await page.getByRole("heading", { name: /DHPB: Premiação/ }).isVisible());
  await page.goto(`${origin}/olimpiadas`);
  await card.getByLabel("Acompanhar esta edição", { exact: true }).uncheck();
  await card.getByRole("button", { name: "Salvar acompanhamento" }).click();
  await card.getByText("Acompanhamento removido.", { exact: true }).waitFor();
  assert.equal((await client.query('SELECT count(*) FROM competition_subscriptions WHERE user_id=$1', [userId])).rows[0].count, "0");
  assert.equal((await client.query("SELECT count(*) FROM academic_alert_records WHERE user_id=$1 AND alert_key LIKE 'competition:%' AND resolved_at IS NULL", [userId])).rows[0].count, "0");
  assert.equal((await client.query('SELECT count(*) FROM calendar_events WHERE user_id=$1', [userId])).rows[0].count, "1");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  assert.ok(await page.getByRole("heading", { name: "Olimpíadas e Competições", exact: true }).isVisible());
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  await page.screenshot({ path: join(dir, "mobile.png"), fullPage: false });
  const { default: AxeBuilder } = await import(pathToFileURL(requireTools.resolve("@axe-core/playwright")).href);
  const accessibility = await new AxeBuilder({ page }).include(".protected-main").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  await writeFile(join(dir, "accessibility.json"), JSON.stringify({ violations: accessibility.violations, passes: accessibility.passes.length }, null, 2));
  assert.deepEqual(accessibility.violations.map((v) => ({ id: v.id, nodes: v.nodes.length })), []);
  assert.deepEqual(errors, []);
  console.log("PASS: migrations, dynamic navigation, all filters, persistence, isolation, idempotence, reminders, calendar toggle, personal events, mobile, accessibility, browser errors.");
  console.log(`Artifacts: ${dir}`);
} catch (error) {
  console.log(`Artifacts: ${dir}`);
  console.error(serverOutput.slice(-6000));
  throw error;
} finally {
  await browser?.close();
  server?.kill();
  await client?.end();
  await pg.stop();
}
