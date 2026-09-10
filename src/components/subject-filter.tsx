"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import {
  EMPTY_SUBJECT_FILTER_VALUE,
  SUBJECT_FILTER_PARAM,
} from "@/lib/subject-filter";
import type { SubjectFilterOption } from "@/types/subjects";

const SUBJECT_FILTER_STORAGE_KEY = "acadia-subject-filter";

type SubjectFilterProps = {
  emptySelection: boolean;
  filterIsExplicit: boolean;
  selectedIds: string[];
  subjects: SubjectFilterOption[];
};

function readStoredIds(subjects: SubjectFilterOption[]) {
  try {
    const stored = JSON.parse(
      window.localStorage.getItem(SUBJECT_FILTER_STORAGE_KEY) ?? "[]",
    ) as unknown;
    if (!Array.isArray(stored)) return [];
    if (stored.includes(EMPTY_SUBJECT_FILTER_VALUE)) {
      return [EMPTY_SUBJECT_FILTER_VALUE];
    }

    const availableIds = new Set(subjects.map((subject) => subject.id));
    return Array.from(
      new Set(
        stored.filter(
          (id): id is string => typeof id === "string" && availableIds.has(id),
        ),
      ),
    );
  } catch {
    return [];
  }
}

function writeStoredIds(ids: string[]) {
  try {
    if (ids.length === 0) {
      window.localStorage.removeItem(SUBJECT_FILTER_STORAGE_KEY);
    } else {
      window.localStorage.setItem(SUBJECT_FILTER_STORAGE_KEY, JSON.stringify(ids));
    }
  } catch {
    // A URL continua sendo a fonte do filtro quando o armazenamento está indisponível.
  }
}

export function SubjectFilter({
  emptySelection,
  filterIsExplicit,
  selectedIds,
  subjects,
}: SubjectFilterProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [draftIds, setDraftIds] = useState(
    () => new Set(
      emptySelection
        ? []
        : selectedIds.length > 0
          ? selectedIds
          : subjects.map(({ id }) => id),
    ),
  );
  const [isOpen, setIsOpen] = useState(filterIsExplicit);
  const [pending, startTransition] = useTransition();
  const allSelected = !emptySelection && selectedIds.length === 0;

  useEffect(() => {
    if (filterIsExplicit) {
      if (emptySelection) {
        writeStoredIds([EMPTY_SUBJECT_FILTER_VALUE]);
      } else if (selectedIds.length > 0) {
        writeStoredIds(selectedIds);
      } else {
        writeStoredIds([]);
        const parameters = new URLSearchParams(window.location.search);
        parameters.delete(SUBJECT_FILTER_PARAM);
        const query = parameters.toString();
        startTransition(() => {
          router.replace(
            `${pathname}${query ? `?${query}` : ""}${window.location.hash}`,
            { scroll: false },
          );
        });
      }
      return;
    }

    const storedIds = readStoredIds(subjects);
    if (storedIds.length === 0) return;

    const parameters = new URLSearchParams(window.location.search);
    parameters.set(SUBJECT_FILTER_PARAM, storedIds.join(","));
    const query = parameters.toString();

    startTransition(() => {
      router.replace(
        `${pathname}${query ? `?${query}` : ""}${window.location.hash}`,
        { scroll: false },
      );
    });
  }, [emptySelection, filterIsExplicit, pathname, router, selectedIds, subjects]);

  function navigateWithSelection(nextIds: string[]) {
    const parameters = new URLSearchParams(window.location.search);
    const uniqueIds = Array.from(new Set(nextIds));
    const shouldShowAll = uniqueIds.length === subjects.length;

    if (shouldShowAll) {
      parameters.delete(SUBJECT_FILTER_PARAM);
      writeStoredIds([]);
    } else if (uniqueIds.length === 0) {
      parameters.set(SUBJECT_FILTER_PARAM, EMPTY_SUBJECT_FILTER_VALUE);
      writeStoredIds([EMPTY_SUBJECT_FILTER_VALUE]);
    } else {
      parameters.set(SUBJECT_FILTER_PARAM, uniqueIds.join(","));
      writeStoredIds(uniqueIds);
    }

    const query = parameters.toString();
    startTransition(() => {
      router.replace(
        `${pathname}${query ? `?${query}` : ""}${window.location.hash}`,
        { scroll: false },
      );
    });
  }

  function toggleSubject(subjectId: string) {
    const next = new Set(draftIds);
    if (next.has(subjectId)) next.delete(subjectId);
    else next.add(subjectId);

    setDraftIds(next);
    navigateWithSelection(Array.from(next));
  }

  return (
    <details
      className="subject-filter"
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
      open={isOpen}
    >
      <summary>
        <span className="subject-filter-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 6h16M7 12h10M10 18h4" />
          </svg>
        </span>
        <span className="subject-filter-label">
          <strong>Filtrar matérias</strong>
          <small>As mudanças são aplicadas automaticamente</small>
        </span>
        <span className="subject-filter-status">
          {draftIds.size === subjects.length
            ? "Todas"
            : draftIds.size === 0
              ? "Nenhuma"
              : draftIds.size === 1
              ? "1 selecionada"
              : `${draftIds.size} selecionadas`}
        </span>
        <svg className="subject-filter-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="m7 10 5 5 5-5" />
        </svg>
      </summary>

      <div className="subject-filter-panel">
        <fieldset disabled={subjects.length === 0}>
          <legend>Matérias exibidas</legend>
          <div className="subject-filter-selection-tools">
            <button
              onClick={() => {
                const allIds = subjects.map(({ id }) => id);
                setDraftIds(new Set(allIds));
                navigateWithSelection(allIds);
              }}
              type="button"
            >
              Selecionar todas
            </button>
            <button
              onClick={() => {
                setDraftIds(new Set());
                navigateWithSelection([]);
              }}
              type="button"
            >
              Limpar seleção
            </button>
          </div>
          <div className="subject-filter-options">
            {subjects.map((subject) => (
              <label key={subject.id}>
                <input
                  checked={draftIds.has(subject.id)}
                  onChange={() => toggleSubject(subject.id)}
                  type="checkbox"
                />
                <i style={{ backgroundColor: subject.color }} />
                <span>{subject.name}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="subject-filter-actions">
          <span
            aria-live="polite"
            className={pending
              ? "subject-filter-live-status subject-filter-live-status-pending"
              : "subject-filter-live-status"}
          >
            <i aria-hidden="true" />
            {pending ? "Atualizando resultados…" : "Atualização automática ativa"}
          </span>
          <button
            className="secondary-action"
            disabled={allSelected}
            onClick={() => {
              const allIds = subjects.map(({ id }) => id);
              setDraftIds(new Set(allIds));
              navigateWithSelection(allIds);
            }}
            type="button"
          >
            Mostrar todas
          </button>
        </div>
      </div>
    </details>
  );
}
