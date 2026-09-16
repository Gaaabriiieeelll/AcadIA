import "server-only";

import { cache } from "react";

import { ETIM_COURSES } from "@/lib/academic-profile-options";
import {
  resolveHifpbProfileSelection,
  type HifpbProfileSelection,
} from "@/lib/hifpb-courses";
import { parseHifpbSchedule } from "@/lib/hifpb-parser";
import type { AcademicProfileValues } from "@/types/academic-profile";

const REQUEST_TIMEOUT_MS = 12_000;

async function fetchHifpbPage(sourceUrl: string) {
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(sourceUrl, {
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "User-Agent": "AcadIA/0.1 (consulta de horario academico publico)",
        },
        next: { revalidate: 60 * 60 },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (!response.ok) {
        throw new Error(`O hIFPB respondeu com o status ${response.status}.`);
      }

      return response.text();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Não foi possível consultar o hIFPB.");
}

const getHifpbSchedule = cache(async (
  sourceUrl: string,
  tableIndex: number,
  className: string,
  displayName: string,
) => {
  const html = await fetchHifpbPage(sourceUrl);
  return parseHifpbSchedule(html, {
    className,
    displayName,
    sourceUrl,
    tableIndex,
  });
});

export async function getHifpbScheduleForSelection(selection: HifpbProfileSelection) {
  return getHifpbSchedule(
    selection.sourceUrl,
    selection.tableIndex,
    selection.className,
    selection.displayName,
  );
}

export async function getHifpbScheduleForProfile(
  profile: Pick<AcademicProfileValues, "academicStage" | "course">,
) {
  const selection = resolveHifpbProfileSelection(profile);
  if (!selection) throw new Error("O curso ou ano do perfil não possui uma grade mapeada no hIFPB.");

  return {
    schedule: await getHifpbScheduleForSelection(selection),
    selection,
  };
}

const mecanicaSecondYearSelection = resolveHifpbProfileSelection({
  academicStage: "2º ano",
  course: ETIM_COURSES[8],
});

export async function getMecanicaSecondYearSchedule() {
  if (!mecanicaSecondYearSelection) {
    throw new Error("A grade da Mecânica II não foi mapeada.");
  }
  return getHifpbScheduleForSelection(mecanicaSecondYearSelection);
}
