import "server-only";

import { db } from "@/lib/db";
import { resolveSubjectFilter } from "@/lib/subject-filter";
import {
  BIMESTERS,
  type AcademicDashboardDTO,
  type AcademicOverviewDTO,
  type AssessmentFormValues,
  type AttendanceFormValues,
  type BimesterCount,
  type BimesterGradesFormValues,
  type BimesterNumber,
  type SubjectDTO,
  type SubjectFormValues,
  getSubjectBimesters,
} from "@/types/subjects";

import { requireCurrentIdentity } from "./current-user";

export class AcademicProfileRequiredError extends Error {
  constructor() {
    super("Academic profile required");
    this.name = "AcademicProfileRequiredError";
  }
}

export class AcademicResourceNotFoundError extends Error {
  constructor() {
    super("Academic resource not found");
    this.name = "AcademicResourceNotFoundError";
  }
}

async function requireAcademicUser() {
  const { googleSubject } = await requireCurrentIdentity();
  const user = await db.user.findUnique({
    where: { googleSubject },
    select: {
      id: true,
      profile: { select: { id: true } },
    },
  });

  if (!user?.profile) throw new AcademicProfileRequiredError();

  return user;
}

function roundMetric(value: number) {
  return Math.round(value * 10) / 10;
}

function calculateAverage(
  assessments: Array<{ score: { toString(): string }; weight: { toString(): string } }>,
) {
  if (assessments.length === 0) return null;

  const totals = assessments.reduce(
    (result, assessment) => {
      const score = Number(assessment.score.toString());
      const weight = Number(assessment.weight.toString());
      return {
        weightedScore: result.weightedScore + score * weight,
        weight: result.weight + weight,
      };
    },
    { weightedScore: 0, weight: 0 },
  );

  return totals.weight > 0 ? roundMetric(totals.weightedScore / totals.weight) : null;
}

function calculateBimesterAverage(
  grades: Array<{ score: { toString(): string } | null }>,
) {
  const scores = grades
    .filter((grade) => grade.score !== null)
    .map((grade) => Number(grade.score!.toString()));

  if (scores.length === 0) return null;
  return roundMetric(scores.reduce((total, score) => total + score, 0) / scores.length);
}

function calculateAttendance(classesHeld: number, absences: number) {
  if (classesHeld === 0) return null;
  return roundMetric(((classesHeld - absences) / classesHeld) * 100);
}

export async function getSubjectsForUser(userId: string): Promise<SubjectDTO[]> {
  const subjects = await db.subject.findMany({
    where: { userId },
    orderBy: [{ name: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      teacher: true,
      color: true,
      classesHeld: true,
      absences: true,
      academicPeriod: true,
      academicStatus: true,
      officialAverage: true,
      finalAssessmentScore: true,
      finalAverage: true,
      bimesterCount: true,
      dataSource: true,
      sourceUpdatedAt: true,
      bimesterGrades: {
        orderBy: { bimester: "asc" },
        select: {
          bimester: true,
          score: true,
          dataSource: true,
        },
      },
      assessments: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          score: true,
          weight: true,
        },
      },
    },
  });

  return subjects.map((subject) => {
    const bimesterCount = subject.bimesterCount as BimesterCount;
    const visibleBimesterGrades = subject.bimesterGrades.filter(
      (grade) => grade.bimester <= bimesterCount,
    );
    const bimesterAverage = calculateBimesterAverage(visibleBimesterGrades);
    const legacyAverage = calculateAverage(subject.assessments);
    const officialAverage = subject.officialAverage === null
      ? null
      : Number(subject.officialAverage.toString());

    return {
      id: subject.id,
      name: subject.name,
      teacher: subject.teacher,
      color: subject.color,
      classesHeld: subject.classesHeld,
      absences: subject.absences,
      attendancePercentage: calculateAttendance(subject.classesHeld, subject.absences),
      bimesterCount,
      bimesterAverage,
      averageScore: officialAverage ?? bimesterAverage ?? legacyAverage,
      officialAverage,
      finalAssessmentScore: subject.finalAssessmentScore === null
        ? null
        : Number(subject.finalAssessmentScore.toString()),
      finalAverage: subject.finalAverage === null
        ? null
        : Number(subject.finalAverage.toString()),
      academicStatus: subject.academicStatus,
      academicPeriod: subject.academicPeriod,
      dataSource: subject.dataSource,
      sourceUpdatedAt: subject.sourceUpdatedAt?.toISOString() ?? null,
      bimesterGrades: visibleBimesterGrades.map((grade) => ({
        bimester: grade.bimester as BimesterNumber,
        score: grade.score === null ? null : Number(grade.score.toString()),
        dataSource: grade.dataSource,
      })),
      assessments: subject.assessments.map((assessment) => ({
        id: assessment.id,
        name: assessment.name,
        score: Number(assessment.score.toString()),
        weight: Number(assessment.weight.toString()),
      })),
    };
  });
}

