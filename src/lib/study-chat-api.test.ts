import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";

import { answerStudyChat, RecommendationAIError } from "./openai-study-recommendations";

const input = {
  userIdentifier: "student-test-id",
  message: "Como estudar circuitos?",
  history: [],
  subjects: [{
    id: "11111111-1111-4111-8111-111111111111",
    name: "Eletrônica",
    averageScore: 64,
    bimesterGrades: [{ bimester: 1, score: 64 }],
    materials: [{
      id: "material-1",
      title: "Circuitos elétricos",
      description: "Lei de Ohm",
      attachmentTitles: [],
    }],
  }],
};

function mockAnswer() {
  return new Response(JSON.stringify({
    output: [{ content: [{
      type: "output_text",
      text: JSON.stringify({ reply: "Revise a Lei de Ohm.", videoQueries: [] }),
    }] }],
  }), { status: 200 });
}

function configureKeys(t: TestContext, groq: string | null) {
  const previousGroq = process.env.GROQ_API_KEY;
  const previousOpenAI = process.env.OPENAI_API_KEY;
  const previousModel = process.env.GROQ_CHAT_MODEL;
  if (groq === null) delete process.env.GROQ_API_KEY;
  else process.env.GROQ_API_KEY = groq;
  process.env.OPENAI_API_KEY = "openai-test-key";
  delete process.env.GROQ_CHAT_MODEL;
  t.after(() => {
    if (previousGroq === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = previousGroq;
    if (previousOpenAI === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousOpenAI;
    if (previousModel === undefined) delete process.env.GROQ_CHAT_MODEL;
    else process.env.GROQ_CHAT_MODEL = previousModel;
  });
}

test("envia o bate-papo à Groq sem campos exclusivos da OpenAI", async (t) => {
  configureKeys(t, "groq-test-key");
  let called = false;
  t.mock.method(globalThis, "fetch", async (url: RequestInfo | URL, init?: RequestInit) => {
    called = true;
    assert.equal(url, "https://api.groq.com/openai/v1/responses");
    assert.equal((init?.headers as Record<string, string>).Authorization, "Bearer groq-test-key");
    const body = JSON.parse(String(init?.body));
    assert.equal(body.model, "openai/gpt-oss-120b");
    assert.equal(body.reasoning.effort, "low");
    assert.equal(body.text.format.strict, true);
    assert.equal(body.store, undefined);
    assert.equal(body.safety_identifier, undefined);
    assert.equal(JSON.parse(body.input).subjects[0].name, "Eletrônica");
    return mockAnswer();
  });

  const result = await answerStudyChat(input);
  assert.equal(called, true);
  assert.equal(result.reply, "Revise a Lei de Ohm.");
});

test("mantém a OpenAI quando a Groq não está configurada", async (t) => {
  configureKeys(t, null);
  t.mock.method(globalThis, "fetch", async (url: RequestInfo | URL, init?: RequestInit) => {
    assert.equal(url, "https://api.openai.com/v1/responses");
    const body = JSON.parse(String(init?.body));
    assert.equal(body.store, false);
    assert.equal(body.reasoning.effort, "none");
    assert.equal(typeof body.safety_identifier, "string");
    return mockAnswer();
  });

  const result = await answerStudyChat(input);
  assert.equal(result.reply, "Revise a Lei de Ohm.");
});

test("não envia dados à OpenAI se a Groq configurada falhar", async (t) => {
  configureKeys(t, "groq-test-key");
  let called = 0;
  t.mock.method(globalThis, "fetch", async (url: RequestInfo | URL) => {
    called += 1;
    assert.equal(url, "https://api.groq.com/openai/v1/responses");
    return new Response("rate limited", { status: 429 });
  });

  await assert.rejects(() => answerStudyChat(input), (error) =>
    error instanceof RecommendationAIError && error.code === "RATE_LIMITED");
  assert.equal(called, 1);
});
