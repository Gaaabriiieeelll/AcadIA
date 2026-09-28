export type SuapReportRow = {
  diaryCode: string;
  academicCode: string | null;
  name: string;
  grades: [number | null, number | null, number | null, number | null];
  classesHeld: number | null;
  absences: number | null;
  officialAverage: number | null;
  finalAssessmentScore: number | null;
  finalAverage: number | null;
  academicStatus: string | null;
};

export type SuapReportPreview = {
  rows: SuapReportRow[];
  skippedRows: number;
  period: string | null;
  registrationNumber: string | null;
};

type TextItem = { x: number; width: number; text: string };
type TextLine = {
  page: number;
  text: string;
  y?: number;
  items?: TextItem[];
};

const NUMBER_TOKEN = /^\d+(?:[,.]\d+)?$/;
const DIARY_START = /^\d{3,}\s+/;
const PERCENTAGE = /\d{1,3}(?:[,.]\d+)?\s*%/;
const STATUS = /\b(?:Cursando|Aprovad[oa]|Reprovad[oa]|Conclu[ií]d[oa]|Matriculad[oa])\b/i;

function itemCenter(item: TextItem) {
  return item.x + item.width / 2;
}

function nearestItem(items: TextItem[], center: number, tolerance = 12) {
  return items
    .filter((item) => item.text.trim() && Math.abs(itemCenter(item) - center) <= tolerance)
    .sort((left, right) =>
      Math.abs(itemCenter(left) - center) - Math.abs(itemCenter(right) - center),
    )[0]?.text.trim() ?? null;
}

