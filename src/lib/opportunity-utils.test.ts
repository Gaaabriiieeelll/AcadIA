import assert from "node:assert/strict";
import test from "node:test";

import type { OpportunityDTO } from "@/types/opportunities";

import { courseMentioned, filterOpportunities, opportunityDeadlineState } from "./opportunity-utils";
import { opportunitySchema } from "./validation/opportunities";

const opportunity: OpportunityDTO = {
  id: "019e1528-1c72-70a8-a70e-bbfeef11f8b4",
  title: "Estágio em manutenção",
  organization: "Empresa Exemplo",
  kind: "internship",
  acceptedCourses: "Mecânica e Eletrônica",
  modality: "onsite",
  location: "João Pessoa",
  deadline: "2026-10-15",
  sourceUrl: "https://example.com/vaga",
  requirements: "Conhecimentos de CAD",
  documents: null,
  notes: null,
  favorite: true,
  hasReminder: true,
  createdAt: "2026-10-01T12:00:00.000Z",
};

test("filtra vagas salvas por curso, favoritos, local, modalidade e prazo", () => {
  const other = {
    ...opportunity,
    id: "019e1528-1c72-70a8-a70e-bbfeef11f8b5",
    title: "Vaga remota",
    favorite: false,
    modality: "remote" as const,
    deadline: "2026-09-30",
  };
  const result = filterOpportunities([opportunity, other], {
    search: "MANUTENCAO",
    kind: "internship",
    modality: "onsite",
    location: "joao",
    courseOnly: true,
    favoritesOnly: true,
    hidePast: true,
  }, "Técnico em Mecânica integrado ao ensino médio", "2026-10-02");

  assert.deepEqual(result.map((item) => item.id), [opportunity.id]);
  assert.equal(courseMentioned("todos os cursos", "Técnico em Mecânica"), true);
  assert.equal(courseMentioned(null, "Técnico em Mecânica"), false);
  assert.equal(opportunityDeadlineState(other.deadline, "2026-10-02"), "past");
});

test("valida a data e exige o link original HTTPS", () => {
  const values = {
    title: opportunity.title,
    organization: opportunity.organization,
    kind: opportunity.kind,
    acceptedCourses: "",
    modality: opportunity.modality,
    location: "",
    deadline: "2026-10-15",
    sourceUrl: opportunity.sourceUrl,
    requirements: "",
    documents: "",
    notes: "",
    reminder: true,
  };

  assert.equal(opportunitySchema.safeParse(values).success, true);
  assert.equal(opportunitySchema.safeParse({ ...values, deadline: "2026-02-30" }).success, false);
  assert.equal(opportunitySchema.safeParse({ ...values, sourceUrl: "http://example.com/vaga" }).success, false);
  assert.equal(opportunitySchema.safeParse({ ...values, sourceUrl: "javascript:alert(1)" }).success, false);
});
