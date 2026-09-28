import assert from "node:assert/strict";
import test from "node:test";

import { parseSuapReport } from "./suap-report";

test("lê notas e frequência de um boletim SUAP com duas colunas por etapa", () => {
  const result = parseSuapReport([
    { page: 1, text: "BOLETIM DE NOTAS INDIVIDUAL" },
    { page: 1, text: "2176 INT.0010 - Geografia III 80 46 6 86,95% Cursando 60 2 80 2 - 2 - 0 - - 0 -" },
  ]);

  assert.equal(result.skippedRows, 0);
  assert.deepEqual(result.rows, [{
    diaryCode: "2176",
    academicCode: "INT.0010",
    name: "Geografia III",
    grades: [60, 80, null, null],
    classesHeld: 46,
    absences: 6,
    officialAverage: null,
    finalAssessmentScore: null,
    finalAverage: null,
    academicStatus: "Cursando",
  }]);
});

test("reconhece colunas de recuperação sem importá-las como notas bimestrais", () => {
  const result = parseSuapReport([
    { page: 1, text: "N1 F1 RP1 M1 N2 F2 RP2 M2 N3 F3 RP3 M3 N4 F4 RP4 M4" },
    { page: 1, text: "20491 Disciplina.3692 - Informática Básica 74 40 10 75,0% Cursando 9,20 4 - 9,20 7,40 6 - 7,40 - 0 - - - - 0 -" },
  ]);

  assert.equal(result.rows.length, 1);
  assert.deepEqual(result.rows[0].grades, [9.2, 7.4, null, null]);
  assert.equal(result.rows[0].name, "Informática Básica");
});

test("separa carga horária decimal e ignora frequência inconsistente", () => {
  const result = parseSuapReport([
    { page: 1, text: "340563 INT.11608 (SRQFILO) - FILOSOFIA 66,70 80 75 12 84,0% Cursando 7,50 4 8,00 2 8,50 6 - 0 - - 0 -" },
    { page: 1, text: "340564 INT.11609 - SOCIOLOGIA 66,70 80 40 10 88,0% Cursando 7,50 4 8,00 2 - 0 - 0 - - 0 -" },
  ]);

  assert.equal(result.rows.length, 2);
  assert.equal(result.rows[0].name, "FILOSOFIA");
  assert.deepEqual(result.rows[0].grades, [7.5, 8, 8.5, null]);
  assert.equal(result.rows[0].classesHeld, 75);
  assert.equal(result.rows[1].classesHeld, null);
  assert.equal(result.rows[1].absences, null);
});

test("usa a posição das colunas do PDF quando uma etapa está vazia", () => {
  const item = (x: number, text: string, width = text.length * 4) => ({ x, width, text });
  const result = parseSuapReport([
    { page: 1, y: 500, text: "Matrícula: 20260000001 Período Letivo: 2026/1", items: [] },
    {
      page: 1,
      y: 440,
      text: "Diário Disciplina C. H. T. de T. Faltas % Freq. Situação E1 E2 E3 E4 MD NAF MFD/",
      items: [
        item(30, "Diário"), item(160, "Disciplina"), item(303, "C. H."),
        item(347, "T. de"), item(383, "T. Faltas"), item(424, "% Freq."),
        item(475, "Situação"), item(542, "E1"), item(587, "E2"),
        item(631, "E3"), item(676, "E4"), item(708, "MD"),
        item(739, "NAF"), item(788, "MFD/"),
      ],
    },
    {
      page: 1,
      y: 425,
      text: "N F N F N F N F",
      items: [item(533, "N"), item(556, "F"), item(578, "N"), item(600, "F"),
        item(622, "N"), item(645, "F"), item(667, "N"), item(689, "F")],
    },
    {
      page: 1,
      y: 412,
      text: "106499 TIN.0001 - Matemática II 80 40 4 90% Cursando - 0 78 4 - 0 - 0 82",
      items: [
        item(28, "106499", 27), item(71, "TIN.0001 - Matemática II", 105),
        item(308, "80", 9), item(352, "40", 9), item(397, "4", 4),
        item(431, "90%", 16), item(475, "Cursando", 35),
        item(556, "0", 4), item(576, "78", 9), item(601, "4", 4),
        item(624, "-", 3), item(645, "0", 4),
        item(668, "-", 3), item(689, "0", 4), item(712, "82", 9),
        item(733, "70", 9), item(797, "82", 9),
      ],
    },
  ]);

  assert.equal(result.skippedRows, 0);
  assert.equal(result.rows.length, 1);
  assert.deepEqual(result.rows[0].grades, [null, 78, null, null]);
  assert.equal(result.rows[0].officialAverage, 82);
  assert.equal(result.rows[0].finalAssessmentScore, 70);
  assert.equal(result.rows[0].finalAverage, 82);
  assert.equal(result.rows[0].classesHeld, 40);
  assert.equal(result.rows[0].absences, 4);
  assert.equal(result.registrationNumber, "20260000001");
  assert.equal(result.period, "2026/1");
});