function parseSpatialReport(lines: readonly TextLine[]): SuapReportPreview {
  const rows: SuapReportRow[] = [];
  const seenDiaries = new Set<string>();
  let skippedRows = 0;

  for (const pageNumber of new Set(lines.map((line) => line.page))) {
    const pageLines = lines.filter((line) => line.page === pageNumber && line.items);
    const stageHeader = pageLines.find((line) =>
      ["E1", "E2", "E3", "E4"].every((label) =>
        line.items!.some((item) => item.text.trim() === label),
      ),
    );
    if (stageHeader?.y === undefined) continue;

    const stageItems = pageLines
      .filter((line) => Math.abs(line.y! - stageHeader.y!) <= 10)
      .flatMap((line) => line.items!);
    const headerItem = (label: string) =>
      stageItems.find((item) => item.text.trim() === label);
    const diaryHeader = headerItem("Diário");
    const workloadHeader = headerItem("C. H.");
    const heldHeader = headerItem("T. de");
    const absenceHeader = headerItem("T. Faltas");
    const frequencyHeader = headerItem("% Freq.");
    const statusHeader = headerItem("Situação");
    const averageHeader = headerItem("MD");
    const finalAssessmentHeader = headerItem("NAF");
    const finalAverageHeader = headerItem("MFD/");
    const noteHeader = pageLines.find((line) =>
      line.y! < stageHeader.y!
      && line.y! >= stageHeader.y! - 20
      && line.items!.filter((item) => item.text.trim() === "N").length >= 4,
    );
    if (
      !diaryHeader || !workloadHeader || !heldHeader || !absenceHeader
      || !frequencyHeader || !statusHeader || !averageHeader || !noteHeader
    ) continue;

    const noteCenters = noteHeader.items!
      .filter((item) => item.text.trim() === "N" && item.x < averageHeader.x)
      .sort((left, right) => left.x - right.x)
      .slice(0, 4)
      .map(itemCenter);
    if (noteCenters.length !== 4) continue;

    for (const line of pageLines) {
      if (line.y! >= noteHeader.y! - 4) continue;
      const items = line.items!;
      const diaryCode = nearestItem(items, itemCenter(diaryHeader));
      if (!diaryCode || !/^\d{3,}$/.test(diaryCode)) continue;
      if (seenDiaries.has(diaryCode)) continue;

      const rawName = items
        .filter((item) =>
          item.text.trim()
          && item.x > itemCenter(diaryHeader) + 15
          && item.x < workloadHeader.x - 4,
        )
        .map((item) => item.text.trim())
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      const codeMatch = /^([\p{L}][\p{L}\d.()/-]{1,29}(?:\s+\([^)]*\))?)\s+-\s+(.+)$/u.exec(rawName);
      const name = (codeMatch?.[2] ?? rawName).trim();
      const classesHeld = parseDecimal(nearestItem(items, itemCenter(heldHeader)) ?? "");
      const absences = parseDecimal(nearestItem(items, itemCenter(absenceHeader)) ?? "");
      const percentage = parseDecimal(
        (nearestItem(items, itemCenter(frequencyHeader)) ?? "").replace("%", ""),
      );
      const status = nearestItem(items, itemCenter(statusHeader), 24);

      if (
        !name || name.length > 120
        || classesHeld === null || absences === null
        || !Number.isInteger(classesHeld) || !Number.isInteger(absences)
        || absences < 0 || absences > classesHeld
        || !status || !STATUS.test(status)
      ) {
        skippedRows++;
        continue;
      }

      const expectedPercentage = classesHeld > 0
        ? ((classesHeld - absences) / classesHeld) * 100
        : null;
      const attendanceIsConsistent = percentage !== null
        && expectedPercentage !== null
        && Math.abs(percentage - expectedPercentage) <= 2;
      const grades = noteCenters.map((center) =>
        parseGrade(nearestItem(items, center)),
      ) as SuapReportRow["grades"];
      const officialAverage = parseGrade(nearestItem(items, itemCenter(averageHeader)));
      const finalAssessmentScore = finalAssessmentHeader
        ? parseGrade(nearestItem(items, finalAssessmentHeader.x))
        : null;
      const finalAverage = finalAverageHeader
        ? parseGrade(nearestItem(items, itemCenter(finalAverageHeader), 16))
        : null;

      rows.push({
        diaryCode,
        academicCode: codeMatch?.[1] ?? null,
        name,
        grades,
        classesHeld: attendanceIsConsistent ? classesHeld : null,
        absences: attendanceIsConsistent ? absences : null,
        officialAverage,
        finalAssessmentScore,
        finalAverage,
        academicStatus: status,
      });
      seenDiaries.add(diaryCode);
    }
  }

  const fullText = lines.map((line) => line.text).join(" ");
  const period = fullText.match(/Per[ií]odo Letivo:\s*(20\d{2}\/\d)/i)?.[1] ?? null;
  const registrationNumber = fullText.match(/Matr[ií]cula:\s*(\d{6,30})/i)?.[1] ?? null;
  return { rows, skippedRows, period, registrationNumber };
}

