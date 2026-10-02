import assert from "node:assert/strict";
import test from "node:test";

import { compactGroqStudyContext, studyChatProvider } from "./study-chat-provider";

test("usa Groq quando a chave está presente e preserva OpenAI como alternativa", () => {
  assert.equal(studyChatProvider({ GROQ_API_KEY: "groq", OPENAI_API_KEY: "openai" }), "groq");
  assert.equal(studyChatProvider({ GROQ_API_KEY: "  ", OPENAI_API_KEY: "openai" }), "openai");
  assert.equal(studyChatProvider({}), "none");
});

test("reduz o contexto enviado ao plano gratuito da Groq", () => {
  const history = Array.from({ length: 10 }, (_, index) => ({
    role: index % 2 ? "assistant" as const : "user" as const,
    content: `Mensagem ${index}`,
  }));
  const subjects = Array.from({ length: 10 }, (_, index) => ({
    id: `${index}`,
    materials: Array.from({ length: 5 }, () => ({
      id: "material",
      title: "T".repeat(200),
      description: "D".repeat(300),
      attachmentTitles: Array.from({ length: 5 }, () => "A".repeat(100)),
    })),
  }));

  const compact = compactGroqStudyContext(history, subjects);
  assert.equal(compact.history.length, 6);
  assert.equal(compact.history[0].content, "Mensagem 4");
  assert.equal(compact.subjects.length, 8);
  assert.equal(compact.subjects[0].materials.length, 3);
  assert.equal(compact.subjects[0].materials[0].title.length, 160);
  assert.equal(compact.subjects[0].materials[0].description?.length, 220);
  assert.equal(compact.subjects[0].materials[0].attachmentTitles.length, 3);
  assert.equal(compact.subjects[0].materials[0].attachmentTitles[0].length, 80);
  assert.equal(subjects[0].materials[0].description.length, 300);
});
