import assert from "node:assert/strict";
import test from "node:test";

import { accountDeletionSchema, aiConsentIntentSchema } from "./privacy";

test("aceita somente as intenções previstas para o consentimento", () => {
  assert.equal(aiConsentIntentSchema.safeParse("grant").success, true);
  assert.equal(aiConsentIntentSchema.safeParse("revoke").success, true);
  assert.equal(aiConsentIntentSchema.safeParse("true").success, false);
});

test("normaliza o e-mail e a frase da confirmação de exclusão", () => {
  const result = accountDeletionSchema.parse({
    email: "  Estudante@Example.com ",
    confirmation: "  excluir minha conta ",
  });

  assert.deepEqual(result, {
    email: "estudante@example.com",
    confirmation: "EXCLUIR MINHA CONTA",
  });
});

test("rejeita e-mail inválido ou frase diferente", () => {
  assert.equal(accountDeletionSchema.safeParse({
    email: "inválido",
    confirmation: "EXCLUIR",
  }).success, false);
});
