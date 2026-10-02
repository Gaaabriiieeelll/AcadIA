import type { OpportunityDTO } from "@/types/opportunities";

export function normalizedOpportunityText(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("pt-BR");
}

export function courseMentioned(acceptedCourses: string | null, profileCourse: string) {
  if (!acceptedCourses) return false;
  const accepted = normalizedOpportunityText(acceptedCourses);
  if (/\b(todos os cursos|qualquer curso|todas as areas)\b/.test(accepted)) return true;

  const core = normalizedOpportunityText(profileCourse)
    .replace(/^tecnico em /, "")
    .replace(/ integrado ao ensino medio.*$/, "")
    .trim();
  return core.length >= 4 && accepted.includes(core);
}

export function opportunityDeadlineState(deadline: string | null, today: string) {
  if (!deadline) return "unknown" as const;
  return deadline < today ? "past" as const : "upcoming" as const;
}

export function filterOpportunities(
  opportunities: OpportunityDTO[],
  filters: {
    search: string;
    kind: string;
    modality: string;
    location: string;
    courseOnly: boolean;
    favoritesOnly: boolean;
    hidePast: boolean;
  },
  profileCourse: string,
  today: string,
) {
  const search = normalizedOpportunityText(filters.search.trim());
  const location = normalizedOpportunityText(filters.location.trim());

  return opportunities.filter((opportunity) => {
    if (filters.kind && opportunity.kind !== filters.kind) return false;
    if (filters.modality && opportunity.modality !== filters.modality) return false;
    if (filters.favoritesOnly && !opportunity.favorite) return false;
    if (filters.courseOnly && !courseMentioned(opportunity.acceptedCourses, profileCourse)) return false;
    if (filters.hidePast && opportunityDeadlineState(opportunity.deadline, today) === "past") return false;
    if (location && !normalizedOpportunityText(opportunity.location ?? "").includes(location)) return false;
    return !search || normalizedOpportunityText([
      opportunity.title,
      opportunity.organization,
      opportunity.acceptedCourses ?? "",
      opportunity.location ?? "",
      opportunity.requirements ?? "",
    ].join(" ")).includes(search);
  });
}
