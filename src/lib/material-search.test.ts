import assert from "node:assert/strict";
import test from "node:test";
import { filterMaterials } from "./material-search";
import type { ClassroomMaterialDTO } from "@/types/google-classroom";

const materials: ClassroomMaterialDTO[] = [
  { id: "1", courseId: "a", courseName: "Física", subjectId: null, source: "material", title: "Revisão", description: "Movimento", alternateLink: null, publishedAt: "2026-10-01", updatedAt: null, attachments: [{ type: "drive", title: "Exercícios de aceleração", url: "https://example.com" }] },
  { id: "2", courseId: "b", courseName: "Química", subjectId: null, source: "announcement", title: "Aviso", description: null, alternateLink: null, publishedAt: "2026-10-08", updatedAt: null, attachments: [] },
];
const defaults = { query: "", courseId: "", kind: "", order: "newest" };

test("busca sem acento ou distinção de maiúsculas em turma e anexos", () => {
  assert.deepEqual(filterMaterials(materials, { ...defaults, query: "FISICA aceleracao" }).map((m) => m.id), ["1"]);
});
test("combina turma, tipo de publicação e tipo de anexo", () => {
  assert.equal(filterMaterials(materials, { ...defaults, courseId: "b", kind: "drive" }).length, 0);
  assert.equal(filterMaterials(materials, { ...defaults, kind: "announcement" })[0].id, "2");
  assert.equal(filterMaterials(materials, { ...defaults, kind: "drive" })[0].id, "1");
});
test("ordena sem alterar a lista recebida e permite limpar filtros", () => {
  assert.deepEqual(filterMaterials(materials, defaults).map((m) => m.id), ["2", "1"]);
  assert.deepEqual(filterMaterials(materials, { ...defaults, order: "oldest" }).map((m) => m.id), ["1", "2"]);
  assert.deepEqual(filterMaterials(materials, { ...defaults, order: "title" }).map((m) => m.id), ["2", "1"]);
  assert.equal(materials[0].id, "1");
  assert.equal(filterMaterials(materials, { ...defaults, query: "inexistente" }).length, 0);
  assert.equal(filterMaterials(materials, defaults).length, 2);
});
