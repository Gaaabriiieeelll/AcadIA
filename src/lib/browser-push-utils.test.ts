import assert from "node:assert/strict";
import test from "node:test";

import {
  browserPushCategoryEnabled,
  browserPushTopic,
  buildBrowserPushPayload,
  hashBrowserPushEndpoint,
  safeBrowserPushHref,
  trustedBrowserPushEndpoint,
} from "./browser-push-utils";

test("gera identificadores push determinísticos sem expor o endpoint", () => {
  const endpoint = "https://push.example/subscription/secret";
  const hash = hashBrowserPushEndpoint(endpoint);

  assert.equal(hash.length, 64);
  assert.equal(hash, hashBrowserPushEndpoint(endpoint));
  assert.equal(hash.includes("secret"), false);
  assert.match(browserPushTopic("grades-math"), /^[A-Za-z0-9_-]{32}$/);
});

test("mantém somente destinos internos seguros nas notificações", () => {
  assert.equal(safeBrowserPushHref("/alertas?filtro=notas#agora"), "/alertas?filtro=notas#agora");
  assert.equal(safeBrowserPushHref("https://malicioso.example"), "/alertas");
  assert.equal(safeBrowserPushHref("//malicioso.example"), "/alertas");
});

test("aceita somente endpoints de provedores Web Push conhecidos", () => {
  assert.equal(trustedBrowserPushEndpoint("https://fcm.googleapis.com/fcm/send/abc"), true);
  assert.equal(trustedBrowserPushEndpoint("https://updates.push.services.mozilla.com/wpush/v2/abc"), true);
  assert.equal(trustedBrowserPushEndpoint("https://web.push.apple.com/QP/abc"), true);
  assert.equal(trustedBrowserPushEndpoint("https://wns2.example.notify.windows.com/w/?token=abc"), true);
  assert.equal(trustedBrowserPushEndpoint("https://127.0.0.1/internal"), false);
  assert.equal(trustedBrowserPushEndpoint("https://push.attacker.example/collect"), false);
  assert.equal(trustedBrowserPushEndpoint("https://user@fcm.googleapis.com/fcm/send/abc"), false);
});

test("respeita categorias e monta um payload limitado à navegação do AcadIA", () => {
  const preference = {
    gradesEnabled: true,
    attendanceEnabled: false,
    tasksEnabled: false,
    calendarEnabled: true,
  };
  assert.equal(browserPushCategoryEnabled("grades", preference), true);
  assert.equal(browserPushCategoryEnabled("attendance", preference), false);
  assert.equal(browserPushCategoryEnabled("desconhecida", preference), false);

  const payload = buildBrowserPushPayload({
    alertKey: "grade-math",
    description: "Sua média precisa de atenção.",
    href: "https://externo.example",
    severity: "warning",
    title: "Matemática",
  });
  assert.equal(payload.title, "Atenção · Matemática");
  assert.equal(payload.href, "/alertas");
  assert.equal(payload.icon, "/acadia-logo.jpeg");
});
