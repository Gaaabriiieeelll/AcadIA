import {
  ETIM_COURSES,
  resolveEtimCourse,
} from "@/lib/academic-profile-options";
import type { AcademicProfileValues } from "@/types/academic-profile";

const HIFPB_COURSE_BASE_URL = "https://joaopessoa.ifpb.edu.br/horario/curso";

type EtimCourse = (typeof ETIM_COURSES)[number];
type AcademicYear = 1 | 2 | 3 | 4;

type HifpbCourseDefinition = {
  courseId: number;
  displayName: string;
  turn: string | null;
};

export type HifpbProfileSelection = HifpbCourseDefinition & {
  academicYear: AcademicYear;
  className: string;
  course: EtimCourse;
  sourceUrl: string;
  tableIndex: number;
};

const courseDefinitions: Record<EtimCourse, HifpbCourseDefinition> = {
  [ETIM_COURSES[0]]: {
    courseId: 81,
    displayName: "Contabilidade",
    turn: null,
  },
  [ETIM_COURSES[1]]: {
    courseId: 19,
    displayName: "Controle Ambiental",
    turn: null,
  },
  [ETIM_COURSES[2]]: {
    courseId: 15,
    displayName: "Edificações",
    turn: null,
  },
  [ETIM_COURSES[3]]: {
    courseId: 20,
    displayName: "Eletrônica",
    turn: null,
  },
  [ETIM_COURSES[4]]: {
    courseId: 16,
    displayName: "Eletrotécnica",
    turn: "Matutino",
  },
  [ETIM_COURSES[5]]: {
    courseId: 17,
    displayName: "Eletrotécnica",
    turn: "Vespertino",
  },
  [ETIM_COURSES[6]]: {
    courseId: 79,
    displayName: "Informática",
    turn: null,
  },
  [ETIM_COURSES[7]]: {
    courseId: 82,
    displayName: "Instrumento Musical",
    turn: null,
  },
  [ETIM_COURSES[8]]: {
    courseId: 18,
    displayName: "Mecânica",
    turn: null,
  },
};

const romanYears: Record<AcademicYear, string> = {
  1: "I",
  2: "II",
  3: "III",
  4: "IV",
};

function resolveAcademicYear(value: string): AcademicYear | null {
  const year = Number(value.match(/[1-4]/)?.[0]);
  return year >= 1 && year <= 4 ? year as AcademicYear : null;
}

export function resolveHifpbProfileSelection(
  profile: Pick<AcademicProfileValues, "academicStage" | "course">,
): HifpbProfileSelection | null {
  const resolvedCourse = resolveEtimCourse(profile.course);
  const course = ETIM_COURSES.find((candidate) => candidate === resolvedCourse);
  const academicYear = resolveAcademicYear(profile.academicStage);

  if (!course || !academicYear) return null;

  const definition = courseDefinitions[course];
  const yearLabel = romanYears[academicYear];
  const className = definition.turn
    ? `${definition.displayName} ${yearLabel} · ${definition.turn}`
    : `${definition.displayName} ${yearLabel}`;

  return {
    ...definition,
    academicYear,
    className,
    course,
    sourceUrl: `${HIFPB_COURSE_BASE_URL}/${definition.courseId}`,
    tableIndex: academicYear - 1,
  };
}
