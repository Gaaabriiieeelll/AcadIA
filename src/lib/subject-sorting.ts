import { SUBJECT_AREAS } from "@/lib/subject-areas";
import type { SubjectDTO } from "@/types/subjects";

export const SUBJECT_SORT_OPTIONS = [
  { value: "average-desc", label: "Maior média" },
  { value: "average-asc", label: "Menor média" },
  { value: "alphabetical-asc", label: "Ordem alfabética (A–Z)" },
  { value: "alphabetical-desc", label: "Ordem alfabética (Z–A)" },
  { value: "area", label: "Área do conhecimento" },
] as const;

export type SubjectSortOption = (typeof SUBJECT_SORT_OPTIONS)[number]["value"];

export const DEFAULT_SUBJECT_SORT: SubjectSortOption = "alphabetical-asc";

const subjectSortValues = new Set<SubjectSortOption>(
  SUBJECT_SORT_OPTIONS.map((option) => option.value),
);

const areaColorOrder = Object.values(SUBJECT_AREAS).map(({ color }) =>
  color.toLocaleLowerCase("pt-BR"),
);

function compareNames(left: SubjectDTO, right: SubjectDTO) {
  return left.name.localeCompare(right.name, "pt-BR", {
    numeric: true,
    sensitivity: "base",
  });
}

function compareAverages(
  left: SubjectDTO,
  right: SubjectDTO,
  direction: "asc" | "desc",
) {
  if (left.averageScore === null && right.averageScore === null) {
    return compareNames(left, right);
  }
  if (left.averageScore === null) return 1;
  if (right.averageScore === null) return -1;

  const difference = direction === "asc"
    ? left.averageScore - right.averageScore
    : right.averageScore - left.averageScore;

  return difference || compareNames(left, right);
}

function compareAreas(left: SubjectDTO, right: SubjectDTO) {
  const leftIndex = areaColorOrder.indexOf(left.color.toLocaleLowerCase("pt-BR"));
  const rightIndex = areaColorOrder.indexOf(right.color.toLocaleLowerCase("pt-BR"));
  const normalizedLeftIndex = leftIndex === -1 ? areaColorOrder.length : leftIndex;
  const normalizedRightIndex = rightIndex === -1 ? areaColorOrder.length : rightIndex;

  return normalizedLeftIndex - normalizedRightIndex || compareNames(left, right);
}

export function parseSubjectSort(
  value: string | string[] | undefined,
): SubjectSortOption {
  const candidate = Array.isArray(value) ? value[0] : value;

  return candidate && subjectSortValues.has(candidate as SubjectSortOption)
    ? candidate as SubjectSortOption
    : DEFAULT_SUBJECT_SORT;
}

export function sortSubjects(
  subjects: SubjectDTO[],
  sortOption: SubjectSortOption,
) {
  return [...subjects].sort((left, right) => {
    switch (sortOption) {
      case "average-desc":
        return compareAverages(left, right, "desc");
      case "average-asc":
        return compareAverages(left, right, "asc");
      case "alphabetical-desc":
        return compareNames(right, left);
      case "area":
        return compareAreas(left, right);
      case "alphabetical-asc":
      default:
        return compareNames(left, right);
    }
  });
}
