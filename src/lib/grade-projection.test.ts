import assert from "node:assert/strict";
import test from "node:test";
import { projectGrades } from "./grade-projection";
import type { BimesterGradeDTO } from "@/types/subjects";

function grades(...scores: (number | null)[]): BimesterGradeDTO[] {
  return scores.map((score, index) => ({ bimester: (index + 1) as BimesterGradeDTO["bimester"], score, dataSource: "SUAP_REPORT" }));
}

test("projeta notas importadas em quatro bimestres e arredonda para cima", () => {
  assert.equal(projectGrades(grades(60, 80, null, null), 4, 70).neededAverage, 70);
  assert.equal(projectGrades(grades(60), 4, 70).neededAverage, 73.4);
});
test("zero é nota preenchida e ausência não é zero", () => {
  const result = projectGrades(grades(0, null), 2, 70);
  assert.equal(result.filled, 1);
  assert.equal(result.neededAverage, 140);
  assert.equal(result.status, "unreachable");
});
test("disciplina sem notas usa a meta e ignora etapas fora do semestre", () => {
  assert.equal(projectGrades([], 2, 70).neededAverage, 70);
  assert.equal(projectGrades(grades(80, null, 100, 100), 2, 70).neededAverage, 60);
});
test("distingue meta já garantida, resultado abaixo da meta e limite 100", () => {
  assert.equal(projectGrades(grades(100, 100, 80), 4, 70).status, "reached");
  assert.equal(projectGrades(grades(60, 60), 2, 70).status, "finished");
  assert.equal(projectGrades(grades(40, null), 2, 70).status, "pending");
  assert.equal(projectGrades(grades(70, 70), 2, 70).neededAverage, null);
});
