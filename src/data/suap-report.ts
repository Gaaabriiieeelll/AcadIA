import "server-only";

import { db } from "@/lib/db";
import { SUBJECT_COLORS } from "@/types/subjects";
import type { SuapReportImportRow } from "@/types/suap-report";

import { requireCurrentIdentity } from "./current-user";

function normalizedSubjectName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleUpperCase("pt-BR");
}

export async function importCurrentSuapReport(rows: SuapReportImportRow[]) {
  const { googleSubject } = await requireCurrentIdentity();
  const user = await db.user.findUnique({
    where: { googleSubject },
    select: { id: true, profile: { select: { id: true } } },
  });
  if (!user?.profile) throw new Error("ACADEMIC_PROFILE_REQUIRED");

  return db.$transaction(async (transaction) => {
    const existingSubjects = await transaction.subject.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, academicCode: true, bimesterCount: true },
    });
    const byId = new Map(existingSubjects.map((subject) => [subject.id, subject]));
    const byName = new Map(
      existingSubjects.map((subject) => [normalizedSubjectName(subject.name), subject]),
    );
    const processedIds = new Set<string>();
    let created = 0;
    let updated = 0;

    for (const row of rows) {
      let subject = row.targetSubjectId
        ? byId.get(row.targetSubjectId)
        : byName.get(normalizedSubjectName(row.name));
      if (row.targetSubjectId && !subject) throw new Error("SUBJECT_NOT_FOUND");
      if (subject && processedIds.has(subject.id)) throw new Error("DUPLICATE_SUBJECT");

      const hasFourBimesters = row.grades[2] !== null || row.grades[3] !== null;
      const subjectData = {
        diaryCode: row.diaryCode,
        academicCode: row.academicCode || subject?.academicCode || null,
        classesHeld: row.classesHeld ?? undefined,
        absences: row.absences ?? undefined,
        officialAverage: row.officialAverage ?? undefined,
        finalAssessmentScore: row.finalAssessmentScore ?? undefined,
        finalAverage: row.finalAverage ?? undefined,
        academicStatus: row.academicStatus ?? undefined,
        bimesterCount: hasFourBimesters ? 4 : subject?.bimesterCount ?? 4,
        dataSource: "SUAP_REPORT" as const,
        sourceUpdatedAt: new Date(),
      };

      if (subject) {
        await transaction.subject.update({
          where: { id: subject.id },
          data: subjectData,
          select: { id: true },
        });
        updated++;
      } else {
        subject = await transaction.subject.create({
          data: {
            userId: user.id,
            name: row.name,
            color: SUBJECT_COLORS[created % SUBJECT_COLORS.length],
            ...subjectData,
          },
          select: { id: true, name: true, academicCode: true, bimesterCount: true },
        });
        created++;
        byId.set(subject.id, subject);
        byName.set(normalizedSubjectName(subject.name), subject);
      }

      processedIds.add(subject.id);
      await Promise.all(row.grades.map((score, index) => score === null
        ? Promise.resolve()
        : transaction.bimesterGrade.upsert({
            where: {
              subjectId_bimester: { subjectId: subject.id, bimester: index + 1 },
            },
            create: {
              subjectId: subject.id,
              bimester: index + 1,
              score,
              dataSource: "SUAP_REPORT",
            },
            update: { score, dataSource: "SUAP_REPORT" },
            select: { id: true },
          }),
      ));
    }

    return { created, updated };
  }, { timeout: 30000 });
}
