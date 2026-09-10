"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";

import {
  DEFAULT_SUBJECT_SORT,
  SUBJECT_SORT_OPTIONS,
  type SubjectSortOption,
} from "@/lib/subject-sorting";

export function SubjectSortControl({ value }: { value: SubjectSortOption }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [optimisticValue, setOptimisticValue] = useOptimistic(value);

  function updateSort(nextSort: SubjectSortOption) {
    const parameters = new URLSearchParams(window.location.search);
    if (nextSort === DEFAULT_SUBJECT_SORT) parameters.delete("sort");
    else parameters.set("sort", nextSort);
    const query = parameters.toString();
    const href = query ? `/disciplinas?${query}` : "/disciplinas";

    startTransition(() => {
      setOptimisticValue(nextSort);
      router.replace(href, { scroll: false });
    });
  }

  return (
    <label className="subject-sort-control">
      <span>Organizar por</span>
      <select
        aria-busy={pending}
        aria-label="Organizar disciplinas"
        disabled={pending}
        onChange={(event) => updateSort(event.target.value as SubjectSortOption)}
        value={optimisticValue}
      >
        {SUBJECT_SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
