import {
  filterHifpbScheduleByGroup,
  formatHifpbSubjectName,
} from "@/lib/hifpb-parser";
import { SUBJECT_AREAS, type SubjectArea } from "@/lib/subject-areas";
import type { HifpbGroup, HifpbSchedule } from "@/types/hifpb";
import type { SubjectFormValues } from "@/types/subjects";

export { SUBJECT_AREAS as HIFPB_SUBJECT_AREAS } from "@/lib/subject-areas";

export type HifpbSubjectImport = SubjectFormValues & {
  area: SubjectArea;
};

type HifpbSubjectAccumulator = Omit<HifpbSubjectImport, "teacher"> & {
  teachers: Set<string>;
};

function getArea(subject: string): SubjectArea {
  const normalized = subject.toLocaleUpperCase("pt-BR");

  if (/MATEMATICA|FISICA/.test(normalized)) return "exact";
  if (/QUIMICA|BIOLOGIA/.test(normalized)) return "nature";
  if (/HIST[ÓO]RIA|GEOGRAFIA|FILO/.test(normalized)) return "human";
  if (/PORTUGUES|INGLES/.test(normalized)) return "languages";
  if (/EDUC FIS/.test(normalized)) return "wellbeing";
  return "technical";
}

function formatImportedSubjectName(subject: string) {
  return formatHifpbSubjectName(subject)
    .replace(/\s+·\s+[ABC]$/u, "")
    .replace(/\s+-\s+U$/u, "");
}

function formatTeacherNames(teachers: Set<string>) {
  const sortedTeachers = Array.from(teachers).sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );
  let result = "";

  for (const teacher of sortedTeachers) {
    const candidate = result ? `${result} / ${teacher}` : teacher;
    if (candidate.length > 120) {
      return result || teacher.slice(0, 120);
    }
    result = candidate;
  }

  return result || null;
}

export function getHifpbSubjects(
  schedule: HifpbSchedule,
  group?: HifpbGroup,
): HifpbSubjectImport[] {
  const visibleSchedule = group
    ? filterHifpbScheduleByGroup(schedule, group)
    : schedule;
  const subjects = new Map<string, HifpbSubjectAccumulator>();

  for (const slot of visibleSchedule.slots) {
    for (const classes of Object.values(slot.classes)) {
      for (const academicClass of classes) {
        const name = formatImportedSubjectName(academicClass.subject);
        const area = getArea(academicClass.subject);
        const existing = subjects.get(name);
        const teacher = academicClass.professor === "Professor não informado"
          ? null
          : academicClass.professor;

        if (existing) {
          if (teacher) existing.teachers.add(teacher);
          continue;
        }

        subjects.set(name, {
          name,
          teachers: new Set(teacher ? [teacher] : []),
          color: SUBJECT_AREAS[area].color,
          area,
        });
      }
    }
  }

  return Array.from(subjects.values())
    .map(({ teachers, ...subject }) => ({
      ...subject,
      teacher: formatTeacherNames(teachers),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}
