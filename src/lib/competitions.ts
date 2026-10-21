import type { Competition, CompetitionStage, CompetitionStatus, CompetitionSubscription } from "@/types/competitions";
import type { AcademicAlertDTO } from "@/types/academic-alerts";

export const COMPETITION_COLOR = "#7c3aed";
export const COMPETITION_TIME_ZONE = "America/Sao_Paulo";
export const competitionStatusLabels: Record<CompetitionStatus, string> = {
  future: "Inscrições futuras", open: "Inscrições abertas", closed: "Inscrições encerradas",
  ongoing: "Em andamento", completed: "Concluída", pending: "Aguardando confirmação",
};
export const stageAccessLabels = {
  eligible: "Público elegível", registered: "Somente inscritos", qualified: "Somente classificados",
};

// Lexicographic wall-clock comparisons preserve all-day dates and the official zone.
export function competitionNow(now: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: COMPETITION_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)!.value;
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}`;
}
function boundary(stage: CompetitionStage, end: boolean) {
  return end
    ? `${stage.endDate ?? stage.startDate}T${stage.endTime ?? "23:59"}:59`
    : `${stage.startDate}T${stage.startTime ?? "00:00"}:00`;
}
export function hasConfirmedStages(c: Competition) { return c.calendarReady && c.stages.length > 0; }
export function getCompetitionStatus(c: Competition, now: Date): CompetitionStatus {
  if (!hasConfirmedStages(c)) return "pending";
  const current = competitionNow(now);
  const registrations = c.stages.filter((s) => s.kind === "registration");
  if (registrations.some((s) => boundary(s, false) <= current && current <= boundary(s, true))) return "open";
  if (registrations.some((s) => boundary(s, false) > current)) return "future";
  const stages = c.stages.filter((s) => s.kind !== "registration");
  if (c.completion && c.completion.confirmedOn <= current.slice(0, 10)
    && stages.every((s) => boundary(s, true) < current)) return "completed";
  if (stages.some((s) => s.closesEdition && boundary(s, true) < current)
    && stages.every((s) => boundary(s, true) < current)) return "completed";
  if (stages.some((s) => boundary(s, false) <= current) && stages.some((s) => boundary(s, true) >= current)) return "ongoing";
  return "closed";
}
export function formatCompetitionDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
}
export function formatCompetitionStage(stage: CompetitionStage) {
  const dates = stage.endDate && stage.endDate !== stage.startDate
    ? `${formatCompetitionDate(stage.startDate)} a ${formatCompetitionDate(stage.endDate)}`
    : formatCompetitionDate(stage.startDate);
  const times = stage.startTime
    ? `${stage.startTime}${stage.endTime ? ` a ${stage.endTime}` : ""} (Brasília)`
    : stage.endTime ? `prazo até ${stage.endTime} (Brasília)` : "dia inteiro · horário não divulgado";
  return `${stage.deadline ? "Até " : ""}${dates} · ${times}`;
}
const normalize = (value: string) => value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("pt-BR");
export type CompetitionFilters = { query: string; area: string; campus: string; level: string; status: string };
export function filterCompetitions(catalog: Competition[], filters: CompetitionFilters, now: Date) {
  const terms = normalize(filters.query.trim()).split(/\s+/).filter(Boolean);
  return catalog.filter((c) => {
    const text = normalize([c.name, c.acronym, c.area, c.description, c.support.text, ...c.campuses].join(" "));
    return terms.every((term) => text.includes(term))
      && (!filters.area || c.area === filters.area)
      && (!filters.campus || c.campuses.includes(filters.campus))
      && (!filters.level || c.levels.includes(filters.level))
      && (!filters.status || getCompetitionStatus(c, now) === filters.status);
  });
}
export function getCompetitionCalendarEvents(catalog: Competition[], rangeStart: string, rangeEnd: string) {
  const unique = new Map<string, {
    id: string; source: "competition"; competitionId: string; title: string; description: string;
    startDate: string; endDate: string; startTime: string | null; endTime: string | null;
    color: string; categoryLabel: string; subjectName: null; completed: false; openEnded: false; href: string;
  }>();
  for (const c of catalog) {
    if (!hasConfirmedStages(c)) continue;
    for (const s of c.stages) {
      if (s.startDate > rangeEnd || (s.endDate ?? s.startDate) < rangeStart) continue;
      const id = `competition:${c.id}:${s.id}`;
      unique.set(id, {
        id, source: "competition", competitionId: c.id,
        title: `${c.acronym}: ${s.title}${s.access === "qualified" ? " · classificados" : ""}`,
        description: `${stageAccessLabels[s.access]}. ${formatCompetitionStage(s)}. ${s.location}. Confira fontes e pendências na competição.`,
        startDate: s.startDate, endDate: s.endDate ?? s.startDate,
        startTime: s.startTime ?? null, endTime: s.endTime ?? null,
        color: COMPETITION_COLOR, categoryLabel: "Olimpíadas e Competições", subjectName: null,
        completed: false, openEnded: false, href: `/olimpiadas#${c.id}`,
      });
    }
  }
  return [...unique.values()];
}
export function buildCompetitionAlerts(catalog: Competition[], subscriptions: CompetitionSubscription[], now: Date, reminderDays: number): AcademicAlertDTO[] {
  const current = competitionNow(now);
  const today = current.slice(0, 10);
  const rangeEnd = new Date(`${today}T12:00:00Z`);
  rangeEnd.setUTCDate(rangeEnd.getUTCDate() + reminderDays);
  const lastDay = rangeEnd.toISOString().slice(0, 10);
  const following = new Map(subscriptions.map((s) => [s.competitionId, s]));
  const alerts = new Map<string, AcademicAlertDTO>();
  for (const c of catalog) {
    const subscription = following.get(c.id);
    if (!hasConfirmedStages(c) || !subscription?.remindersEnabled) continue;
    for (const stage of c.stages) {
      if (stage.access === "qualified" && !subscription.includeQualified) continue;
      if (boundary(stage, true) < current) continue;
      const date = stage.kind === "registration" || stage.deadline ? (stage.endDate ?? stage.startDate) : stage.startDate;
      if (date < today || date > lastDay) continue;
      const id = `competition:${c.id}:${stage.id}`;
      alerts.set(id, {
        id, category: "calendar", severity: "info", eyebrow: "Olimpíadas e Competições",
        title: `${c.acronym}: ${stage.kind === "registration" ? "prazo de inscrição" : stage.title}`,
        description: `${formatCompetitionStage(stage)}. ${stageAccessLabels[stage.access]}. Acompanhar no app não efetua inscrição.`,
        actionLabel: "Ver competição", href: `/olimpiadas#${c.id}`, dateKey: date,
        dateLabel: formatCompetitionDate(date), accentColor: COMPETITION_COLOR, read: false,
      });
    }
  }
  return [...alerts.values()];
}
