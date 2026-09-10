import assert from "node:assert/strict";
import test from "node:test";

import {
  createAndroidPairingCode,
  hashAndroidWidgetSecret,
  normalizeAndroidPairingCode,
} from "./android-widget-secrets";

test("gera códigos Android legíveis, normalizados e com 40 bits de aleatoriedade", () => {
  const codes = Array.from({ length: 100 }, createAndroidPairingCode);
  for (const code of codes) {
    assert.match(code, /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
    assert.equal(normalizeAndroidPairingCode(code.toLowerCase()), code.replace("-", ""));
  }
  assert.equal(new Set(codes).size, codes.length);
});

test("separa hashes de pareamento e acesso sem persistir o segredo", () => {
  const previousSecret = process.env.AUTH_SECRET;
  process.env.AUTH_SECRET = "test-only-secret-with-enough-entropy";
  try {
    const pairing = hashAndroidWidgetSecret("pairing", "ABCD2345");
    const token = hashAndroidWidgetSecret("token", "ABCD2345");
    assert.match(pairing, /^[a-f0-9]{64}$/);
    assert.notEqual(pairing, token);
    assert.equal(pairing, hashAndroidWidgetSecret("pairing", "ABCD2345"));
    assert.ok(!pairing.includes("ABCD2345"));
  } finally {
    if (previousSecret === undefined) delete process.env.AUTH_SECRET;
    else process.env.AUTH_SECRET = previousSecret;
  }
});
