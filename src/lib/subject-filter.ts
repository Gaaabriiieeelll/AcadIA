export const SUBJECT_FILTER_PARAM = "materias";
export const EMPTY_SUBJECT_FILTER_VALUE = "nenhuma";

export function parseSubjectFilter(value: string | string[] | undefined) {
  const values = Array.isArray(value) ? value : value === undefined ? [] : [value];

  return Array.from(
    new Set(
      values
        .flatMap((item) => item.split(","))
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

export function resolveSubjectFilter<T extends { id: string }>(
  subjects: T[],
  requestedIds: readonly string[],
) {
  if (requestedIds.length === 0) {
    return { selectedIds: [] as string[], subjects };
  }

  if (requestedIds.includes(EMPTY_SUBJECT_FILTER_VALUE)) {
    return { selectedIds: [] as string[], subjects: [] as T[] };
  }

  const requested = new Set(requestedIds);
  const selectedIds = subjects
    .map((subject) => subject.id)
    .filter((id) => requested.has(id));

  if (selectedIds.length === 0) {
    return { selectedIds: [] as string[], subjects };
  }

  const selected = new Set(selectedIds);

  return {
    selectedIds,
    subjects: subjects.filter((subject) => selected.has(subject.id)),
  };
}
