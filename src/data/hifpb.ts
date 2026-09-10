import "server-only";

import { unstable_cache } from "next/cache";
import { cache } from "react";

import {
  HIFPB_MECANICA_URL,
  parseMecanicaSecondYearSchedule,
} from "@/lib/hifpb-parser";

const REQUEST_TIMEOUT_MS = 12_000;

async function fetchHifpbPage() {
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(HIFPB_MECANICA_URL, {
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "User-Agent": "AcadIA/0.1 (consulta de horario academico publico)",
        },
        cache: "no-store",
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

const getCachedHifpbPage = unstable_cache(
  fetchHifpbPage,
  ["hifpb-mecanica-ii-2026-2"],
  { revalidate: 60 * 60 },
);

export const getMecanicaSecondYearSchedule = cache(async () => {
  const html = await getCachedHifpbPage();
  return parseMecanicaSecondYearSchedule(html);
});
