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

function getArea(subject: string): SubjectArea {
  const normalized = subject.toLocaleUpperCase("pt-BR");

  if (/MATEMATICA|FISICA/.test(normalized)) return "exact";
  if (/QUIMICA|BIOLOGIA/.test(normalized)) return "nature";
  if (/HIST[ÓO]RIA|GEOGRAFIA|FILO/.test(normalized)) return "human";
  if (/PORTUGUES|INGLES/.test(normalized)) return "languages";
  if (/EDUC FIS/.test(normalized)) return "wellbeing";
  return "technical";
}

export function getMecanicaSecondYearSubjects(
  schedule: HifpbSchedule,
  group?: HifpbGroup,
): HifpbSubjectImport[] {
  const visibleSchedule = group
    ? filterHifpbScheduleByGroup(schedule, group)
    : schedule;
  const subjects = new Map<string, HifpbSubjectImport>();

  for (const slot of visibleSchedule.slots) {
    for (const classes of Object.values(slot.classes)) {
      for (const academicClass of classes) {
        const name = formatHifpbSubjectName(academicClass.subject);
        const key = `${name}\u0000${academicClass.professor}`;

        if (subjects.has(key)) continue;

        const area = getArea(academicClass.subject);
        subjects.set(key, {
          name,
          teacher:
            academicClass.professor === "Professor não informado"
              ? null
              : academicClass.professor,
          color: SUBJECT_AREAS[area].color,
          area,
        });
      }
    }
  }

  return Array.from(subjects.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "pt-BR"),
  );
}