export async function getCurrentSubjects(): Promise<SubjectDTO[]> {
  const user = await requireAcademicUser();
  return getSubjectsForUser(user.id);
}

export async function getCurrentAcademicOverview(): Promise<AcademicOverviewDTO> {
  const subjects = await getCurrentSubjects();
  return createAcademicOverview(subjects);
}

function createAcademicOverview(subjects: SubjectDTO[]): AcademicOverviewDTO {
  const averages = subjects
    .map((subject) => subject.averageScore)
    .filter((average): average is number => average !== null);
  const filledBimesterGrades = subjects.flatMap((subject) =>
    subject.bimesterGrades.filter((grade) => grade.score !== null),
  );
  const totalClasses = subjects.reduce((total, subject) => total + subject.classesHeld, 0);
  const totalAbsences = subjects.reduce((total, subject) => total + subject.absences, 0);

  return {
    subjectCount: subjects.length,
    assessmentCount: filledBimesterGrades.length,
    totalBimesterCount: subjects.reduce(
      (total, subject) => total + subject.bimesterCount,
      0,
    ),
    subjectsWithoutGrades: subjects.filter((subject) =>
      subject.bimesterGrades.every((grade) => grade.score === null),
    ).length,
    twoBimesterSubjects: subjects.filter((subject) => subject.bimesterCount === 2).length,
    fourBimesterSubjects: subjects.filter((subject) => subject.bimesterCount === 4).length,
    averageScore:
      averages.length > 0
        ? roundMetric(averages.reduce((total, average) => total + average, 0) / averages.length)
        : null,
    attendancePercentage: calculateAttendance(totalClasses, totalAbsences),
  };
}

export async function getCurrentAcademicDashboard(
  requestedSubjectIds: readonly string[] = [],
): Promise<AcademicDashboardDTO> {
  const availableSubjects = await getCurrentSubjects();
  const { selectedIds, subjects } = resolveSubjectFilter(
    availableSubjects,
    requestedSubjectIds,
  );

  return {
    availableSubjects: availableSubjects.map(({ id, name, color }) => ({ id, name, color })),
    selectedSubjectIds: selectedIds,
    overview: createAcademicOverview(subjects),
    bimesters: BIMESTERS.map((bimester) => {
      const eligibleSubjects = subjects.filter(
        (subject) => subject.bimesterCount >= bimester,
      );
      const scores = eligibleSubjects
        .map((subject) =>
          subject.bimesterGrades.find((grade) => grade.bimester === bimester)?.score,
        )
        .filter((score): score is number => score !== null && score !== undefined);

      return {
        bimester,
        averageScore: scores.length > 0
          ? roundMetric(scores.reduce((total, score) => total + score, 0) / scores.length)
          : null,
        filledGrades: scores.length,
        eligibleSubjects: eligibleSubjects.length,
      };
    }),
    subjects,
  };
}

export async function createCurrentSubject(values: SubjectFormValues) {
  const user = await requireAcademicUser();
  await db.subject.create({
    data: {
      userId: user.id,
      name: values.name,
      teacher: values.teacher,
      color: values.color,
    },
    select: { id: true },
  });
}

function normalizedSubjectName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleUpperCase("pt-BR");
}

