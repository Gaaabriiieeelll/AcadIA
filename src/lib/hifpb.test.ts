import assert from "node:assert/strict";
import test from "node:test";

import {
  ETIM_COURSES,
  resolveAcademicClassGroup,
} from "./academic-profile-options";
import { resolveHifpbProfileSelection } from "./hifpb-courses";
import {
  filterHifpbScheduleByGroup,
  formatHifpbSubjectName,
  parseHifpbSchedule,
} from "./hifpb-parser";

const courseIds = [81, 19, 15, 20, 16, 17, 79, 82, 18];

test("normaliza somente as divisões acadêmicas aceitas", () => {
  assert.equal(resolveAcademicClassGroup(" a "), "A");
  assert.equal(resolveAcademicClassGroup("C"), "C");
  assert.equal(resolveAcademicClassGroup("2026.1"), null);
  assert.equal(resolveAcademicClassGroup(null), null);
});

test("relaciona cada curso ETIM ao identificador oficial do hIFPB", () => {
  ETIM_COURSES.forEach((course, index) => {
    const selection = resolveHifpbProfileSelection({
      academicStage: "2º ano",
      course,
    });

    assert.ok(selection);
    assert.equal(selection.courseId, courseIds[index]);
    assert.equal(selection.sourceUrl, `https://joaopessoa.ifpb.edu.br/horario/curso/${courseIds[index]}`);
    assert.equal(selection.tableIndex, 1);
  });
});

test("monta o nome e a tabela da turma a partir do curso e ano", () => {
  const electronics = resolveHifpbProfileSelection({
    academicStage: "2º ano",
    course: ETIM_COURSES[3],
  });
  const electrotechnics = resolveHifpbProfileSelection({
    academicStage: "4º ano",
    course: ETIM_COURSES[5],
  });

  assert.equal(electronics?.className, "Eletrônica II");
  assert.equal(electronics?.tableIndex, 1);
  assert.equal(electrotechnics?.className, "Eletrotécnica IV · Vespertino");
  assert.equal(electrotechnics?.tableIndex, 3);
});

test("rejeita curso ou ano sem correspondência", () => {
  assert.equal(resolveHifpbProfileSelection({
    academicStage: "5º ano",
    course: ETIM_COURSES[3],
  }), null);
  assert.equal(resolveHifpbProfileSelection({
    academicStage: "2º ano",
    course: "Curso inexistente",
  }), null);
});

test("lê a tabela do ano selecionado e preserva a fonte oficial", () => {
  const selection = resolveHifpbProfileSelection({
    academicStage: "2º ano",
    course: ETIM_COURSES[3],
  });
  assert.ok(selection);

  const html = `
    <h6>Semestre 2026.2</h6>
    <div class="alert"><b>[ ELETRONICA INTEGRADO ]</b></div>
    <table><tbody><tr><td>07:00 - 07:50</td><td></td><td></td><td></td><td></td><td></td></tr></tbody></table>
    <table><tbody><tr>
      <td>07:00 - 07:50</td>
      <td><div class="card-turma"><div class="card-header"><span>BIOLOGIA II - U</span></div><a href="/horario/professor/21">LUCIANA</a><a href="/horario/sala/7">SALA 07</a></div></td>
      <td><div class="card-turma"><div class="card-header"><span>ELETRON DIGIT - C</span></div><a href="/horario/professor/30">ERIK</a><a href="/horario/laboratorio/18">ELETRIC I</a></div></td>
      <td></td><td></td><td></td>
    </tr></tbody></table>
  `;

  const schedule = parseHifpbSchedule(html, selection);

  assert.equal(schedule.className, "Eletrônica II");
  assert.equal(schedule.course, "ELETRONICA INTEGRADO");
  assert.equal(schedule.sourceUrl, selection.sourceUrl);
  assert.equal(schedule.semester, "2026.2");
  assert.equal(schedule.slots[0]?.classes.monday[0]?.professor, "LUCIANA");
  assert.equal(
    schedule.slots[0]?.classes.tuesday[0]?.roomUrl,
    "https://joaopessoa.ifpb.edu.br/horario/laboratorio/18",
  );
});

test("reconhece as divisões A, B e C publicadas pelo hIFPB", () => {
  const selection = resolveHifpbProfileSelection({
    academicStage: "2º ano",
    course: ETIM_COURSES[3],
  });
  assert.ok(selection);

  const html = `
    <h6>Semestre 2026.2</h6>
    <div class="alert"><b>[ ELETRONICA INTEGRADO ]</b></div>
    <table></table>
    <table><tbody><tr>
      <td>07:00 - 07:50</td>
      <td>
        <div class="card-turma"><div class="card-header"><span>MATEMATICA II - U</span></div><a href="/horario/professor/1">DOCENTE COMUM</a></div>
        <div class="card-turma"><div class="card-header"><span>ELETRON DIGIT - A</span></div><a href="/horario/professor/2">DOCENTE A</a></div>
        <div class="card-turma"><div class="card-header"><span>ELETRON DIGIT - B</span></div><a href="/horario/professor/3">DOCENTE B</a></div>
        <div class="card-turma"><div class="card-header"><span>ELETRON DIGIT - C</span></div><a href="/horario/professor/4">DOCENTE C</a></div>
      </td>
      <td></td><td></td><td></td><td></td>
    </tr></tbody></table>
  `;
  const schedule = parseHifpbSchedule(html, selection);
  const groupC = filterHifpbScheduleByGroup(schedule, "C");

  assert.deepEqual(
    groupC.slots[0]?.classes.monday.map((academicClass) => academicClass.subject),
    ["MATEMATICA II - U", "ELETRON DIGIT - C"],
  );
  assert.deepEqual(
    groupC.professors.map((professor) => professor.name),
    ["DOCENTE C", "DOCENTE COMUM"],
  );
  assert.equal(formatHifpbSubjectName("ELETRON DIGIT - C"), "ELETRON DIGIT · C");
});