function parseDecimal(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseGrade(value: string | undefined) {
  if (!value || value === "-") return null;
  const parsed = parseDecimal(value);
  return parsed !== null && parsed >= 0 && parsed <= 100 ? parsed : null;
}

function parseRow(text: string, hasRecoveryColumns: boolean): SuapReportRow | null {
  const diaryMatch = /^(\d{3,})\s+/.exec(text);
  const percentageMatch = PERCENTAGE.exec(text);
  if (!diaryMatch || !percentageMatch) return null;

  const beforePercentage = text.slice(diaryMatch[0].length, percentageMatch.index).trim();
  const precedingTokens = beforePercentage.split(/\s+/);
  const numericSuffix: string[] = [];
  while (precedingTokens.length > 0 && NUMBER_TOKEN.test(precedingTokens.at(-1)!)) {
    numericSuffix.unshift(precedingTokens.pop()!);
    if (numericSuffix.length === 5) break;
  }
  if (numericSuffix.length < 3) return null;

  const classesHeld = parseDecimal(numericSuffix.at(-2)!);
  const absences = parseDecimal(numericSuffix.at(-1)!);
  if (
    classesHeld === null || absences === null
    || !Number.isInteger(classesHeld) || !Number.isInteger(absences)
    || classesHeld < 0 || absences < 0 || absences > classesHeld
  ) return null;

  // Some boletins show both workload in hours and planned classes. A subject
  // name ending in a number should not be mistaken for a workload column.
  const workloadColumns = numericSuffix.length >= 4
    && (numericSuffix.length === 5 || (parseDecimal(numericSuffix.at(-4)!) ?? 0) > 10)
    ? 4
    : 3;
  const nameTokens = [
    ...precedingTokens,
    ...numericSuffix.slice(0, numericSuffix.length - workloadColumns),
  ];
  const rawName = nameTokens.join(" ").trim();
  const codeMatch = /^([\p{L}][\p{L}\d.()/-]{1,29}(?:\s+\([^)]*\))?)\s+-\s+(.+)$/u.exec(rawName)
    ?? /^(Disciplina\.\d+)\s+-\s+(.+)$/i.exec(rawName);
  const academicCode = codeMatch?.[1] ?? null;
  const name = (codeMatch?.[2] ?? rawName).replace(/\s+/g, " ").trim();
  if (!name || name.length > 120) return null;

  const frequency = parseDecimal(percentageMatch[0].replace("%", "").trim());
  const calculatedFrequency = classesHeld > 0
    ? ((classesHeld - absences) / classesHeld) * 100
    : null;
  const attendanceIsConsistent = frequency !== null
    && calculatedFrequency !== null
    && Math.abs(frequency - calculatedFrequency) <= 2;

  const afterPercentage = text.slice(percentageMatch.index + percentageMatch[0].length);
  const statusMatch = STATUS.exec(afterPercentage);
  if (!statusMatch) return null;
  const afterStatus = afterPercentage.slice(statusMatch.index + statusMatch[0].length)
    .replace(/^\s*-\s*Depend[êe]ncia(?:\s*\([^)]*\))?/i, "")
    .replace(/^\s*\([^)]*\)/, "");
  const gradeStart = /(?:^|\s)(?:\d+(?:[,.]\d+)?|-)(?=\s|$)/.exec(afterStatus);
  if (!gradeStart) return null;
  const gradeTokens = afterStatus.slice(gradeStart.index).trim().match(/(?:\d+(?:[,.]\d+)?|-)(?=\s|$)/g) ?? [];
  if (gradeTokens.length < 4) return null;

  const stageWidth = hasRecoveryColumns || gradeTokens.length >= 17 ? 4 : 2;
  const grades = [0, 1, 2, 3].map((index) =>
    parseGrade(gradeTokens[index * stageWidth]),
  ) as SuapReportRow["grades"];

  return {
    diaryCode: diaryMatch[1],
    academicCode,
    name,
    grades,
    classesHeld: attendanceIsConsistent ? classesHeld : null,
    absences: attendanceIsConsistent ? absences : null,
    officialAverage: null,
    finalAssessmentScore: null,
    finalAverage: null,
    academicStatus: statusMatch[0],
  };
}

export function parseSuapReport(lines: readonly TextLine[]): SuapReportPreview {
  const spatial = parseSpatialReport(lines);
  if (spatial.rows.length > 0) return spatial;

  const hasRecoveryColumns = lines.some(({ text }) => /\bRP[1-4]\b/i.test(text));
  const rows: SuapReportRow[] = [];
  const seenDiaries = new Set<string>();
  let skippedRows = 0;

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (!DIARY_START.test(line.text)) continue;

    let text = line.text;
    for (let offset = 1; offset <= 2 && !PERCENTAGE.test(text); offset++) {
      const next = lines[index + offset];
      if (!next || next.page !== line.page || DIARY_START.test(next.text)) break;
      text += ` ${next.text}`;
    }

    if (!PERCENTAGE.test(text)) continue;
    const parsed = parseRow(text, hasRecoveryColumns);
    if (!parsed) {
      skippedRows++;
      continue;
    }
    if (seenDiaries.has(parsed.diaryCode)) continue;
    seenDiaries.add(parsed.diaryCode);
    rows.push(parsed);
  }

  return {
    rows,
    skippedRows,
    period: spatial.period,
    registrationNumber: spatial.registrationNumber,
  };
}
