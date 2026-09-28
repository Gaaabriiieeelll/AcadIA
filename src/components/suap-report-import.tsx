"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { importSuapReportAction } from "@/app/suap-report-actions";
import type { SuapReportRow, SuapReportPreview } from "@/lib/suap-report";
import type { SubjectFilterOption } from "@/types/subjects";
import type { SuapReportImportRow } from "@/types/suap-report";

import styles from "./suap-report-import.module.css";

type DraftRow = SuapReportImportRow & { selected: boolean };
type Feedback = { status: "success" | "error"; message: string } | null;

const MAX_PDF_BYTES = 4 * 1024 * 1024;

function normalizedName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleUpperCase("pt-BR");
}

function initialDraft(row: SuapReportRow, subjects: SubjectFilterOption[]): DraftRow {
  const matched = subjects.find((subject) => normalizedName(subject.name) === normalizedName(row.name));
  return {
    ...row,
    targetSubjectId: matched?.id ?? null,
    selected: row.grades.some((grade) => grade !== null)
      || row.classesHeld !== null
      || row.officialAverage !== null
      || row.finalAssessmentScore !== null
      || row.finalAverage !== null,
  };
}

function nullableNumber(value: string) {
  return value === "" ? null : Number(value);
}

export function SuapReportImport({ subjects }: { subjects: SubjectFilterOption[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [drafts, setDrafts] = useState<DraftRow[] | null>(null);
  const [period, setPeriod] = useState<string | null>(null);
  const [skippedRows, setSkippedRows] = useState(0);
  const [reviewed, setReviewed] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  function updateRow(index: number, change: Partial<DraftRow>) {
    setDrafts((current) => current?.map((row, rowIndex) =>
      rowIndex === index ? { ...row, ...change } : row,
    ) ?? null);
    setReviewed(false);
  }

  async function readReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = new FormData(event.currentTarget).get("report");
    if (!(file instanceof File) || file.size === 0) {
      setFeedback({ status: "error", message: "Selecione um boletim em PDF." });
      return;
    }
    if (!file.name.toLowerCase().endsWith(".pdf") || file.size > MAX_PDF_BYTES) {
      setFeedback({ status: "error", message: "Envie um PDF de até 4 MB." });
      return;
    }

    setIsReading(true);
    setFeedback(null);
    setDrafts(null);
    setReviewed(false);
    try {
      const body = new FormData();
      body.set("report", file);
      const response = await fetch("/api/suap-report/preview", {
        method: "POST",
        body,
        cache: "no-store",
      });
      const data = await response.json() as Pick<SuapReportPreview, "rows" | "period" | "skippedRows"> & { error?: string };
      if (!response.ok) {
        setFeedback({ status: "error", message: data.error ?? "Não foi possível ler o PDF." });
        return;
      }

      setDrafts(data.rows.map((row) => initialDraft(row, subjects)));
      setPeriod(data.period);
      setSkippedRows(data.skippedRows);
    } catch {
      setFeedback({ status: "error", message: "Falha de conexão ao ler o PDF. Tente novamente." });
    } finally {
      setIsReading(false);
    }
  }

  async function saveReport() {
    const selected = drafts?.filter((row) => row.selected) ?? [];
    if (selected.length === 0) {
      setFeedback({ status: "error", message: "Selecione ao menos uma disciplina." });
      return;
    }
    if (!reviewed) {
      setFeedback({ status: "error", message: "Confira os dados e marque a confirmação antes de importar." });
      return;
    }
    const linkedIds = selected.map((row) => row.targetSubjectId).filter((id): id is string => id !== null);
    if (new Set(linkedIds).size !== linkedIds.length) {
      setFeedback({ status: "error", message: "Duas linhas estão vinculadas à mesma disciplina." });
      return;
    }

    setIsSaving(true);
    setFeedback(null);
    try {
      const rows: SuapReportImportRow[] = selected.map((row) => ({
        diaryCode: row.diaryCode,
        academicCode: row.academicCode,
        name: row.name,
        grades: row.grades,
        classesHeld: row.classesHeld,
        absences: row.absences,
        officialAverage: row.officialAverage,
        finalAssessmentScore: row.finalAssessmentScore,
        finalAverage: row.finalAverage,
        academicStatus: row.academicStatus,
        targetSubjectId: row.targetSubjectId,
      }));
      const result = await importSuapReportAction(rows);
      setFeedback({ status: result.status, message: result.message });
      if (result.status === "success") {
        setDrafts(null);
        setReviewed(false);
        formRef.current?.reset();
        router.refresh();
      }
    } catch {
      setFeedback({ status: "error", message: "Não foi possível salvar o boletim. Tente novamente." });
    } finally {
      setIsSaving(false);
    }
  }

  const selectedCount = drafts?.filter((row) => row.selected).length ?? 0;

  return (
    <section aria-labelledby="suap-report-title" className={styles.card}>
      <div className={styles.heading}>
        <div>
          <span>Boletim escolar</span>
          <h2 id="suap-report-title">Importar boletim em PDF</h2>
          <p>Selecione o boletim de notas individual gerado pelo SUAP para preencher notas e frequência.</p>
        </div>
        <span aria-hidden="true" className={styles.pdfIcon}>PDF</span>
      </div>

      <form className={styles.uploadForm} onSubmit={readReport} ref={formRef}>
        <label>
          <span>Arquivo PDF (até 4 MB)</span>
          <input accept=".pdf,application/pdf" name="report" required type="file" />
        </label>
        <button className="secondary-action" disabled={isReading || isSaving} type="submit">
          {isReading ? "Lendo boletim…" : "Ler boletim"}
        </button>
      </form>
      <p className={styles.privacyNote}>O PDF é usado apenas para extrair a prévia; o arquivo original não é armazenado.</p>

      {feedback ? (
        <p className={`${styles.feedback} ${feedback.status === "error" ? styles.error : styles.success}`} role={feedback.status === "error" ? "alert" : "status"}>
          {feedback.message}
        </p>
      ) : null}

      {drafts ? (
        <div className={styles.preview}>
          <div className={styles.previewHeading}>
            <div>
              <h3>Confira antes de importar</h3>
              <p>{drafts.length} disciplina(s) identificada(s){period ? ` · período ${period}` : ""}. {selectedCount} selecionada(s).</p>
            </div>
            {skippedRows > 0 ? <p className={styles.warning}>{skippedRows} linha(s) não reconhecida(s).</p> : null}
          </div>
          <p className={styles.reviewNote}>Abra cada disciplina para corrigir notas, frequência e vínculo. Campos vazios não substituem dados já salvos.</p>

          <div className={styles.rows}>
            {drafts.map((row, index) => (
              <details className={styles.row} key={`${row.diaryCode}-${index}`}>
                <summary>
                  <span>{row.name}</span>
                  <small>{row.grades.filter((grade) => grade !== null).length} nota(s) · {row.classesHeld === null ? "frequência ausente" : `${row.absences} falta(s) em ${row.classesHeld} aula(s)`}</small>
                  <strong>{row.selected ? "Selecionada" : "Ignorada"}</strong>
                </summary>
                <div className={styles.rowBody}>
                  <label className={styles.selectRow}>
                    <input checked={row.selected} onChange={(event) => updateRow(index, { selected: event.target.checked })} type="checkbox" />
                    Importar esta disciplina
                  </label>
                  <label className={styles.field}>
                    <span>Vincular à disciplina do AcadIA</span>
                    <select onChange={(event) => updateRow(index, { targetSubjectId: event.target.value || null })} value={row.targetSubjectId ?? ""}>
                      <option value="">Criar nova disciplina</option>
                      {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                    </select>
                  </label>
                  <label className={styles.field}>
                    <span>Nome no boletim {row.targetSubjectId ? "(nome atual será preservado)" : ""}</span>
                    <input maxLength={120} onChange={(event) => updateRow(index, { name: event.target.value })} required type="text" value={row.name} />
                  </label>
                  <div className={styles.fieldGrid}>
                    {row.grades.map((grade, gradeIndex) => (
                      <label className={styles.field} key={gradeIndex}>
                        <span>Nota E{gradeIndex + 1}</span>
                        <input max="100" min="0" onChange={(event) => {
                          const grades = [...row.grades] as DraftRow["grades"];
                          grades[gradeIndex] = nullableNumber(event.target.value);
                          updateRow(index, { grades });
                        }} step="0.01" type="number" value={grade ?? ""} />
                      </label>
                    ))}
                    <label className={styles.field}>
                      <span>Média oficial (MD)</span>
                      <input max="100" min="0" onChange={(event) => updateRow(index, { officialAverage: nullableNumber(event.target.value) })} step="0.01" type="number" value={row.officialAverage ?? ""} />
                    </label>
                    <label className={styles.field}>
                      <span>Avaliação final (NAF)</span>
                      <input max="100" min="0" onChange={(event) => updateRow(index, { finalAssessmentScore: nullableNumber(event.target.value) })} step="0.01" type="number" value={row.finalAssessmentScore ?? ""} />
                    </label>
                    <label className={styles.field}>
                      <span>Média final (MFD)</span>
                      <input max="100" min="0" onChange={(event) => updateRow(index, { finalAverage: nullableNumber(event.target.value) })} step="0.01" type="number" value={row.finalAverage ?? ""} />
                    </label>
                    <label className={styles.field}>
                      <span>Aulas registradas</span>
                      <input max="10000" min="0" onChange={(event) => updateRow(index, { classesHeld: nullableNumber(event.target.value) })} step="1" type="number" value={row.classesHeld ?? ""} />
                    </label>
                    <label className={styles.field}>
                      <span>Faltas</span>
                      <input max="10000" min="0" onChange={(event) => updateRow(index, { absences: nullableNumber(event.target.value) })} step="1" type="number" value={row.absences ?? ""} />
                    </label>
                  </div>
                </div>
              </details>
            ))}
          </div>

          <div className={styles.confirmation}>
            <label>
              <input checked={reviewed} onChange={(event) => setReviewed(event.target.checked)} type="checkbox" />
              Conferi as disciplinas, notas e faltas que serão importadas.
            </label>
            <button className="primary-action" disabled={isSaving || selectedCount === 0 || !reviewed} onClick={saveReport} type="button">
              {isSaving ? "Importando…" : `Importar ${selectedCount} disciplina(s)`}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
