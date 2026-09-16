import { load } from "cheerio";

import type { HifpbProfileSelection } from "@/lib/hifpb-courses";
import {
  hifpbWeekdays,
  type HifpbClass,
  type HifpbGroup,
  type HifpbProfessor,
  type HifpbSchedule,
  type HifpbWeekday,
} from "@/types/hifpb";

export const HIFPB_MECANICA_URL =
  "https://joaopessoa.ifpb.edu.br/horario/curso/18";

const HIFPB_ORIGIN = new URL(HIFPB_MECANICA_URL).origin;

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function formatHifpbSubjectName(subject: string) {
  const group = getHifpbSubjectGroup(subject);

  if (!group) return subject;

  const baseName = subject.replace(/\s+-\s+[ABC]$/u, "");
  const groupedName = baseName
    .split("/")
    .find((part) => part.endsWith(`-${group}`))
    ?.replace(new RegExp(`-${group}$`, "u"), "");
  const visibleName = groupedName ?? baseName;
  const expandedName =
    visibleName === "MAT"
      ? "LABORATÓRIO DE MATERIAIS"
      : visibleName === "TEC"
        ? "TECNOLOGIA MECÂNICA"
        : visibleName;

  return `${expandedName} · ${group}`;
}

function getHifpbSubjectGroup(subject: string): HifpbGroup | null {
  return subject.match(/\s+-\s+([ABC])$/u)?.[1] as HifpbGroup | undefined ?? null;
}