export async function synchronizeCurrentSubjects(subjects: SubjectFormValues[]) {
  const user = await requireAcademicUser();
  const existingSubjects = await db.subject.findMany({
    where: { userId: user.id },
    select: { id: true, name: true, teacher: true },
  });
  const existingByName = new Map(
    existingSubjects.map((subject) => [normalizedSubjectName(subject.name), subject]),
  );
  const missingSubjects = subjects.filter(
    (subject) => !existingByName.has(normalizedSubjectName(subject.name)),
  );
  const changedSubjects = subjects.flatMap((subject) => {
    const existing = existingByName.get(normalizedSubjectName(subject.name));
    return existing && subject.teacher && subject.teacher !== existing.teacher
      ? [{ id: existing.id, teacher: subject.teacher }]
      : [];
  });

  return db.$transaction(async (transaction) => {
    const created = missingSubjects.length > 0
      ? await transaction.subject.createMany({
          data: missingSubjects.map((subject) => ({
            userId: user.id,
            name: subject.name,
            teacher: subject.teacher,
            color: subject.color,
          })),
          skipDuplicates: true,
        })
      : { count: 0 };

    await Promise.all(
      changedSubjects.map((subject) =>
        transaction.subject.update({
          where: { id: subject.id },
          data: { teacher: subject.teacher },
          select: { id: true },
        }),
      ),
    );

    return { created: created.count, updated: changedSubjects.length };
  });
}

export async function addCurrentAssessment(
  subjectId: string,
  values: AssessmentFormValues,
) {
  const user = await requireAcademicUser();
  const subject = await db.subject.findFirst({
    where: { id: subjectId, userId: user.id },
    select: { id: true },
  });

  if (!subject) throw new AcademicResourceNotFoundError();

  await db.assessment.create({
    data: {
      subjectId: subject.id,
      name: values.name,
      score: values.score,
      weight: values.weight,
    },
    select: { id: true },
  });
}

export async function updateCurrentBimesterGrades(
  subjectId: string,
  values: BimesterGradesFormValues,
) {
  const user = await requireAcademicUser();
  const subject = await db.subject.findFirst({
    where: { id: subjectId, userId: user.id },
    select: { id: true, bimesterCount: true },
  });

  if (!subject) throw new AcademicResourceNotFoundError();

  const scores = [
    values.bimester1,
    values.bimester2,
    values.bimester3,
    values.bimester4,
  ];

  const activeBimesters = getSubjectBimesters(subject.bimesterCount as BimesterCount);

  await db.$transaction(async (transaction) => {
    await transaction.bimesterGrade.deleteMany({
      where: {
        subjectId: subject.id,
        bimester: { gt: subject.bimesterCount },
      },
    });

    await Promise.all(
      activeBimesters.map((bimester, index) =>
        transaction.bimesterGrade.upsert({
          where: {
            subjectId_bimester: {
              subjectId: subject.id,
              bimester,
            },
          },
          create: {
            subjectId: subject.id,
            bimester,
            score: scores[index],
            dataSource: "MANUAL",
          },
          update: {
            score: scores[index],
            dataSource: "MANUAL",
          },
        }),
      ),
    );
  });
}

export async function updateCurrentAttendance(
  subjectId: string,
  values: AttendanceFormValues,
) {
  const user = await requireAcademicUser();
  const result = await db.subject.updateMany({
    where: { id: subjectId, userId: user.id },
    data: values,
  });

  if (result.count === 0) throw new AcademicResourceNotFoundError();
}

export async function deleteCurrentAssessment(subjectId: string, assessmentId: string) {
  const user = await requireAcademicUser();
  const result = await db.assessment.deleteMany({
    where: {
      id: assessmentId,
      subjectId,
      subject: { userId: user.id },
    },
  });

  if (result.count === 0) throw new AcademicResourceNotFoundError();
}

export async function deleteCurrentSubject(subjectId: string) {
  const user = await requireAcademicUser();
  const result = await db.subject.deleteMany({
    where: { id: subjectId, userId: user.id },
  });

  if (result.count === 0) throw new AcademicResourceNotFoundError();
}
