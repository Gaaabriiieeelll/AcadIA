import assert from "node:assert/strict";
import test from "node:test";

import {
  hasConfiguredJobSecret,
  isBearerRequestAuthorized,
} from "./job-authorization";

test("detecta ao menos um segredo de job configurado", () => {
  assert.equal(hasConfiguredJobSecret([undefined, "  ", "cron-secret"]), true);
  assert.equal(hasConfiguredJobSecret([undefined, "  "]), false);
});

test("aceita qualquer segredo Bearer explicitamente configurado", () => {
  const request = new Request("https://acadia.example/api/jobs/whatsapp-alerts", {
    headers: { authorization: "Bearer cron-secret" },
  });

  assert.equal(
    isBearerRequestAuthorized(request, ["legacy-secret", "cron-secret"]),
    true,
  );
});

test("rejeita cabeçalho ausente, formato inválido e segredo incorreto", () => {
  const url = "https://acadia.example/api/jobs/whatsapp-alerts";

  assert.equal(isBearerRequestAuthorized(new Request(url), ["cron-secret"]), false);
  assert.equal(isBearerRequestAuthorized(new Request(url, {
    headers: { authorization: "cron-secret" },
  }), ["cron-secret"]), false);
  assert.equal(isBearerRequestAuthorized(new Request(url, {
    headers: { authorization: "Bearer outro-segredo" },
  }), ["cron-secret"]), false);
});