export function filterHifpbScheduleByGroup(
  schedule: HifpbSchedule,
  group: HifpbGroup,
): HifpbSchedule {
  const slots = schedule.slots
    .map((slot) => {
      const classes = emptyWeek();

      for (const weekday of hifpbWeekdays) {
        classes[weekday] = slot.classes[weekday].filter((academicClass) => {
          const subjectGroup = getHifpbSubjectGroup(academicClass.subject);
          return subjectGroup === null || subjectGroup === group;
        });
      }

      return { ...slot, classes };
    })
    .filter((slot) =>
      hifpbWeekdays.some((weekday) => slot.classes[weekday].length > 0),
    );

  const subjects = new Set<string>();
  const professorMap = new Map<string, HifpbProfessor & { subjectSet: Set<string> }>();

  for (const slot of slots) {
    for (const weekday of hifpbWeekdays) {
      for (const academicClass of slot.classes[weekday]) {
        subjects.add(academicClass.subject);
        const professorKey = academicClass.professorUrl ?? academicClass.professor;
        const existing = professorMap.get(professorKey);

        if (existing) {
          existing.subjectSet.add(academicClass.subject);
          continue;
        }

        professorMap.set(professorKey, {
          name: academicClass.professor,
          profileUrl: academicClass.professorUrl,
          subjects: [],
          subjectSet: new Set([academicClass.subject]),
        });
      }
    }
  }

  const professors = Array.from(professorMap.values())
    .map(({ subjectSet, ...professor }) => ({
      ...professor,
      subjects: Array.from(subjectSet).sort((a, b) => a.localeCompare(b, "pt-BR")),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  return {
    ...schedule,
    slots,
    subjects: Array.from(subjects).sort((a, b) => a.localeCompare(b, "pt-BR")),
    professors,
  };
}

function safeHifpbUrl(
  value: string | undefined,
  resource: "professor" | "place",
  sourceUrl: string,
) {
  if (!value) return null;

  try {
    const url = new URL(value, sourceUrl);
    const allowedPath =
      resource === "professor"
        ? /^\/horario\/professor\/\d+\/?$/
        : /^\/horario\/(?:sala|laboratorio)\/\d+\/?$/;

    if (url.origin !== HIFPB_ORIGIN || !allowedPath.test(url.pathname)) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

function emptyWeek(): Record<HifpbWeekday, HifpbClass[]> {
  return {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
  };
}

export function parseHifpbSchedule(
  html: string,
  selection: Pick<
    HifpbProfileSelection,
    "className" | "displayName" | "sourceUrl" | "tableIndex"
  >,
): HifpbSchedule {
  const $ = load(html);
  const table = $("table").eq(selection.tableIndex);

  if (table.length === 0) {
    throw new Error(`A grade da turma ${selection.className} não foi encontrada no hIFPB.`);
  }

  const semesterHeading = $("h5, h6")
    .toArray()
    .map((element) => normalizeText($(element).text()))
    .find((text) => /^Semestre\s+/i.test(text));
  const semester = semesterHeading?.replace(/^Semestre\s+/i, "") ?? "Não informado";
  const course = normalizeText($(".alert b").first().text()).replace(/^\[\s*|\s*\]$/g, "");
  const slots: HifpbSchedule["slots"] = [];

  table.find("tbody > tr").each((_, row) => {
    const cells = $(row).children("td");
    const time = normalizeText(cells.eq(0).text());

    if (!/^\d{2}:\d{2}\s+-\s+\d{2}:\d{2}$/.test(time)) return;

    const classes = emptyWeek();

    hifpbWeekdays.forEach((weekday, weekdayIndex) => {
      cells
        .eq(weekdayIndex + 1)
        .find(".card-turma")
        .each((__, card) => {
          const subject = normalizeText($(card).find(".card-header span").first().text());
          const professorAnchor = $(card).find('a[href*="/horario/professor/"]').first();
          const roomAnchor = $(card)
            .find('a[href*="/horario/sala/"], a[href*="/horario/laboratorio/"]')
            .first();
          const professor = normalizeText(professorAnchor.text());
          const room = normalizeText(roomAnchor.text());

          if (!subject) return;

          classes[weekday].push({
            subject,
            professor: professor || "Professor não informado",
            professorUrl: safeHifpbUrl(
              professorAnchor.attr("href"),
              "professor",
              selection.sourceUrl,
            ),
            room: room || null,
            roomUrl: safeHifpbUrl(
              roomAnchor.attr("href"),
              "place",
              selection.sourceUrl,
            ),
          });
        });
    });

    slots.push({ time, classes });
  });

  if (slots.length === 0) {
    throw new Error(`O hIFPB retornou uma grade vazia para a turma ${selection.className}.`);
  }

  const occupiedSlots = slots.filter((slot) =>
    hifpbWeekdays.some((weekday) => slot.classes[weekday].length > 0),
  );

  const subjects = new Set<string>();
  const professorMap = new Map<string, HifpbProfessor & { subjectSet: Set<string> }>();

  for (const slot of occupiedSlots) {
    for (const weekday of hifpbWeekdays) {
      for (const academicClass of slot.classes[weekday]) {
        subjects.add(academicClass.subject);
        const professorKey = academicClass.professorUrl ?? academicClass.professor;
        const existing = professorMap.get(professorKey);

        if (existing) {
          existing.subjectSet.add(academicClass.subject);
          continue;
        }

        professorMap.set(professorKey, {
          name: academicClass.professor,
          profileUrl: academicClass.professorUrl,
          subjects: [],
          subjectSet: new Set([academicClass.subject]),
        });
      }
    }
  }

  const professors = Array.from(professorMap.values())
    .map(({ subjectSet, ...professor }) => ({
      ...professor,
      subjects: Array.from(subjectSet).sort((a, b) => a.localeCompare(b, "pt-BR")),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  return {
    semester,
    course: course || selection.displayName,
    className: selection.className,
    sourceUrl: selection.sourceUrl,
    slots: occupiedSlots,
    professors,
    subjects: Array.from(subjects).sort((a, b) => a.localeCompare(b, "pt-BR")),
  };
}

export function parseMecanicaSecondYearSchedule(html: string): HifpbSchedule {
  return parseHifpbSchedule(html, {
    className: "Mecânica II",
    displayName: "MECÂNICA INTEGRADO",
    sourceUrl: HIFPB_MECANICA_URL,
    tableIndex: 1,
  });
}
