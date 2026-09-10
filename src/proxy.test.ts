import assert from "node:assert/strict";
import test from "node:test";

import { NextRequest } from "next/server";

import { proxy } from "./proxy";

test("gera nonce novo e uma política de scripts estrita por resposta", () => {
  const first = proxy(new NextRequest("https://acadia.example/dashboard"));
  const second = proxy(new NextRequest("https://acadia.example/dashboard"));
  const firstPolicy = first.headers.get("content-security-policy");
  const secondPolicy = second.headers.get("content-security-policy");

  assert.ok(firstPolicy);
  assert.ok(secondPolicy);
  assert.match(firstPolicy, /script-src 'self' 'nonce-[^']+' 'strict-dynamic'/);
  assert.match(firstPolicy, /script-src-attr 'none'/);
  assert.match(firstPolicy, /frame-ancestors 'none'/);
  assert.notEqual(firstPolicy, secondPolicy);
});
