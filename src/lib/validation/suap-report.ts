import "server-only";

import { z } from "zod";

const grade = z.number().finite().min(0).max(100).nullable();
const attendanceValue = z.number().int().min(0).max(10000).nullable();

const reportRowSchema = z.object({
  diaryCode: z.string().trim().regex(/^\d{3,30}$/),
  academicCode: z.string().trim().max(30).nullable(),
  name: z.string().trim().min(1).max(120),
  grades: z.tuple([grade, grade, grade, grade]),
  classesHeld: attendanceValue,
  absences: attendanceValue,
  officialAverage: grade,
  finalAssessmentScore: grade,
  finalAverage: grade,
  academicStatus: z.string().trim().max(30).nullable(),
  targetSubjectId: z.uuid().nullable(),
}).superRefine((row, context) => {
  if ((row.classesHeld === null) !== (row.absences === null)) {
    context.addIssue({
      code: "custom",
      message: "Aulas e faltas devem ser informadas juntas.",
      path: ["classesHeld"],
    });
  }
  if (
    row.classesHeld !== null && row.absences !== null
    && row.absences > row.classesHeld
  ) {
    context.addIssue({
      code: "custom",
      message: "Faltas não podem exceder as aulas.",
      path: ["absences"],
    });
  }
  if (
    row.grades.every((score) => score === null)
    && row.classesHeld === null
    && row.officialAverage === null
    && row.finalAssessmentScore === null
    && row.finalAverage === null
  ) {
    context.addIssue({
      code: "custom",
      message: "Selecione pelo menos uma nota ou frequência para importar.",
      path: ["grades"],
    });
  }
});

export const reportImportSchema = z.array(reportRowSchema).min(1).max(50);
